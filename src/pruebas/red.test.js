import { describe, it, expect, afterEach } from 'vitest';
import { responder, clonar, configurarRed, restablecerRed } from '../servicios/mock/red.js';
import { crearCanal, acotar } from '../servicios/mock/tiempoReal.js';
import { ErrorDeServicio } from '../servicios/seleccion.js';

/**
 * Pruebas del simulador de red y del canal de tiempo real.
 *
 * El simulador es aleatorio por diseno, de modo que las pruebas lo configuran
 * antes de medirlo: una suite que falla una de cada doce ejecuciones es peor
 * que no tener suite.
 */

afterEach(() => restablecerRed());

describe('simulador de red', () => {
  it('nunca falla con la tasa de fallas en cero', async () => {
    configurarRed({ demoraMinMs: 0, demoraMaxMs: 0, tasaDeFallas: 0 });
    for (let i = 0; i < 50; i += 1) {
      await expect(responder({ ok: true })).resolves.toEqual({ ok: true });
    }
  });

  it('siempre falla con la tasa de fallas en uno, y con el tipo de error propio', async () => {
    configurarRed({ demoraMinMs: 0, demoraMaxMs: 0, tasaDeFallas: 1 });
    await expect(responder({ ok: true })).rejects.toBeInstanceOf(ErrorDeServicio);
  });

  it('usa el mensaje de error que le pasa cada servicio', async () => {
    configurarRed({ demoraMinMs: 0, demoraMaxMs: 0, tasaDeFallas: 1 });
    await expect(
      responder(null, { mensajeDeError: 'No se pudo consultar los reclamos.' })
    ).rejects.toThrow('No se pudo consultar los reclamos.');
  });

  it('respeta la demora minima configurada', async () => {
    configurarRed({ demoraMinMs: 60, demoraMaxMs: 60, tasaDeFallas: 0 });
    const inicio = Date.now();
    await responder({});
    // Margen de tolerancia: los temporizadores del entorno no son exactos.
    expect(Date.now() - inicio).toBeGreaterThanOrEqual(50);
  });

  it('devuelve una copia y no la semilla, para que la pantalla no la pueda mutar', async () => {
    configurarRed({ demoraMinMs: 0, demoraMaxMs: 0, tasaDeFallas: 0 });
    const semilla = { lista: [{ id: 'a', n: 1 }] };
    const recibido = await responder(semilla);

    recibido.lista[0].n = 999;

    expect(semilla.lista[0].n).toBe(1);
    expect(recibido).not.toBe(semilla);
  });
});

describe('copia profunda', () => {
  it('copia objetos anidados, arreglos y fechas', () => {
    const original = { a: [1, { b: 2 }], f: new Date('2026-11-10T00:00:00Z') };
    const copia = clonar(original);

    expect(copia).toEqual(original);
    expect(copia.a[1]).not.toBe(original.a[1]);
    expect(copia.f).not.toBe(original.f);
    expect(copia.f.getTime()).toBe(original.f.getTime());
  });

  it('devuelve los valores primitivos tal cual', () => {
    expect(clonar(5)).toBe(5);
    expect(clonar('x')).toBe('x');
    expect(clonar(null)).toBe(null);
  });
});

describe('canal de tiempo real', () => {
  it('avisa al suscriptor apenas se suscribe, con el estado actual', () => {
    const canal = crearCanal({
      estadoInicial: { n: 1 },
      intervaloMs: 100000,
      mutar: (e) => ({ n: e.n + 1 }),
    });

    const recibidos = [];
    const cancelar = canal.suscribir((e) => recibidos.push(e));

    expect(recibidos).toEqual([{ n: 1 }]);
    cancelar();
    canal.detener();
  });

  it('notifica a todos los suscriptores cada vez que avanza', () => {
    const canal = crearCanal({
      estadoInicial: { n: 0 },
      intervaloMs: 100000,
      mutar: (e) => ({ n: e.n + 1 }),
    });

    const a = [];
    const b = [];
    const cancelarA = canal.suscribir((e) => a.push(e.n));
    const cancelarB = canal.suscribir((e) => b.push(e.n));

    canal.avanzar();
    canal.avanzar();

    expect(a).toEqual([0, 1, 2]);
    expect(b).toEqual([0, 1, 2]);

    cancelarA();
    cancelarB();
    canal.detener();
  });

  it('deja de notificar al que cancela', () => {
    const canal = crearCanal({
      estadoInicial: { n: 0 },
      intervaloMs: 100000,
      mutar: (e) => ({ n: e.n + 1 }),
    });

    const recibidos = [];
    const cancelar = canal.suscribir((e) => recibidos.push(e.n));
    cancelar();
    canal.avanzar();

    expect(recibidos).toEqual([0]);
    canal.detener();
  });

  it('entrega copias, de modo que un suscriptor no puede alterar a los demas', () => {
    const canal = crearCanal({
      estadoInicial: { lista: [1, 2] },
      intervaloMs: 100000,
      mutar: (e) => e,
    });

    let primero = null;
    const cancelarA = canal.suscribir((e) => {
      primero = e;
    });
    primero.lista.push(99);

    let segundo = null;
    const cancelarB = canal.suscribir((e) => {
      segundo = e;
    });

    expect(segundo.lista).toEqual([1, 2]);

    cancelarA();
    cancelarB();
    canal.detener();
  });
});

describe('acotar', () => {
  it('mantiene el valor dentro del rango', () => {
    expect(acotar(5, 0, 10)).toBe(5);
    expect(acotar(-3, 0, 10)).toBe(0);
    expect(acotar(42, 0, 10)).toBe(10);
  });
});
