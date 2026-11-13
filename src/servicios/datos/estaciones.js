/**
 * Datos semilla de estaciones de bicicletas publicas.
 *
 * Las ubicaciones corresponden a puntos reales de San Francisco (Cordoba) para
 * que el mapa sea legible en la demostracion. La disponibilidad es inventada y
 * el canal de tiempo real la modifica mientras la aplicacion esta abierta.
 */
export const ESTACIONES_SEMILLA = [
  {
    id: 'est-01',
    nombre: 'Plaza Civica',
    direccion: 'Bv. 25 de Mayo y Av. Libertador Norte',
    lat: -31.4258,
    lng: -62.0833,
    anclajes: 16,
    disponibles: 9,
    estado: 'operativa',
  },
  {
    id: 'est-02',
    nombre: 'Terminal de Omnibus',
    direccion: 'Av. Libertador Sur 1500',
    lat: -31.4336,
    lng: -62.0822,
    anclajes: 20,
    disponibles: 14,
    estado: 'operativa',
  },
  {
    id: 'est-03',
    nombre: 'UTN Facultad Regional San Francisco',
    direccion: 'Av. de la Universidad 501',
    lat: -31.4195,
    lng: -62.0689,
    anclajes: 12,
    disponibles: 3,
    estado: 'operativa',
  },
  {
    id: 'est-04',
    nombre: 'Parque Cincuentenario',
    direccion: 'Av. Trinidad y Bv. Roca',
    lat: -31.4312,
    lng: -62.0921,
    anclajes: 18,
    disponibles: 11,
    estado: 'operativa',
  },
  {
    id: 'est-05',
    nombre: 'Hospital J. B. Iturraspe',
    direccion: 'Av. Libertador Norte 1050',
    lat: -31.4181,
    lng: -62.0848,
    anclajes: 14,
    disponibles: 0,
    estado: 'operativa',
  },
  {
    id: 'est-06',
    nombre: 'Barrio Catedral',
    direccion: 'Iturraspe y Belgrano',
    lat: -31.4271,
    lng: -62.0872,
    anclajes: 10,
    disponibles: 5,
    estado: 'mantenimiento',
  },
  {
    id: 'est-07',
    nombre: 'Polideportivo Municipal',
    direccion: 'Av. Caseros 2100',
    lat: -31.4219,
    lng: -62.0954,
    anclajes: 16,
    disponibles: 12,
    estado: 'operativa',
  },
  {
    id: 'est-08',
    nombre: 'Parque Industrial',
    direccion: 'Ruta Nacional 19 km 4',
    lat: -31.4402,
    lng: -62.0695,
    anclajes: 12,
    disponibles: 8,
    estado: 'operativa',
  },
];

/** Motivos admitidos al reportar un problema con una estacion o una bicicleta. */
export const MOTIVOS_DE_REPORTE = [
  { id: 'bici_danada', etiqueta: 'Bicicleta danada' },
  { id: 'anclaje_trabado', etiqueta: 'Anclaje trabado' },
  { id: 'estacion_fuera_servicio', etiqueta: 'Estacion fuera de servicio' },
  { id: 'dato_incorrecto', etiqueta: 'La disponibilidad no coincide' },
  { id: 'otro', etiqueta: 'Otro' },
];
