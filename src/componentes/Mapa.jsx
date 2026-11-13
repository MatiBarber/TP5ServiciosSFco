import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SAN_FRANCISCO } from '../config.js';

/**
 * Mapa compartido por los tres modulos que lo necesitan: bicicletas, alarmas y
 * estacionamiento medido.
 *
 * Usa Leaflet directo y no react-leaflet por dos motivos. Uno: una dependencia
 * menos y una version menos que mantener alineada con React. Dos: los
 * marcadores se dibujan con divIcon y CSS propio, lo que evita por completo el
 * problema clasico de los iconos de Leaflet con empaquetadores —las imagenes
 * por defecto se referencian por ruta relativa y el bundle las pierde— y de
 * paso permite colorear cada marcador segun el estado del dato, que es lo que
 * vuelve legible la disponibilidad en vivo.
 */

/**
 * @param {object} props
 * @param {{lat: number, lng: number}} [props.centro]
 * @param {number} [props.zoom]
 * @param {{id: string, lat: number, lng: number, etiqueta?: string, color?: string, texto?: string}[]} [props.marcadores]
 * @param {{id: string, poligono: [number, number][], color: string, nombre?: string}[]} [props.poligonos]
 * @param {{lat: number, lng: number} | null} [props.ubicacionUsuario]
 * @param {(id: string) => void} [props.alTocarMarcador]
 * @param {string} [props.altura]
 */
export function Mapa({
  centro = SAN_FRANCISCO,
  zoom = SAN_FRANCISCO.zoom,
  marcadores = [],
  poligonos = [],
  ubicacionUsuario = null,
  alTocarMarcador,
  altura = '320px',
}) {
  const contenedor = useRef(null);
  const mapa = useRef(null);
  const capaMarcadores = useRef(null);
  const capaPoligonos = useRef(null);
  const marcadorUsuario = useRef(null);

  // Creacion del mapa. Una sola vez por montaje.
  useEffect(() => {
    if (mapa.current || !contenedor.current) return undefined;

    mapa.current = L.map(contenedor.current, {
      center: [centro.lat, centro.lng],
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; colaboradores de OpenStreetMap',
    }).addTo(mapa.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapa.current);

    capaPoligonos.current = L.layerGroup().addTo(mapa.current);
    capaMarcadores.current = L.layerGroup().addTo(mapa.current);

    // Ionic monta la pantalla con el contenedor todavia sin tamano definitivo.
    // Sin este recalculo el mapa aparece en gris con un solo cuadrante dibujado.
    const recalcular = () => mapa.current?.invalidateSize();
    const t = setTimeout(recalcular, 150);
    window.addEventListener('resize', recalcular);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', recalcular);
      mapa.current?.remove();
      mapa.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marcadores. Se redibujan cuando cambia el dato en vivo.
  useEffect(() => {
    if (!capaMarcadores.current) return;
    capaMarcadores.current.clearLayers();

    for (const m of marcadores) {
      const icono = L.divIcon({
        className: 'marcador-propio',
        html: `<span class="punto" style="background:${m.color ?? '#0b6b3a'}">${
          m.texto ?? ''
        }</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marcador = L.marker([m.lat, m.lng], { icon: icono }).addTo(capaMarcadores.current);
      if (m.etiqueta) marcador.bindPopup(m.etiqueta);
      if (alTocarMarcador) marcador.on('click', () => alTocarMarcador(m.id));
    }
  }, [marcadores, alTocarMarcador]);

  // Poligonos de zona (estacionamiento medido).
  useEffect(() => {
    if (!capaPoligonos.current) return;
    capaPoligonos.current.clearLayers();

    for (const p of poligonos) {
      const forma = L.polygon(p.poligono, {
        color: p.color,
        weight: 2,
        fillOpacity: 0.18,
      }).addTo(capaPoligonos.current);
      if (p.nombre) forma.bindPopup(p.nombre);
    }
  }, [poligonos]);

  // Ubicacion del usuario y encuadre.
  useEffect(() => {
    if (!mapa.current) return;

    if (marcadorUsuario.current) {
      marcadorUsuario.current.remove();
      marcadorUsuario.current = null;
    }

    if (!ubicacionUsuario) return;

    marcadorUsuario.current = L.marker([ubicacionUsuario.lat, ubicacionUsuario.lng], {
      icon: L.divIcon({
        className: 'marcador-usuario',
        html: '<span class="pulso"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      zIndexOffset: 1000,
    }).addTo(mapa.current);

    mapa.current.setView([ubicacionUsuario.lat, ubicacionUsuario.lng], 15);
  }, [ubicacionUsuario]);

  return <div ref={contenedor} className="mapa" style={{ height: altura }} />;
}
