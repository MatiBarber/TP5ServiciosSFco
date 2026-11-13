/**
 * Datos semilla del sistema de alarmas comunitarias.
 *
 * Cada alarma pertenece a una zona. La suscripcion de la consigna es por zona y
 * no por alarma, que es como funcionan los temas de Firebase Cloud Messaging:
 * la correspondencia es deliberada, de modo que el dia que el disparo sea real
 * cada zona es un topic.
 */

export const ZONAS = [
  { id: 'centro', nombre: 'Centro', color: '#2563eb' },
  { id: 'norte', nombre: 'Barrio Norte', color: '#7c3aed' },
  { id: 'sur', nombre: 'Barrio Sur', color: '#db2777' },
  { id: 'catedral', nombre: 'Catedral', color: '#ea580c' },
  { id: 'industrial', nombre: 'Parque Industrial', color: '#0f766e' },
];

export const ALARMAS_SEMILLA = [
  { id: 'al-01', nombre: 'Plaza Civica', zona: 'centro', lat: -31.4256, lng: -62.0836, estado: 'desactivada', bateria: 92 },
  { id: 'al-02', nombre: '25 de Mayo y Entre Rios', zona: 'centro', lat: -31.4241, lng: -62.0861, estado: 'desactivada', bateria: 88 },
  { id: 'al-03', nombre: 'Iturraspe y Belgrano', zona: 'catedral', lat: -31.4273, lng: -62.0874, estado: 'desactivada', bateria: 64 },
  { id: 'al-04', nombre: 'Bv. Roca y Libertad', zona: 'catedral', lat: -31.4295, lng: -62.0901, estado: 'desactivada', bateria: 71 },
  { id: 'al-05', nombre: 'Av. Libertador Norte 900', zona: 'norte', lat: -31.4189, lng: -62.0842, estado: 'desactivada', bateria: 97 },
  { id: 'al-06', nombre: 'Av. de la Universidad 400', zona: 'norte', lat: -31.4201, lng: -62.0702, estado: 'activada', bateria: 55 },
  { id: 'al-07', nombre: 'Terminal de Omnibus', zona: 'sur', lat: -31.4334, lng: -62.0824, estado: 'desactivada', bateria: 83 },
  { id: 'al-08', nombre: 'Pasaje Los Alamos', zona: 'sur', lat: -31.4347, lng: -62.0791, estado: 'desactivada', bateria: 41 },
  { id: 'al-09', nombre: 'Av. Trinidad y Bv. Roca', zona: 'sur', lat: -31.4316, lng: -62.0918, estado: 'desactivada', bateria: 79 },
  { id: 'al-10', nombre: 'Ruta 19 km 4', zona: 'industrial', lat: -31.4405, lng: -62.0691, estado: 'desactivada', bateria: 68 },
  { id: 'al-11', nombre: 'Polideportivo Municipal', zona: 'norte', lat: -31.4221, lng: -62.0951, estado: 'desactivada', bateria: 90 },
  { id: 'al-12', nombre: 'Parque Cincuentenario', zona: 'sur', lat: -31.4309, lng: -62.0929, estado: 'fuera_de_linea', bateria: 0 },
];

export const ESTADOS_DE_ALARMA = {
  activada: { etiqueta: 'Activada', color: '#dc2626' },
  desactivada: { etiqueta: 'Normal', color: '#16a34a' },
  fuera_de_linea: { etiqueta: 'Fuera de linea', color: '#6b7280' },
};
