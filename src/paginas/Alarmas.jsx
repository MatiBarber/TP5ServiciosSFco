import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import { locateOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { Mapa } from '../componentes/Mapa.jsx';
import { EstadoDeCarga, EstadoDeError } from '../componentes/Estados.jsx';
import { AvisoDeSimulacion } from '../componentes/AvisoDeSimulacion.jsx';
import { useGeolocalizacion } from '../ganchos/useGeolocalizacion.js';
import { useAvisos } from '../push/ProveedorDeAvisos.jsx';
import { avisoLocal } from '../push/fcm.js';
import { formatearDistancia, ordenarPorCercania } from '../servicios/geo.js';
import { RADIO_CERCANIA_M } from '../config.js';
import alarmas from '../servicios/alarmas.js';

/**
 * Monitoreo de alarmas comunitarias.
 *
 * Cubre los cuatro requisitos: mapa de alarmas, estado en vivo, aviso cuando se
 * activa una cercana y suscripcion por zonas.
 *
 * El aviso por cercania es in-app y no push, y la razon es la misma que en el
 * TP6: para que el aviso saliera del servidor haria falta un proceso que
 * detecte la activacion y conozca la ubicacion del vecino, y eso es
 * infraestructura que el plan gratuito no cubre. Lo que si esta resuelto aca es
 * la regla de decision —que alarmas ameritan avisar— escrita como funcion pura
 * en la capa de servicios y probada en src/pruebas/alarmas.test.js. El dia que
 * exista disparo real, esa regla corre en el servidor sin cambiar una linea.
 */
export function Alarmas() {
  const [lista, setLista] = useState(null);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('mapa');
  const [suscripciones, setSuscripciones] = useState(() => alarmas.zonasSuscriptas());
  const { ubicacion, pedirUbicacion, cargando: ubicando } = useGeolocalizacion();
  const { mostrarAviso } = useAvisos();

  // Las ya avisadas, para no repetir el mismo aviso en cada latido del canal.
  const yaAvisadas = useRef(new Set());

  useEffect(() => {
    let vigente = true;
    alarmas
      .listarAlarmas()
      .then((l) => vigente && (setLista(l), setError(null)))
      .catch((e) => vigente && setError(e));
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (lista === null) return undefined;
    return alarmas.suscribirEstado(setLista);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista === null]);

  // Deteccion de activaciones que ameritan aviso.
  useEffect(() => {
    if (!lista) return;

    const relevantes = alarmas.activadasCercanas(lista, ubicacion, suscripciones);

    for (const a of relevantes) {
      if (yaAvisadas.current.has(a.id)) continue;
      yaAvisadas.current.add(a.id);

      const titulo = 'Alarma comunitaria activada';
      const cuerpo = `${a.nombre} - zona ${
        alarmas.zonas().find((z) => z.id === a.zona)?.nombre ?? a.zona
      }.`;
      mostrarAviso({ titulo, cuerpo, tipo: 'alarmas', zona: a.zona });
      avisoLocal(titulo, cuerpo);
    }

    // Una alarma que volvio a la normalidad puede volver a avisar si se reactiva.
    const activas = new Set(lista.filter((a) => a.estado === 'activada').map((a) => a.id));
    for (const id of [...yaAvisadas.current]) {
      if (!activas.has(id)) yaAvisadas.current.delete(id);
    }
  }, [lista, ubicacion, suscripciones, mostrarAviso]);

  const ordenadas = useMemo(
    () => (lista ? ordenarPorCercania(lista, ubicacion) : []),
    [lista, ubicacion]
  );

  const estados = alarmas.estados();
  const zonas = alarmas.zonas();

  const marcadores = useMemo(
    () =>
      ordenadas.map((a) => ({
        id: a.id,
        lat: a.lat,
        lng: a.lng,
        color: estados[a.estado]?.color ?? '#6b7280',
        etiqueta: `<strong>${a.nombre}</strong><br/>${estados[a.estado]?.etiqueta} · bateria ${
          a.bateria
        }%`,
      })),
    [ordenadas, estados]
  );

  const activadas = ordenadas.filter((a) => a.estado === 'activada');

  async function alternarZona(zonaId, activa) {
    const nuevas = await alarmas.suscribirZona(zonaId, activa);
    setSuscripciones(nuevas);
  }

  return (
    <Pantalla
      titulo="Alarmas comunitarias"
      herramientaExtra={
        <IonToolbar>
          <IonSegment value={vista} onIonChange={(e) => setVista(e.detail.value)}>
            <IonSegmentButton value="mapa">
              <IonLabel>Mapa</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="lista">
              <IonLabel>Listado</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="zonas">
              <IonLabel>Mis zonas</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      }
    >
      <div className="contenido">
        <AvisoDeSimulacion texto="Estado simulado: las alarmas se activan y se normalizan solas para demostrar el monitoreo en vivo." />

        {error && !lista && <EstadoDeError error={error} alReintentar={() => setLista(null)} />}
        {!error && lista === null && <EstadoDeCarga texto="Consultando alarmas..." />}

        {lista !== null && (
          <>
            <div className="fila-acciones">
              <IonButton size="small" fill="outline" onClick={pedirUbicacion} disabled={ubicando}>
                <IonIcon slot="start" icon={locateOutline} />
                {ubicando ? 'Ubicando...' : 'Mi ubicacion'}
              </IonButton>
              <IonChip className="chip-vivo">
                <span className="punto-vivo" /> En vivo
              </IonChip>
              <IonChip color={activadas.length ? 'danger' : 'success'}>
                {activadas.length} activada{activadas.length === 1 ? '' : 's'}
              </IonChip>
            </div>

            {vista === 'mapa' && (
              <Mapa marcadores={marcadores} ubicacionUsuario={ubicacion} altura="48vh" />
            )}

            {vista === 'lista' && (
              <IonList lines="full">
                {ordenadas.map((a) => (
                  <IonItem key={a.id}>
                    <span
                      className="punto-lista"
                      style={{ background: estados[a.estado]?.color }}
                      aria-hidden="true"
                    />
                    <IonLabel>
                      <h3>{a.nombre}</h3>
                      <p>
                        Zona {zonas.find((z) => z.id === a.zona)?.nombre} ·{' '}
                        {estados[a.estado]?.etiqueta}
                      </p>
                      <p className="linea-datos">Bateria {a.bateria}%</p>
                    </IonLabel>
                    {a.distanciaM !== undefined && (
                      <IonNote slot="end">{formatearDistancia(a.distanciaM)}</IonNote>
                    )}
                  </IonItem>
                ))}
              </IonList>
            )}

            {vista === 'zonas' && (
              <>
                <IonList lines="full">
                  <IonListHeader>
                    <IonLabel>Zonas suscriptas</IonLabel>
                  </IonListHeader>
                  {zonas.map((z) => (
                    <IonItem key={z.id}>
                      <IonIcon
                        slot="start"
                        icon={shieldCheckmarkOutline}
                        style={{ color: z.color }}
                      />
                      <IonToggle
                        checked={suscripciones.includes(z.id)}
                        onIonChange={(e) => alternarZona(z.id, e.detail.checked)}
                      >
                        {z.nombre}
                      </IonToggle>
                    </IonItem>
                  ))}
                </IonList>

                <IonNote className="nota-bloque">
                  Recibís avisos de las zonas suscriptas, y ademas de cualquier alarma que se
                  active a menos de {RADIO_CERCANIA_M} metros de tu ubicacion. Cada zona
                  corresponde a un tema de Firebase Cloud Messaging: el dia que el disparo sea
                  real, suscribirse aca es suscribirse al tema.
                </IonNote>
              </>
            )}
          </>
        )}
      </div>
    </Pantalla>
  );
}
