import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { configurarRed, restablecerRed } from '../servicios/mock/red.js';
import { vaciarTodo } from '../servicios/almacenamiento.js';

import bicicletas from '../servicios/mock/bicicletas.js';
import tributaria from '../servicios/mock/tributaria.js';
import reclamos from '../servicios/mock/reclamos.js';
import atencion from '../servicios/mock/atencion.js';
import alarmas from '../servicios/mock/alarmas.js';
import estacionamiento from '../servicios/mock/estacionamiento.js';
import { ZONAS_DE_ESTACIONAMIENTO } from '../servicios/datos/estacionamiento.js';

/**
 * Pruebas de reglas de negocio de los siete modulos.
 *
 * Todas corren con el simulador en modo deterministico —sin demora y sin
 * fallas— porque lo que se verifica aca no es el transporte sino la regla.
 */

beforeEach(() => {
  configurarRed({ demoraMinMs: 0, demoraMaxMs: 0, tasaDeFallas: 0 });
  vaciarTodo();
});

afterEach(() => restablecerRed());

describe('bicicletas', () => {
  it('nunca informa mas bicicletas que anclajes, ni cantidades negativas', async () => {
    // Se fuerzan muchos avances del canal para recorrer el rango de mutaciones.
    for (let i = 0; i < 300; i += 1) bicicletas._avanzarTiempoReal();

    const lista = await bicicletas.listarEstaciones();
    for (const e of lista) {
      expect(e.disponibles, e.nombre).toBeGreaterThanOrEqual(0);
      expect(e.disponibles, e.nombre).toBeLessThanOrEqual(e.anclajes);
    }
  });

  it('no toca las estaciones en mantenimiento', async () => {
    const antes = (await bicicletas.listarEstaciones()).filter(
      (e) => e.estado === 'mantenimiento'
    );
    for (let i = 0; i < 200; i += 1) bicicletas._avanzarTiempoReal();
    const despues = (await bicicletas.listarEstaciones()).filter(
      (e) => e.estado === 'mantenimiento'
    );

    expect(despues.map((e) => e.disponibles)).toEqual(antes.map((e) => e.disponibles));
  });

  it('ordena las estaciones cercanas por distancia creciente', async () => {
    const lista = await bicicletas.estacionesCercanas({ lat: -31.4257, lng: -62.0836 });
    const distancias = lista.map((e) => e.distanciaM);
    expect(distancias).toEqual([...distancias].sort((a, b) => a - b));
  });

  it('guarda el reporte de problema y lo devuelve en el listado', async () => {
    await bicicletas.reportarProblema({ estacionId: 'est-01', motivo: 'bici_danada' });
    const reportes = await bicicletas.listarReportes();
    expect(reportes).toHaveLength(1);
    expect(reportes[0].estacionId).toBe('est-01');
  });
});

describe('tributaria', () => {
  it('marca como vencido todo cedulon impago cuya fecha ya paso', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const lista = await tributaria.listarCedulones();

    for (const c of lista) {
      if (c.estado === 'pagado') continue;
      const esperado = c.vence < hoy ? 'vencido' : 'pendiente';
      expect(c.estado, `${c.id} vence ${c.vence}`).toBe(esperado);
    }
  });

  it('pagar un cedulon lo deja pagado y genera el comprobante', async () => {
    const pendientes = (await tributaria.listarCedulones()).filter((c) => c.estado !== 'pagado');
    const elegido = pendientes[0];

    const comprobante = await tributaria.pagarCedulon({
      cedulonId: elegido.id,
      medio: 'Tarjeta de credito (simulado)',
    });

    expect(comprobante.importe).toBe(elegido.importe);
    expect(comprobante.simulado).toBe(true);

    const despues = await tributaria.obtenerCedulon(elegido.id);
    expect(despues.estado).toBe('pagado');
  });

  it('el pago aparece en el historial', async () => {
    const pendientes = (await tributaria.listarCedulones()).filter((c) => c.estado !== 'pagado');
    await tributaria.pagarCedulon({ cedulonId: pendientes[0].id, medio: 'Billetera (simulado)' });

    const historial = await tributaria.historialDePagos();
    expect(historial.some((p) => p.cedulonId === pendientes[0].id)).toBe(true);
  });

  it('los proximos vencimientos quedan dentro de la ventana pedida y no incluyen pagados', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const limite = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    for (const c of await tributaria.proximosVencimientos(10)) {
      expect(c.estado).not.toBe('pagado');
      expect(c.vence >= hoy).toBe(true);
      expect(c.vence <= limite).toBe(true);
    }
  });
});

describe('reclamos', () => {
  const nuevo = {
    categoria: 'baches',
    descripcion: 'Bache grande en la esquina, se inunda cuando llueve.',
    direccion: 'Av. Caseros 2100',
  };

  it('crea el reclamo en estado recibido y con una entrada de historial', async () => {
    const creado = await reclamos.crearReclamo(nuevo);
    expect(creado.estado).toBe('recibido');
    expect(creado.historial).toHaveLength(1);
    expect(creado.id).toMatch(/^RE-\d{4}-\d{4}$/);
  });

  it('el reclamo creado aparece primero en el listado', async () => {
    const creado = await reclamos.crearReclamo(nuevo);
    const lista = await reclamos.listarReclamos();
    expect(lista[0].id).toBe(creado.id);
  });

  it('el filtro por texto busca en descripcion, direccion e identificador', async () => {
    const creado = await reclamos.crearReclamo({
      ...nuevo,
      descripcion: 'Semaforo intermitente desde el martes a la madrugada.',
      direccion: 'Ruta 19 y colectora oeste',
    });

    expect(await reclamos.listarReclamos({ texto: 'intermitente' })).toHaveLength(1);
    expect(await reclamos.listarReclamos({ texto: 'colectora' })).toHaveLength(1);
    expect(await reclamos.listarReclamos({ texto: creado.id })).toHaveLength(1);
    expect(await reclamos.listarReclamos({ texto: 'zzzz' })).toHaveLength(0);
  });

  it('el filtro por texto no distingue mayusculas', async () => {
    await reclamos.crearReclamo({ ...nuevo, direccion: 'Av. Caseros 2100' });
    const enMinuscula = await reclamos.listarReclamos({ texto: 'caseros' });
    const enMayuscula = await reclamos.listarReclamos({ texto: 'CASEROS' });
    expect(enMinuscula.length).toBe(enMayuscula.length);
    expect(enMinuscula.length).toBeGreaterThan(0);
  });

  it('el filtro por estado deja solo los de ese estado', async () => {
    const lista = await reclamos.listarReclamos({ estado: 'resuelto' });
    expect(lista.every((r) => r.estado === 'resuelto')).toBe(true);
  });

  it('avanzar el estado agrega al historial sin perder lo anterior', async () => {
    const creado = await reclamos.crearReclamo(nuevo);
    const actualizado = await reclamos.actualizarEstado(creado.id, 'en_curso', 'Derivado.');

    expect(actualizado.estado).toBe('en_curso');
    expect(actualizado.historial).toHaveLength(2);
    expect(actualizado.historial[0].estado).toBe('recibido');
  });

  it('no permite modificar un reclamo que no es propio', async () => {
    // Los reclamos semilla no estan en el almacen del dispositivo.
    const resultado = await reclamos.actualizarEstado('RE-2026-0418', 'resuelto', '');
    expect(resultado).toBe(null);
  });
});

describe('lineas de atencion', () => {
  const area = {
    nombre: 'Obras Publicas',
    telefono: '+54 3564 000002',
    correo: 'obras@ejemplo.gob.ar',
    whatsapp: '543564000002',
  };

  it('arma el enlace de llamada quitando los separadores', () => {
    expect(atencion.enlaceDeContacto('llamar', area)).toBe('tel:+543564000002');
  });

  it('arma el enlace de correo con asunto y cuerpo codificados', () => {
    const enlace = atencion.enlaceDeContacto('correo', area, 'Hola, consulta por un bache');
    expect(enlace).toContain('mailto:obras@ejemplo.gob.ar');
    expect(enlace).toContain('subject=Consulta%20-%20Obras%20Publicas');
    expect(enlace).toContain('body=Hola%2C%20consulta%20por%20un%20bache');
  });

  it('arma el enlace de mensajeria con solo digitos', () => {
    expect(atencion.enlaceDeContacto('whatsapp', { whatsapp: '+54 3564 00-0002' })).toBe(
      'https://wa.me/543564000002'
    );
  });

  it('devuelve null cuando el area no tiene ese medio de contacto', () => {
    expect(atencion.enlaceDeContacto('correo', { nombre: 'Policia', telefono: '911' })).toBe(null);
    expect(atencion.enlaceDeContacto('whatsapp', { nombre: 'Policia' })).toBe(null);
  });
});

describe('alarmas', () => {
  const laPlaza = { lat: -31.4256, lng: -62.0836 };

  it('avisa por una alarma activada de una zona suscripta aunque este lejos', () => {
    const lista = [
      { id: 'a1', zona: 'sur', estado: 'activada', lat: -31.4405, lng: -62.0691 },
      { id: 'a2', zona: 'norte', estado: 'desactivada', lat: -31.4256, lng: -62.0836 },
    ];
    const relevantes = alarmas.activadasCercanas(lista, laPlaza, ['sur']);
    expect(relevantes.map((a) => a.id)).toEqual(['a1']);
  });

  it('avisa por cercania aunque la zona no este suscripta', () => {
    const lista = [{ id: 'a1', zona: 'industrial', estado: 'activada', ...laPlaza }];
    expect(alarmas.activadasCercanas(lista, laPlaza, [], 800).map((a) => a.id)).toEqual(['a1']);
  });

  it('no avisa por una alarma lejana de una zona no suscripta', () => {
    const lista = [
      { id: 'a1', zona: 'industrial', estado: 'activada', lat: -31.4405, lng: -62.0691 },
    ];
    expect(alarmas.activadasCercanas(lista, laPlaza, ['centro'], 800)).toHaveLength(0);
  });

  it('nunca avisa por una alarma que no esta activada', () => {
    const lista = [
      { id: 'a1', zona: 'centro', estado: 'desactivada', ...laPlaza },
      { id: 'a2', zona: 'centro', estado: 'fuera_de_linea', ...laPlaza },
    ];
    expect(alarmas.activadasCercanas(lista, laPlaza, ['centro'])).toHaveLength(0);
  });

  it('sin ubicacion decide solo por zona suscripta', () => {
    const lista = [{ id: 'a1', zona: 'centro', estado: 'activada', ...laPlaza }];
    expect(alarmas.activadasCercanas(lista, null, ['centro'])).toHaveLength(1);
    expect(alarmas.activadasCercanas(lista, null, ['sur'])).toHaveLength(0);
  });

  it('las alarmas fuera de linea nunca cambian de estado', async () => {
    for (let i = 0; i < 200; i += 1) alarmas._avanzarTiempoReal();
    const lista = await alarmas.listarAlarmas();
    expect(lista.find((a) => a.id === 'al-12').estado).toBe('fuera_de_linea');
  });

  it('alta y baja de suscripcion persisten', async () => {
    await alarmas.suscribirZona('sur', true);
    expect(alarmas.zonasSuscriptas()).toContain('sur');

    await alarmas.suscribirZona('sur', false);
    expect(alarmas.zonasSuscriptas()).not.toContain('sur');
  });
});

describe('estacionamiento medido', () => {
  const zonaRoja = ZONAS_DE_ESTACIONAMIENTO.find((z) => z.id === 'zona-roja');

  it('cobra por fraccion empezada', () => {
    // Zona roja: 1200 por hora, fraccion de 30 minutos => 600 por fraccion.
    expect(estacionamiento.calcularImporte(zonaRoja, 30)).toBe(600);
    expect(estacionamiento.calcularImporte(zonaRoja, 31)).toBe(1200);
    expect(estacionamiento.calcularImporte(zonaRoja, 60)).toBe(1200);
  });

  it('no cobra por tiempo cero o negativo', () => {
    expect(estacionamiento.calcularImporte(zonaRoja, 0)).toBe(0);
    expect(estacionamiento.calcularImporte(zonaRoja, -10)).toBe(0);
  });

  it('recorta el tiempo al maximo permitido por la zona', async () => {
    const sesion = await estacionamiento.iniciarSesion({
      zonaId: 'zona-roja',
      patente: 'ab123cd',
      minutos: 600,
      medio: 'simulado',
    });
    expect(sesion.minutos).toBe(zonaRoja.maximoHoras * 60);
    expect(sesion.patente).toBe('AB123CD');
  });

  it('la extension respeta el tope de la zona', async () => {
    await estacionamiento.iniciarSesion({
      zonaId: 'zona-roja',
      patente: 'AB123CD',
      minutos: 90,
      medio: 'simulado',
    });

    const extendida = await estacionamiento.extenderSesion(120);
    expect(extendida.minutos).toBe(120); // tope de 2 horas

    // Ya en el tope, una extension mas devuelve null en lugar de cobrar de mas.
    await expect(estacionamiento.extenderSesion(30)).resolves.toBe(null);
  });

  it('la extension suma el importe de los minutos agregados', async () => {
    const inicial = await estacionamiento.iniciarSesion({
      zonaId: 'zona-verde',
      patente: 'AB123CD',
      minutos: 60,
      medio: 'simulado',
    });
    const extendida = await estacionamiento.extenderSesion(60);
    expect(extendida.importe).toBe(inicial.importe * 2);
  });

  it('una sesion vencida deja de estar activa', async () => {
    const sesion = await estacionamiento.iniciarSesion({
      zonaId: 'zona-roja',
      patente: 'AB123CD',
      minutos: 30,
      medio: 'simulado',
    });
    expect(estacionamiento.sesionActiva()).not.toBe(null);

    // Minutos restantes calculados sobre un instante posterior al vencimiento.
    const despues = new Date(sesion.terminaEl).getTime() + 1000;
    expect(estacionamiento.minutosRestantes(sesion, despues)).toBeLessThan(0);
  });

  it('detecta la zona que contiene un punto y devuelve null fuera de toda zona', () => {
    expect(estacionamiento.zonaDePunto({ lat: -31.4258, lng: -62.0835 })?.id).toBe('zona-roja');
    expect(estacionamiento.zonaDePunto({ lat: -31.5, lng: -62.3 })).toBe(null);
    expect(estacionamiento.zonaDePunto(null)).toBe(null);
  });
});
