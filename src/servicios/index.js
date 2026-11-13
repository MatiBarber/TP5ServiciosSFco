/**
 * Punto de entrada unico de la capa de servicios.
 *
 * Agregar un servicio nuevo a la aplicacion es agregar un archivo a esta
 * carpeta con su par simulado/real y una linea aca. Esa es la respuesta
 * concreta al requisito no funcional de escalabilidad de la consigna: la
 * incorporacion de una funcionalidad no toca ninguna pantalla existente.
 */
export { default as bicicletas } from './bicicletas.js';
export { default as tributaria } from './tributaria.js';
export { default as reclamos } from './reclamos.js';
export { default as atencion } from './atencion.js';
export { default as alarmas } from './alarmas.js';
export { default as estacionamiento } from './estacionamiento.js';
export { default as notificaciones } from './notificaciones.js';
export { ErrorDeServicio, seleccionar } from './seleccion.js';
