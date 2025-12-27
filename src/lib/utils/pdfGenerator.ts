import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export function generarPDFIndividual(visita: any) {
    const doc = new jsPDF();
    let y = 20;

    // --- ENCABEZADO ESTILO FORMULARIO ---
    doc.setFillColor(63, 81, 181);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME DE VISITA DEL SUPERINTENDENTE", 14, 15);
    doc.setFontSize(10);
    doc.text(`CONGREGACIÓN: ${visita.congregacionId} | FECHA: ${visita.fecha} | TIPO: ${visita.tipo}`, 14, 22);
    doc.setTextColor(0, 0, 0);
    y = 40;

    const crearTablaModulo = (titulo: string, filas: any[][]) => {
        autoTable(doc, {
            startY: y,
            head: [[titulo.toUpperCase(), "RESPUESTA / OBSERVACIONES"]],
            body: filas,
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181], fontSize: 9 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
            margin: { left: 14, right: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 8;
        if (y > 260) { doc.addPage(); y = 20; }
    };

    // 1. MINISTERIO
    crearTablaModulo("1. Ministerio del Campo", [
        ["Observaciones Territorio", visita.ministerio.territorioObs],
        ["Observaciones Precursores", visita.ministerio.precursoresObs],
        ["Observaciones Generales", visita.ministerio.observaciones]
    ]);

    // 2. REUNIONES
    crearTablaModulo("2. Reuniones y Asistencia", [
        ["Estudiantes / Inactivos", `Est: ${visita.reuniones.asistencia.estudiantes} / Inac: ${visita.reuniones.asistencia.inactivos}`],
        ["Sacados / Hijos de Testigos", `Sac: ${visita.reuniones.asistencia.sacados} / Hijos: ${visita.reuniones.asistencia.hijosTestigos}`],
        ["Tendencia Entre Semana", `${visita.reuniones.entreSemana.tendencia} (Faltan: ${visita.reuniones.entreSemana.faltan})`],
        ["Tendencia Fin de Semana", `${visita.reuniones.finSemana.tendencia} (Faltan: ${visita.reuniones.finSemana.faltan})`],
        ["Observaciones de Reuniones", visita.reuniones.observaciones]
    ]);

    // 3. PASTOREO
    crearTablaModulo("3. Pastoreo", [
        ["Inactivos visitados", visita.pastoreo.inactivos],
        ["Sacados visitados", visita.pastoreo.sacados],
        ["Observaciones", visita.pastoreo.observaciones]
    ]);

    // 4. CRECIMIENTO
    crearTablaModulo("4. Crecimiento", [
        ["Cursos Regulares", visita.crecimiento.cursosRegulares ? "Sí" : "No"],
        ["Observaciones", visita.crecimiento.observaciones]
    ]);

    // 5. SUPERINTENDENTE DE SERVICIO
    crearTablaModulo("5. Superintendente de Servicio", [
        ["Visita Periódica", visita.superintendenteServicio.visitaPeriodica === 'si' ? 'Sí' : 'No'],
        ["Observaciones", visita.superintendenteServicio.observaciones]
    ]);

    // 6. PUBLICACIONES
    crearTablaModulo("6. Publicaciones", [
        ["Inventario Mensual", visita.publicaciones.inventarioMensual ? "Sí" : "No"],
        ["Excedente", visita.publicaciones.excedente],
        ["Observaciones", visita.publicaciones.observaciones]
    ]);

    // 7. PROGRESO ESPIRITUAL
    crearTablaModulo("7. Progreso Espiritual", [
        ["Hábitos de Estudio", visita.progresoEspiritual.habitosEstudio],
        ["Observaciones", visita.progresoEspiritual.observaciones]
    ]);

    // 8. CUERPO DE NOMBRADOS
    crearTablaModulo("8. Cuerpo de Nombrados", [
        ["Unidad del Cuerpo", visita.cuerpoNombrados.unidadCuerpo],
        ["Programa de Capacitación", visita.cuerpoNombrados.programaCapacitacion ? "Activo" : "No"],
        ["Observaciones", visita.cuerpoNombrados.observaciones]
    ]);

    // 9. LOCAL DE REUNIÓN
    crearTablaModulo("9. Local de Reunión", [
        ["Programa de Limpieza", visita.localReunion.programaLimpieza === 'si' ? 'Al día' : 'Revisar'],
        ["Plan de Seguridad", visita.localReunion.planSeguridad ? "Establecido" : "No"],
        ["Observaciones", visita.localReunion.observaciones]
    ]);

    // 10. ANÁLISIS DE INACTIVOS
    crearTablaModulo("10. Análisis de Inactivos", [
        ["Plan de Acción", visita.analisisInactivos.planAccion ? "Sí" : "No"],
        ["Observaciones", visita.analisisInactivos.observaciones]
    ]);

    // 11. PRECURSORES
    crearTablaModulo("11. Análisis de Precursores", [
        ["Apoyo de los Ancianos", visita.precursoresAnalisis.apoyoAncianos === 'si' ? 'Sí' : 'No'],
        ["Horario Práctico", visita.precursoresAnalisis.horarioPractico ? "Sí" : "No"],
        ["Observaciones", visita.precursoresAnalisis.observaciones]
    ]);

    // 12. CONTABILIDAD
    crearTablaModulo("12. Contabilidad", [
        ["Contabilidad en Línea", visita.contabilidad.contabilidadEnLinea === 'si' ? 'Sí' : 'No'],
        ["Archivos Revisados", visita.contabilidad.archivosRevisados ? "Sí" : "No"],
        ["Observaciones", visita.contabilidad.observaciones]
    ]);

    // 13. PROBLEMAS GRAVES
    crearTablaModulo("13. Problemas Graves", [
        ["Nivel de Urgencia", visita.problemasGraves.nivelUrgencia.toUpperCase()],
        ["Intervención Sucursal", visita.problemasGraves.requiereIntervencionSucursal ? "REQUERIDA" : "No"],
        ["Observaciones", visita.problemasGraves.observaciones]
    ]);

    // 14. INSTRUCCIÓN Y REUNIONES
    crearTablaModulo("14. Instrucción y Reuniones", [
        ["Puntos Clave Discursos", visita.ideasDiscursos.puntosClave],
        ["Sugerencias Ancianos", visita.ideasDiscursos.sugerenciasAncianos],
        ["Vida y Min. (S-89)", visita.observacionesReuniones.vidaMinisterio.asignacionesS89],
        ["Estudio Atalaya", visita.observacionesReuniones.finDeSemana.estudioAtalaya]
    ]);

    // 15. CONCLUSIONES
    crearTablaModulo("15. Observaciones Finales", [
        ["Comentarios Finales", visita.observacionesFinales]
    ]);

    // 16. OBSERVACIONES ADICIONALES (Ejemplo: Reuniones de fin de semana)
    crearTablaModulo("16. Detalles de Instrucción", [
        ["Vida y Ministerio", visita.observacionesReuniones.vidaMinisterio.asignacionesS89],
        ["Consejero Auxiliar", visita.observacionesReuniones.vidaMinisterio.consejeroAuxiliar],
        ["Estudio de la Atalaya", visita.observacionesReuniones.finDeSemana.estudioAtalaya]
    ]);

    doc.save(`Informe_Visita_${visita.congregacionId}_${visita.fecha}.pdf`);
}

// Añade esta función a tu pdfGenerator.ts
export function generarPDFListado(visitas: any[]) {
    const doc = new jsPDF();
    const encabezados = ['Fecha', 'Congregación', 'Tipo', 'Observaciones Finales'];
    
    const filas = visitas.map(v => [
        v.fecha || 'N/A', 
        v.congregacionId || 'N/A', 
        v.tipo || 'N/A', 
        v.observacionesFinales || ''
    ]);

    doc.setFontSize(18);
    doc.text('Informe Mensual de Visitas', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
        head: [encabezados],
        body: filas,
        startY: 25,
        theme: 'striped',
        headStyles: { fillColor: [91, 76, 196], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 255] }
    });

    doc.save(`Informe_Visitas_${new Date().toISOString().slice(0, 10)}.pdf`);
}