export type Vista = 'inicio' | 'circuito' | 'congregaciones' | 'visitas' | 'registros' | 'configuracion';

export interface Circuito {
    nombre: string;
    idioma: string;
    pais: string;
}

export interface Congregacion {
    circuito: string;
    seccion: string;
    nombre: string;
    numero: string;
    ciudad: string;
    provincia: string;
    pais: string;
    idioma: string;
    diaSemana: string;
    horaSemana: string;
    diaFin: string;
    horaFin: string;
}