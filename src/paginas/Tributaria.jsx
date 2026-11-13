import { useCallback, useEffect, useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { alarmOutline, documentTextOutline } from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { EstadoDeCarga, EstadoDeError, EstadoVacio } from '../componentes/Estados.jsx';
import { AvisoDeSimulacion } from '../componentes/AvisoDeSimulacion.jsx';
import { useServicio } from '../ganchos/useServicio.js';
import { useAvisos } from '../push/ProveedorDeAvisos.jsx';
import { avisoLocal } from '../push/fcm.js';
import tributaria from '../servicios/tributaria.js';

/**
 * Direccion General Tributaria.
 *
 * Cubre los cuatro requisitos: consulta y emision de cedulones, pago en linea
 * (simulado y declarado como tal), historial de pagos con el estado de las
 * obligaciones, y recordatorio de vencimientos.
 *
 * El recordatorio es deliberadamente un aviso local y no una notificacion push:
 * la fecha de vencimiento ya esta en el dispositivo, de modo que no hace falta
 * que ningun servidor la informe. Es la distincion de mecanismos que ordeno el
 * TP6, aplicada aca para no gastar infraestructura en algo que no la necesita.
 */

export const formatearPesos = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(n ?? 0);

export const formatearFecha = (iso) => {
  if (!iso) return '';
  const f = iso.length <= 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return f.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const COLORES = { pendiente: 'warning', vencido: 'danger', pagado: 'success' };

export function Tributaria() {
  const navegar = useNavigate();
  const { mostrarAviso } = useAvisos();
  const [vista, setVista] = useState('cuenta');
  const [vencimientos, setVencimientos] = useState([]);

  const peticion = useCallback(
    () => (vista === 'cuenta' ? tributaria.listarCedulones() : tributaria.historialDePagos()),
    [vista]
  );

  const { datos, cargando, error, recargar } = useServicio(peticion, [vista]);

  useEffect(() => {
    tributaria.proximosVencimientos(15).then(setVencimientos).catch(() => setVencimientos([]));
  }, []);

  /**
   * Programa el recordatorio del vencimiento mas proximo.
   *
   * Aca aparece el limite de la plataforma web frente a la nativa. En Android
   * el TP7 uso AlarmManager, que dispara con la aplicacion cerrada. El
   * navegador no tiene equivalente: la API que lo habria permitido,
   * Notification Triggers, quedo en ensayo de origen y nunca se estandarizo.
   * De modo que lo honesto es registrar el recordatorio en el historial de
   * avisos y mostrarlo ahora, y declarar que el aviso diferido real requiere
   * push desde el servidor.
   */
  async function recordarVencimiento(cedulon) {
    const titulo = 'Vencimiento proximo';
    const cuerpo = `${cedulon.tributo} - periodo ${cedulon.periodo} vence el ${formatearFecha(
      cedulon.vence
    )}.`;
    mostrarAviso({ titulo, cuerpo, tipo: 'tributos' });
    await avisoLocal(titulo, cuerpo);
  }

  const lista = datos ?? [];

  return (
    <Pantalla
      titulo="Tributaria"
      herramientaExtra={
        <IonToolbar>
          <IonSegment value={vista} onIonChange={(e) => setVista(e.detail.value)}>
            <IonSegmentButton value="cuenta">
              <IonLabel>Cuenta corriente</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="historial">
              <IonLabel>Historial</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      }
    >
      <div className="contenido">
        <AvisoDeSimulacion texto="Cedulones e importes simulados. El pago es una demostracion y no procesa dinero." />

        {vista === 'cuenta' && vencimientos.length > 0 && (
          <div className="panel-vencimientos">
            <h3>
              <IonIcon icon={alarmOutline} /> Proximos vencimientos
            </h3>
            {vencimientos.map((c) => (
              <div className="fila-vencimiento" key={c.id}>
                <div>
                  <strong>{c.tributo}</strong>
                  <span>
                    Periodo {c.periodo} · vence {formatearFecha(c.vence)}
                  </span>
                </div>
                <IonButton size="small" fill="clear" onClick={() => recordarVencimiento(c)}>
                  Recordar
                </IonButton>
              </div>
            ))}
          </div>
        )}

        {cargando && <EstadoDeCarga texto="Consultando la cuenta corriente..." />}
        {error && <EstadoDeError error={error} alReintentar={recargar} />}

        {!cargando && !error && lista.length === 0 && (
          <EstadoVacio
            icono={documentTextOutline}
            titulo={vista === 'cuenta' ? 'Sin cedulones' : 'Sin pagos registrados'}
            detalle="Cuando haya movimientos van a aparecer aca."
          />
        )}

        {!error && lista.length > 0 && vista === 'cuenta' && (
          <IonList lines="full">
            <IonListHeader>
              <IonLabel>Cedulones</IonLabel>
            </IonListHeader>
            {lista.map((c) => (
              <IonItem key={c.id} button detail onClick={() => navegar(`/tributaria/${c.id}`)}>
                <IonLabel>
                  <h3>{c.tributo}</h3>
                  <p>
                    Periodo {c.periodo} · cuenta {c.cuenta}
                  </p>
                  <p className="linea-datos">
                    {c.estado === 'pagado'
                      ? `Pagado el ${formatearFecha(c.pagadoEl)}`
                      : `Vence el ${formatearFecha(c.vence)}`}
                  </p>
                </IonLabel>
                <div slot="end" className="columna-derecha">
                  <strong>{formatearPesos(c.importe)}</strong>
                  <IonBadge color={COLORES[c.estado]}>{c.estado}</IonBadge>
                </div>
              </IonItem>
            ))}
          </IonList>
        )}

        {!error && lista.length > 0 && vista === 'historial' && (
          <IonList lines="full">
            <IonListHeader>
              <IonLabel>Pagos realizados</IonLabel>
            </IonListHeader>
            {lista.map((p) => (
              <IonItem key={p.id}>
                <IonLabel>
                  <h3>{p.tributo}</h3>
                  <p>
                    Periodo {p.periodo} · {p.medio}
                  </p>
                  <p className="linea-datos">{formatearFecha(p.fecha)}</p>
                </IonLabel>
                <div slot="end" className="columna-derecha">
                  <strong>{formatearPesos(p.importe)}</strong>
                  <IonNote color="medium">
                    <small>simulado</small>
                  </IonNote>
                </div>
              </IonItem>
            ))}
          </IonList>
        )}
      </div>
    </Pantalla>
  );
}
