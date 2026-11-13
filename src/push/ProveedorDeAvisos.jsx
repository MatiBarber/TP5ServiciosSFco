import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { IonToast } from '@ionic/react';
import { escucharEnPrimerPlano } from './fcm.js';
import notificaciones from '../servicios/notificaciones.js';

/**
 * Contexto de avisos.
 *
 * Reune en un solo lugar las tres formas de aviso que distingue el TP6:
 *
 *   push     - llega desde Firebase con la aplicacion en segundo plano; lo
 *              publica el service worker y esta aplicacion no se entera hasta
 *              que el vecino la abre.
 *   push     - llega con la aplicacion en primer plano; lo entrega onMessage,
 *              se guarda en el historial y se muestra como mensaje emergente.
 *   in-app   - lo produce la propia aplicacion (alarma cercana, vencimiento del
 *              estacionamiento) sin que intervenga ningun servidor.
 *
 * Que los tres terminen en el mismo historial es lo que permite que la pantalla
 * de avisos cumpla el requisito de la consigna sin importar por donde entro el
 * mensaje.
 */

const Contexto = createContext({
  sinLeer: 0,
  refrescar: () => {},
  mostrarAviso: () => {},
});

export function ProveedorDeAvisos({ children }) {
  const [sinLeer, setSinLeer] = useState(0);
  const [emergente, setEmergente] = useState(null);

  const refrescar = useCallback(() => {
    setSinLeer(notificaciones.cantidadSinLeer());
  }, []);

  /**
   * Registra un aviso y lo muestra. Lo usan los modulos in-app.
   * @param {{titulo: string, cuerpo: string, tipo?: string, zona?: string}} aviso
   */
  const mostrarAviso = useCallback(
    (aviso) => {
      notificaciones.registrarAviso(aviso);
      setEmergente({ titulo: aviso.titulo, cuerpo: aviso.cuerpo });
      refrescar();
    },
    [refrescar]
  );

  useEffect(() => {
    refrescar();

    const cancelar = escucharEnPrimerPlano((mensaje) => {
      notificaciones.registrarAviso({
        titulo: mensaje.titulo,
        cuerpo: mensaje.cuerpo,
        tipo: mensaje.datos?.tipo,
        zona: mensaje.datos?.zona,
        enlace: mensaje.datos?.enlace,
      });
      setEmergente({ titulo: mensaje.titulo, cuerpo: mensaje.cuerpo });
      refrescar();
    });

    return cancelar;
  }, [refrescar]);

  const valor = useMemo(
    () => ({ sinLeer, refrescar, mostrarAviso }),
    [sinLeer, refrescar, mostrarAviso]
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      <IonToast
        isOpen={emergente !== null}
        header={emergente?.titulo}
        message={emergente?.cuerpo}
        duration={6000}
        position="top"
        color="primary"
        buttons={[{ text: 'Cerrar', role: 'cancel' }]}
        onDidDismiss={() => setEmergente(null)}
      />
    </Contexto.Provider>
  );
}

export function useAvisos() {
  return useContext(Contexto);
}
