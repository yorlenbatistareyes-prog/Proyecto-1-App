import { visitasStore, mostrarToast } from '$lib/stores';
import { generarPDFIndividual } from '$lib/utils/pdfGenerator';
import type { Visita } from '$lib/types';


// 1. El Molde Gigante (Sacado de tu código)
export const moldeVisita: Visita = {
    fecha: '',
    congregacionId: '',
    tipo: 'Ordinaria',
    ministerio: { observaciones: '', territorioObs: '', precursoresObs: '', programa: [] },
    reuniones: { 
      asistencia: { estudiantes: 0, sacados: 0, inactivos: 0, hijosTestigos: 0, noAsisten: 0 },
      entreSemana: { tendencia: '', faltan: 0, porcentaje: '' },
      finSemana: { tendencia: '', faltan: 0, porcentaje: '' },
      observaciones: ''
    },
    pastoreo: { observaciones: '', inactivos: 0, sacados: 0 },
    crecimiento: { observaciones: '', cursosRegulares: false },
    superintendenteServicio: { observaciones: '', visitaPeriodica: 'si' },
    publicaciones: { observaciones: '', inventarioMensual: false, excedente: 'no' },
    progresoEspiritual: { observaciones: '', habitosEstudio: 'buenos' },
    cuerpoNombrados: { observaciones: '', unidadCuerpo: 'buena', programaCapacitacion: false },
    localReunion: { observaciones: '', programaLimpieza: 'si', planSeguridad: false },
    analisisInactivos: { observaciones: '', planAccion: false },
    precursoresAnalisis: { observaciones: '', apoyoAncianos: 'si', horarioPractico: true },
    contabilidad: { observaciones: '', contabilidadEnLinea: 'no', archivosRevisados: false },
    problemasGraves: { observaciones: '', nivelUrgencia: 'bajo', requiereIntervencionSucursal: false },
    miscelaneos: { observaciones: '', temasPendientes: false },
    ideasDiscursos: { puntosClave: '', textosBiblicos: '', sugerenciasAncianos: '' },
    observacionesReuniones: {
      vidaMinisterio: { asignacionesS89: '', consejeroAuxiliar: '' },
      finDeSemana: { estudioAtalaya: '' }
    },
    observacionesFinales: ''
};

// 2. Lógica de Guardado (Adaptada para .ts)
export function procesarGuardadoVisita(datos: Visita) {
    let esNueva = false;
    
    visitasStore.update(lista => {
        const indice = lista.findIndex(v => v.id === datos.id);
        if (indice !== -1) {
            const nuevaLista = [...lista];
            nuevaLista[indice] = { ...datos };
            return nuevaLista;
        } else {
            esNueva = true;
            return [...lista, { ...datos, id: Date.now() }];
        }
    });
    
    // Generamos PDF y avisamos
    generarPDFIndividual(datos);
    return esNueva; // Le avisamos al componente si la visita es nueva
    mostrarToast("✅ Visita guardada y PDF generado");
}

// 3. Lógica de Eliminar
export function eliminarVisita(id: number) {
    visitasStore.update(lista => lista.filter(v => v.id !== id));
}