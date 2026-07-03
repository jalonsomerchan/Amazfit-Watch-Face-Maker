# Extensiones avanzadas para Amazfit Watch Face Maker

Este ZIP añade una capa de mejoras sin cambiar el sistema del proyecto: no requiere build y se carga después de `js/app.js`.

## Instalación rápida

1. Copia `js/advanced-widgets.js` dentro de la carpeta `js/` del proyecto.
2. Abre `index.html` y añade esta línea justo después de `<script src="js/app.js"></script>`:

```html
<script src="js/advanced-widgets.js"></script>
```

También puedes aplicar el fichero `index.patch` con:

```bash
git apply index.patch
```

## Qué añade

### Widgets nuevos

- Agujas analógicas de hora, minuto y segundo.
- Anillos múltiples tipo Apple Watch.
- Icono meteorológico visual.
- Temperatura máxima/mínima.
- Fase lunar.
- Cuenta atrás.
- Separadores/líneas.
- Iconos SVG predefinidos.
- Indicador de objetivo de pasos configurable.
- Fecha en círculo.
- Marcador de batería con icono.

### Capas y edición

- Ordenar delante/detrás, enviar al frente/fondo.
- Bloquear y ocultar capas.
- Duplicar widget.
- Deshacer/rehacer.
- Centrar X/Y.
- Distribuir horizontal/vertical.
- Selector de z-index.
- Copiar posición X desde otro widget.
- Copiar posición Y desde otro widget.
- Copia de estilo ampliada, sin arrastrar la posición del widget.

### Menús desplegables

Los grupos de widgets se cierran automáticamente al pulsar fuera, al abrir otro grupo o al seleccionar un widget.

## Nota sobre exportación Zeus

Los widgets avanzados se exportan como imagen estática (`renderAsImage`) para conservar el diseño visual dentro del proyecto Zeus. Los widgets dinámicos originales del editor se mantienen como estaban.
