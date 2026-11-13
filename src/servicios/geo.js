/**
 * Utilidades geograficas compartidas por los tres modulos con mapa.
 *
 * Son funciones puras y sin dependencias, que es lo que las hace probables sin
 * navegador: las pruebas de src/pruebas/geo.test.js las verifican contra
 * distancias conocidas de San Francisco.
 */

const RADIO_TIERRA_M = 6371000;

const aRadianes = (grados) => (grados * Math.PI) / 180;

/**
 * Distancia en metros entre dos puntos, por la formula del semiverseno.
 *
 * A escala de ciudad el error frente a una proyeccion geodesica es de
 * centimetros, de modo que alcanza de sobra para ordenar estaciones por
 * cercania o decidir si una alarma esta a menos de ochocientos metros.
 *
 * @param {{lat: number, lng: number}} a
 * @param {{lat: number, lng: number}} b
 * @returns {number} metros
 */
export function distanciaEnMetros(a, b) {
  const dLat = aRadianes(b.lat - a.lat);
  const dLng = aRadianes(b.lng - a.lng);
  const lat1 = aRadianes(a.lat);
  const lat2 = aRadianes(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Ordena una lista de puntos por cercania y les agrega la distancia calculada.
 *
 * @template {{lat: number, lng: number}} T
 * @param {T[]} puntos
 * @param {{lat: number, lng: number} | null} origen
 * @returns {(T & {distanciaM?: number})[]}
 */
export function ordenarPorCercania(puntos, origen) {
  if (!origen) return [...puntos];
  return puntos
    .map((p) => ({ ...p, distanciaM: distanciaEnMetros(origen, p) }))
    .sort((x, y) => x.distanciaM - y.distanciaM);
}

/**
 * Determina si un punto cae dentro de un poligono, por el algoritmo del rayo.
 *
 * Lo usa el modulo de estacionamiento medido para resolver en que zona esta
 * parado el vehiculo sin consultar ningun servicio externo.
 *
 * @param {{lat: number, lng: number}} punto
 * @param {[number, number][]} poligono pares [lat, lng]
 * @returns {boolean}
 */
export function dentroDelPoligono(punto, poligono) {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i, i += 1) {
    const [latI, lngI] = poligono[i];
    const [latJ, lngJ] = poligono[j];
    const cruza = latI > punto.lat !== latJ > punto.lat;
    if (!cruza) continue;
    const lngEnElCorte = ((lngJ - lngI) * (punto.lat - latI)) / (latJ - latI) + lngI;
    if (punto.lng < lngEnElCorte) dentro = !dentro;
  }
  return dentro;
}

/**
 * Texto corto de distancia, para las tarjetas de las listas.
 * @param {number | undefined} metros
 */
export function formatearDistancia(metros) {
  if (metros === undefined || metros === null) return '';
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1)} km`;
}
