export type Vista = 'inicio' | 'circuito' | 'congregaciones' | 'visitas' | 'registros' | 'configuracion';

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
    id?: number;
    congregacionId: string;
    fecha: string;
    tipo: string;
    observaciones: string; // Observaciones generales
    ministerio: {
        observaciones: string; // Observaciones específicas del Ministerio
        programa: ProgramaDia[];
    };
}
// ... (tus interfaces de Circuito y Congregacion se quedan igual)