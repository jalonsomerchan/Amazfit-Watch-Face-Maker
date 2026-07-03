# Amazfit Watch Face Maker · hmSensor

Proyecto estático para crear esferas Zepp OS con el máximo número de widgets basados en el `hmSensor Sensor Module`.

## Uso

Abre `index.html` en el navegador. No hay paso de build.

## Exportar para Zeus

Pulsa **Proyecto Zeus ZIP** para generar un proyecto compatible con Zeus:

```bash
zeus build -t default
```

## Sensores incluidos

- `TIME`: hora, segundos, fecha, semana y campos lunares/festivos.
- `BATTERY`: texto y barra.
- `STEP`: pasos, objetivo, porcentaje y barra.
- `CALORIE`: calorías, objetivo, porcentaje y barra.
- `HEART`: pulso y barra.
- `PAI`: texto y barra.
- `DISTANCE`: texto y barra.
- `STAND`: horas de pie, objetivo y barra.
- `WEATHER`: clima, índice, temperatura, máxima, mínima, rango, humedad, UV, amanecer y atardecer.
- `FAT_BURRING`: minutos y barra.
- `SPO2`: texto y barra.
- `BODY_TEMP`: temperatura corporal.
- `STRESS`: texto y barra.
- `VIBRATE`: estado.
- `WEAR`: estado en muñeca.
- `WORLD_CLOCK`: reloj mundial y ciudad.
- `SLEEP`: total, profundo, ligero, REM, despierto y barra.
- `MUSIC`: título, artista y estado.

El código exportado usa lecturas defensivas: prueba métodos y propiedades habituales y mantiene el fallback visual si el firmware/modelo no expone un dato concreto.

## Editor TEXT actualizado

El inspector permite editar las propiedades documentadas de `hmUI.widget.TEXT`: `align_h`, `align_v`, `text_style`, `line_space`, `char_space`, posición, tamaño, color y texto/fallback. El exportador Zeus las escribe en cada widget `TEXT` generado.

