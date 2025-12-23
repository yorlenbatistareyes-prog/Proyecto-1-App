import { writable } from 'svelte/store';
import type { Vista, Circuito, Congregacion, RegistroVisita } from './types';

// Función auxiliar para recuperar datos de forma segura desde localStorage
const obtenerGuardados = (clave: string) => {
    if (typeof window !== 'undefined') {
        const guardado = localStorage.getItem(clave);
        try {
            return guardado ? JSON.parse(guardado) : [];
        } catch (e) {
            console.error(`Error al parsear JSON de ${clave}:`, e);
            return [];
        }
    }
    return [];
};

export const vistaActual = writable<Vista>('inicio');
export const menuAbierto = writable(false);

// --- STORES CON PERSISTENCIA ---

export const circuitos = writable<Circuito[]>(obtenerGuardados('asistente_circuitos_v1'));
export const congregaciones = writable<Congregacion[]>(obtenerGuardados('asistente_congre_v1'));
export const visitasStore = writable<RegistroVisita[]>(obtenerGuardados('asistente_visitas_v1'));

// Suscripciones para guardado automático (Solo en el cliente)
if (typeof window !== 'undefined') {
    circuitos.subscribe(v => localStorage.setItem('asistente_circuitos_v1', JSON.stringify(v)));
    congregaciones.subscribe(v => localStorage.setItem('asistente_congre_v1', JSON.stringify(v)));
    visitasStore.subscribe(v => localStorage.setItem('asistente_visitas_v1', JSON.stringify(v)));
}

// Recuperamos el estado previo de apariencia (para que al abrir la app se mantenga como la dejaste)
const temaPrevio = typeof window !== 'undefined' ? localStorage.getItem('asistente_tema') === 'true' : false;
const colorPrevio = typeof window !== 'undefined' ? localStorage.getItem('asistente_color') || '#b63a3a' : '#b63a3a';

// Definimos los nuevos stores
export const temaOscuro = writable<boolean>(temaPrevio);
export const colorAcento = writable<string>(colorPrevio);

// Guardado automático de la apariencia
if (typeof window !== 'undefined') {
    temaOscuro.subscribe(v => localStorage.setItem('asistente_tema', v.toString()));
    colorAcento.subscribe(v => localStorage.setItem('asistente_color', v));
}