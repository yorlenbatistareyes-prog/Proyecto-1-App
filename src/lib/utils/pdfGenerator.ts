import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export async function generarPDFIndividual(visita: any) {
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

    // ... (El resto de tus módulos 4 al 16 se mantienen igual) ...
    // Para ahorrar espacio he omitido la repetición de los módulos intermedios que ya tienes bien.

    // 15. CONCLUSIONES
    crearTablaModulo("15. Observaciones Finales", [
        ["Comentarios Finales", visita.observacionesFinales]
    ]);

    // --- CAMBIO SUGERIDO POR EL CHAT (GUARDADO) ---
    try {
        const pdfData = doc.output('arraybuffer');
        const filePath = await save({
            title: 'Guardar Informe de Visita',
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
            defaultPath: `Informe_Visita_${visita.congregacionId}_${visita.fecha}.pdf`
        });

        if (filePath) {
            await writeFile(filePath, new Uint8Array(pdfData));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al guardar PDF Individual:', error);
        throw error;
    }
}

export async function generarPDFListado(visitas: any[]) {
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

    // --- CAMBIO SUGERIDO POR EL CHAT (GUARDADO LISTADO) ---
    try {
        const pdfData = doc.output('arraybuffer');
        const filePath = await save({
            title: 'Guardar Informe Mensual de Visitas',
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
            defaultPath: `Informe_Visitas_${new Date().toISOString().slice(0, 10)}.pdf`
        });

        if (filePath) {
            await writeFile(filePath, new Uint8Array(pdfData));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al guardar PDF Listado:', error);
        throw error;
    }
}