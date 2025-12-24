export type Vista = 'inicio' | 'circuito' | 'congregaciones' | 'visitas' | 'registros' | 'configuracion' | 'informes';

export interface Circuito {
    nombre: string;
    idioma: string;
    pais: string;
}

export interface Congregacion {
    circuito: string;
    seccion: string;
    sucursal: string;
    nombre: string;
    numero: string;
    ciudad: string;
    provincia: string;
    pais: string;
    idioma: string;
    esLenguaSeñas: boolean;
    reunionEntreSemana: string;
    horaEntreSemana: string;
    reunionFinSemana: string;
    horaFinSemana: string;
    telefono: string;
}

export interface ProgramaDia {
    dia: string;
    hora: string;
}

export interface Visita {
    id: number; // Ya no es opcional si lo manejamos con Date.now()
    congregacionId: string;
    fecha: string;
    tipo: string;
    observacionesFinales: string;
    ministerio: {
        observaciones: string;
        territorioObs: string;
        precursoresObs: string;
        programa: ProgramaDia[];
    };
    reuniones: {
        asistencia: {
            estudiantes: number;
            sacados: number;
            inactivos: number;
            hijosTestigos: number;
            noAsisten: number;
        };
        entreSemana: { tendencia: string; faltan: number; porcentaje: string };
        finSemana: { tendencia: string; faltan: number; porcentaje: string };
        observaciones: string;
    };
    pastoreo: {
        observaciones: string;
        inactivos: number;
        sacados: number;
    };
    crecimiento: {
        observaciones: string;
        cursosRegulares: boolean;
    };
    // Añadimos un index signature simple para permitir el acceso dinámico si fuera necesario
    [key: string]: any; 
}