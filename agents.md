# Amazfit Editor

## Objetivo del proyecto

Este proyecto es una aplicacion web estatica para disenar esferas de Amazfit, con Amazfit Active 3 Premium 466 x 466 px como modelo predeterminado. Permite componer una pantalla de reloj con widgets visuales, ajustar estilos desde un inspector, previsualizar la esfera, exportar la configuracion como JSON, importar configuraciones guardadas, descargar una imagen PNG y generar una aproximacion de codigo Zepp OS.

No hay paso de build: se puede abrir `index.html` directamente en el navegador. La app depende de CDN para Tailwind CSS, Lucide Icons y Google Fonts.

## Estructura

- `index.html`: estructura HTML de la interfaz, botones, paneles, inputs y simulador del reloj.
- `css/styles.css`: fuentes, clases tipograficas custom y estilos globales pequenos, como el scrollbar.
- `js/app.js`: estado de la aplicacion, plantillas, render del canvas, drag and drop, inspector, import JSON, exportacion ZIP de proyecto Zeus, exportacion PNG y generador de codigo Zepp OS.

La biblioteca de widgets vive como barra superior en `index.html`, antes de las dos columnas principales. Las tarjetas antiguas de biblioteca dentro del panel izquierdo quedaron ocultas para no duplicar la UI visible.

## Modelo de estado

La app mantiene el estado principal en variables globales de `js/app.js`:

- `elements`: lista de widgets colocados en la esfera.
- `selectedElementId`: id del widget seleccionado en el inspector.
- `watchConfig`: configuracion del fondo y dimensiones nativas de la esfera.
- `SCALE`: escala visual usada para mostrar 390 x 450 como 312 x 360 en pantalla.

Cada widget usa coordenadas nativas de la esfera, no coordenadas escaladas de la UI. Al renderizar, `renderCanvas()` multiplica posiciones y tamanos por `SCALE`.

La resolucion se elige con `watch-model`. Las opciones viven en `watchModels`; `changeWatchModel()` actualiza `watchConfig.width`, `watchConfig.height`, la escala del simulador, las etiquetas visibles, el PNG exportado y el fondo del codigo Zepp generado.

Algunos modelos tambien declaran `zeusPlatforms`, que son los targets reales que Zeus escribe en `app.json`. Esto afecta a la etiqueta que muestra Zepp OS Simulator en la lista de apps. Por ejemplo, Active 3 Premium usa `active-3-premium-cn`, `active-3-premium-global-1`, `active-3-premium-global-2` y `active-3-premium-global-3`; si un modelo no tiene targets propios, el exportador usa el fallback antiguo `madrid/madridw`, que el simulador puede etiquetar como GTR 3 Pro.

Los widgets dinamicos usan texto de muestra en la previsualizacion, pero el codigo Zepp OS generado intenta convertirlos en valores reales del reloj. El catalogo actual incluye hora, fecha, pasos, calorias, distancia, pulso, bateria, sueno, estres, SpO2, PAI, clima, temperatura, humedad, UV, altitud, presion, amanecer, atardecer, alarma, Bluetooth y cronometro. Las barras `progress-bar` tambien se vinculan a metricas mediante `progressType`.

Las fuentes visibles del editor se resuelven con `fontFamilyMap` y se aplican inline en los widgets renderizados. Las fuentes viven en `assets/fonts`, no dependen de Google Fonts en tiempo de uso. Para Zepp OS, `zeppFontFiles` limita la lista a TTF locales compatibles y `exportJSON()` copia las fuentes usadas a `assets/default/raw/*.ttf`; `generateZeppCode()` las referencia en cada `widget.TEXT` con `font: 'raw/archivo.ttf'`, que es el formato que usa la plantilla oficial de Zeus. El PNG exportado usa el mismo mapa mediante `getCanvasFont()` y espera a `document.fonts.ready` antes de dibujar. El widget `date` tiene `dateFormat`, configurable desde el inspector y respetado en la previsualizacion, PNG y codigo Zepp generado.

Si algun modelo concreto no respeta una TTF en `hmUI.widget.TEXT`, los elementos de texto pueden activar el fallback `renderAsImage`; `exportJSON()` genera `assets/default/text_*.png` y `generateZeppCode()` usa `hmUI.widget.IMG`. Ese modo es visualmente fiel, pero el texto queda estatico.

Las guias visuales usan capas `.guide-layer`: rejilla fina, lineas de centro, tercios y area segura redonda. Cuando `showGuides` esta activo, `drag()` y `resizeElement()` ajustan posiciones y tamanos a `GRID_SIZE`.

`watchConfig.shape` controla si el preview se muestra redondo o cuadrado. Es solo una ayuda visual del editor; la resolucion nativa sigue viniendo de `watchConfig.width` y `watchConfig.height`.

Los widgets dinamicos soportan texto antes y despues del valor mediante `metricPrefix` y `metricSuffix`. Esto se aplica en el editor, PNG y codigo Zepp generado.

El generador evita imports ESM en `watchface/index.js` y usa APIs globales (`hmUI`, `hmSensor` y `timer`) para que el paquete funcione con el runtime `configVersion: v2`. Si una metrica no existe en el SDK/dispositivo, el widget conserva su texto de fallback.

La mayoria de widgets soportan un titulo opcional encima del contenido mediante `titleEnabled`, `titleText`, `titleFontFamily`, `titleFontSize` y `titleColor`. El titulo se pinta en el editor, en el PNG y en el codigo Zepp generado. El widget `bluetooth` tambien tiene estados configurables OK/KO (`statusOkText`, `statusKoText`, `statusOkColor`, `statusKoColor`, `statusPreview`) y el codigo generado cambia texto/color segun conexion.

## Flujo principal

1. `DOMContentLoaded` inicializa Lucide, carga la plantilla `sport` y aplica el fondo.
2. Los botones del HTML llaman funciones globales como `addElement`, `applyTemplate`, `exportJSON` o `exportAsImage`.
3. `renderCanvas()` reconstruye los elementos visuales dentro de `#canvas-elements`.
4. `selectElement()` sincroniza el inspector con el widget activo.
5. `updateElementProp()` cambia el estado del widget y vuelve a renderizar.
6. `generateZeppCode()` actualiza el bloque de codigo Zepp OS cada vez que cambia la esfera.
7. El codigo generado crea sensores Zepp OS opcionales para las metricas disponibles, guarda referencias a textos/barras dinamicas y los refresca con temporizador.
8. `openInstallModal()` y `closeInstallModal()` controlan el modal de ayuda de instalacion.
9. `exportJSON()` conserva el nombre historico, pero ahora descarga un ZIP con un proyecto Zeus compilable con `zeus build -t default`: `app.json`, `app.js`, `watchface/index.js`, `assets/default/icon.png`, `README.md` y `amazfit-editor-design.json`.

Los elementos seleccionados muestran un tirador inferior derecho para redimensionar con raton o tactil. El inspector tambien incluye `centerSelectedElement('horizontal')` y `centerSelectedElement('vertical')`, que centran el widget por eje en el lienzo nativo del modelo elegido.

## Convenciones para editar

- Mantener `index.html` centrado en estructura. Si una mejora requiere comportamiento, ponerlo en `js/app.js`; si requiere estilos reutilizables o globales, ponerlo en `css/styles.css`.
- Las funciones llamadas desde atributos `onclick`, `oninput` u `onchange` deben seguir estando disponibles globalmente, porque la app no usa modulos ES.
- Respetar el espacio nativo del modelo elegido en todo lo que afecte a exportacion o codigo Zepp OS. Active 3 Premium usa 466 x 466 px.
- Mantener separados los valores de muestra del editor y los valores reales del reloj. Si se cambia un widget dinamico, revisar `DYNAMIC_METRIC_TYPES`, `metricDefaults`, `getGeneratedTextExpression()` y la lectura/formato dentro de `generateZeppCode()`.
- Si se cambia el inspector, mantener sincronizados los controles dobles: `prop-size` con `prop-size-slider` y `prop-title-size` con `prop-title-size-slider`.
- Si se anade un modelo de reloj, actualizar `watchModels` y el `<select id="watch-model">` con la misma clave. Si va a exportarse para Zeus, anadir tambien sus `zeusPlatforms` para que el simulador muestre el dispositivo correcto.
- Si se cambia el empaquetado Zeus, mantener sincronizados `createZeusAppJson()`, `createZeusAppJs()`, `createProjectReadme()` y la lista de archivos de `exportJSON()`.
- Cuando se anada un nuevo tipo de widget, revisar como minimo:
  - `addElement()`
  - `renderCanvas()`
  - `selectElement()`
  - `exportAsImage()`
  - `generateZeppCode()`
- Evitar introducir dependencias de build salvo que se cambie explicitamente el enfoque del proyecto.

## Verificacion recomendada

- Abrir `index.html` en un navegador y comprobar que la plantilla deportiva carga al inicio.
- Probar anadir, seleccionar, mover y eliminar widgets.
- Probar cambios de fondo: color, gradiente e imagen.
- Probar importacion JSON y exportacion ZIP de proyecto Zeus.
- Probar descarga PNG.
- Confirmar que los iconos Lucide aparecen tras renderizados dinamicos.
