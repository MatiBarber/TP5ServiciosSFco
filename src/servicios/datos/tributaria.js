/**
 * Datos semilla de la Direccion General Tributaria.
 *
 * Los importes y los numeros de cuenta son inventados. Los nombres de los
 * tributos siguen la nomenclatura municipal habitual para que las pantallas
 * resulten reconocibles en la demostracion.
 */

function dia(desplazamiento) {
  const f = new Date();
  f.setHours(0, 0, 0, 0);
  f.setDate(f.getDate() + desplazamiento);
  return f.toISOString().slice(0, 10);
}

export const CONTRIBUYENTE_SEMILLA = {
  cuit: '20-41234567-8',
  nombre: 'Matias Barbieri',
  domicilio: 'Bv. 25 de Mayo 1234 - San Francisco (Cordoba)',
};

export const CEDULONES_SEMILLA = [
  {
    id: 'ced-2026-0411',
    tributo: 'Contribucion que incide sobre los inmuebles',
    periodo: '2026/11',
    cuenta: '04-11-0234-5',
    importe: 38450.0,
    vence: dia(9),
    estado: 'pendiente',
  },
  {
    id: 'ced-2026-0410',
    tributo: 'Contribucion que incide sobre los inmuebles',
    periodo: '2026/10',
    cuenta: '04-11-0234-5',
    importe: 38450.0,
    vence: dia(-21),
    estado: 'pagado',
    pagadoEl: dia(-24),
    medio: 'Tarjeta de credito (simulado)',
  },
  {
    id: 'ced-2026-0311',
    tributo: 'Comercio e industria',
    periodo: '2026/11',
    cuenta: '03-11-7781-2',
    importe: 91200.5,
    vence: dia(3),
    estado: 'pendiente',
  },
  {
    id: 'ced-2026-0211',
    tributo: 'Automotor - Dominio AB123CD',
    periodo: '2026/6to bim',
    cuenta: '02-11-4412-0',
    importe: 24780.0,
    vence: dia(-4),
    estado: 'vencido',
  },
  {
    id: 'ced-2026-0209',
    tributo: 'Automotor - Dominio AB123CD',
    periodo: '2026/5to bim',
    cuenta: '02-11-4412-0',
    importe: 24780.0,
    vence: dia(-64),
    estado: 'pagado',
    pagadoEl: dia(-70),
    medio: 'Tarjeta de debito (simulado)',
  },
  {
    id: 'ced-2026-0511',
    tributo: 'Servicios a la propiedad - Agua corriente',
    periodo: '2026/11',
    cuenta: '05-11-9087-7',
    importe: 15990.0,
    vence: dia(16),
    estado: 'pendiente',
  },
];
