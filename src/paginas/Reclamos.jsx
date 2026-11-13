import { useCallback, useState } from 'react';
import {
  IonBadge,
  IonFab,
  IonFabButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonToolbar,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { add, chatbubbleEllipsesOutline, imagesOutline } from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { EstadoDeCarga, EstadoDeError, EstadoVacio } from '../componentes/Estados.jsx';
import { AvisoDeSimulacion } from '../componentes/AvisoDeSimulacion.jsx';
import { useServicio } from '../ganchos/useServicio.js';
import reclamos from '../servicios/reclamos.js';

/**
 * Centro de reclamos - listado, busqueda y seguimiento.
 *
 * El buscador y el filtro por estado cubren el requisito de "facilitar la
 * busqueda y visualizacion de reclamos anteriores". El filtrado ocurre en la
 * capa de servicios y no en el componente a proposito: contra una API real ese
 * filtro viaja como parametro de consulta, de modo que la pantalla no cambia.
 */

const COLOR_ESTADO = {
  recibido: 'medium',
  en_curso: 'warning',
  resuelto: 'success',
  rechazado: 'danger',
};

export function Reclamos() {
  const navegar = useNavigate();
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('');

  const peticion = useCallback(
    () => reclamos.listarReclamos({ texto, estado: estado || undefined }),
    [texto, estado]
  );

  const { datos, cargando, error, recargar } = useServicio(peticion, [texto, estado]);

  const categorias = reclamos.categorias();
  const lista = datos ?? [];

  return (
    <Pantalla
      titulo="Centro de reclamos"
      herramientaExtra={
        <IonToolbar>
          <IonSearchbar
            value={texto}
            debounce={400}
            placeholder="Buscar por numero, texto o direccion"
            onIonInput={(e) => setTexto(e.detail.value ?? '')}
          />
        </IonToolbar>
      }
    >
      <div className="contenido">
        <AvisoDeSimulacion texto="Los reclamos que registres quedan guardados en este dispositivo." />

        <IonItem lines="none">
          <IonSelect
            label="Estado"
            labelPlacement="fixed"
            value={estado}
            onIonChange={(e) => setEstado(e.detail.value)}
          >
            <IonSelectOption value="">Todos</IonSelectOption>
            {reclamos.estados().map((e) => (
              <IonSelectOption key={e.id} value={e.id}>
                {e.etiqueta}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {cargando && <EstadoDeCarga texto="Consultando reclamos..." />}
        {error && <EstadoDeError error={error} alReintentar={recargar} />}

        {!cargando && !error && lista.length === 0 && (
          <EstadoVacio
            icono={chatbubbleEllipsesOutline}
            titulo="No hay reclamos"
            detalle={
              texto || estado
                ? 'Probá cambiando la busqueda o el filtro.'
                : 'Toca el boton + para registrar el primero.'
            }
          />
        )}

        {!error && lista.length > 0 && (
          <IonList lines="full">
            {lista.map((r) => {
              const categoria = categorias.find((c) => c.id === r.categoria);
              return (
                <IonItem key={r.id} button detail onClick={() => navegar(`/reclamos/${r.id}`)}>
                  <IonLabel>
                    <h3>{categoria?.etiqueta ?? r.categoria}</h3>
                    <p>{r.descripcion}</p>
                    <p className="linea-datos">
                      {r.id} · {r.direccion}
                      {r.adjuntos?.length > 0 && (
                        <>
                          {' · '}
                          <IonIcon icon={imagesOutline} /> {r.adjuntos.length}
                        </>
                      )}
                    </p>
                  </IonLabel>
                  <div slot="end" className="columna-derecha">
                    <IonBadge color={COLOR_ESTADO[r.estado]}>
                      {reclamos.estados().find((e) => e.id === r.estado)?.etiqueta}
                    </IonBadge>
                    <IonNote>
                      <small>
                        {new Date(r.creadoEl).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </small>
                    </IonNote>
                  </div>
                </IonItem>
              );
            })}
          </IonList>
        )}
      </div>

      <IonFab slot="fixed" vertical="bottom" horizontal="end" className="fab-sobre-barra">
        <IonFabButton onClick={() => navegar('/reclamos/nuevo')} aria-label="Nuevo reclamo">
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>
    </Pantalla>
  );
}
