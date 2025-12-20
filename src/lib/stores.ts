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