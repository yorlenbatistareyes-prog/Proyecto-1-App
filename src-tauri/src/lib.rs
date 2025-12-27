use serde_json::Value;
use std::fs;

// Función auxiliar para logging en producción
fn log_production(message: &str) {
    #[cfg(not(debug_assertions))]
    {
        // Importación condicional solo para producción
        use chrono::Local;
        
        if let Ok(mut path) = std::env::current_dir() {
            path.push("tauri_app_log.txt");
            let _ = std::fs::write(
                &path, 
                format!("{}: {}\n", Local::now().format("%Y-%m-%d %H:%M:%S"), message)
            );
        }
    }
    println!("{}", message);
}

// Tus comandos existentes...
#[tauri::command]
fn guardar_todo_en_disco(app: tauri::AppHandle, estado: Value) -> Result<String, String> {
    use tauri::Manager;
    
    log_production("Ejecutando: guardar_todo_en_disco");
    
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio: {:?}", e))?;
    
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Error creando directorio: {}", e))?;
    
    let ruta_datos = app_data_dir.join("datos_asistente.json");
    let contenido = serde_json::to_string_pretty(&estado).map_err(|e| e.to_string())?;

    fs::write(&ruta_datos, contenido).map_err(|e| e.to_string())?;
    
    log_production(&format!("Datos guardados en: {:?}", ruta_datos));
    Ok("Guardado exitoso".into())
}

#[tauri::command]
fn cargar_todo_desde_disco(app: tauri::AppHandle) -> Result<Value, String> {
    use tauri::Manager;
    
    log_production("Ejecutando: cargar_todo_desde_disco");
    
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio: {:?}", e))?;
    
    let ruta_datos = app_data_dir.join("datos_asistente.json");
    
    log_production(&format!("Buscando archivo en: {:?}", ruta_datos));
    
    if !ruta_datos.exists() {
        log_production("Archivo no encontrado, retornando datos por defecto");
        return Ok(serde_json::json!({
            "circuitos": [],
            "congregaciones": [],
            "visitas": [],
            "agenda": []
        }));
    }
    
    let contenido = fs::read_to_string(&ruta_datos).map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&contenido).map_err(|e| e.to_string())?;

    log_production("Datos cargados exitosamente");
    Ok(json)
}

#[tauri::command]
async fn exportar_datos(app: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    
    log_production("Iniciando exportar_datos (versión producción)");
    
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Error obteniendo directorio: {:?}", e))?;
    
    let ruta_datos = app_data_dir.join("datos_asistente.json");
    
    log_production(&format!("Ruta de datos: {:?}", ruta_datos));
    
    if !ruta_datos.exists() {
        log_production("No hay datos para exportar");
        return Err("No hay datos para exportar".into());
    }
    
    let contenido = std::fs::read_to_string(&ruta_datos)
        .map_err(|e| format!("Error leyendo archivo: {}", e))?;

    // VERSIÓN COMPATIBLE CON PRODUCCIÓN: Guardar directamente en escritorio
    let escritorio = dirs::desktop_dir()
        .ok_or("No se pudo encontrar el escritorio".to_string())?;
    
    let ruta_destino = escritorio.join("copia_seguridad_asistente.json");
    
    log_production(&format!("Guardando en: {:?}", ruta_destino));
    
    std::fs::write(&ruta_destino, contenido)
        .map_err(|e| format!("Error escribiendo archivo: {}", e))?;
    
    let mensaje = format!("✅ Copia de seguridad creada en tu escritorio\n{}", ruta_destino.display());
    log_production(&mensaje);
    Ok(mensaje)
}

// VERSIÓN ORIGINAL QUE SABEMOS QUE FUNCIONA EN DESARROLLO
#[tauri::command]
fn importar_datos_nativa(handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    use tauri_plugin_dialog::DialogExt;
    
    log_production("Iniciando importar_datos_nativa");

    let archivo_seleccionado = handle
        .dialog()
        .file()
        .add_filter("JSON", &["json"])
        .blocking_pick_file();

    if let Some(ruta) = archivo_seleccionado {
        log_production(&format!("Archivo seleccionado: {:?}", ruta));
        
        // Deja el código EXACTAMENTE como estaba cuando funcionaba
        let contenido = std::fs::read_to_string(ruta.to_string()).map_err(|e| e.to_string())?;
        let json: serde_json::Value = serde_json::from_str(&contenido).map_err(|e| e.to_string())?;
        
        log_production("Importación exitosa");
        return Ok(json);
    }

    log_production("Importación cancelada por el usuario");
    Err("Importación cancelada".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build())
        .invoke_handler(tauri::generate_handler![
            guardar_todo_en_disco,
            cargar_todo_desde_disco,
            exportar_datos,
            importar_datos_nativa
        ])
        .setup(|_app| {
            log_production("Aplicación inicializando...");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}