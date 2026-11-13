import { useCallback } from 'react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
} from '@ionic/react';
import {
  callOutline,
  chatbubbleOutline,
  mailOutline,
} from 'ionicons/icons';
import { Pantalla } from '../componentes/Pantalla.jsx';
import { EstadoDeCarga, EstadoDeError } from '../componentes/Estados.jsx';
import { useServicio } from '../ganchos/useServicio.js';
import atencion from '../servicios/atencion.js';

/**
 * Lineas de atencion al vecino.
 *
 * Los tres requisitos —llamar, enviar correo e integrar mensajeria— se resuelven
 * con esquemas de URI que el sistema operativo despacha a la aplicacion
 * correspondiente: tel:, mailto: y https://wa.me/. No hay backend, no hay SDK y
 * no hay nada que simular en la parte que importa: en el telefono el marcador
 * se abre de verdad.
 *
 * Es ademas el unico modulo del trabajo donde la frontera entre API y SDK que
 * ordeno el TP7 no aplica, porque no interviene ninguna de las dos cosas.
 */
export function Atencion() {
  const peticion = useCallback(() => atencion.listarAgrupadas(), []);
  const { datos, cargando, error, recargar } = useServicio(peticion, []);

  function abrir(accion, area) {
    const enlace = atencion.enlaceDeContacto(
      accion,
      area,
      accion === 'llamar' ? '' : `Hola, necesito consultar por ${area.nombre}.`
    );
    if (!enlace) return;
    // Los esquemas tel: y mailto: no abren ventana: los maneja el sistema.
    // wa.me si es una URL, y por eso va con noopener.
    if (accion === 'whatsapp') window.open(enlace, '_blank', 'noopener');
    else window.location.href = enlace;
  }

  return (
    <Pantalla titulo="Lineas de atencion">
      <div className="contenido">
        {cargando && <EstadoDeCarga texto="Cargando contactos..." />}
        {error && <EstadoDeError error={error} alReintentar={recargar} />}

        {(datos ?? []).map((grupo) => (
          <IonList key={grupo.nombre} lines="full">
            <IonListHeader>
              <IonLabel>{grupo.nombre}</IonLabel>
            </IonListHeader>

            {grupo.areas.map((area) => (
              <IonItem key={area.id} className="item-contacto">
                <IonLabel>
                  <h3>{area.nombre}</h3>
                  <p>{area.descripcion}</p>
                  {area.horario && <p className="linea-datos">{area.horario}</p>}
                  {area.demostracion && (
                    <IonNote color="warning">
                      <small>Contacto de demostracion</small>
                    </IonNote>
                  )}

                  <div className="acciones-contacto">
                    {area.telefono && (
                      <IonButton size="small" fill="solid" onClick={() => abrir('llamar', area)}>
                        <IonIcon slot="start" icon={callOutline} />
                        Llamar
                      </IonButton>
                    )}
                    {area.correo && (
                      <IonButton size="small" fill="outline" onClick={() => abrir('correo', area)}>
                        <IonIcon slot="start" icon={mailOutline} />
                        Correo
                      </IonButton>
                    )}
                    {area.whatsapp && (
                      <IonButton
                        size="small"
                        fill="outline"
                        onClick={() => abrir('whatsapp', area)}
                      >
                        <IonIcon slot="start" icon={chatbubbleOutline} />
                        Mensaje
                      </IonButton>
                    )}
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ))}

        <IonNote className="nota-bloque">
          Los numeros de emergencia nacionales (100, 107, 911 y 144) son reales. Los contactos
          de areas municipales son de demostracion y estan marcados como tales.
        </IonNote>
      </div>
    </Pantalla>
  );
}
