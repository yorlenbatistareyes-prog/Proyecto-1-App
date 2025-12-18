import { writable } from 'svelte/store';
import type { Vista, Circuito, Congregacion } from './types';

// Función auxiliar para recuperar datos de forma segura
const obtenerGuardados = (clave: string) => {
    if (typeof window !== 'undefined') {
        const guardado = localStorage.getItem(clave);
        return guardado ? JSON.parse(guardado) : [];
    }
    return [];
};

export const vistaActual = writable<Vista>('inicio');
export const menuAbierto = writable(false);

// --- STORES CON PERSISTENCIA ---

// Store de Circuitos
export const circuitos = writable<Circuito[]>(obtenerGuardados('asistente_circuitos_v1'));

// Store de Congregaciones (NUEVO)
export const congregaciones = writable<Congregacion[]>(obtenerGuardados('asistente_congre_v1'));

// Suscripciones para guardado automático
if (typeof window !== 'undefined') {
    circuitos.subscribe(v => localStorage.setItem('asistente_circuitos_v1', JSON.stringify(v)));
    congregaciones.subscribe(v => localStorage.setItem('asistente_congre_v1', JSON.stringify(v)));
}