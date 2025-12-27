use serde_json::Value;
use std::fs;
// 1. Comando para guardar: Recibe el estado de Svelte y lo escribe en un archivo
// 1. Comando para guardar
#[tauri::command]
fn guardar_todo_en_disco(estado: Value) -> Result<String, String> {
    let contenido = serde_json::to_string_pretty(&estado).map_err(|e| e.to_string())?; // Mantenemos tu forma original

    fs::write("../datos_asistente.json", contenido).map_err(|e| e.to_string())?;

    Ok("Guardado exitoso".into())
}

// 2. Comando para cargar
#[tauri::command]
fn cargar_todo_desde_disco() -> Result<Value, String> {
    let contenido = fs::read_to_string("../datos_asistente.json").map_err(|e| e.to_string())?;

    let json: Value = serde_json::from_str(&contenido).map_err(|e| e.to_string())?;

    Ok(json)
}

// 3. NUEVO: Comando para exportar (Copia de seguridad)
#[tauri::command]
async fn exportar_datos(handle: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    let contenido = fs::read_to_string("../datos_asistente.json").map_err(|e| e.to_string())?;

    // Abrir ventana para elegir dónde guardar
    let ruta_destino = handle
        .dialog()
        .file()
        .set_file_name("copia_seguridad_asistente.json")
        .blocking_save_file(); // Usamos blocking para esperar la respuesta del usuario

    if let Some(ruta) = ruta_destino {
        fs::write(ruta.to_string(), contenido).map_err(|e| e.to_string())?;
        return Ok("Copia de seguridad creada con éxito".into());
    }

    Err("Exportación cancelada".into())
}

#[tauri::command]
async fn importar_datos_nativa(handle: tauri::AppHandle) -> Result<Value, String> {
    use tauri_plugin_dialog::DialogExt;

    // 1. Abrimos el diálogo para seleccionar un archivo
    let archivo_seleccionado = handle
        .dialog()
        .file()
        .add_filter("JSON", &["json"]) // Solo archivos .json
        .blocking_pick_file();

    // 2. Si el usuario eligió algo, lo leemos
    if let Some(ruta) = archivo_seleccionado {
        let contenido = fs::read_to_string(ruta.to_string()).map_err(|e| e.to_string())?;

        let json: Value = serde_json::from_str(&contenido).map_err(|e| e.to_string())?;

        return Ok(json);
    }

    Err("Importación cancelada".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
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
