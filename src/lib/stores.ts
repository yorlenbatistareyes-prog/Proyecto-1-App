import { writable } from 'svelte/store';
import type { Circuito, Congregacion, Visita, Vista } from './types';

const obtenerGuardados = <T>(clave: string, valorDefecto: T): T => {
    if (typeof window !== 'undefined') {
        const guardado = localStorage.getItem(clave);
        try {
            return guardado ? JSON.parse(guardado) : valorDefecto;
        } catch (e) {
            console.error(`Error en ${clave}:`, e);
            return valorDefecto;
        }
    }
    return valorDefecto;
};

// --- ESTADO DE NAVEGACIÓN ---
export const vistaActual = writable<Vista>('inicio');
export const menuAbierto = writable(false);

// --- DATOS CON PERSISTENCIA ---
export const circuitos = writable<Circuito[]>(obtenerGuardados('asistente_circuitos_v1', []));
export const congregaciones = writable<Congregacion[]>(obtenerGuardados('asistente_congre_v1', []));
export const visitasStore = writable<Visita[]>(obtenerGuardados('asistente_visitas_v1', []));

// Suscripciones automáticas
if (typeof window !== 'undefined') {
    circuitos.subscribe(v => localStorage.setItem('asistente_circuitos_v1', JSON.stringify(v)));
    congregaciones.subscribe(v => localStorage.setItem('asistente_congre_v1', JSON.stringify(v)));
    visitasStore.subscribe(v => localStorage.setItem('asistente_visitas_v1', JSON.stringify(v)));
}

// --- APARIENCIA ---
export const temaOscuro = writable<boolean>(obtenerGuardados('asistente_tema', false));
export const colorAcento = writable<string>(obtenerGuardados('asistente_color', '#b63a3a'));

if (typeof window !== 'undefined') {
    temaOscuro.subscribe(v => localStorage.setItem('asistente_tema', JSON.stringify(v)));
    colorAcento.subscribe(v => localStorage.setItem('asistente_color', v));
}

// --- NOTIFICACIONES (TOAST) ---
export const toast = writable<{mensaje: string, tipo: 'exito' | 'error'} | null>(null);

export function mostrarToast(mensaje: string, tipo: 'exito' | 'error' = 'exito') {
    toast.set({ mensaje, tipo });
    setTimeout(() => toast.set(null), 3000);
}