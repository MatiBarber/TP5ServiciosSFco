/**
 * Catalogo de tipos de aviso y novedades semilla.
 *
 * Los tipos coinciden con los temas que la consigna enumera —cortes de
 * servicio, obras publicas, eventos, emergencias— y son la unidad de la
 * personalizacion que pide el requisito: el usuario elige tipos y zonas, no
 * avisos sueltos.
 */

export const TIPOS_DE_AVISO = [
  { id: 'cortes', etiqueta: 'Cortes de servicio', descripcion: 'Agua, luz y gas.', icono: 'water' },
  { id: 'obras', etiqueta: 'Obras publicas', descripcion: 'Cortes de calle y desvios.', icono: 'construct' },
  { id: 'eventos', etiqueta: 'Eventos', descripcion: 'Actividades culturales y deportivas.', icono: 'calendar' },
  { id: 'emergencias', etiqueta: 'Emergencias', descripcion: 'Alertas meteorologicas y de seguridad.', icono: 'warning' },
  { id: 'tributos', etiqueta: 'Vencimientos', descripcion: 'Recordatorios de tributos municipales.', icono: 'cash' },
  { id: 'alarmas', etiqueta: 'Alarmas cercanas', descripcion: 'Activaciones en tus zonas suscriptas.', icono: 'notifications' },
];

function haceHoras(n) {
  const f = new Date();
  f.setHours(f.getHours() - n);
  return f.toISOString();
}

export const AVISOS_SEMILLA = [
  {
    id: 'av-001',
    tipo: 'cortes',
    zona: 'norte',
    titulo: 'Corte programado de agua en Barrio Norte',
    cuerpo:
      'El jueves de 8 a 14 se interrumpe el servicio por reparacion de la red troncal en Av. Libertador Norte.',
    fecha: haceHoras(3),
    enlace: 'https://www.sanfrancisco.gov.ar/',
    leido: false,
  },
  {
    id: 'av-002',
    tipo: 'obras',
    zona: 'centro',
    titulo: 'Bv. 25 de Mayo con transito reducido',
    cuerpo:
      'Por repavimentacion, la circulacion entre Iturraspe y Belgrano queda en un solo carril hasta el viernes.',
    fecha: haceHoras(20),
    enlace: 'https://www.sanfrancisco.gov.ar/',
    leido: true,
  },
  {
    id: 'av-003',
    tipo: 'eventos',
    zona: 'centro',
    titulo: 'Feria de artesanos en Plaza Civica',
    cuerpo: 'Sabado y domingo de 17 a 22, con patio gastronomico y musica en vivo.',
    fecha: haceHoras(44),
    enlace: 'https://www.sanfrancisco.gov.ar/',
    leido: true,
  },
  {
    id: 'av-004',
    tipo: 'emergencias',
    zona: 'centro',
    titulo: 'Alerta meteorologica amarilla',
    cuerpo:
      'Se esperan tormentas fuertes con rafagas durante la tarde. Evita estacionar bajo arbolado.',
    fecha: haceHoras(70),
    enlace: 'https://www.smn.gob.ar/',
    leido: true,
  },
];
