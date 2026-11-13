import { useCallback, useState } from 'react';
import { IonBadge, IonButton, IonNote, IonText } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { Mapa } from '../componentes/Mapa.jsx';
import { EstadoDeCarga, EstadoDeError } from '../componentes/Estados.jsx';
import { useServicio } from '../ganchos/useServicio.js';
import reclamos from '../servicios/reclamos.js';

/**
 * Detalle y seguimiento de un reclamo.
 *
 * La linea de tiempo del historial es la respuesta al requisito de "mostrar el
 * estado del reclamo y actualizar al usuario sobre el progreso".
 *
 * El boton que avanza el estado no existiria en produccion: ahi el cambio lo
 * hace el area municipal. Esta puesto, y marcado como herramienta de
 * demostracion, porque sin el no habria forma de mostrar el seguimiento en una
 * defensa de quince minutos.
 */

const COLOR_ESTADO = {
  recibido: 'medium',
  en_curso: 'warning',
  resuelto: 'success',
  rechazado: 'danger',
};

const SIGUIENTE = { recibido: 'en_curso', en_curso: 'resuelto' };

export function DetalleReclamo() {
  const { id } = useParams();
  const [trabajando, setTrabajando] = useState(false);

  const peticion = useCallback(() => reclamos.obtenerReclamo(id), [id]);
  const { datos: reclamo, cargando, error, recargar, setDatos } = useServicio(peticion, [id]);

  const categorias = reclamos.categorias();
  const estados = reclamos.estados();

  async function avanzar() {
    if (!reclamo) return;
    const nuevo = SIGUIENTE[reclamo.estado];
    if (!nuevo) return;

    setTrabajando(true);
    try {
      const actualizado = await reclamos.actualizarEstado(
        reclamo.id,
        nuevo,
        nuevo === 'en_curso'
          ? 'Derivado al area correspondiente.'
          : 'Intervencion finalizada.'
      );
      if (actualizado) setDatos(actualizado);
    } catch {
      // El servicio ya informa el error; aca alcanza con no romper la pantalla.
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <Pantalla titulo="Reclamo" volverA="/reclamos">
      <div className="contenido">
        {cargando && <EstadoDeCarga filas={2} texto="Abriendo el reclamo..." />}
        {error && <EstadoDeError error={error} alReintentar={recargar} />}

        {reclamo && (
          <>
            <div className="encabezado-reclamo">
              <div>
                <h2>{categorias.find((c) => c.id === reclamo.categoria)?.etiqueta}</h2>
                <p className="texto-tenue">
                  {reclamo.id} · {new Date(reclamo.creadoEl).toLocaleString('es-AR')}
                </p>
              </div>
              <IonBadge color={COLOR_ESTADO[reclamo.estado]}>
                {estados.find((e) => e.id === reclamo.estado)?.etiqueta}
              </IonBadge>
            </div>

            <p className="descripcion-reclamo">{reclamo.descripcion}</p>
            <IonNote className="nota-bloque">{reclamo.direccion}</IonNote>

            {reclamo.adjuntosOmitidos && (
              <IonText color="warning">
                <p className="nota-bloque">
                  Las fotos no pudieron guardarse: el almacenamiento del navegador esta lleno.
                </p>
              </IonText>
            )}

            {reclamo.adjuntos?.length > 0 && (
              <div className="galeria">
                {reclamo.adjuntos.map((a, i) => (
                  <img key={i} src={a.datos} alt={`Foto ${i + 1} del reclamo ${reclamo.id}`} />
                ))}
              </div>
            )}

            {reclamo.lat !== null && reclamo.lng !== null && (
              <>
                <h3 className="titulo-seccion">Ubicacion</h3>
                <Mapa
                  centro={{ lat: reclamo.lat, lng: reclamo.lng }}
                  zoom={16}
                  altura="200px"
                  marcadores={[
                    {
                      id: reclamo.id,
                      lat: reclamo.lat,
                      lng: reclamo.lng,
                      color: '#b45309',
                      etiqueta: reclamo.direccion,
                    },
                  ]}
                />
              </>
            )}

            <h3 className="titulo-seccion">Seguimiento</h3>
            <ol className="linea-tiempo">
              {reclamo.historial.map((h, i) => (
                <li key={i} className={i === reclamo.historial.length - 1 ? 'ultimo' : ''}>
                  <span className={`punto ${h.estado}`} />
                  <div>
                    <strong>{estados.find((e) => e.id === h.estado)?.etiqueta}</strong>
                    <p>{h.nota}</p>
                    <small>{new Date(h.fecha).toLocaleString('es-AR')}</small>
                  </div>
                </li>
              ))}
            </ol>

            {SIGUIENTE[reclamo.estado] && (
              <div className="caja-demo">
                <small>
                  Herramienta de demostracion: en produccion el estado lo actualiza el area
                  municipal, no el vecino.
                </small>
                <IonButton size="small" fill="outline" onClick={avanzar} disabled={trabajando}>
                  Simular avance a{' '}
                  {estados.find((e) => e.id === SIGUIENTE[reclamo.estado])?.etiqueta}
                </IonButton>
              </div>
            )}
          </>
        )}
      </div>
    </Pantalla>
  );
}
