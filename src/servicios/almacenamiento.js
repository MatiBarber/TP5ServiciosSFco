/**
 * Persistencia local.
 *
 * Todo lo que el vecino genera —reclamos, pagos simulados, preferencias,
 * suscripciones, historial de avisos— vive en el localStorage del propio
 * dispositivo y no sale de el. Esa es la respuesta concreta al requisito no
 * funcional de seguridad: la aplicacion no puede filtrar datos personales de un
 * servidor que no tiene.
 *
 * El dia que exista API municipal, estas funciones son el unico lugar donde hay
 * que tocar para reemplazar el almacen por una cuenta del vecino.
 */

const PREFIJO = 'serviciossf:';

/** Soporta entornos sin localStorage (service worker, pruebas, modo privado). */
function almacen() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

/**
 * @template T
 * @param {string} clave
 * @param {T} porDefecto
 * @returns {T}
 */
export function leer(clave, porDefecto) {
  const a = almacen();
  if (!a) return porDefecto;
  try {
    const crudo = a.getItem(PREFIJO + clave);
    if (crudo === null) return porDefecto;
    return JSON.parse(crudo);
  } catch {
    // Un valor corrupto no debe impedir que la aplicacion abra.
    return porDefecto;
  }
}

/**
 * @param {string} clave
 * @param {unknown} valor
 * @returns {boolean} false si el navegador rechazo la escritura (cuota llena)
 */
export function escribir(clave, valor) {
  const a = almacen();
  if (!a) return false;
  try {
    a.setItem(PREFIJO + clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

/** @param {string} clave */
export function borrar(clave) {
  const a = almacen();
  if (!a) return;
  try {
    a.removeItem(PREFIJO + clave);
  } catch {
    /* sin efecto */
  }
}

/** Elimina todo lo que la aplicacion haya guardado. Usado por Preferencias. */
export function vaciarTodo() {
  const a = almacen();
  if (!a) return;
  try {
    const claves = [];
    for (let i = 0; i < a.length; i += 1) {
      const k = a.key(i);
      if (k && k.startsWith(PREFIJO)) claves.push(k);
    }
    claves.forEach((k) => a.removeItem(k));
  } catch {
    /* sin efecto */
  }
}

export const CLAVES = {
  reclamos: 'reclamos',
  pagos: 'pagos',
  cedulones: 'cedulones',
  suscripciones: 'suscripciones',
  preferencias: 'preferencias',
  avisos: 'avisos',
  estacionamiento: 'estacionamiento-activo',
  reportes: 'reportes-bicicletas',
};
