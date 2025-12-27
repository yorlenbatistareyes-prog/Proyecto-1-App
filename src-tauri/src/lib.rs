use serde_json::Value;
use std::fs;
// 1. Comando para guardar: Recibe el estado de Svelte y lo escribe en un archivo
// 1. Comando para guardar
// 1. Comando para guardar (CORREGIDO)
#[tauri::command]
fn guardar_todo_en_disco(app: tauri::AppHandle, estado: Value) -> Result<String, String> {
    use tauri::Manager;
    
    // Usar la misma ruta que exportar_datos
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio: {:?}", e))?;
    
    // Crear el directorio si no existe
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Error creando directorio: {}", e))?;
    
    let ruta_datos = app_data_dir.join("datos_asistente.json");
    let contenido = serde_json::to_string_pretty(&estado).map_err(|e| e.to_string())?;

    fs::write(ruta_datos, contenido).map_err(|e| e.to_string())?;

    Ok("Guardado exitoso".into())
}

// 2. Comando para cargar (CORREGIDO)
#[tauri::command]
fn cargar_todo_desde_disco(app: tauri::AppHandle) -> Result<Value, String> {
    use tauri::Manager;
    
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio: {:?}", e))?;
    
    let ruta_datos = app_data_dir.join("datos_asistente.json");
    
    if !ruta_datos.exists() {
        return Ok(serde_json::json!({
            "circuitos": [],
            "congregaciones": [],
            "visitas": [],
            "agenda": []
        }));
    }
    
    let contenido = fs::read_to_string(&ruta_datos).map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&contenido).map_err(|e| e.to_string())?;

    Ok(json)
}

// 3. NUEVO: Comando para exportar (Copia de seguridad)
#[tauri::command]
async fn exportar_datos(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;
    use tauri::Manager;
    
    // Obtener el directorio de datos de la app
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio: {:?}", e))?;
    
    let ruta_datos = app_data_dir.join("datos_asistente.json");
    
    let contenido = if ruta_datos.exists() {
        std::fs::read_to_string(&ruta_datos)
            .map_err(|e| format!("Error leyendo archivo: {}", e))?
    } else {
        return Err("No hay datos para exportar".into());
    };

    // Abrir ventana para elegir dónde guardar
    let ruta_destino = app
        .dialog()
        .file()
        .set_file_name("copia_seguridad_asistente.json")
        .blocking_save_file();

    if let Some(ruta) = ruta_destino {
        std::fs::write(ruta.to_string(), contenido)
            .map_err(|e| format!("Error escribiendo archivo: {}", e))?;
        return Ok("Copia de seguridad creada con éxito".into());
    }

    Err("Exportación cancelada".into())
}

#[tauri::command]
async fn importar_datos_nativa(handle: tauri::AppHandle) -> Result<Value, String> {
    use tauri_plugin_dialog::DialogExt;

    // Abrimos el diálogo para seleccionar un archivo
    let archivo_seleccionado = handle
        .dialog()
        .file()
        .add_filter("JSON", &["json"])
        .blocking_pick_file();

    // Si el usuario eligió algo, lo leemos
    if let Some(ruta) = archivo_seleccionado {
        let contenido = std::fs::read_to_string(ruta.to_string()).map_err(|e| e.to_string())?;
        let json: Value = serde_json::from_str(&contenido).map_err(|e| e.to_string())?;
        return Ok(json);
    }

    Err("Importación cancelada".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            guardar_todo_en_disco,
            cargar_todo_desde_disco,
            exportar_datos,
            importar_datos_nativa
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
