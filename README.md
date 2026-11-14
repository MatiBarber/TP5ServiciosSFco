# Servicios San Francisco

Aplicación web móvil (PWA) de acceso a los servicios municipales de la ciudad de San Francisco, Córdoba.

**TP5 — Arquitecturas Móviles — UTN Facultad Regional San Francisco**
Alumno: Matías Barbieri · Docente: Ing. Juan Pablo Bono · Año 2026

---

## Qué es

Siete módulos de servicios municipales sobre una única capa de datos con un interruptor entre simulado y real:

| Módulo | Ruta | Estado |
|---|---|---|
| Bicicletas públicas | `/bicicletas` | Mapa, disponibilidad en vivo, cercanía, reporte |
| Centro de reclamos | `/reclamos` | Formulario, adjuntos, listado, búsqueda, seguimiento |
| Dirección General Tributaria | `/tributaria` | Cedulones, emisión, pago simulado, historial, vencimientos |
| Estacionamiento medido | `/estacionamiento` | Zonas, tarifas, pago simulado, temporizador, extensión |
| Alarmas comunitarias | `/alarmas` | Mapa, estado en vivo, alerta por cercanía, suscripción por zona |
| Líneas de atención | `/atencion` | Directorio, `tel:`, `mailto:`, `wa.me` |
| Notificaciones al vecino | `/avisos` | FCM Web Push, preferencias, historial |

---

## Puesta en marcha

### 1. Requisitos

- **Node.js 20.19 o superior** (probado con 22). Verificar con `node -v`. Si hay una versión anterior, descargar la LTS desde nodejs.org.
- Un navegador Chromium (Chrome o Edge) para las herramientas de desarrollo y Lighthouse.

Con 4 GB de memoria, **cerrar Android Studio por completo antes de trabajar acá**, no dejarlo minimizado. El entorno de este proyecto es mucho más liviano que el nativo (no hay Gradle ni emulador), pero los dos juntos no entran.

### 2. Instalar y levantar

```bash
cd servicios-sfco
npm install
npm run dev
```

Vite imprime dos direcciones. La de `localhost` sirve para la notebook; la de red local (`http://192.168.x.x:5173`) sirve para abrir la aplicación desde el Moto G31 estando los dos en el mismo wifi.

> `npm install` muestra advertencias `EBADENGINE` sobre algunos subpaquetes de Firebase que piden Node 24. Son avisos, no errores: esos subpaquetes (Storage) no se usan acá y el código de Firebase corre en el navegador, no en Node.

### 3. Configurar Firebase (necesario sólo para las notificaciones push)

La aplicación funciona entera sin esto. El único módulo que lo necesita es el canal de push.

1. Entrar a [console.firebase.google.com](https://console.firebase.google.com) y crear un proyecto **nuevo**, separado de GestorLiga. Nombre sugerido: `servicios-sfco`.
2. Dentro del proyecto, agregar una **aplicación web** (el ícono `</>`). No hace falta activar Hosting en ese paso.
3. Copiar el objeto `firebaseConfig` que muestra la consola.
4. En la raíz del proyecto, copiar `.env.example` a `.env` y completar los valores:

```bash
cp .env.example .env
```

5. Generar la clave VAPID: **Configuración del proyecto → Cloud Messaging → Certificados push web → Generar par de claves**. Copiar la clave pública en `VITE_FIREBASE_VAPID_KEY`.
6. Abrir `public/firebase-messaging-sw.js` y reemplazar los seis `'COMPLETAR'` por los mismos valores del paso 3. Ese archivo no pasa por Vite y por eso no puede leer `.env`.

### 4. Publicar en Firebase Hosting

Las notificaciones push y la geolocalización **exigen HTTPS**. En desarrollo funcionan en `localhost`, pero para probarlas en el teléfono hay que publicar.

```bash
npm install -g firebase-tools
firebase login
firebase init hosting      # elegir el proyecto creado; public: dist; SPA: sí; no sobrescribir firebase.json
npm run deploy
```

El `firebase.json` ya incluido trae la reescritura de rutas para aplicación de una sola página y las cabeceras de caché correctas. Al correr `firebase init`, **responder que no** cuando pregunte si sobrescribe archivos existentes.

### 5. Probar las push en el teléfono

1. Abrir la URL publicada en Chrome del Moto G31.
2. Ir a **Preferencias** y tocar *Activar notificaciones*. Aceptar el permiso.
3. Copiar el token que aparece en pantalla.
4. En la consola de Firebase: **Messaging → Crear campaña → Enviar mensaje de prueba** y pegar el token.
5. Probar **dos veces**: con la aplicación abierta en pantalla y con la aplicación en segundo plano. Son dos caminos de código distintos (ver sección siguiente) y hacen falta las dos capturas para el informe.

### 6. Instalar como aplicación

En Chrome del teléfono: menú → *Agregar a pantalla de inicio*. Queda con ícono propio, sin barra del navegador y con funcionamiento sin conexión.

---

## Comandos

```bash
npm run dev        # servidor de desarrollo, accesible desde la red local
npm run build      # compila a dist/
npm run preview    # sirve dist/ para probar la PWA compilada
npm test           # 83 pruebas de la capa de servicios
npm run deploy     # compila y publica en Firebase Hosting
```

---

## Arquitectura

### La decisión central

Todos los módulos consumen la misma capa de servicios, y esa capa decide si los datos vienen de un simulador o de una API real:

```
src/
  config.js                 <- USAR_SIMULADOR = true
  servicios/
    seleccion.js            <- seleccionar(simulado, real)
    bicicletas.js           <- fachada: lo unico que importa la interfaz
    tributaria.js
    reclamos.js
    atencion.js
    alarmas.js
    estacionamiento.js
    notificaciones.js
    mock/                   <- datos semilla + demora + fallas + tiempo real
    real/                   <- fetch contra la API municipal
    datos/                  <- semillas
```

Ninguna pantalla sabe de dónde salen los datos. Pasar de simulado a real es cambiar `USAR_SIMULADOR` en `src/config.js`.

**Agregar un módulo nuevo** es agregar un archivo a `servicios/` con su par `mock`/`real` y una línea en `servicios/index.js`. Ninguna pantalla existente se toca. Esa es la respuesta al requisito no funcional de escalabilidad.

### El simulador falla a propósito

`RED_SIMULADA` en `config.js` introduce entre 300 y 800 ms de demora y hace fallar una de cada doce peticiones. Sin eso, los estados de carga y de error de la interfaz nunca se ejercitan durante el desarrollo y la aplicación se rompe en la demostración.

Las pruebas desactivan la aleatoriedad con `configurarRed({ demoraMinMs: 0, demoraMaxMs: 0, tasaDeFallas: 0 })`.

### Tiempo real

Bicicletas y alarmas no piden el dato una vez: se suscriben a un canal que muta el estado cada pocos segundos y notifica. La disponibilidad cambia sola en pantalla. El contrato de suscripción es el mismo que expondría un WebSocket.

### Dos service workers

| Archivo | Alcance | Responsabilidad |
|---|---|---|
| `dist/sw.js` (generado por Workbox) | `/` | Funcionamiento sin conexión, caché de teselas del mapa |
| `public/firebase-messaging-sw.js` | `/firebase-cloud-messaging-push-scope` | Recepción de push en segundo plano |

Son dos trabajadores con responsabilidades distintas. Confundirlos es el error más común al sumar push a una PWA que ya funcionaba sin conexión.

### Los dos caminos de entrega de una push

- **Aplicación en segundo plano**: el service worker publica el aviso. `onBackgroundMessage` en `public/firebase-messaging-sw.js`.
- **Aplicación en primer plano**: el SDK no muestra nada y entrega el mensaje a `onMessage`. `escucharEnPrimerPlano` en `src/push/fcm.js`.

Es la misma distinción verificada en el TP6 con dos pruebas separadas.

---

## Rendimiento

El requisito pide cargar en menos de 3 segundos. Se midió y se optimizó:

| | Fragmento mayor | Comprimido |
|---|---|---|
| Antes | 1699 kB | 401 kB |
| Después | 850 kB | 175 kB |

Tres cambios:

1. **Firebase se carga bajo demanda** (`import()` dinámico en `src/push/fcm.js`). Un vecino que consulta una estación de bicicletas no descarga el SDK de mensajería.
2. **Las doce pantallas viajan en fragmentos separados** (`React.lazy` en `src/App.jsx`). Leaflet (150 kB) sólo baja al abrir un mapa.
3. **Se habilitó el descarte de componentes de Ionic no usados** (`treeshake.moduleSideEffects` en `vite.config.js`). Ni `@ionic/react` ni `@ionic/core` declaran `sideEffects` en su `package.json`, de modo que el empaquetador conservaba los ciento y pico de componentes del framework aunque la aplicación usara treinta.

Para medir con Lighthouse: Chrome → F12 → pestaña Lighthouse → modo Navegación, dispositivo Móvil, **sobre la URL publicada** (no sobre `localhost`, que no está limitado por red).

> La categoría PWA fue **eliminada de Lighthouse** en la versión 12, al cambiar Chrome sus criterios de instalabilidad. Quedan Rendimiento, Accesibilidad, Prácticas recomendadas y SEO. La instalabilidad se verifica en **DevTools → Application → Manifest**.

---

## Limitaciones declaradas

1. **Los pagos son simulados.** No hay pasarela. La pantalla de pago no acepta ni almacena datos de tarjeta: sólo se elige un medio, que es una etiqueta. Lleva un cartel de demostración fijo y visible.
2. **No hay API municipal.** Los siete servicios están simulados, lo que la consigna autoriza expresamente. La implementación real está escrita y completa en `src/servicios/real/`, lista para el día que exista el endpoint.
3. **El disparo automático de push requiere plan Blaze.** Igual que en el TP6: el canal está implementado y verificado, pero el proceso que decide *cuándo* enviar sería una Cloud Function y el proyecto corre en Spark.
4. **En iPhone, las push sólo funcionan con la aplicación instalada en la pantalla de inicio** (iOS 16.4+). No funcionan en una pestaña de Safari. En Android/Chrome funcionan sin instalar.
5. **No hay avisos locales diferidos.** El navegador no tiene equivalente de `AlarmManager`: la API que lo permitía (Notification Triggers) quedó en ensayo de origen y nunca se estandarizó. El aviso del temporizador de estacionamiento se dispara mientras la aplicación sigue abierta.
6. **Las push recibidas en segundo plano no entran al historial de la aplicación**, porque las publica el service worker sin que la página esté viva. Sumarlas exigiría IndexedDB compartido.
7. **Los contactos municipales son de demostración** y están marcados como tales en la interfaz. Los números de emergencia nacionales (100, 107, 911, 144) son reales.

---

## Privacidad y seguridad

- No hay cuenta de usuario ni servidor propio. Reclamos, fotos, pagos simulados y preferencias se guardan **únicamente en el `localStorage` de este dispositivo**.
- Las fotos adjuntas se reducen a 1024 px y se recomprimen en el teléfono antes de guardarse; no se suben a ningún lado.
- La aplicación no pide ni acepta datos de tarjeta en ninguna pantalla.
- La geolocalización se pide sólo detrás de un botón, nunca al arrancar.
- El permiso de notificaciones se pide sólo desde Preferencias, detrás de un gesto del usuario.
- Preferencias incluye *Borrar mis datos de este dispositivo*.

---

## Pruebas

```bash
npm test
```

83 pruebas en cuatro archivos:

| Archivo | Qué verifica |
|---|---|
| `arquitectura.test.js` | Que las implementaciones simulada y real de los siete servicios expongan exactamente el mismo contrato. Es la prueba que convierte "basta con cambiar una bandera" de promesa en hecho verificable. |
| `red.test.js` | Simulador de red (demora, fallas, copias defensivas) y canal de tiempo real. |
| `geo.test.js` | Distancias, orden por cercanía y detección de zona, contra puntos conocidos de San Francisco. |
| `servicios.test.js` | Reglas de negocio de los siete módulos: invariantes de disponibilidad, estados de cedulones, filtros de reclamos, enlaces de contacto, regla de alerta por cercanía, tarifas por fracción y topes de extensión. |

---

## Tecnologías

| Elección | Motivo |
|---|---|
| Ionic React 9 + Vite | La consigna nombra Ionic. Aporta componentes con aspecto móvil, que cubre el criterio de interfaz |
| Leaflet + OpenStreetMap | Sin clave, sin cuenta, sin facturación. Google Maps exige facturación habilitada |
| PWA instalable | Responde de forma directa qué significa "no nativa": push, pantalla de inicio propia y funcionamiento sin conexión |
| Firebase Cloud Messaging | Ya usado en el TP6. Un proveedor menos que administrar |
| Firebase Hosting | Gratuito en Spark y da HTTPS, obligatorio para service worker, push y geolocalización |
| Vitest | Comparte la configuración de Vite; cero andamiaje adicional |
