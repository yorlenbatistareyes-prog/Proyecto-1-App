import { congregaciones } from '$lib/stores'; // <-- Aquí quitamos la palabra "Store"
import type { Congregacion } from '$lib/types'; 

export const moldeCongregacion: Congregacion = {
    circuito: '', seccion: '', sucursal: '',
    nombre: '', numero: '', ciudad: '', provincia: '',
    pais: 'Cuba', idioma: 'S', esLenguaSeñas: false,
    reunionEntreSemana: '', horaEntreSemana: '',
    reunionFinSemana: '', horaFinSemana: '',
    telefono: ''
};

export function eliminarCongregacion(nombre: string) {
    // Usamos el nombre correcto del store
    congregaciones.update(lista => {
        return lista.filter(c => c.nombre !== nombre);
    });
}

// Esta función ahora recibe los datos y decide si guarda o actualiza
export function procesarGuardadoCongregacion(datos: Congregacion) {
    congregaciones.update(lista => {
        const index = lista.findIndex(c => c.nombre === datos.nombre);
        if (index !== -1) {
            // Si ya existe (EDICIÓN), reemplazamos
            const nuevaLista = [...lista];
            nuevaLista[index] = { ...datos };
            return nuevaLista;
        } else {
            // Si es nueva (CREACIÓN), añadimos
            return [...lista, { ...datos }];
        }
    });
}