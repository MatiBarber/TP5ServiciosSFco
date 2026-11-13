import { useCallback } from 'react';
import {
  IonBadge,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { notificationsOffOutline, openOutline, settingsOutline } from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { EstadoDeCarga, EstadoDeError, EstadoVacio } from '../componentes/Estados.jsx';
import { useServicio } from '../ganchos/useServicio.js';
import { useAvisos } from '../push/ProveedorDeAvisos.jsx';
import notificaciones from '../servicios/notificaciones.js';

/**
 * Historial de notificaciones al vecino.
 *
 * Es el destino comun de los tres mecanismos: los avisos push recibidos en
 * primer plano, los avisos in-app que produce la propia aplicacion (alarma
 * cercana, vencimiento del estacionamiento, recordatorio tributario) y los
 * datos semilla del catalogo municipal.
 *
 * Los avisos push recibidos en segundo plano son la excepcion y conviene
 * decirlo: los publica el service worker sin que esta pagina este viva, de modo
 * que no pasan por aca. Sumarlos exigiria que el service worker escribiera en
 * un almacen compartido —IndexedDB, porque el localStorage no es accesible
 * desde un worker— y queda senalado como trabajo pendiente.
 */
export function Avisos() {
  const navegar = useNavigate();
  const { refrescar } = useAvisos();

  const peticion = useCallback(() => notificaciones.listarAvisos(), []);
  const { datos, cargando, error, recargar, setDatos } = useServicio(peticion, []);

  const tipos = notificaciones.tipos();
  const lista = datos ?? [];

  async function abrir(aviso) {
    await notificaciones.marcarLeido(aviso.id);
    setDatos(lista.map((a) => (a.id === aviso.id ? { ...a, leido: true } : a)));
    refrescar();
    if (aviso.enlace) window.open(aviso.enlace, '_blank', 'noopener');
  }

  return (
    <Pantalla
      titulo="Notificaciones"
      acciones={
        <button
          type="button"
          className="boton-barra"
          aria-label="Preferencias de notificaciones"
          onClick={() => navegar('/preferencias')}
        >
          <IonIcon icon={settingsOutline} />
        </button>
      }
    >
      <div className="contenido">
        {cargando && <EstadoDeCarga texto="Cargando avisos..." />}
        {error && <EstadoDeError error={error} alReintentar={recargar} />}

        {!cargando && !error && lista.length === 0 && (
          <EstadoVacio
            icono={notificationsOffOutline}
            titulo="Sin avisos"
            detalle="Cuando el municipio publique novedades de los tipos que elegiste, van a aparecer aca."
            accion={
              <IonButton size="small" fill="outline" onClick={() => navegar('/preferencias')}>
                Revisar preferencias
              </IonButton>
            }
          />
        )}

        {!error && lista.length > 0 && (
          <IonList lines="full">
            {lista.map((a) => {
              const tipo = tipos.find((t) => t.id === a.tipo);
              return (
                <IonItem
                  key={a.id}
                  button
                  onClick={() => abrir(a)}
                  className={a.leido ? '' : 'aviso-sin-leer'}
                >
                  <IonLabel>
                    <h3>
                      {!a.leido && <span className="punto-sin-leer" aria-label="Sin leer" />}
                      {a.titulo}
                    </h3>
                    <p className="cuerpo-aviso">{a.cuerpo}</p>
                    <p className="linea-datos">
                      {new Date(a.fecha).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {a.enlace && (
                        <>
                          {' · '}
                          <IonIcon icon={openOutline} /> mas informacion
                        </>
                      )}
                    </p>
                  </IonLabel>
                  <IonBadge slot="end" color="medium">
                    {tipo?.etiqueta ?? a.tipo}
                  </IonBadge>
                </IonItem>
              );
            })}
          </IonList>
        )}

        <IonNote className="nota-bloque">
          Los avisos recibidos con la aplicacion cerrada los publica el service worker y
          aparecen en la bandeja del sistema, no en esta lista.
        </IonNote>
      </div>
    </Pantalla>
  );
}
