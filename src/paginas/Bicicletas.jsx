import { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { locateOutline, warningOutline } from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { Mapa } from '../componentes/Mapa.jsx';
import { EstadoDeCarga, EstadoDeError } from '../componentes/Estados.jsx';
import { AvisoDeSimulacion } from '../componentes/AvisoDeSimulacion.jsx';
import { useGeolocalizacion } from '../ganchos/useGeolocalizacion.js';
import { formatearDistancia, ordenarPorCercania } from '../servicios/geo.js';
import bicicletas from '../servicios/bicicletas.js';

/**
 * Bicicletas publicas.
 *
 * Cubre los cuatro requisitos de la consigna: mapa interactivo, disponibilidad
 * en tiempo real, busqueda por cercania con la ubicacion del usuario y reporte
 * de problemas.
 *
 * La disponibilidad no se pide una vez al abrir: la pantalla se suscribe al
 * canal del servicio y el numero de bicicletas libres cambia solo mientras se
 * la mira. Es la diferencia entre simular la respuesta de una API y simular el
 * servicio.
 */

function colorDeDisponibilidad(estacion) {
  if (estacion.estado !== 'operativa') return '#6b7280';
  const proporcion = estacion.disponibles / estacion.anclajes;
  if (estacion.disponibles === 0) return '#dc2626';
  if (proporcion < 0.25) return '#d97706';
  return '#16a34a';
}

export function Bicicletas() {
  const [estaciones, setEstaciones] = useState(null);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('mapa');
  const [seleccionada, setSeleccionada] = useState(null);
  const [motivo, setMotivo] = useState('bici_danada');
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const { ubicacion, pedirUbicacion, cargando: ubicando, error: errorUbicacion } =
    useGeolocalizacion();

  // Carga inicial. Pasa por el servicio, de modo que ejercita demora y fallas.
  useEffect(() => {
    let vigente = true;
    bicicletas
      .listarEstaciones()
      .then((lista) => {
        if (vigente) {
          setEstaciones(lista);
          setError(null);
        }
      })
      .catch((e) => vigente && setError(e));
    return () => {
      vigente = false;
    };
  }, []);

  // Suscripcion al estado en vivo. Solo actualiza si ya hubo una carga exitosa:
  // si la primera peticion fallo, la pantalla debe mostrar el error y no datos
  // que aparecieron por un camino distinto.
  useEffect(() => {
    if (estaciones === null) return undefined;
    return bicicletas.suscribirDisponibilidad((lista) => setEstaciones(lista));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estaciones === null]);

  const ordenadas = useMemo(
    () => (estaciones ? ordenarPorCercania(estaciones, ubicacion) : []),
    [estaciones, ubicacion]
  );

  const marcadores = useMemo(
    () =>
      ordenadas.map((e) => ({
        id: e.id,
        lat: e.lat,
        lng: e.lng,
        color: colorDeDisponibilidad(e),
        texto: String(e.disponibles),
        etiqueta: `<strong>${e.nombre}</strong><br/>${e.disponibles} bicicletas · ${
          e.anclajes - e.disponibles
        } anclajes libres`,
      })),
    [ordenadas]
  );

  async function enviarReporte() {
    if (!seleccionada) return;
    setEnviando(true);
    try {
      await bicicletas.reportarProblema({
        estacionId: seleccionada.id,
        motivo,
        comentario: comentario.trim(),
      });
      setMensaje('Reporte enviado. Gracias por avisar.');
      setSeleccionada(null);
      setComentario('');
    } catch (e) {
      setMensaje(e.message);
    } finally {
      setEnviando(false);
    }
  }

  function recargar() {
    setEstaciones(null);
    setError(null);
    bicicletas.listarEstaciones().then(setEstaciones).catch(setError);
  }

  return (
    <Pantalla
      titulo="Bicicletas publicas"
      herramientaExtra={
        <IonToolbar>
          <IonSegment value={vista} onIonChange={(e) => setVista(e.detail.value)}>
            <IonSegmentButton value="mapa">
              <IonLabel>Mapa</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="lista">
              <IonLabel>Cercanas</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      }
    >
      <div className="contenido">
        <AvisoDeSimulacion texto="Disponibilidad simulada: se actualiza sola cada pocos segundos para demostrar el canal en vivo." />

        {error && !estaciones && <EstadoDeError error={error} alReintentar={recargar} />}
        {!error && estaciones === null && <EstadoDeCarga texto="Consultando estaciones..." />}

        {estaciones !== null && (
          <>
            <div className="fila-acciones">
              <IonButton size="small" fill="outline" onClick={pedirUbicacion} disabled={ubicando}>
                <IonIcon slot="start" icon={locateOutline} />
                {ubicando ? 'Ubicando...' : ubicacion ? 'Actualizar ubicacion' : 'Usar mi ubicacion'}
              </IonButton>
              <IonChip className="chip-vivo">
                <span className="punto-vivo" /> En vivo
              </IonChip>
            </div>

            {errorUbicacion && (
              <IonNote color="danger" className="nota-bloque">
                {errorUbicacion}
              </IonNote>
            )}

            {vista === 'mapa' ? (
              <Mapa
                marcadores={marcadores}
                ubicacionUsuario={ubicacion}
                altura="46vh"
                alTocarMarcador={(id) =>
                  setSeleccionada(ordenadas.find((e) => e.id === id) ?? null)
                }
              />
            ) : (
              <IonList lines="full">
                {ordenadas.map((e) => (
                  <IonItem key={e.id} button detail onClick={() => setSeleccionada(e)}>
                    <span
                      className="punto-lista"
                      style={{ background: colorDeDisponibilidad(e) }}
                      aria-hidden="true"
                    />
                    <IonLabel>
                      <h3>{e.nombre}</h3>
                      <p>{e.direccion}</p>
                      <p className="linea-datos">
                        <strong>{e.disponibles}</strong> bicicletas ·{' '}
                        <strong>{e.anclajes - e.disponibles}</strong> anclajes
                        {e.estado !== 'operativa' && ' · en mantenimiento'}
                      </p>
                    </IonLabel>
                    {e.distanciaM !== undefined && (
                      <IonNote slot="end">{formatearDistancia(e.distanciaM)}</IonNote>
                    )}
                  </IonItem>
                ))}
              </IonList>
            )}

            {vista === 'lista' && !ubicacion && (
              <IonNote className="nota-bloque">
                Compartí tu ubicacion para ordenar las estaciones por cercania.
              </IonNote>
            )}
          </>
        )}
      </div>

      <IonModal isOpen={seleccionada !== null} onDidDismiss={() => setSeleccionada(null)}>
        <div className="hoja">
          <h2>{seleccionada?.nombre}</h2>
          <p className="texto-tenue">{seleccionada?.direccion}</p>

          <div className="contadores">
            <div>
              <strong>{seleccionada?.disponibles}</strong>
              <span>bicicletas</span>
            </div>
            <div>
              <strong>{(seleccionada?.anclajes ?? 0) - (seleccionada?.disponibles ?? 0)}</strong>
              <span>anclajes libres</span>
            </div>
            {seleccionada?.distanciaM !== undefined && (
              <div>
                <strong>{formatearDistancia(seleccionada.distanciaM)}</strong>
                <span>de distancia</span>
              </div>
            )}
          </div>

          <h3 className="titulo-seccion">
            <IonIcon icon={warningOutline} /> Reportar un problema
          </h3>

          <IonItem>
            <IonSelect
              label="Motivo"
              labelPlacement="floating"
              value={motivo}
              onIonChange={(e) => setMotivo(e.detail.value)}
            >
              {bicicletas.motivosDeReporte().map((m) => (
                <IonSelectOption key={m.id} value={m.id}>
                  {m.etiqueta}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonTextarea
              label="Comentario (opcional)"
              labelPlacement="floating"
              rows={3}
              value={comentario}
              onIonInput={(e) => setComentario(e.detail.value ?? '')}
            />
          </IonItem>

          <div className="acciones-hoja">
            <IonButton fill="clear" onClick={() => setSeleccionada(null)}>
              Cancelar
            </IonButton>
            <IonButton onClick={enviarReporte} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar reporte'}
            </IonButton>
          </div>
        </div>
      </IonModal>

      <IonToast
        isOpen={mensaje !== null}
        message={mensaje ?? ''}
        duration={3500}
        onDidDismiss={() => setMensaje(null)}
      />
    </Pantalla>
  );
}
