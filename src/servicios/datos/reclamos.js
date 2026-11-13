/**
 * Catalogo y datos semilla del centro de reclamos.
 */

export const CATEGORIAS_DE_RECLAMO = [
  { id: 'alumbrado', etiqueta: 'Alumbrado publico', area: 'Servicios Publicos' },
  { id: 'baches', etiqueta: 'Baches y pavimento', area: 'Obras Publicas' },
  { id: 'residuos', etiqueta: 'Recoleccion de residuos', area: 'Higiene Urbana' },
  { id: 'arbolado', etiqueta: 'Arbolado y poda', area: 'Ambiente' },
  { id: 'agua', etiqueta: 'Agua y cloacas', area: 'Servicios Sanitarios' },
  { id: 'transito', etiqueta: 'Transito y senalizacion', area: 'Transito' },
  { id: 'espacios', etiqueta: 'Plazas y espacios verdes', area: 'Espacios Verdes' },
  { id: 'otro', etiqueta: 'Otro', area: 'Mesa de Entradas' },
];

/** Estados por los que pasa un reclamo, en orden. */
export const ESTADOS_DE_RECLAMO = [
  { id: 'recibido', etiqueta: 'Recibido', color: 'medium' },
  { id: 'en_curso', etiqueta: 'En curso', color: 'warning' },
  { id: 'resuelto', etiqueta: 'Resuelto', color: 'success' },
  { id: 'rechazado', etiqueta: 'Rechazado', color: 'danger' },
];

function haceDias(n) {
  const f = new Date();
  f.setDate(f.getDate() - n);
  return f.toISOString();
}

export const RECLAMOS_SEMILLA = [
  {
    id: 'RE-2026-0418',
    categoria: 'alumbrado',
    descripcion:
      'Tres luminarias apagadas sobre Bv. Roca entre Iturraspe y Belgrano. La cuadra queda a oscuras.',
    direccion: 'Bv. Roca 850',
    lat: -31.4283,
    lng: -62.0889,
    creadoEl: haceDias(12),
    estado: 'resuelto',
    adjuntos: [],
    historial: [
      { estado: 'recibido', fecha: haceDias(12), nota: 'Reclamo registrado.' },
      { estado: 'en_curso', fecha: haceDias(9), nota: 'Derivado a Servicios Publicos.' },
      { estado: 'resuelto', fecha: haceDias(4), nota: 'Se reemplazaron tres luminarias.' },
    ],
  },
  {
    id: 'RE-2026-0502',
    categoria: 'baches',
    descripcion:
      'Bache profundo en la esquina, se inunda cuando llueve y ya rompio dos ruedas.',
    direccion: 'Av. Caseros y Rivadavia',
    lat: -31.4226,
    lng: -62.0913,
    creadoEl: haceDias(5),
    estado: 'en_curso',
    adjuntos: [],
    historial: [
      { estado: 'recibido', fecha: haceDias(5), nota: 'Reclamo registrado.' },
      { estado: 'en_curso', fecha: haceDias(2), nota: 'Inspeccion realizada, cuadrilla asignada.' },
    ],
  },
  {
    id: 'RE-2026-0517',
    categoria: 'residuos',
    descripcion: 'No pasa el camion recolector desde el lunes en toda la cuadra.',
    direccion: 'Pasaje Los Alamos 300',
    lat: -31.4341,
    lng: -62.0788,
    creadoEl: haceDias(1),
    estado: 'recibido',
    adjuntos: [],
    historial: [{ estado: 'recibido', fecha: haceDias(1), nota: 'Reclamo registrado.' }],
  },
];
