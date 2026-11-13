import { seleccionar } from './seleccion.js';
import simulado from './mock/bicicletas.js';
import real from './real/bicicletas.js';

/**
 * Fachada del servicio de bicicletas.
 *
 * Es lo unico que importan las pantallas. No saben —y no pueden saber— si lo
 * que reciben viene del simulador o de la API municipal: eso lo decide
 * USAR_SIMULADOR en src/config.js.
 */
export default seleccionar(simulado, real);
