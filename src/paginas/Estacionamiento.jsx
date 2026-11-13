import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonRange,
  IonText,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { locateOutline, timeOutline } from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { Mapa } from '../componentes/Mapa.jsx';
import { AvisoDeSimulacion } from '../componentes/AvisoDeSimulacion.jsx';
import { useGeolocalizacion } from '../ganchos/useGeolocalizacion.js';
import { useAvisos } from '../push/ProveedorDeAvisos.jsx';
import { avisoLocal } from '../push/fcm.js';
import { formatearPesos } from './Tributaria.jsx';
import estacionamiento from '../servicios/estacionamiento.js';

/**
 * Estacionamiento medido.
 *
 * Cubre los cuatro requisitos: mapa de zonas con tarifas y horarios, pago en
 * linea (simulado), temporizador que avisa antes de que venza, y extension del
 * tiempo desde la aplicacion.
 *
 * El temporizador es el caso donde la diferencia entre la plataforma web y la
 * nativa se ve con mas claridad. En Android, el TP7 programo el recordatorio
 * con AlarmManager y el sistema lo dispara con la aplicacion cerrada. Aca el
 * aviso depende de un intervalo que corre mientras la pestana vive: si el
 * vecino cierra el navegador, no hay aviso. La API que habria cubierto el hueco
 * —Notification Triggers— quedo en ensayo de origen y nunca se estandarizo, de
 * modo que el unico camino real en la web es una notificacion push enviada
 * desde el servidor al vencer el tiempo. Eso es exactamente la Cloud Function
 * que el TP6 dejo documentada como fuera de alcance por el plan gratuito.
 */
export function Estacionamiento() {
  const navegar = useNavigate();
  const { mostrarAviso } = useAvisos();
  const { ubicacion, pedirUbicacion, cargando: ubicando } = useGeolocalizacion();

  const [sesion, setSesion] = useState(() => estacionamiento.sesionActiva());
  const [zonaId, setZonaId] = useState('zona-roja');
  const [patente, setPatente] = useState('');
  const [minutos, setMinutos] = useState(60);
  const [restantes, setRestantes] = useState(0);

  const avisoEnviado = useRef(false);
  const zonas = estacionamiento.zonas();
  const zonaSeleccionada = zonas.find((z) => z.id === zonaId);

  // Zona detectada por geolocalizacion, calculada en el cliente contra los
  // poligonos ya descargados: no requiere ninguna peticion.
  const zonaDetectada = useMemo(() => estacionamiento.zonaDePunto(ubicacion), [ubicacion]);

  useEffect(() => {
    if (zonaDetectada) setZonaId(zonaDetectada.id);
  }, [zonaDetectada]);

  // Temporizador de la sesion en curso.
  useEffect(() => {
    if (!sesion) return undefined;

    function latido() {
      const faltan = estacionamiento.minutosRestantes(sesion);
      setRestantes(faltan);

      if (faltan <= sesion.avisoPrevioMinutos && faltan > 0 && !avisoEnviado.current) {
        avisoEnviado.current = true;
        const titulo = 'El estacionamiento esta por vencer';
        const cuerpo = `Quedan ${Math.ceil(faltan)} minutos en ${sesion.zonaNombre}. Podes extenderlo desde la aplicacion.`;
        mostrarAviso({ titulo, cuerpo, tipo: 'obras' });
        avisoLocal(titulo, cuerpo);
      }

      if (faltan <= 0) {
        setSesion(null);
        avisoEnviado.current = false;
        mostrarAviso({
          titulo: 'Estacionamiento finalizado',
          cuerpo: `Vencio el tiempo en ${sesion.zonaNombre}.`,
          tipo: 'obras',
        });
      }
    }

    latido();
    const reloj = setInterval(latido, 15000);
    return () => clearInterval(reloj);
  }, [sesion, mostrarAviso]);

  const importe = zonaSeleccionada
    ? estacionamiento.calcularImporte(zonaSeleccionada, minutos)
    : 0;

  const poligonos = zonas.map((z) => ({
    id: z.id,
    poligono: z.poligono,
    color: z.color,
    nombre: `${z.nombre} · ${formatearPesos(z.tarifaPorHora)}/hora`,
  }));

  async function extender(extra) {
    const actualizada = await estacionamiento.extenderSesion(extra);
    if (actualizada) {
      setSesion(actualizada);
      avisoEnviado.current = false;
    }
  }

  async function finalizar() {
    await estacionamiento.finalizarSesion();
    setSesion(null);
    avisoEnviado.current = false;
  }

  function irAPagar() {
    navegar('/pago', {
      state: {
        origen: 'estacionamiento',
        zonaId,
        patente: patente.toUpperCase().trim(),
        minutos,
        concepto: `${zonaSeleccionada.nombre} · ${minutos} minutos`,
        importe,
        volverA: '/estacionamiento',
      },
    });
  }

  // Al volver de la pantalla de pago hay que releer la sesion del almacen.
  useEffect(() => {
    const actual = estacionamiento.sesionActiva();
    if (actual && !sesion) setSesion(actual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patenteValida = /^[A-Z]{2}\d{3}[A-Z]{2}$|^[A-Z]{3}\d{3}$/.test(
    patente.toUpperCase().trim()
  );

  return (
    <Pantalla titulo="Estacionamiento medido">
      <div className="contenido">
        <AvisoDeSimulacion texto="Zonas y tarifas de demostracion. El pago no procesa dinero." />

        {sesion ? (
          <div className="panel-temporizador">
            <IonIcon icon={timeOutline} />
            <h2>{Math.max(0, Math.ceil(restantes))} min</h2>
            <p>
              {sesion.patente} · {sesion.zonaNombre}
            </p>
            <IonNote>
              Vence a las{' '}
              {new Date(sesion.terminaEl).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · pagado {formatearPesos(sesion.importe)}
            </IonNote>

            <div className="acciones-temporizador">
              <IonButton size="small" fill="outline" onClick={() => extender(30)}>
                +30 min
              </IonButton>
              <IonButton size="small" fill="outline" onClick={() => extender(60)}>
                +60 min
              </IonButton>
              <IonButton size="small" fill="clear" color="danger" onClick={finalizar}>
                Finalizar
              </IonButton>
            </div>

            <IonNote className="nota-bloque">
              El aviso previo se dispara mientras la aplicacion sigue abierta. El navegador no
              permite programar un aviso que se dispare con la aplicacion cerrada, a diferencia
              de Android: eso requiere una notificacion push enviada desde el servidor.
            </IonNote>
          </div>
        ) : (
          <>
            <div className="fila-acciones">
              <IonButton size="small" fill="outline" onClick={pedirUbicacion} disabled={ubicando}>
                <IonIcon slot="start" icon={locateOutline} />
                {ubicando ? 'Ubicando...' : 'Detectar mi zona'}
              </IonButton>
              {ubicacion && (
                <IonChip color={zonaDetectada ? 'success' : 'medium'}>
                  {zonaDetectada ? zonaDetectada.nombre : 'Fuera de zona medida'}
                </IonChip>
              )}
            </div>

            <Mapa poligonos={poligonos} ubicacionUsuario={ubicacion} altura="32vh" />

            <IonList lines="full">
              {zonas.map((z) => (
                <IonItem
                  key={z.id}
                  button
                  onClick={() => setZonaId(z.id)}
                  color={z.id === zonaId ? 'light' : undefined}
                >
                  <span
                    className="punto-lista"
                    style={{ background: z.color }}
                    aria-hidden="true"
                  />
                  <IonLabel>
                    <h3>{z.nombre}</h3>
                    <p>{z.horario}</p>
                    <p className="linea-datos">
                      {formatearPesos(z.tarifaPorHora)} por hora · fraccion {z.fraccionMinutos}{' '}
                      min · maximo {z.maximoHoras} h
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>

            <h3 className="titulo-seccion">Iniciar estacionamiento</h3>

            <IonItem>
              <IonInput
                label="Patente"
                labelPlacement="floating"
                value={patente}
                placeholder="AB123CD"
                maxlength={7}
                onIonInput={(e) => setPatente((e.detail.value ?? '').toUpperCase())}
              />
            </IonItem>
            {patente.length > 0 && !patenteValida && (
              <IonText color="danger">
                <small className="error-campo">
                  Formato esperado: AB123CD o ABC123.
                </small>
              </IonText>
            )}

            <div className="selector-tiempo">
              <IonLabel>
                Tiempo: <strong>{minutos} minutos</strong>
              </IonLabel>
              <IonRange
                min={30}
                max={(zonaSeleccionada?.maximoHoras ?? 2) * 60}
                step={30}
                snaps
                ticks={false}
                value={minutos}
                onIonChange={(e) => setMinutos(e.detail.value)}
              />
            </div>

            <div className="resumen-pago">
              <span>Total a pagar</span>
              <strong>{formatearPesos(importe)}</strong>
            </div>

            <IonButton
              expand="block"
              className="boton-principal"
              disabled={!patenteValida}
              onClick={irAPagar}
            >
              Pagar e iniciar
            </IonButton>
          </>
        )}
      </div>
    </Pantalla>
  );
}
