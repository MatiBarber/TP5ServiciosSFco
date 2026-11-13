import { responder, clonar } from './red.js';
import { CEDULONES_SEMILLA, CONTRIBUYENTE_SEMILLA } from '../datos/tributaria.js';
import { leer, escribir, CLAVES } from '../almacenamiento.js';

/**
 * Implementacion simulada de la Direccion General Tributaria.
 *
 * El estado de los cedulones se persiste en el dispositivo apenas se paga uno,
 * para que la pantalla de historial muestre algo que el propio usuario produjo
 * durante la demostracion y no solamente la semilla.
 */

function cedulonesActuales() {
  const guardados = leer(CLAVES.cedulones, null);
  return guardados ?? clonar(CEDULONES_SEMILLA);
}

function guardarCedulones(lista) {
  escribir(CLAVES.cedulones, lista);
}

/** Recalcula 'vencido' contra la fecha de hoy antes de devolver. */
function conEstadoAlDia(cedulon) {
  if (cedulon.estado === 'pagado') return cedulon;
  const hoy = new Date().toISOString().slice(0, 10);
  return { ...cedulon, estado: cedulon.vence < hoy ? 'vencido' : 'pendiente' };
}

async function obtenerContribuyente() {
  return responder(CONTRIBUYENTE_SEMILLA);
}

/** @param {{estado?: string}} [filtro] */
async function listarCedulones(filtro = {}) {
  let lista = cedulonesActuales().map(conEstadoAlDia);
  if (filtro.estado) lista = lista.filter((c) => c.estado === filtro.estado);
  lista.sort((a, b) => (a.vence < b.vence ? 1 : -1));
  return responder(lista, { mensajeDeError: 'No se pudo consultar la cuenta corriente.' });
}

/** @param {string} id */
async function obtenerCedulon(id) {
  const c = cedulonesActuales().find((x) => x.id === id) ?? null;
  return responder(c ? conEstadoAlDia(c) : null, {
    mensajeDeError: 'No se pudo emitir el cedulon.',
  });
}

/**
 * Proximos vencimientos dentro de una ventana de dias.
 *
 * Es el dato que alimenta el recordatorio del requisito "implementar
 * notificaciones para recordar fechas de vencimiento".
 *
 * @param {number} dias
 */
async function proximosVencimientos(dias = 15) {
  const hoy = new Date();
  const limite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const hoyIso = hoy.toISOString().slice(0, 10);

  const lista = cedulonesActuales()
    .map(conEstadoAlDia)
    .filter((c) => c.estado !== 'pagado' && c.vence >= hoyIso && c.vence <= limite)
    .sort((a, b) => (a.vence < b.vence ? -1 : 1));

  return responder(lista, { mensajeDeError: 'No se pudo consultar vencimientos.' });
}

/**
 * Registra un pago SIMULADO.
 *
 * No existe ninguna pasarela detras. La funcion no acepta ni almacena datos de
 * tarjeta: recibe solo el medio elegido, que es una etiqueta. Ver la nota de
 * seguridad del README.
 *
 * @param {{cedulonId: string, medio: string}} datos
 */
async function pagarCedulon({ cedulonId, medio }) {
  const lista = cedulonesActuales();
  const indice = lista.findIndex((c) => c.id === cedulonId);
  if (indice === -1) {
    return responder(null, { mensajeDeError: 'El cedulon ya no esta disponible.' });
  }

  const hoy = new Date().toISOString().slice(0, 10);
  lista[indice] = { ...lista[indice], estado: 'pagado', pagadoEl: hoy, medio };
  guardarCedulones(lista);

  const comprobante = {
    id: `PG-${Date.now()}`,
    cedulonId,
    tributo: lista[indice].tributo,
    periodo: lista[indice].periodo,
    importe: lista[indice].importe,
    medio,
    fecha: new Date().toISOString(),
    simulado: true,
  };
  escribir(CLAVES.pagos, [comprobante, ...leer(CLAVES.pagos, [])]);

  return responder(comprobante, { mensajeDeError: 'El pago no pudo procesarse.' });
}

async function historialDePagos() {
  const propios = leer(CLAVES.pagos, []);
  const deSemilla = clonar(CEDULONES_SEMILLA)
    .filter((c) => c.estado === 'pagado')
    .map((c) => ({
      id: `PG-${c.id}`,
      cedulonId: c.id,
      tributo: c.tributo,
      periodo: c.periodo,
      importe: c.importe,
      medio: c.medio ?? 'Simulado',
      fecha: `${c.pagadoEl}T12:00:00.000Z`,
      simulado: true,
    }));

  const todos = [...propios, ...deSemilla].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  return responder(todos, { mensajeDeError: 'No se pudo consultar el historial.' });
}

export default {
  obtenerContribuyente,
  listarCedulones,
  obtenerCedulon,
  proximosVencimientos,
  pagarCedulon,
  historialDePagos,
};
