// Zepp OS watchface runtime no define CommonJS module/exports.
// Estos guards evitan ReferenceError si algún wrapper generado los toca.
var module = (typeof module !== 'undefined') ? module : { exports: {} };
var exports = (typeof exports !== 'undefined') ? exports : module.exports;

// AMAZFIT FIX MODULE ERROR + KEEP SLEEP PAI
// AMAZFIT KEEP SLEEP AND PAI - best effort Active 3 Premium
// AMAZFIT WORKING WIDGETS - Active 3 Premium logs 2026-07-03
// --- DEBUG SENSORIAL DEL CÓDIGO EXPORTADO ---
// true: muestra estado de sensores al arrancar y cada pocos ticks.
// false: genera una esfera más limpia para producción.
const AMAZFIT_SENSOR_DEBUG = true;

// true: prueba muchas propiedades/métodos al arrancar. Útil para investigar.
// false: no hace pruebas largas ni spam de consola.
const AMAZFIT_SENSOR_DEEP_PROBE = false;

// AMAZFIT EDITOR - Bluetooth real con hmBle.connectStatus()
// --- CONSTANTES Y VARIABLES DE ESTADO ---
let elements = [];
let selectedElementId = null;
let isDragging = false;
let isResizing = false;
let styleCopyTargetId = null;
let dragOffset = { x: 0, y: 0 };
let resizeState = { startX: 0, startY: 0, width: 0, height: 0 };
let showGuides = false;
const GRID_SIZE = 10;
const STORAGE_KEYS = {
    watchModel: 'amazfit-editor:last-watch-model',
    watchShape: 'amazfit-editor:last-watch-shape',
    autosavedDesign: 'amazfit-editor:autosaved-design:v1'
};
let autosaveTimer = null;
let autosaveEnabled = false;

// Exportación exacta para el simulador Zeus:
// true  = rasteriza los widgets de texto como PNG para que posición/tamaño coincidan con el preview HTML.
// false = usa TEXT nativo dinámico de Zepp OS, pero la fuente puede variar en el simulador/reloj.
const ZEPP_EXACT_PREVIEW_EXPORT = false;

// Configuración real del lienzo (390 x 450)
let watchConfig = {
    model: 'active3premium',
    modelName: 'Amazfit Active 3 Premium',
    width: 466,
    height: 466,
    bgType: 'gradient',
    bgColor: '#020617',
    bgGradStart: '#0d1527',
    bgGradEnd: '#020617',
    bgGradAngle: '135',
    bgImage: null,
    shape: 'round'
};

const watchModels = {
    active3premium: {
        name: 'Amazfit Active 3 Premium',
        width: 466,
        height: 466,
        shape: 'round',
        zeusPlatforms: [
            { name: 'active-3-premium-cn', deviceSource: 10944768 },
            { name: 'active-3-premium-global-1', deviceSource: 10944769 },
            { name: 'active-3-premium-global-2', deviceSource: 10944771 },
            { name: 'active-3-premium-global-3', deviceSource: 10948867 }
        ]
    },
    active: {
        name: 'Amazfit Active original',
        width: 390,
        height: 450,
        shape: 'square',
        zeusPlatforms: [
            { name: 'Hannover', deviceSource: 8323329 }
        ]
    },
    active2premium: {
        name: 'Amazfit Active 2 Premium',
        width: 466,
        height: 466,
        shape: 'round',
        zeusPlatforms: [
            { name: 'Milan64', deviceSource: 10092800 },
            { name: 'MilanWNFC64', deviceSource: 10092801 },
            { name: 'MilanW64', deviceSource: 10092803 },
            { name: 'MilanWNA64', deviceSource: 10092807 }
        ]
    },
    gts4: { name: 'Amazfit GTS 4', width: 390, height: 450, shape: 'square' },
    gtr4: {
        name: 'Amazfit GTR 4',
        width: 466,
        height: 466,
        shape: 'round',
        zeusPlatforms: [
            { name: 'Berlin', deviceSource: 7930112 },
            { name: 'BerlinW', deviceSource: 7930113 }
        ]
    },
    balance: { name: 'Amazfit Balance', width: 480, height: 480, shape: 'round' },
    bip5: { name: 'Amazfit Bip 5', width: 320, height: 380, shape: 'square' },
    custom: { name: 'Personalizado', width: 390, height: 450, shape: 'square' }
};

const legacyZeusPlatforms = [
    { name: "madrid", deviceSource: 229 },
    { name: "madridw", deviceSource: 230 }
];

// Escala del simulador físico para encajar la resolución elegida en la UI
let SCALE = 312 / 390;

const DYNAMIC_METRIC_TYPES = [
    'time',
    'hour',
    'minute',
    'second',
    'date',
    'day',
    'month',
    'year',
    'weekday',
    'day-of-year',
    'week',
    'steps',
    'calories',
    'distance',
    'heart',
    'battery',
    'stress',
    'spo2',
    'weather',
    'temperature',
    'sunrise',
    'sunset',
    'bluetooth'
];

const metricDefaults = {
    time: { text: '10:09', color: '#38bdf8', fontSize: 55, fontFamily: 'font-teko', timeFormat: 'hh-mm-24' },
    hour: { text: '10', color: '#38bdf8', fontSize: 68, fontFamily: 'font-teko' },
    minute: { text: '09', color: '#38bdf8', fontSize: 68, fontFamily: 'font-teko' },
    second: { text: '42', color: '#94a3b8', fontSize: 28, fontFamily: 'font-orbitron' },
    date: { text: 'MIE, 30 JUN', color: '#34d399', fontSize: 18, fontFamily: 'font-rajdhani', dateFormat: 'weekday-day-month-short' },
    day: { text: '30', color: '#34d399', fontSize: 42, fontFamily: 'font-teko', dateFormat: 'day-padded' },
    month: { text: 'JUN', color: '#34d399', fontSize: 28, fontFamily: 'font-rajdhani', dateFormat: 'month-short' },
    year: { text: '2026', color: '#34d399', fontSize: 24, fontFamily: 'font-orbitron', dateFormat: 'year-full' },
    weekday: { text: 'MIE', color: '#34d399', fontSize: 24, fontFamily: 'font-rajdhani', dateFormat: 'weekday-short' },
    'day-of-year': { text: '181', color: '#34d399', fontSize: 24, fontFamily: 'font-chakra', dateFormat: 'day-of-year' },
    week: { text: '27', color: '#34d399', fontSize: 24, fontFamily: 'font-chakra', dateFormat: 'iso-week' },
    steps: { text: '5420', color: '#fbbf24', fontSize: 24, fontFamily: 'font-chakra' },
    calories: { text: '420', color: '#fb923c', fontSize: 22, fontFamily: 'font-chakra' },
    distance: { text: '4.8', color: '#a3e635', fontSize: 22, fontFamily: 'font-chakra' },
    heart: { text: '75', color: '#f43f5e', fontSize: 24, fontFamily: 'font-chakra' },
    battery: { text: '80', color: '#2dd4bf', fontSize: 24, fontFamily: 'font-orbitron' },
    stress: { text: '34', color: '#f87171', fontSize: 22, fontFamily: 'font-chakra' },
    spo2: { text: '98', color: '#38bdf8', fontSize: 22, fontFamily: 'font-chakra' },
    weather: { text: 'SOLEADO', color: '#fde047', fontSize: 18, fontFamily: 'font-rajdhani' },
    temperature: { text: '24', color: '#fca5a5', fontSize: 26, fontFamily: 'font-orbitron' },
    sunrise: { text: '06:42', color: '#fdba74', fontSize: 20, fontFamily: 'font-orbitron' },
    sunset: { text: '21:38', color: '#f9a8d4', fontSize: 20, fontFamily: 'font-orbitron' },
    bluetooth: { text: 'BT ON', color: '#60a5fa', fontSize: 18, fontFamily: 'font-rajdhani' },
};

const fontFamilyMap = {
    'font-bebas': "'Bebas Neue', sans-serif",
    'font-teko': "'Teko', sans-serif",
    'font-orbitron': "'Orbitron', sans-serif",
    'font-chakra': "'Chakra Petch', sans-serif",
    'font-rajdhani': "'Rajdhani', sans-serif",
    'font-mono-tech': "'Share Tech Mono', monospace",
    'font-montserrat': "'Montserrat', sans-serif",
    'font-inter': "'Inter', sans-serif"
};

const zeppFontFiles = {
    'font-bebas': 'bebas-neue-400.ttf',
    'font-teko': 'teko-700.ttf',
    'font-orbitron': 'orbitron-700.ttf',
    'font-chakra': 'chakra-petch-700.ttf',
    'font-rajdhani': 'rajdhani-700.ttf',
    'font-mono-tech': 'share-tech-mono-400.ttf',
    'font-montserrat': 'montserrat-700.ttf',
    'font-inter': 'inter-400.ttf'
};

const zeppTextSizeScale = {
    'font-bebas': 0.84,
    'font-teko': 0.84,
    'font-orbitron': 0.82,
    'font-chakra': 0.82,
    'font-rajdhani': 0.82,
    'font-mono-tech': 0.86,
    'font-montserrat': 0.82,
    'font-inter': 0.84
};

const unsupportedFontFallbacks = {
    'font-playfair': 'font-montserrat'
};

const dateFormatLabels = {
    'weekday-day-month-short': 'MIE, 30 JUN',
    'weekday-day-month-long': 'MIERCOLES, 30 JUNIO',
    'day-month-short': '30 JUN',
    'day-month-long': '30 JUNIO',
    'day-month-numeric': '30/06',
    'day-month-year-numeric': '30/06/2026',
    'iso': '2026-06-30',
    'month-day': 'JUN 30',
    'day-padded': '30',
    'day-number': '30',
    'month-number-padded': '06',
    'month-number': '6',
    'month-short': 'JUN',
    'month-long': 'JUNIO',
    'year-full': '2026',
    'year-short': '26',
    'weekday-short': 'MIE',
    'weekday-long': 'MIERCOLES',
    'day-of-year': '181',
    'day-of-year-padded': '181',
    'iso-week': '27',
    'week-padded': '27'
};

const timeFormatLabels = {
    'hh-mm-24': '10:09',
    'hh-mm-ss-24': '10:09:42',
    'hh-mm-12': '10:09 AM',
    'hh-mm-ss-12': '10:09:42 AM',
    'h-mm-12': '10:09 am',
    'hhmm-24': '1009',
    'hh-mm-dot': '10.09',
    'hh-mm-space': '10 09',
    'hour-only': '10',
    'minute-only': '09',
    'second-only': '42'
};

function applyMetricDefaults(element, type) {
    const defaults = metricDefaults[type];
    if (!defaults) return;
    Object.assign(element, defaults);
    ensureStatusDefaults(element);
    ensureDateDefaults(element);
}

function getCssFontFamily(fontClass) {
    return fontFamilyMap[normalizeFontClass(fontClass)] || fontFamilyMap['font-inter'];
}

function normalizeFontClass(fontClass) {
    return zeppFontFiles[fontClass] ? fontClass : (unsupportedFontFallbacks[fontClass] || 'font-inter');
}

function getZeppFontFile(fontClass) {
    return zeppFontFiles[normalizeFontClass(fontClass)] || zeppFontFiles['font-inter'];
}

function getZeppFontPath(fontClass) {
    const fontFile = getZeppFontFile(fontClass);
    return fontFile ? `raw/${fontFile}` : '';
}

function getCanvasFont(fontClass, size, weight = '') {
    return `${weight ? `${weight} ` : ''}${size}px ${getCssFontFamily(fontClass)}`;
}

function getZeppTextSize(fontClass, size) {
    const normalizedFont = normalizeFontClass(fontClass || 'font-inter');
    const scale = zeppTextSizeScale[normalizedFont] || 0.84;
    return Math.max(1, Math.round((size || 14) * scale));
}

function getZeppTextBoxHeight(fontClass, size, preferredHeight) {
    const textSize = getZeppTextSize(fontClass, size);
    return Math.max(1, Math.round(Math.max(preferredHeight || 0, textSize * 1.45)));
}

function pad2(value) {
    return value < 10 ? `0${value}` : String(value);
}

function getDateParts(date) {
    const weekdaysShort = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const weekdaysLong = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const monthsShort = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const monthsLong = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - startOfYear) / 86400000) + 1;
    const isoDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const isoDay = isoDate.getUTCDay() || 7;
    isoDate.setUTCDate(isoDate.getUTCDate() + 4 - isoDay);
    const isoYearStart = new Date(Date.UTC(isoDate.getUTCFullYear(), 0, 1));
    const isoWeek = Math.ceil((((isoDate - isoYearStart) / 86400000) + 1) / 7);
    return {
        day: pad2(date.getDate()),
        dayNumber: String(date.getDate()),
        month: pad2(date.getMonth() + 1),
        monthNumber: String(date.getMonth() + 1),
        year: String(date.getFullYear()),
        yearShort: String(date.getFullYear()).slice(-2),
        weekdayShort: weekdaysShort[date.getDay()],
        weekdayLong: weekdaysLong[date.getDay()],
        monthShort: monthsShort[date.getMonth()],
        monthLong: monthsLong[date.getMonth()],
        dayOfYear: String(dayOfYear),
        dayOfYearPadded: String(dayOfYear).padStart(3, '0'),
        isoWeek: String(isoWeek),
        isoWeekPadded: pad2(isoWeek)
    };
}

function formatDateForDisplay(format, date = new Date()) {
    const parts = getDateParts(date);
    switch (format) {
        case 'weekday-day-month-long':
            return `${parts.weekdayLong}, ${parts.day} ${parts.monthLong}`;
        case 'day-month-short':
            return `${parts.day} ${parts.monthShort}`;
        case 'day-month-long':
            return `${parts.day} ${parts.monthLong}`;
        case 'day-month-numeric':
            return `${parts.day}/${parts.month}`;
        case 'day-month-year-numeric':
            return `${parts.day}/${parts.month}/${parts.year}`;
        case 'iso':
            return `${parts.year}-${parts.month}-${parts.day}`;
        case 'month-day':
            return `${parts.monthShort} ${parts.day}`;
        case 'day-padded':
            return parts.day;
        case 'day-number':
            return parts.dayNumber;
        case 'month-number-padded':
            return parts.month;
        case 'month-number':
            return parts.monthNumber;
        case 'month-short':
            return parts.monthShort;
        case 'month-long':
            return parts.monthLong;
        case 'year-full':
            return parts.year;
        case 'year-short':
            return parts.yearShort;
        case 'weekday-short':
            return parts.weekdayShort;
        case 'weekday-long':
            return parts.weekdayLong;
        case 'day-of-year':
            return parts.dayOfYear;
        case 'day-of-year-padded':
            return parts.dayOfYearPadded;
        case 'iso-week':
            return parts.isoWeek;
        case 'week-padded':
            return parts.isoWeekPadded;
        case 'weekday-day-month-short':
        default:
            return `${parts.weekdayShort}, ${parts.day} ${parts.monthShort}`;
    }
}

function formatTimeForDisplay(format, date = new Date()) {
    const hour24 = date.getHours();
    const hour12 = hour24 % 12 || 12;
    const minute = pad2(date.getMinutes());
    const second = pad2(date.getSeconds());
    const period = hour24 >= 12 ? 'PM' : 'AM';

    switch (format) {
        case 'hh-mm-ss-24':
            return `${pad2(hour24)}:${minute}:${second}`;
        case 'hh-mm-12':
            return `${pad2(hour12)}:${minute} ${period}`;
        case 'hh-mm-ss-12':
            return `${pad2(hour12)}:${minute}:${second} ${period}`;
        case 'h-mm-12':
            return `${hour12}:${minute} ${period.toLowerCase()}`;
        case 'hhmm-24':
            return `${pad2(hour24)}${minute}`;
        case 'hh-mm-dot':
            return `${pad2(hour24)}.${minute}`;
        case 'hh-mm-space':
            return `${pad2(hour24)} ${minute}`;
        case 'hour-only':
            return pad2(hour24);
        case 'minute-only':
            return minute;
        case 'second-only':
            return second;
        case 'hh-mm-24':
        default:
            return `${pad2(hour24)}:${minute}`;
    }
}

function isDynamicMetricType(type) {
    return DYNAMIC_METRIC_TYPES.includes(type);
}

function isCalendarMetricType(type) {
    return ['date', 'day', 'month', 'year', 'weekday', 'day-of-year', 'week'].includes(type);
}

function getMetricLabel(type) {
    const labels = {
        battery: 'BATERÍA',
        steps: 'PASOS',
        heart: 'RITMO C.',
        calories: 'CALORÍAS',
        distance: 'DISTANCIA',
        stress: 'ESTRÉS',
        spo2: 'SPO2',
        date: 'FECHA',
        day: 'DÍA',
        month: 'MES',
        year: 'AÑO',
        weekday: 'DÍA SEM.',
        'day-of-year': 'DÍA AÑO',
        week: 'SEMANA'
    };
    return labels[type] || String(type || 'DATO').toUpperCase();
}

function supportsOptionalTitle(type) {
    return !['label', 'arc-progress', 'circle', 'stroke-rect'].includes(type);
}

function ensureTitleDefaults(element) {
    if (element.titleEnabled === undefined) element.titleEnabled = false;
    if (!element.titleText) element.titleText = getMetricLabel(element.progressType || element.type);
    if (!element.titleFontFamily) element.titleFontFamily = 'font-rajdhani';
    if (!element.titleFontSize) element.titleFontSize = 10;
    if (!element.titleColor) element.titleColor = '#94a3b8';
}

function ensureStatusDefaults(element) {
    if (element.type !== 'bluetooth') return;
    if (!element.statusOkText) element.statusOkText = 'BT OK';
    if (!element.statusKoText) element.statusKoText = 'BT KO';
    if (!element.statusOkColor) element.statusOkColor = '#60a5fa';
    if (!element.statusKoColor) element.statusKoColor = '#f87171';
    if (!element.statusPreview) element.statusPreview = 'ok';
    element.text = element.statusPreview === 'ko' ? element.statusKoText : element.statusOkText;
    element.color = element.statusPreview === 'ko' ? element.statusKoColor : element.statusOkColor;
}

function ensureDateDefaults(element) {
    if (!isCalendarMetricType(element.type)) return;
    const defaults = metricDefaults[element.type] || metricDefaults.date;
    if (!element.dateFormat) element.dateFormat = defaults.dateFormat || 'weekday-day-month-short';
    element.text = dateFormatLabels[element.dateFormat] || formatDateForDisplay(element.dateFormat);
}

function ensureTimeDefaults(element) {
    if (element.type !== 'time') return;
    if (!element.timeFormat) element.timeFormat = 'hh-mm-24';
    element.text = timeFormatLabels[element.timeFormat] || timeFormatLabels['hh-mm-24'];
}

function ensureMetricAffixDefaults(element) {
    if (!isDynamicMetricType(element.type)) return;
    if (element.metricPrefix === undefined) element.metricPrefix = '';
    if (element.metricSuffix === undefined) element.metricSuffix = '';
}

function isProgressWidget(type) {
    return type === 'progress-bar' || type === 'arc-progress';
}

function isShapeWidget(type) {
    return type === 'circle' || type === 'stroke-rect';
}

function hasAutoContentHeight(element) {
    return element && !isShapeWidget(element.type);
}

function getTitleContentHeight(element) {
    if (!element || !element.titleEnabled || !supportsOptionalTitle(element.type)) return 0;
    return getMeasuredTextHeight(element.titleText || '', element.titleFontFamily || 'font-rajdhani', element.titleFontSize || 10, 'bold') + 2;
}

function getTextContentHeight(element) {
    const fontWeight = ['font-bebas', 'font-orbitron', 'font-chakra', 'font-montserrat', 'font-rajdhani'].includes(element.fontFamily) ? 'bold' : '';
    return getMeasuredTextHeight(getElementDisplayText(element), element.fontFamily || 'font-inter', element.fontSize || 14, fontWeight);
}

function getMeasuredTextHeight(text, fontClass, size, weight = '') {
    if (!String(text || '').length) return 0;
    return Math.max(1, Math.ceil(size || 14));
}

function getAutoContentHeight(element) {
    if (!hasAutoContentHeight(element)) return Math.max(1, Math.round(element.height || 1));

    const titleHeight = getTitleContentHeight(element);
    let contentHeight = getTextContentHeight(element);

    if (element.type === 'progress-bar') {
        contentHeight = 12 + Math.max(2, Math.ceil(element.progressThickness || 6));
    } else if (element.type === 'arc-progress') {
        contentHeight = Math.max(1, Math.round(element.width || 1));
    } else if (element.type === 'chart') {
        contentHeight = Math.max(24, Math.ceil((element.fontSize || 14) * 1.6));
    } else if (element.type === 'image') {
        contentHeight = Math.max(1, Math.round(element.width || 45));
    }

    return Math.max(1, Math.ceil(titleHeight + contentHeight));
}

function fitElementHeightToContent(element) {
    if (!hasAutoContentHeight(element)) return element.height;
    element.height = Math.min(getCanvasHeight() - element.y, getAutoContentHeight(element));
    if (element.height < 1) element.height = 1;
    return element.height;
}

function canRenderElementAsImage(element) {
    return element && !['progress-bar', 'arc-progress', 'circle', 'stroke-rect', 'chart', 'image'].includes(element.type);
}

function isExactZeppImageExportEnabled() {
    return ZEPP_EXACT_PREVIEW_EXPORT === true;
}

function shouldRenderAsZeppImage(element) {
    // Nunca rasterizar datos dinámicos (hora, fecha, pasos, batería, etc.).
    // Si se convierten a PNG quedan estáticos o pueden no cargarse como asset en el simulador.
    if (element && isDynamicMetricType(element.type)) return false;
    return canRenderElementAsImage(element) && (element.renderAsImage || isExactZeppImageExportEnabled());
}

function applyMetricAffixes(element, value) {
    if (!isDynamicMetricType(element.type)) return value || '';
    return `${element.metricPrefix || ''}${value || ''}${element.metricSuffix || ''}`;
}

function getElementDisplayText(element) {
    if (element.type === 'time') {
        return applyMetricAffixes(element, formatTimeForDisplay(element.timeFormat || 'hh-mm-24'));
    }
    if (element.type === 'hour') {
        return applyMetricAffixes(element, formatTimeForDisplay('hour-only'));
    }
    if (element.type === 'minute') {
        return applyMetricAffixes(element, formatTimeForDisplay('minute-only'));
    }
    if (element.type === 'second') {
        return applyMetricAffixes(element, formatTimeForDisplay('second-only'));
    }
    if (element.type === 'bluetooth') {
        const value = element.statusPreview === 'ko'
            ? (element.statusKoText || 'BT KO')
            : (element.statusOkText || 'BT OK');
        return applyMetricAffixes(element, value);
    }
    if (isCalendarMetricType(element.type)) {
        return applyMetricAffixes(element, formatDateForDisplay(element.dateFormat || 'weekday-day-month-short'));
    }
    return applyMetricAffixes(element, element.text || '');
}

function getElementDisplayColor(element) {
    if (element.type === 'bluetooth') {
        return element.statusPreview === 'ko'
            ? (element.statusKoColor || '#f87171')
            : (element.statusOkColor || '#60a5fa');
    }
    return element.color || '#ffffff';
}

function normalizeElement(element) {
    element.fontFamily = normalizeFontClass(element.fontFamily || 'font-inter');
    element.titleFontFamily = normalizeFontClass(element.titleFontFamily || 'font-rajdhani');
    ensureTitleDefaults(element);
    if (!supportsOptionalTitle(element.type)) element.titleEnabled = false;
    ensureStatusDefaults(element);
    ensureDateDefaults(element);
    ensureTimeDefaults(element);
    ensureMetricAffixDefaults(element);
    fitElementHeightToContent(element);
    return element;
}

function updateCopyStyleControls(currentId) {
    const button = document.getElementById('prop-copy-style-button');
    if (!button) return;

    const hasSource = elements.some(element => element.id !== currentId);
    const isPicking = styleCopyTargetId === currentId;
    button.disabled = !hasSource;
    button.className = isPicking
        ? 'w-full h-8 inline-flex items-center justify-center gap-2 rounded border border-amber-700/80 bg-amber-950/50 text-amber-200 hover:bg-amber-900/60 transition text-xs font-semibold'
        : 'w-full h-8 inline-flex items-center justify-center gap-2 rounded border border-cyan-900/70 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 hover:text-cyan-100 transition text-xs font-semibold';
    if (!hasSource) {
        button.classList.add('opacity-40', 'cursor-not-allowed');
    }

    const icon = isPicking ? 'mouse-pointer-click' : 'copy';
    const text = isPicking ? 'Elige origen' : 'Copiar estilo';
    button.innerHTML = `<i data-lucide="${icon}" class="w-3.5 h-3.5"></i>${text}`;
    lucide.createIcons();
}

function startStyleCopyMode() {
    if (!selectedElementId) return;
    if (styleCopyTargetId === selectedElementId) {
        cancelStyleCopyMode();
        return;
    }
    if (!elements.some(element => element.id !== selectedElementId)) {
        showNotification("Añade otro elemento para copiar su estilo", "error");
        return;
    }

    styleCopyTargetId = selectedElementId;
    renderCanvas();
    selectElement(selectedElementId);
    showNotification("Selecciona en el reloj el elemento del que quieres copiar el estilo");
}

function cancelStyleCopyMode() {
    if (!styleCopyTargetId) return;
    styleCopyTargetId = null;
    renderCanvas();
    if (selectedElementId) selectElement(selectedElementId);
}

function pickStyleSource(sourceId) {
    const targetId = styleCopyTargetId;
    if (!targetId) return;

    if (sourceId === targetId) {
        showNotification("Elige otro elemento como origen del estilo", "error");
        return;
    }

    const source = elements.find(el => el.id === sourceId);
    const target = elements.find(el => el.id === targetId);
    if (!source || !target) {
        cancelStyleCopyMode();
        return;
    }

    normalizeElement(source);
    copyStyle(source, target);
    normalizeElement(target);
    clampElementToCanvas(target);
    styleCopyTargetId = null;
    selectedElementId = target.id;
    renderCanvas();
    selectElement(target.id);
    showNotification("Estilo copiado al elemento seleccionado", "success");
}

function handleStyleCopyPick(event, sourceId) {
    if (!styleCopyTargetId) return false;
    event.preventDefault();
    event.stopPropagation();
    pickStyleSource(sourceId);
    return true;
}

function clearStyleCopyModeIfNeeded() {
    if (!styleCopyTargetId) return;
    if (!elements.some(element => element.id === styleCopyTargetId)) {
        styleCopyTargetId = null;
    }
}

function resetStyleCopyMode() {
    styleCopyTargetId = null;
}

function disableCopyStyleButton() {
    const button = document.getElementById('prop-copy-style-button');
    if (!button) return;
    button.disabled = true;
    button.className = 'w-full h-8 inline-flex items-center justify-center gap-2 rounded border border-cyan-900/70 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 hover:text-cyan-100 transition text-xs font-semibold opacity-40 cursor-not-allowed';
    button.innerHTML = `<i data-lucide="copy" class="w-3.5 h-3.5"></i>Copiar estilo`;
    lucide.createIcons();
}

function copyStyle(source, target) {
    const commonStyleProps = [
        'y',
        'fontSize',
        'fontFamily',
        'opacity',
        'textAlign',
        'renderAsImage'
    ];

    commonStyleProps.forEach((prop) => {
        if (source[prop] !== undefined) target[prop] = source[prop];
    });

    if (supportsOptionalTitle(target.type)) {
        [
            'titleEnabled',
            'titleFontFamily',
            'titleFontSize',
            'titleColor'
        ].forEach((prop) => {
            if (source[prop] !== undefined) target[prop] = source[prop];
        });
    }

    if (isProgressWidget(target.type)) {
        ['progressThickness', 'progressBgColor'].forEach((prop) => {
            if (source[prop] !== undefined) target[prop] = source[prop];
        });
    }

    clampElementToCanvas(target);
}

function getCanvasWidth() {
    return watchConfig.width || 390;
}

function getCanvasHeight() {
    return watchConfig.height || 450;
}

function snapToGrid(value) {
    if (!showGuides) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function clampElementToCanvas(element) {
    if (!element) return;
    element.x = Math.max(0, Math.min(getCanvasWidth() - element.width, element.x || 0));
    element.y = Math.max(0, Math.min(getCanvasHeight() - element.height, element.y || 0));
}

function getSavedWatchModel() {
    try {
        const savedModel = localStorage.getItem(STORAGE_KEYS.watchModel);
        return watchModels[savedModel] ? savedModel : null;
    } catch (err) {
        return null;
    }
}

function saveWatchPreference(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (err) {}
}

function getNormalizedDesignConfig(config) {
    const savedWatchConfig = config && config.watchConfig ? config.watchConfig : {};
    const savedModelKey = watchModels[savedWatchConfig.model] ? savedWatchConfig.model : 'active3premium';
    const savedModel = watchModels[savedModelKey] || watchModels.active3premium;
    return {
        watchConfig: {
            ...watchConfig,
            ...savedWatchConfig,
            model: savedModelKey,
            modelName: savedWatchConfig.modelName || savedModel.name,
            width: savedWatchConfig.width || savedModel.width,
            height: savedWatchConfig.height || savedModel.height,
            shape: savedWatchConfig.shape || savedModel.shape || 'square'
        },
        elements: Array.isArray(config?.elements) ? config.elements.map(normalizeElement) : []
    };
}

function saveCurrentDesignNow() {
    if (!autosaveEnabled) return;
    try {
        localStorage.setItem(STORAGE_KEYS.autosavedDesign, JSON.stringify(getDesignConfig()));
    } catch (err) {
        console.warn('No se pudo guardar el diseño en localStorage.', err);
    }
}

function scheduleDesignAutosave() {
    if (!autosaveEnabled) return;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveCurrentDesignNow, 200);
}

function loadAutosavedDesign() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.autosavedDesign);
        if (!saved) return false;
        const parsed = JSON.parse(saved);
        if (!parsed || !parsed.watchConfig || !Array.isArray(parsed.elements)) return false;
        const normalized = getNormalizedDesignConfig(parsed);
        watchConfig = normalized.watchConfig;
        elements = normalized.elements;
        selectedElementId = null;
        resetStyleCopyMode();
        saveWatchPreference(STORAGE_KEYS.watchModel, watchConfig.model);
        saveWatchPreference(STORAGE_KEYS.watchShape, watchConfig.shape);
        return true;
    } catch (err) {
        console.warn('No se pudo cargar el diseño guardado.', err);
        return false;
    }
}

function applyBackgroundControlsFromConfig() {
    const bgColor = document.getElementById('bg-color');
    const bgColorHex = document.getElementById('bg-color-hex');
    const gradStart = document.getElementById('bg-grad-start');
    const gradEnd = document.getElementById('bg-grad-end');
    const gradAngle = document.getElementById('bg-grad-angle');

    if (bgColor) bgColor.value = watchConfig.bgColor || '#020617';
    if (bgColorHex) bgColorHex.value = watchConfig.bgColor || '#020617';
    if (gradStart) gradStart.value = watchConfig.bgGradStart || '#0d1527';
    if (gradEnd) gradEnd.value = watchConfig.bgGradEnd || '#020617';
    if (gradAngle) gradAngle.value = watchConfig.bgGradAngle || '135';
}

function applyWatchModelConfig(modelKey, options = {}) {
    const model = watchModels[modelKey] || watchModels.active3premium;
    const normalizedModelKey = watchModels[modelKey] ? modelKey : 'active3premium';

    watchConfig.model = normalizedModelKey;
    watchConfig.modelName = model.name;
    watchConfig.width = model.width;
    watchConfig.height = model.height;
    watchConfig.shape = options.keepShape ? (watchConfig.shape || model.shape || 'square') : (model.shape || 'square');

    if (options.persist) {
        saveWatchPreference(STORAGE_KEYS.watchModel, normalizedModelKey);
        saveWatchPreference(STORAGE_KEYS.watchShape, watchConfig.shape);
    }

    return model;
}

function restoreSavedWatchConfig() {
    const savedModel = getSavedWatchModel();
    if (savedModel) applyWatchModelConfig(savedModel);

    try {
        const savedShape = localStorage.getItem(STORAGE_KEYS.watchShape);
        if (savedShape === 'round' || savedShape === 'square') watchConfig.shape = savedShape;
    } catch (err) {}
}

function applyWatchShape() {
    const screen = document.getElementById('watch-screen');
    const innerFrame = document.getElementById('watch-inner-frame');
    const shell = document.getElementById('watch-shell');
    const safeCircle = document.getElementById('guide-safe-circle');
    const isRound = (watchConfig.shape || 'square') === 'round';

    if (screen) screen.style.borderRadius = isRound ? '50%' : '38px';
    if (innerFrame) innerFrame.style.borderRadius = isRound ? '50%' : '44px';
    if (shell) shell.style.borderRadius = isRound ? '50%' : '58px';
    if (safeCircle) safeCircle.classList.toggle('hidden', !isRound || !showGuides);
}

function updateWatchViewport() {
    const width = getCanvasWidth();
    const height = getCanvasHeight();
    SCALE = Math.min(312 / width, 360 / height);

    const screen = document.getElementById('watch-screen');
    if (screen) {
        screen.style.width = `${width * SCALE}px`;
        screen.style.height = `${height * SCALE}px`;
        screen.style.setProperty('--grid-small', `${GRID_SIZE * SCALE}px`);
        screen.style.setProperty('--grid-large', `${GRID_SIZE * 5 * SCALE}px`);
    }

    const label = document.getElementById('watch-resolution-label');
    if (label) label.innerText = `${width} x ${height} px`;

    const modelSelect = document.getElementById('watch-model');
    if (modelSelect && watchConfig.model) modelSelect.value = watchConfig.model;

    const shapeSelect = document.getElementById('watch-shape');
    if (shapeSelect) shapeSelect.value = watchConfig.shape || 'square';
    applyWatchShape();
}

function changeWatchModel(modelKey) {
    const model = applyWatchModelConfig(modelKey, { persist: true });
    updateWatchViewport();
    renderCanvas();
    scheduleDesignAutosave();
    showNotification(`${model.name}: ${model.width} x ${model.height}px`, 'success');
}

function changeWatchShape(shape) {
    watchConfig.shape = shape === 'round' ? 'round' : 'square';
    saveWatchPreference(STORAGE_KEYS.watchShape, watchConfig.shape);
    applyWatchShape();
    scheduleDesignAutosave();
    showNotification(watchConfig.shape === 'round' ? "Preview redondo activado" : "Preview cuadrado activado", "success");
}

function openInstallModal() {
    const modal = document.getElementById('install-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
}

function closeInstallModal() {
    const modal = document.getElementById('install-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function openCodeImportModal() {
    const modal = document.getElementById('code-import-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const textArea = document.getElementById('code-import-json-text');
    if (textArea) textArea.focus();
    lucide.createIcons();
}

function closeCodeImportModal() {
    const modal = document.getElementById('code-import-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    const textArea = document.getElementById('code-import-json-text');
    if (textArea) textArea.value = '';
    const fileInput = document.getElementById('code-import-json');
    if (fileInput) fileInput.value = '';
}

// --- PRESETS Y PLANTILLAS ---
const templates = {
    sport: [
        { id: 't1', type: 'time', x: 20, y: 55, width: 350, height: 95, color: '#06b6d4', fontSize: 80, fontFamily: 'font-teko', opacity: 1, text: '10:45', textAlign: 'center' },
        { id: 't2', type: 'date', x: 20, y: 145, width: 350, height: 25, color: '#ffffff', fontSize: 16, fontFamily: 'font-rajdhani', opacity: 0.8, text: 'MARTES, 30 JUNIO', textAlign: 'center' },

        // Barra de progreso de Batería (Widget Completo)
        { id: 't3', type: 'progress-bar', x: 35, y: 190, width: 320, height: 25, color: '#10b981', fontSize: 12, fontFamily: 'font-inter', opacity: 1, textAlign: 'left', progressType: 'battery', progressValue: 85, progressThickness: 6, progressBgColor: '#1e293b' },

        // Barra de progreso de Pasos (Widget Completo)
        { id: 't4', type: 'progress-bar', x: 35, y: 230, width: 320, height: 25, color: '#eab308', fontSize: 12, fontFamily: 'font-inter', opacity: 1, textAlign: 'left', progressType: 'steps', progressValue: 62, progressThickness: 6, progressBgColor: '#1e293b' },

        // Gráfico Sparkline de Ritmo Cardíaco
        { id: 't5', type: 'chart', x: 120, y: 280, width: 150, height: 40, color: '#ef4444', opacity: 1 },

        // Datos de Ritmo Cardíaco en texto debajo
        { id: 't6', type: 'heart', x: 20, y: 330, width: 350, height: 25, color: '#ef4444', fontSize: 18, fontFamily: 'font-chakra', opacity: 0.9, text: '124', textAlign: 'center' }
    ],
    minimal: [
        { id: 'm1', type: 'time', x: 20, y: 120, width: 350, height: 110, color: '#ffffff', fontSize: 95, fontFamily: 'font-montserrat', opacity: 1, text: '12:00', textAlign: 'center' },
        { id: 'm2', type: 'date', x: 20, y: 225, width: 350, height: 25, color: '#94a3b8', fontSize: 14, fontFamily: 'font-inter', opacity: 0.8, text: '30 JUNIO', textAlign: 'center' },
        { id: 'm3', type: 'progress-bar', x: 75, y: 275, width: 240, height: 10, color: '#a78bfa', opacity: 0.8, progressType: 'battery', progressValue: 70, progressThickness: 4, progressBgColor: '#1e293b' }
    ],
    classic: [
        { id: 'c1', type: 'image', x: 175, y: 45, width: 40, height: 40, text: '⭐', color: '#fbbf24', opacity: 1, imageSrc: null },
        { id: 'c2', type: 'time', x: 20, y: 110, width: 350, height: 80, color: '#e2e8f0', fontSize: 62, fontFamily: 'font-montserrat', opacity: 1, text: '10:08', textAlign: 'center' },
        { id: 'c3', type: 'date', x: 20, y: 195, width: 350, height: 25, color: '#94a3b8', fontSize: 14, fontFamily: 'font-montserrat', opacity: 0.9, text: 'Miércoles, 30 de Junio', textAlign: 'center' },
        { id: 'c4', type: 'steps', x: 20, y: 275, width: 350, height: 30, color: '#fbbf24', fontSize: 16, fontFamily: 'font-montserrat', opacity: 0.9, text: '7450', textAlign: 'center' }
    ]
};

// --- INICIALIZACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const hasAutosavedDesign = loadAutosavedDesign();
    if (!hasAutosavedDesign) restoreSavedWatchConfig();
    updateWatchViewport();
    if (hasAutosavedDesign) {
        applyBackgroundControlsFromConfig();
        changeBgType(watchConfig.bgType || 'gradient');
        renderCanvas();
        selectElement(null);
    } else {
        applyTemplate('sport'); // Carga deportiva por defecto
    }
    updateBgSettings();
    autosaveEnabled = true;
    saveCurrentDesignNow();

    const installModal = document.getElementById('install-modal');
    installModal.addEventListener('click', (event) => {
        if (event.target === installModal) closeInstallModal();
    });
    const codeImportModal = document.getElementById('code-import-modal');
    codeImportModal.addEventListener('click', (event) => {
        if (event.target === codeImportModal) closeCodeImportModal();
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            elements.forEach(normalizeElement);
            renderCanvas();
            if (selectedElementId) {
                const selected = elements.find(el => el.id === selectedElementId);
                if (selected) document.getElementById('prop-h').value = selected.height;
            }
        });
    }
});

window.addEventListener('beforeunload', () => {
    saveCurrentDesignNow();
});

window.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTypingField = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
    );

    if (event.key === 'Escape') {
        cancelStyleCopyMode();
        closeInstallModal();
        closeCodeImportModal();
        return;
    }

    const isDeleteKey = ['Delete', 'Backspace', 'Del', 'Supr'].includes(event.key) ||
        ['Delete', 'Backspace'].includes(event.code) ||
        event.keyCode === 46 ||
        event.keyCode === 8;
    if (!isTypingField && isDeleteKey) {
        if (!selectedElementId) return;
        event.preventDefault();
        deleteSelectedElement();
        return;
    }

    const arrowDeltas = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0]
    };
    if (!isTypingField && arrowDeltas[event.key]) {
        if (!selectedElementId) return;
        event.preventDefault();
        const step = event.shiftKey ? GRID_SIZE : 1;
        moveSelectedElementBy(arrowDeltas[event.key][0] * step, arrowDeltas[event.key][1] * step);
    }
});

// --- TOAST NOTIFICATIONS ---
function showNotification(text, type = 'info') {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    const toastIcon = document.getElementById('toast-icon');

    toastText.innerText = text;
    if (type === 'success') {
        toastIcon.innerHTML = `<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i>`;
    } else if (type === 'error') {
        toastIcon.innerHTML = `<i data-lucide="alert-triangle" class="w-5 h-5 text-rose-500"></i>`;
    } else {
        toastIcon.innerHTML = `<i data-lucide="info" class="w-5 h-5 text-cyan-400"></i>`;
    }
    lucide.createIcons();

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// --- CONTROLADORES DE ELEMENTOS / WIDGETS ---
function addElement(type) {
    const id = 'el_' + Date.now();
    let newElement = {
        id: id,
        type: type,
        x: 40,
        y: 100 + (elements.length * 30) % 220,
        width: 310,
        height: 50,
        color: '#ffffff',
        fontSize: 24,
        fontFamily: 'font-inter',
        opacity: 1,
        textAlign: 'center'
    };

    // Propiedades específicas por tipo de widget
    switch (type) {
        case 'time':
        case 'hour':
        case 'minute':
        case 'second':
        case 'date':
        case 'day':
        case 'month':
        case 'year':
        case 'weekday':
        case 'day-of-year':
        case 'week':
        case 'steps':
        case 'calories':
        case 'distance':
        case 'heart':
        case 'battery':
        case 'stress':
        case 'spo2':
        case 'weather':
        case 'temperature':
        case 'sunrise':
        case 'sunset':
        case 'bluetooth':
            applyMetricDefaults(newElement, type);
            break;
        case 'label':
            newElement.text = 'ACTIVE PREMIUM';
            newElement.fontSize = 14;
            newElement.color = '#94a3b8';
            break;
        case 'progress-bar':
            newElement.height = 30;
            newElement.progressType = 'battery';
            newElement.progressValue = 75;
            newElement.progressThickness = 6;
            newElement.progressBgColor = '#1e293b';
            newElement.color = '#10b981';
            break;
        case 'arc-progress':
            newElement.x = 135;
            newElement.y = 135;
            newElement.width = 170;
            newElement.height = 170;
            newElement.progressType = 'steps';
            newElement.progressValue = 62;
            newElement.progressThickness = 12;
            newElement.progressBgColor = '#1e293b';
            newElement.color = '#22c55e';
            newElement.fontSize = 18;
            break;
        case 'circle':
            newElement.x = 178;
            newElement.y = 178;
            newElement.width = 110;
            newElement.height = 110;
            newElement.color = '#0f766e';
            newElement.opacity = 0.45;
            break;
        case 'stroke-rect':
            newElement.x = 58;
            newElement.y = 310;
            newElement.width = 350;
            newElement.height = 72;
            newElement.color = '#8b5cf6';
            newElement.progressThickness = 3;
            break;
        case 'chart':
            newElement.width = 160;
            newElement.height = 40;
            newElement.color = '#ef4444';
            break;
        case 'image':
            newElement.width = 45;
            newElement.height = 45;
            newElement.text = '☀️'; // Emoji backup por si no hay imagen
            newElement.imageSrc = null; // Ruta o base64
            break;
    }

    normalizeElement(newElement);
    elements.push(newElement);
    renderCanvas();
    selectElement(id);
    showNotification(`Widget de ${type.toUpperCase()} añadido`, 'success');
}

function renderCanvas() {
    const container = document.getElementById('canvas-elements');
    container.innerHTML = '';

    elements.forEach(el => {
        normalizeElement(el);
        const div = document.createElement('div');
        div.id = el.id;
        const isSelected = selectedElementId === el.id;
        const isStyleTarget = styleCopyTargetId === el.id;
        const isStyleSourceCandidate = styleCopyTargetId && !isStyleTarget;
        const stateClass = isStyleTarget
            ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-black z-30'
            : isStyleSourceCandidate
                ? 'ring-1 ring-emerald-400/80 hover:ring-2 hover:ring-emerald-300 cursor-copy z-20'
                : isSelected
                    ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-black z-30'
                    : 'hover:ring-1 hover:ring-slate-700';
        div.className = `absolute ${styleCopyTargetId ? 'cursor-copy' : 'cursor-move'} select-none flex flex-col transition-all ${stateClass}`;

        // Conversión escala del plano nativo al simulador visual
        div.style.left = `${el.x * SCALE}px`;
        div.style.top = `${el.y * SCALE}px`;
        div.style.width = `${el.width * SCALE}px`;
        div.style.height = `${el.height * SCALE}px`;
        div.style.opacity = el.opacity;

        div.style.justifyContent = 'flex-start';
        div.style.alignItems = 'stretch';

        // --- RENDEREAR ELEMENTOS ESPECÍFICOS ---
        if (el.type === 'progress-bar') {
            // Barra de progreso interactiva autorellenable
            const val = el.progressValue || 0;
            const thick = el.progressThickness || 6;
            const bg = el.progressBgColor || '#1e293b';
            const activeColor = el.color || '#10b981';
            const typeLabel = getMetricLabel(el.progressType);

            div.innerHTML = `
                <div class="w-full flex flex-col gap-1 px-1">
                    ${el.titleEnabled ? `<div class="leading-none" style="font-family: ${getCssFontFamily(el.titleFontFamily || 'font-rajdhani')}; font-size: ${(el.titleFontSize || 10) * SCALE}px; color: ${el.titleColor || '#94a3b8'}; text-align: ${el.textAlign || 'center'};">${el.titleText || ''}</div>` : ''}
                    <div class="flex justify-between text-[8px] tracking-wide font-bold opacity-80" style="color: ${activeColor}">
                        <span>${typeLabel}</span>
                        <span>${val}%</span>
                    </div>
                    <div class="w-full rounded-full overflow-hidden" style="background-color: ${bg}; height: ${thick}px;">
                        <div class="h-full rounded-full" style="width: ${val}%; background-color: ${activeColor}"></div>
                    </div>
                </div>
            `;
        }
        else if (el.type === 'arc-progress') {
            const val = Math.max(0, Math.min(100, el.progressValue || 0));
            const thick = Math.max(2, (el.progressThickness || 10) * SCALE);
            const bg = el.progressBgColor || '#1e293b';
            const activeColor = el.color || '#22c55e';
            const size = Math.max(1, Math.min(el.width, el.height) * SCALE);
            const radius = Math.max(1, (size / 2) - (thick / 2) - 1);
            const circumference = 2 * Math.PI * radius;
            const dashOffset = circumference * (1 - (val / 100));
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.innerHTML = `
                <div class="relative flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
                    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="absolute inset-0">
                        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${bg}" stroke-width="${thick}" stroke-linecap="round" />
                        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${activeColor}" stroke-width="${thick}" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 ${size / 2} ${size / 2})" />
                    </svg>
                    <div class="leading-none text-center font-bold" style="font-family: ${getCssFontFamily(el.fontFamily || 'font-inter')}; font-size: ${(el.fontSize || 18) * SCALE}px; color: ${activeColor};">${val}%</div>
                </div>
            `;
        }
        else if (el.type === 'circle') {
            div.style.borderRadius = '9999px';
            div.style.backgroundColor = el.color || '#0f766e';
        }
        else if (el.type === 'stroke-rect') {
            const thick = Math.max(1, el.progressThickness || 3);
            div.style.border = `${thick * SCALE}px solid ${el.color || '#8b5cf6'}`;
            div.style.borderRadius = `${Math.min(18, Math.max(0, Math.min(el.width, el.height) * 0.16)) * SCALE}px`;
        }
        else if (el.type === 'chart') {
            // Gráfico de onda de electrocardiograma (SVG Sparkline)
            const strokeColor = el.color || '#ef4444';
            div.innerHTML = `
                <div class="w-full h-full flex flex-col justify-between">
                    ${el.titleEnabled ? `<div class="leading-none" style="font-family: ${getCssFontFamily(el.titleFontFamily || 'font-rajdhani')}; font-size: ${(el.titleFontSize || 10) * SCALE}px; color: ${el.titleColor || '#94a3b8'}; text-align: ${el.textAlign || 'center'};">${el.titleText || ''}</div>` : ''}
                    <svg class="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path d="M0,20 L15,20 L22,4 L30,36 L36,20 L48,20 L54,12 L60,28 L66,20 L100,20" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </div>
            `;
        }
        else if (el.type === 'image') {
            // Imagen cargada o preset emoji
            if (el.imageSrc) {
                div.innerHTML = `${el.titleEnabled ? `<div class="leading-none w-full" style="font-family: ${getCssFontFamily(el.titleFontFamily || 'font-rajdhani')}; font-size: ${(el.titleFontSize || 10) * SCALE}px; color: ${el.titleColor || '#94a3b8'}; text-align: ${el.textAlign || 'center'};">${el.titleText || ''}</div>` : ''}<img src="${el.imageSrc}" class="w-full h-full object-contain pointer-events-none">`;
            } else {
                // Emoji decorativo centrado
                div.innerHTML = `${el.titleEnabled ? `<div class="leading-none w-full" style="font-family: ${getCssFontFamily(el.titleFontFamily || 'font-rajdhani')}; font-size: ${(el.titleFontSize || 10) * SCALE}px; color: ${el.titleColor || '#94a3b8'}; text-align: ${el.textAlign || 'center'};">${el.titleText || ''}</div>` : ''}<span style="font-size: ${(el.height * SCALE) * 0.7}px">${el.text}</span>`;
            }
        }
        else {
            // Widget estándar de Texto (Hora, Fecha, Pasos, Latidos, Batería, Texto Libre)
            div.innerHTML = `${el.titleEnabled ? `<div class="leading-none w-full" style="font-family: ${getCssFontFamily(el.titleFontFamily || 'font-rajdhani')}; font-size: ${(el.titleFontSize || 10) * SCALE}px; color: ${el.titleColor || '#94a3b8'}; text-align: ${el.textAlign || 'center'};">${el.titleText || ''}</div>` : ''}<div class="leading-none w-full" style="font-family: ${getCssFontFamily(el.fontFamily || 'font-inter')}; font-size: ${(el.fontSize || 14) * SCALE}px; color: ${getElementDisplayColor(el)}; text-align: ${el.textAlign || 'center'};">${getElementDisplayText(el)}</div>`;
        }

        if (selectedElementId === el.id && !styleCopyTargetId) {
            const resizeHandle = document.createElement('button');
            resizeHandle.type = 'button';
            resizeHandle.className = 'element-resize-handle';
            resizeHandle.title = 'Redimensionar';
            resizeHandle.setAttribute('aria-label', 'Redimensionar elemento');
            resizeHandle.addEventListener('mousedown', (e) => startResize(e, el.id));
            resizeHandle.addEventListener('touchstart', (e) => startResize(e, el.id), { passive: false });
            div.appendChild(resizeHandle);
        }

        // Eventos de arrastre
        div.addEventListener('mousedown', (e) => startDrag(e, el.id));
        div.addEventListener('touchstart', (e) => startDrag(e, el.id), { passive: false });

        container.appendChild(div);
    });

    generateZeppCode();
    scheduleDesignAutosave();
}

// --- ARRASTRE DE ELEMENTOS (DRAG & DROP) ---
function startDrag(e, id) {
    if (isResizing) return;
    if (handleStyleCopyPick(e, id)) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(id);
    isDragging = true;

    const element = elements.find(el => el.id === id);
    const point = getCanvasPointerPoint(e);

    dragOffset.x = (point.x / SCALE) - element.x;
    dragOffset.y = (point.y / SCALE) - element.y;

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
}

function drag(e) {
    if (!isDragging || isResizing || !selectedElementId) return;
    if (e.type === 'touchmove') e.preventDefault(); // detiene scroll móvil

    const element = elements.find(el => el.id === selectedElementId);
    const point = getCanvasPointerPoint(e);

    let newX = snapToGrid(Math.round((point.x / SCALE) - dragOffset.x));
    let newY = snapToGrid(Math.round((point.y / SCALE) - dragOffset.y));

    // Límites nativos del modelo para que preview, PNG y simulador compartan coordenadas.
    newX = Math.max(0, Math.min(getCanvasWidth() - element.width, newX));
    newY = Math.max(0, Math.min(getCanvasHeight() - element.height, newY));

    element.x = newX;
    element.y = newY;

    // Actualiza inputs en tiempo real
    document.getElementById('prop-x').value = newX;
    document.getElementById('prop-y').value = newY;

    const div = document.getElementById(element.id);
    if (div) {
        div.style.left = `${newX * SCALE}px`;
        div.style.top = `${newY * SCALE}px`;
    }
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
    generateZeppCode();
    scheduleDesignAutosave();
}

function startResize(e, id) {
    if (handleStyleCopyPick(e, id)) return;
    e.preventDefault();
    e.stopPropagation();

    const element = elements.find(el => el.id === id);
    if (!element) return;

    selectedElementId = id;
    isDragging = false;
    isResizing = true;

    const point = getPointerPoint(e);
    resizeState = {
        startX: point.x,
        startY: point.y,
        width: element.width,
        height: element.height
    };

    document.addEventListener('mousemove', resizeElement);
    document.addEventListener('touchmove', resizeElement, { passive: false });
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchend', stopResize);
}

function getPointerPoint(e) {
    const source = e.type.startsWith('touch') ? e.touches[0] || e.changedTouches[0] : e;
    return {
        x: source.clientX,
        y: source.clientY
    };
}

function getCanvasPointerPoint(e) {
    const point = getPointerPoint(e);
    const screen = document.getElementById('watch-screen');
    if (!screen) return point;

    const rect = screen.getBoundingClientRect();
    return {
        x: point.x - rect.left,
        y: point.y - rect.top
    };
}

function resizeElement(e) {
    if (!isResizing || !selectedElementId) return;
    if (e.type === 'touchmove') e.preventDefault();

    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;

    const point = getPointerPoint(e);
    const deltaX = Math.round((point.x - resizeState.startX) / SCALE);
    const deltaY = Math.round((point.y - resizeState.startY) / SCALE);
    const minWidth = isProgressWidget(element.type) || element.type === 'chart' || element.type === 'stroke-rect' ? 32 : 18;
    const minHeight = isProgressWidget(element.type) ? 18 : 16;

    element.width = Math.max(minWidth, Math.min(getCanvasWidth() - element.x, snapToGrid(resizeState.width + deltaX)));
    if (hasAutoContentHeight(element)) {
        fitElementHeightToContent(element);
    } else {
        element.height = Math.max(minHeight, Math.min(getCanvasHeight() - element.y, snapToGrid(resizeState.height + deltaY)));
    }

    document.getElementById('prop-w').value = element.width;
    document.getElementById('prop-h').value = element.height;

    const div = document.getElementById(element.id);
    if (div) {
        div.style.width = `${element.width * SCALE}px`;
        div.style.height = `${element.height * SCALE}px`;
    }
}

function stopResize() {
    if (!isResizing) return;
    isResizing = false;

    document.removeEventListener('mousemove', resizeElement);
    document.removeEventListener('touchmove', resizeElement);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchend', stopResize);

    renderCanvas();
    generateZeppCode();
}

function moveSelectedElementBy(deltaX, deltaY) {
    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;

    element.x += deltaX;
    element.y += deltaY;
    clampElementToCanvas(element);

    const propX = document.getElementById('prop-x');
    const propY = document.getElementById('prop-y');
    if (propX) propX.value = element.x;
    if (propY) propY.value = element.y;

    renderCanvas();
    generateZeppCode();
    scheduleDesignAutosave();
}

function centerSelectedElement(axis) {
    if (!selectedElementId) return;
    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;

    if (axis === 'horizontal') {
        element.x = Math.round((getCanvasWidth() - element.width) / 2);
    } else if (axis === 'vertical') {
        element.y = Math.round((getCanvasHeight() - element.height) / 2);
    } else {
        element.x = Math.round((getCanvasWidth() - element.width) / 2);
        element.y = Math.round((getCanvasHeight() - element.height) / 2);
    }

    normalizeElement(element);
    renderCanvas();
    selectElement(element.id);
    showNotification(axis === 'vertical' ? "Elemento centrado verticalmente" : "Elemento centrado horizontalmente", "success");
}

// --- SELECCIÓN E INSPECTOR ---
function selectElement(id) {
    selectedElementId = id;
    const element = elements.find(el => el.id === id);
    if (element) normalizeElement(element);

    renderCanvas();

    if (!element) {
        document.getElementById('no-selection-msg').classList.remove('hidden');
        document.getElementById('inspector-form').classList.add('hidden');
        disableCopyStyleButton();
        return;
    }

    document.getElementById('no-selection-msg').classList.add('hidden');
    document.getElementById('inspector-form').classList.remove('hidden');

    // Cargar datos en el inspector
    clearStyleCopyModeIfNeeded();
    updateCopyStyleControls(element.id);
    document.getElementById('elem-badge').innerText = `Widget: ${element.type}`;
    document.getElementById('prop-x').value = element.x;
    document.getElementById('prop-y').value = element.y;
    document.getElementById('prop-w').value = element.width;
    document.getElementById('prop-h').value = element.height;
    document.getElementById('prop-h').disabled = hasAutoContentHeight(element);
    document.getElementById('prop-h').title = hasAutoContentHeight(element)
        ? 'El alto se ajusta automáticamente al contenido'
        : 'Alto del elemento';
    document.getElementById('prop-font').value = element.fontFamily || 'font-inter';
    document.getElementById('prop-size').value = element.fontSize || 14;
    document.getElementById('prop-size-slider').value = element.fontSize || 14;
    document.getElementById('prop-color').value = element.color;
    document.getElementById('prop-color-hex').value = element.color;
    document.getElementById('prop-opacity').value = element.opacity * 100;

    // Control de visibilidad según tipo de Widget
    const textContainer = document.getElementById('prop-text-container');
    const dateFormatContainer = document.getElementById('prop-date-format-container');
    const timeFormatContainer = document.getElementById('prop-time-format-container');
    const affixContainer = document.getElementById('prop-affix-container');
    const renderImageContainer = document.getElementById('prop-render-image-container');
    const fontContainer = document.getElementById('prop-font-container');
    const colorSizeContainer = document.getElementById('prop-color-size-container');
    const progressContainer = document.getElementById('prop-progress-container');
    const imageContainer = document.getElementById('prop-image-container');
    const titleContainer = document.getElementById('prop-title-container');
    const titleFields = document.getElementById('prop-title-fields');
    const statusContainer = document.getElementById('prop-status-container');

    // Default visible/hidden
    textContainer.classList.add('hidden');
    dateFormatContainer.classList.add('hidden');
    timeFormatContainer.classList.add('hidden');
    affixContainer.classList.add('hidden');
    renderImageContainer.classList.add('hidden');
    fontContainer.classList.remove('hidden');
    colorSizeContainer.classList.remove('hidden');
    progressContainer.classList.add('hidden');
    imageContainer.classList.add('hidden');
    titleContainer.classList.toggle('hidden', !supportsOptionalTitle(element.type));
    titleFields.classList.toggle('hidden', !element.titleEnabled);
    statusContainer.classList.add('hidden');

    document.getElementById('prop-title-enabled').checked = !!element.titleEnabled;
    document.getElementById('prop-title-text').value = element.titleText || '';
    document.getElementById('prop-title-font').value = element.titleFontFamily || 'font-rajdhani';
    document.getElementById('prop-title-size').value = element.titleFontSize || 10;
    document.getElementById('prop-title-size-slider').value = element.titleFontSize || 10;
    document.getElementById('prop-title-color').value = element.titleColor || '#94a3b8';
    document.getElementById('prop-title-color-hex').value = element.titleColor || '#94a3b8';

    if (element.type === 'label' || isDynamicMetricType(element.type)) {
        textContainer.classList.remove('hidden');
        document.getElementById('prop-text').value = element.text;
    }

    if (canRenderElementAsImage(element)) {
        renderImageContainer.classList.remove('hidden');
        document.getElementById('prop-render-image').checked = !!element.renderAsImage;
    }

    if (isDynamicMetricType(element.type)) {
        affixContainer.classList.remove('hidden');
        document.getElementById('prop-prefix').value = element.metricPrefix || '';
        document.getElementById('prop-suffix').value = element.metricSuffix || '';
    }

    if (isCalendarMetricType(element.type)) {
        dateFormatContainer.classList.remove('hidden');
        document.getElementById('prop-date-format').value = element.dateFormat || metricDefaults[element.type]?.dateFormat || 'weekday-day-month-short';
        document.getElementById('prop-text').value = getElementDisplayText(element);
    }

    if (element.type === 'time') {
        timeFormatContainer.classList.remove('hidden');
        document.getElementById('prop-time-format').value = element.timeFormat || 'hh-mm-24';
        document.getElementById('prop-text').value = getElementDisplayText(element);
    }

    if (['hour', 'minute', 'second'].includes(element.type)) {
        document.getElementById('prop-text').value = getElementDisplayText(element);
    }

    if (element.type === 'bluetooth') {
        statusContainer.classList.remove('hidden');
        document.getElementById('prop-status-ok-text').value = element.statusOkText || 'BT OK';
        document.getElementById('prop-status-ko-text').value = element.statusKoText || 'BT KO';
        document.getElementById('prop-status-ok-color').value = element.statusOkColor || '#60a5fa';
        document.getElementById('prop-status-ko-color').value = element.statusKoColor || '#f87171';
        document.getElementById('prop-status-preview').value = element.statusPreview || 'ok';
    }

    if (isProgressWidget(element.type)) {
        fontContainer.classList.add('hidden');
        progressContainer.classList.remove('hidden');

        document.getElementById('prop-progress-type').value = element.progressType || 'battery';
        document.getElementById('prop-progress-val').value = element.progressValue || 75;
        document.getElementById('prop-progress-thickness').value = element.progressThickness || 6;
        document.getElementById('prop-progress-bg').value = element.progressBgColor || '#1e293b';
    }

    if (isShapeWidget(element.type)) {
        textContainer.classList.add('hidden');
        fontContainer.classList.add('hidden');
        document.getElementById('prop-size').closest('div').parentElement.classList.add('hidden');
    }

    if (element.type === 'stroke-rect') {
        progressContainer.classList.remove('hidden');
        document.getElementById('prop-progress-type').closest('div').classList.add('hidden');
        document.getElementById('prop-progress-val').closest('div').classList.add('hidden');
        document.getElementById('prop-progress-thickness').value = element.progressThickness || 3;
        document.getElementById('prop-progress-bg').closest('div').classList.add('hidden');
    } else {
        document.getElementById('prop-progress-type').closest('div').classList.remove('hidden');
        document.getElementById('prop-progress-val').closest('div').classList.remove('hidden');
        document.getElementById('prop-progress-bg').closest('div').classList.remove('hidden');
    }

    if (element.type === 'chart') {
        textContainer.classList.add('hidden');
        fontContainer.classList.add('hidden');
        document.getElementById('prop-size').closest('div').parentElement.classList.add('hidden'); // Ocultar tamaño
    } else if (!isShapeWidget(element.type)) {
        document.getElementById('prop-size').closest('div').parentElement.classList.remove('hidden');
    }

    if (element.type === 'image') {
        imageContainer.classList.remove('hidden');
        fontContainer.classList.add('hidden');
        colorSizeContainer.classList.add('hidden');
    }

    updateAlignButtons(element.textAlign || 'center');
}

function updateElementProp(key, value) {
    if (!selectedElementId) return;
    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;

    element[key] = value;

    if (key === 'color') {
        document.getElementById('prop-color-hex').value = value;
        document.getElementById('prop-color').value = value;
    }

    if (key === 'fontSize') {
        document.getElementById('prop-size').value = value;
        document.getElementById('prop-size-slider').value = value;
    }

    if (key === 'dateFormat') {
        ensureDateDefaults(element);
        document.getElementById('prop-text').value = getElementDisplayText(element);
    }

    if (key === 'timeFormat') {
        ensureTimeDefaults(element);
        document.getElementById('prop-text').value = getElementDisplayText(element);
    }

    if (key === 'metricPrefix' || key === 'metricSuffix') {
        ensureMetricAffixDefaults(element);
        document.getElementById('prop-text').value = getElementDisplayText(element);
    }

    if (key === 'titleEnabled') {
        document.getElementById('prop-title-fields').classList.toggle('hidden', !value);
    }

    if (key === 'titleFontSize') {
        document.getElementById('prop-title-size').value = value;
        document.getElementById('prop-title-size-slider').value = value;
    }

    if (key === 'titleColor') {
        document.getElementById('prop-title-color-hex').value = value;
        document.getElementById('prop-title-color').value = value;
    }

    if (['statusOkText', 'statusKoText', 'statusOkColor', 'statusKoColor', 'statusPreview'].includes(key)) {
        ensureStatusDefaults(element);
        document.getElementById('prop-text').value = element.text;
        document.getElementById('prop-color').value = element.color;
        document.getElementById('prop-color-hex').value = element.color;
    }

    if (key === 'textAlign') {
        updateAlignButtons(value);
    }

    normalizeElement(element);
    document.getElementById('prop-h').value = element.height;
    renderCanvas();
}

function updateAlignButtons(alignment) {
    ['left', 'center', 'right'].forEach(align => {
        const btn = document.getElementById(`align-${align}`);
        if (align === alignment) {
            btn.className = 'py-1 text-xs rounded bg-indigo-600 text-white';
        } else {
            btn.className = 'py-1 text-xs rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800';
        }
    });
}

function deleteSelectedElement() {
    if (!selectedElementId) return;
    elements = elements.filter(el => el.id !== selectedElementId);
    selectedElementId = null;
    resetStyleCopyMode();
    renderCanvas();
    selectElement(null);
    showNotification("Widget eliminado", "info");
}

function clearCanvas() {
    elements = [];
    selectedElementId = null;
    resetStyleCopyMode();
    renderCanvas();
    selectElement(null);
    showNotification("Esfera completamente vaciada", "info");
}

// --- MANEJO DE IMÁGENES DENTRO DE WIDGETS ---
function selectPresetIcon(emoji) {
    if (!selectedElementId) return;
    const element = elements.find(el => el.id === selectedElementId);
    if (element && element.type === 'image') {
        element.imageSrc = null; // Quita personalizada
        element.text = emoji;
        renderCanvas();
        showNotification(`Preset de icono '${emoji}' aplicado`);
    }
}

function handleElementImageUpload(event) {
    const file = event.target.files[0];
    if (!file || !selectedElementId) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const element = elements.find(el => el.id === selectedElementId);
        if (element && element.type === 'image') {
            element.imageSrc = e.target.result;
            renderCanvas();
            showNotification("Imagen personalizada cargada con éxito", "success");
        }
    };
    reader.readAsDataURL(file);
}

// --- GESTIÓN DE FONDOS ---
function changeBgType(type) {
    watchConfig.bgType = type;

    ['color', 'gradient', 'image'].forEach(t => {
        const btn = document.getElementById(`bg-btn-${t}`);
        const configDiv = document.getElementById(`bg-config-${t}`);

        if (t === type) {
            btn.className = "py-1 text-xs font-medium rounded bg-indigo-600 text-white";
            configDiv.classList.remove('hidden');
        } else {
            btn.className = "py-1 text-xs font-medium rounded text-slate-400 hover:text-white hover:bg-slate-800";
            configDiv.classList.add('hidden');
        }
    });

    updateBgSettings();
}

function updateBgSettings() {
    const screen = document.getElementById('watch-screen');

    if (watchConfig.bgType === 'color') {
        const color = document.getElementById('bg-color').value;
        watchConfig.bgColor = color;
        document.getElementById('bg-color-hex').value = color;
        screen.style.background = color;
    } else if (watchConfig.bgType === 'gradient') {
        const start = document.getElementById('bg-grad-start').value;
        const end = document.getElementById('bg-grad-end').value;
        const angle = document.getElementById('bg-grad-angle').value;

        watchConfig.bgGradStart = start;
        watchConfig.bgGradEnd = end;
        watchConfig.bgGradAngle = angle;

        screen.style.background = `linear-gradient(${angle}deg, ${start}, ${end})`;
    } else if (watchConfig.bgType === 'image') {
        if (watchConfig.bgImage) {
            screen.style.background = `url('${watchConfig.bgImage}')`;
            screen.style.backgroundSize = 'cover';
            screen.style.backgroundPosition = 'center';
        } else {
            screen.style.background = '#020617';
        }
    }
    generateZeppCode();
    scheduleDesignAutosave();
}

function updateBgSettingsFromText(type) {
    if (type === 'color') {
        const hex = document.getElementById('bg-color-hex').value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            document.getElementById('bg-color').value = hex;
            updateBgSettings();
        }
    }
}

function handleBgImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        watchConfig.bgImage = e.target.result;
        updateBgSettings();
        showNotification("Fondo de pantalla aplicado", "success");
    };
    reader.readAsDataURL(file);
}

// --- GUÍAS DE ALINEACIÓN ---
function toggleGrid() {
    showGuides = !showGuides;
    document.querySelectorAll('.guide-layer').forEach(layer => {
        layer.classList.toggle('hidden', !showGuides);
    });
    applyWatchShape();
    showNotification(showGuides ? "Guías y ajuste a rejilla activados" : "Guías desactivadas");
}

// --- APLICACIÓN DE PLANTILLAS ---
function applyTemplate(key) {
    if (templates[key]) {
        elements = JSON.parse(JSON.stringify(templates[key])).map(normalizeElement);
        selectedElementId = null;
        resetStyleCopyMode();

        if (key === 'sport') {
            changeBgType('gradient');
            document.getElementById('bg-grad-start').value = '#0a1128';
            document.getElementById('bg-grad-end').value = '#020617';
            document.getElementById('bg-grad-angle').value = '135';
        } else if (key === 'minimal') {
            changeBgType('color');
            document.getElementById('bg-color').value = '#020205';
        } else if (key === 'classic') {
            changeBgType('gradient');
            document.getElementById('bg-grad-start').value = '#1e293b';
            document.getElementById('bg-grad-end').value = '#0f172a';
            document.getElementById('bg-grad-angle').value = '180';
        }

        updateBgSettings();
        renderCanvas();
        selectElement(null);
        showNotification(`Plantilla ${key.toUpperCase()} aplicada exitosamente`, "success");
    }
}

// --- EXPORTACIÓN E IMPORTACIÓN ---
function getDesignConfig() {
    return {
        app: "Amazfit Active Watchface Creator Premium",
        version: "2.0",
        watchConfig: watchConfig,
        elements: elements
    };
}

function downloadDesignJSON() {
    const designConfig = getDesignConfig();
    const blob = new Blob([JSON.stringify(designConfig, null, 2)], { type: 'application/json' });
    const downloadAnchor = document.createElement('a');
    const modelSlug = (watchConfig.modelName || 'amazfit-design')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.download = `${modelSlug || 'amazfit-design'}-${Date.now()}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    URL.revokeObjectURL(downloadAnchor.href);
    downloadAnchor.remove();
    showNotification("Código JSON descargado", "success");
}

function getSafeProjectName() {
    const baseName = (watchConfig.modelName || 'amazfit-watchface')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `${baseName || 'amazfit-watchface'}-${Date.now()}`;
}

function createZeusAppJson(projectName) {
    const appName = (watchConfig.modelName || 'Amazfit Editor').slice(0, 32);
    const model = watchModels[watchConfig.model] || watchModels.active3premium;
    const platforms = model.zeusPlatforms || legacyZeusPlatforms;

    return {
        configVersion: "v2",
        app: {
            appId: 100000 + (Date.now() % 900000),
            appName: appName,
            appType: "watchface",
            version: {
                code: 1,
                name: "1.0"
            },
            icon: "icon.png",
            vender: "zepp",
            description: `Generated by Amazfit Editor for ${watchConfig.modelName || 'Amazfit'}`
        },
        permissions: [],
        runtime: {
            apiVersion: {
                compatible: "1.0.0",
                target: "1.0.1",
                minVersion: "1.0.0"
            }
        },
        targets: {
            default: {
                module: {
                    watchface: {
                        path: "watchface/index",
                        main: 1,
                        editable: 0,
                        lockscreen: 1
                    }
                },
                platforms: platforms,
                designWidth: getCanvasWidth()
            }
        },
        i18n: {
            "en-US": {
                appName: appName
            }
        },
        defaultLanguage: "en-US",
        debug: false
    };
}

function createZeusAppJs() {
    return `App({
  globalData: {},
  onCreate(options) {
    console.log('amazfit-editor watchface created')
  },

  onDestroy(options) {
    console.log('amazfit-editor watchface destroyed')
  }
})
`;
}

function createProjectReadme(projectName) {
    return `# ${projectName}

Proyecto Zepp OS generado desde Amazfit Editor.

## Compilar

\`\`\`bash
zeus build -t default
\`\`\`

El archivo instalable .zab se generará dentro de \`dist/\`.

## Archivos principales

- \`app.json\`: configuración del proyecto Zepp OS.
- \`app.js\`: entrada global requerida por Zeus.
- \`watchface/index.js\`: código de la esfera generado por el editor.
- \`assets/default/icon.png\`: icono mínimo del proyecto.
- \`assets/default/text_*.png\`: textos rasterizados opcionales para respetar fuentes en Zepp OS Simulator.
- \`amazfit-editor-design.json\`: copia del diseño para reimportarlo en el editor.

Nota: Zepp OS Simulator no carga fuentes web en widgets TEXT nativos. Los widgets marcados como "Texto como imagen" conservan la fuente visual, pero su texto queda estático.
`;
}

function createIconDataUrl() {
    const canvas = document.createElement('canvas');
    canvas.width = 324;
    canvas.height = 324;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 324, 324);
    gradient.addColorStop(0, '#06b6d4');
    gradient.addColorStop(1, '#4f46e5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 324, 324);

    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(54, 34, 216, 256, 46);
    ctx.fill();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 54px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ZEPP', 162, 162);

    return canvas.toDataURL('image/png');
}

function dataUrlToUint8Array(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function createElementImageDataUrl(el) {
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    normalizeElement(el);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(el.width));
    canvas.height = Math.max(1, Math.round(el.height));
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = el.opacity ?? 1;

    const align = el.textAlign || 'center';
    const xPos = align === 'left' ? 0 : align === 'right' ? canvas.width : canvas.width / 2;
    ctx.textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
    ctx.textBaseline = 'top';

    let y = 0;
    if (el.titleEnabled) {
        ctx.fillStyle = el.titleColor || '#94a3b8';
        ctx.font = getCanvasFont(el.titleFontFamily || 'font-rajdhani', el.titleFontSize || 10, 'bold');
        ctx.fillText(el.titleText || '', xPos, y);
        y += getTitleContentHeight(el);
    }

    ctx.fillStyle = getElementDisplayColor(el);
    const fontWeight = ['font-bebas', 'font-orbitron', 'font-chakra', 'font-montserrat', 'font-rajdhani'].includes(el.fontFamily) ? 'bold' : '';
    ctx.font = getCanvasFont(el.fontFamily || 'font-inter', el.fontSize || 14, fontWeight);
    ctx.fillText(getElementDisplayText(el), xPos, y);

    return canvas.toDataURL('image/png');
}

async function addElementImageAssets(root) {
    const imageElements = elements
        .map((el, idx) => ({ el, idx }))
        .filter(({ el }) => shouldRenderAsZeppImage(el));

    for (const { el, idx } of imageElements) {
        const dataUrl = await createElementImageDataUrl(el);
        root.file(`assets/default/text_${idx}.png`, dataUrlToUint8Array(dataUrl));
    }
}

function loadBinaryAsset(url) {
    return fetch(url).then((response) => {
        if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
        return response.arrayBuffer();
    }).catch(() => new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = () => {
            if (request.status === 0 || (request.status >= 200 && request.status < 300)) {
                resolve(request.response);
                return;
            }
            reject(new Error(`No se pudo cargar ${url}`));
        };
        request.onerror = () => reject(new Error(`No se pudo cargar ${url}`));
        request.send();
    }));
}

async function addZeppFontAssets(root) {
    const usedFontFiles = new Set();

    elements.forEach((el) => {
        normalizeElement(el);
        const fullImageFallback = shouldRenderAsZeppImage(el);
        if (el.titleEnabled && !fullImageFallback) usedFontFiles.add(getZeppFontFile(el.titleFontFamily || 'font-rajdhani'));
        if (isProgressWidget(el.type)) usedFontFiles.add(getZeppFontFile(el.fontFamily || 'font-inter'));
        if (canRenderElementAsImage(el) && !fullImageFallback) {
            usedFontFiles.add(getZeppFontFile(el.fontFamily || 'font-inter'));
        }
    });

    for (const fontFile of usedFontFiles) {
        if (!fontFile) continue;
        const fontBytes = await loadBinaryAsset(`assets/fonts/${fontFile}`);
        root.file(`assets/default/raw/${fontFile}`, fontBytes);
    }
}

async function exportJSON() {
    if (!window.JSZip) {
        showNotification("No se pudo cargar JSZip para crear el ZIP.", "error");
        return;
    }

    showNotification("Preparando proyecto Zeus...");
    generateZeppCode();

    const projectName = getSafeProjectName();
    const zip = new JSZip();
    const root = zip.folder(projectName);
    const appJson = createZeusAppJson(projectName);
    const watchfaceCode = document.getElementById('zepp-code-box').innerText;
    const designConfig = getDesignConfig();

    root.file('app.json', JSON.stringify(appJson, null, 2));
    root.file('app.js', createZeusAppJs());
    root.file('watchface/index.js', watchfaceCode);
    root.file('amazfit-editor-design.json', JSON.stringify(designConfig, null, 2));
    root.file('README.md', createProjectReadme(projectName));
    root.file('assets/default/icon.png', dataUrlToUint8Array(createIconDataUrl()));
    await addZeppFontAssets(root);
    await addElementImageAssets(root);

    const blob = await zip.generateAsync({ type: 'blob' });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.download = `${projectName}.zip`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    URL.revokeObjectURL(downloadAnchor.href);
    downloadAnchor.remove();

    showNotification("Proyecto Zeus ZIP exportado", "success");
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!loadDesignConfig(parsed)) {
                showNotification("Formato JSON incompatible.", "error");
            }
        } catch (err) {
            showNotification("Error procesando archivo.", "error");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function handleCodeImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (loadDesignConfig(parsed)) {
                closeCodeImportModal();
            } else {
                showNotification("Formato JSON incompatible.", "error");
            }
        } catch (err) {
            showNotification("Error procesando archivo.", "error");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function importPastedDesignJSON() {
    const textArea = document.getElementById('code-import-json-text');
    const rawJson = textArea ? textArea.value.trim() : '';
    if (!rawJson) {
        showNotification("Pega un JSON antes de importarlo.", "error");
        return;
    }

    try {
        const parsed = JSON.parse(rawJson);
        if (loadDesignConfig(parsed)) {
            closeCodeImportModal();
        } else {
            showNotification("Formato JSON incompatible.", "error");
        }
    } catch (err) {
        showNotification("JSON no válido.", "error");
    }
}

function loadDesignConfig(parsed) {
    if (!parsed || !parsed.watchConfig || !Array.isArray(parsed.elements)) return false;

    watchConfig = {
        ...watchConfig,
        ...parsed.watchConfig
    };
    if (!watchConfig.modelName) watchConfig.modelName = watchModels[watchConfig.model]?.name || 'Personalizado';
    if (!watchConfig.width) watchConfig.width = watchModels[watchConfig.model]?.width || 390;
    if (!watchConfig.height) watchConfig.height = watchModels[watchConfig.model]?.height || 450;
    if (!watchConfig.shape) watchConfig.shape = watchModels[watchConfig.model]?.shape || 'square';
    if (watchModels[watchConfig.model]) {
        saveWatchPreference(STORAGE_KEYS.watchModel, watchConfig.model);
        saveWatchPreference(STORAGE_KEYS.watchShape, watchConfig.shape);
    }
    elements = parsed.elements.map(normalizeElement);
    selectedElementId = null;
    resetStyleCopyMode();
    updateWatchViewport();
    applyBackgroundControlsFromConfig();
    changeBgType(watchConfig.bgType || 'gradient');
    updateBgSettings();
    renderCanvas();
    selectElement(null);
    saveCurrentDesignNow();
    showNotification("Diseño JSON cargado con éxito", "success");
    return true;
}

// --- RENDERIZADOR A IMAGEN REAL ---
async function exportAsImage() {
    showNotification("Dibujando y optimizando imagen...");
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    const canvasWidth = getCanvasWidth();
    const canvasHeight = getCanvasHeight();
    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.width = canvasWidth;
    virtualCanvas.height = canvasHeight;
    const ctx = virtualCanvas.getContext('2d');

    // 1. Dibujar Fondo
    if (watchConfig.bgType === 'color') {
        ctx.fillStyle = watchConfig.bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        drawElementsAndDownload();
    } else if (watchConfig.bgType === 'gradient') {
        const angleRad = (watchConfig.bgGradAngle * Math.PI) / 180;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radiusX = canvasWidth / 2;
        const radiusY = canvasHeight / 2;
        const x1 = centerX - Math.cos(angleRad) * radiusX;
        const y1 = centerY - Math.sin(angleRad) * radiusY;
        const x2 = centerX + Math.cos(angleRad) * radiusX;
        const y2 = centerY + Math.sin(angleRad) * radiusY;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, watchConfig.bgGradStart);
        grad.addColorStop(1, watchConfig.bgGradEnd);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        drawElementsAndDownload();
    } else if (watchConfig.bgType === 'image' && watchConfig.bgImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            drawElementsAndDownload();
        };
        img.src = watchConfig.bgImage;
    } else {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        drawElementsAndDownload();
    }

    function drawElementsAndDownload() {
        elements.forEach(el => {
            normalizeElement(el);
            ctx.save();
            ctx.globalAlpha = el.opacity;
            const titleOffset = getTitleContentHeight(el);
            const contentY = el.y + titleOffset;
            const drawTitle = () => {
                if (!el.titleEnabled) return;
                ctx.fillStyle = el.titleColor || '#94a3b8';
                ctx.font = getCanvasFont(el.titleFontFamily || 'font-rajdhani', el.titleFontSize || 10, 'bold');
                ctx.textBaseline = 'top';
                if (el.textAlign === 'center') {
                    ctx.textAlign = 'center';
                    ctx.fillText(el.titleText || '', el.x + (el.width / 2), el.y);
                } else if (el.textAlign === 'right') {
                    ctx.textAlign = 'right';
                    ctx.fillText(el.titleText || '', el.x + el.width, el.y);
                } else {
                    ctx.textAlign = 'left';
                    ctx.fillText(el.titleText || '', el.x, el.y);
                }
            };
            drawTitle();

            if (el.type === 'progress-bar') {
                // Dibujar barra de progreso analógica en la imagen exportada
                const val = el.progressValue || 75;
                const thick = el.progressThickness || 6;
                const barBg = el.progressBgColor || '#1e293b';
                const barFill = el.color || '#10b981';

                // Fondo de la barra
                ctx.fillStyle = barBg;
                ctx.beginPath();
                ctx.roundRect(el.x, contentY + 12, el.width, thick, thick / 2);
                ctx.fill();

                // Relleno activo
                ctx.fillStyle = barFill;
                ctx.beginPath();
                ctx.roundRect(el.x, contentY + 12, el.width * (val / 100), thick, thick / 2);
                ctx.fill();

                // Etiqueta
                ctx.fillStyle = barFill;
                ctx.font = "bold 10px sans-serif";
                ctx.fillText(`${el.progressType.toUpperCase()}: ${val}%`, el.x, contentY + 8);

            } else if (el.type === 'arc-progress') {
                const val = Math.max(0, Math.min(100, el.progressValue || 0));
                const thick = el.progressThickness || 10;
                const centerX = el.x + (el.width / 2);
                const centerY = contentY + ((el.height - titleOffset) / 2);
                const radius = Math.max(1, (Math.min(el.width, el.height - titleOffset) / 2) - (thick / 2) - 1);
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + ((Math.PI * 2) * (val / 100));

                ctx.lineWidth = thick;
                ctx.lineCap = 'round';
                ctx.strokeStyle = el.progressBgColor || '#1e293b';
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = el.color || '#22c55e';
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.stroke();

                ctx.fillStyle = el.color || '#22c55e';
                ctx.font = getCanvasFont(el.fontFamily || 'font-inter', el.fontSize || 18, 'bold');
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillText(`${val}%`, centerX, centerY);

            } else if (el.type === 'circle') {
                ctx.fillStyle = el.color || '#0f766e';
                ctx.beginPath();
                ctx.arc(el.x + (el.width / 2), contentY + ((el.height - titleOffset) / 2), Math.max(1, Math.min(el.width, el.height - titleOffset) / 2), 0, Math.PI * 2);
                ctx.fill();

            } else if (el.type === 'stroke-rect') {
                ctx.strokeStyle = el.color || '#8b5cf6';
                ctx.lineWidth = el.progressThickness || 3;
                ctx.beginPath();
                ctx.roundRect(el.x, contentY, el.width, Math.max(1, el.height - titleOffset), Math.min(18, Math.max(0, Math.min(el.width, el.height - titleOffset) * 0.16)));
                ctx.stroke();

            } else if (el.type === 'chart') {
                // Dibujar onda ECG en la imagen
                ctx.strokeStyle = el.color || '#ef4444';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();

                const startX = el.x;
                const startY = contentY + ((el.height - titleOffset) / 2);
                const w = el.width;
                const h = Math.max(1, el.height - titleOffset);

                ctx.moveTo(startX, startY);
                ctx.lineTo(startX + (w * 0.15), startY);
                ctx.lineTo(startX + (w * 0.22), contentY + (h * 0.1));
                ctx.lineTo(startX + (w * 0.30), contentY + (h * 0.9));
                ctx.lineTo(startX + (w * 0.36), startY);
                ctx.lineTo(startX + (w * 0.48), startY);
                ctx.lineTo(startX + (w * 0.54), contentY + (h * 0.3));
                ctx.lineTo(startX + (w * 0.60), contentY + (h * 0.7));
                ctx.lineTo(startX + (w * 0.66), startY);
                ctx.lineTo(startX + w, startY);
                ctx.stroke();

            } else if (el.type === 'image') {
                // Dibujar preset de emoji o imagen personalizada
                if (el.imageSrc) {
                    const img = new Image();
                    img.src = el.imageSrc;
                    ctx.drawImage(img, el.x, contentY, el.width, Math.max(1, el.height - titleOffset));
                } else {
                    ctx.fillStyle = el.color || '#fff';
                    ctx.font = `${Math.max(1, el.height - titleOffset) * 0.8}px sans-serif`;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'center';
                    ctx.fillText(el.text, el.x + (el.width / 2), contentY + ((el.height - titleOffset) / 2));
                }
            } else {
                // Dibujar texto normal
                ctx.fillStyle = getElementDisplayColor(el);
                const fontWeight = ['font-bebas', 'font-orbitron', 'font-chakra', 'font-montserrat', 'font-rajdhani'].includes(el.fontFamily) ? 'bold' : '';
                ctx.font = getCanvasFont(el.fontFamily || 'font-inter', el.fontSize || 14, fontWeight);
                ctx.textBaseline = 'top';

                let xPos = el.x;
                if (el.textAlign === 'center') {
                    ctx.textAlign = 'center';
                    xPos = el.x + (el.width / 2);
                } else if (el.textAlign === 'right') {
                    ctx.textAlign = 'right';
                    xPos = el.x + el.width;
                } else {
                    ctx.textAlign = 'left';
                }
                ctx.fillText(getElementDisplayText(el), xPos, contentY);
            }
            ctx.restore();
        });

        // Descarga automática
        const link = document.createElement('a');
        link.download = `amazfit_active_face_${Date.now()}.png`;
        link.href = virtualCanvas.toDataURL('image/png');
        link.click();
        link.remove();
        showNotification("Esfera PNG exportada exitosamente", "success");
    }
}

// --- COPIADO AL PORTAPAPELES ---
function copyCode() {
    const codeBox = document.getElementById('zepp-code-box');
    const code = codeBox.innerText;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code)
            .then(() => showNotification("Código copiado al portapapeles", "success"))
            .catch(() => fallbackCopyCode(code));
        return;
    }

    fallbackCopyCode(code);
}

function fallbackCopyCode(code) {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showNotification("Código copiado al portapapeles", "success");
    } catch (err) {
        showNotification("No se pudo copiar automáticamente.", "error");
    }
    document.body.removeChild(textArea);
}

function escapeGeneratedText(text) {
    return String(text || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function wrapGeneratedMetricText(el, expression) {
    const prefix = escapeGeneratedText(el.metricPrefix || '');
    const suffix = escapeGeneratedText(el.metricSuffix || '');
    if (!prefix && !suffix) return expression;
    return `'${prefix}' + ${expression} + '${suffix}'`;
}

function getGeneratedTextExpression(el) {
    if (el.type === 'time') {
        return wrapGeneratedMetricText(el, `getMetricText('time', '${escapeGeneratedText(getElementDisplayText(el))}', { timeFormat: '${escapeGeneratedText(el.timeFormat || 'hh-mm-24')}' })`);
    }
    if (el.type === 'bluetooth') {
        return wrapGeneratedMetricText(el, `getMetricText('bluetooth', '${escapeGeneratedText(getElementDisplayText(el))}', { okText: '${escapeGeneratedText(el.statusOkText || 'BT OK')}', koText: '${escapeGeneratedText(el.statusKoText || 'BT KO')}' })`);
    }
    if (isCalendarMetricType(el.type)) {
        return wrapGeneratedMetricText(el, `getMetricText('${el.type}', '${escapeGeneratedText(getElementDisplayText(el))}', { dateFormat: '${escapeGeneratedText(el.dateFormat || metricDefaults[el.type]?.dateFormat || 'weekday-day-month-short')}' })`);
    }
    if (isDynamicMetricType(el.type)) return wrapGeneratedMetricText(el, `getMetricText('${el.type}', '${escapeGeneratedText(el.text)}')`);
    return `'${escapeGeneratedText(el.text)}'`;
}

function getDynamicMetricType(el) {
    if (isDynamicMetricType(el.type)) {
        return el.type;
    }
    return null;
}

function elementNeedsSecondRefresh(el) {
    if (!el) return false;
    if (el.type === 'second') return true;
    if (el.type === 'time') {
        return ['hh-mm-ss-24', 'hh-mm-ss-12', 'second-only'].includes(el.timeFormat);
    }
    return false;
}

// --- GENERADOR DE CÓDIGO ZEPP OS SDK COMPATIBLE ---
function generateZeppCode() {
    const codeBox = document.getElementById('zepp-code-box');
    const refreshInterval = elements.some(elementNeedsSecondRefresh) ? 1000 : 30000;

    let jsCode = `/**\n * Esfera auto-generada para ${watchConfig.modelName || 'Amazfit'}\n * Resolución: ${getCanvasWidth()} x ${getCanvasHeight()} px\n * Zepp OS SDK compatible sin imports ESM\n */\n\n`;
    jsCode += `function createWidget(type, options) {\n`;
    jsCode += `  return hmUI.createWidget(type, options)\n`;
    jsCode += `}\n`;
    jsCode += `const widget = hmUI.widget\n`;
    jsCode += `const align = hmUI.align\n`;
    jsCode += `const prop = hmUI.prop\n\n`;
    jsCode += `let refreshTimer = null\n`;
    jsCode += `const metricSensors = {}\n`;
    jsCode += `const dynamicTexts = []\n`;
    jsCode += `const dynamicBars = []\n\n`;
    jsCode += `const dynamicArcs = []\n\n`;
    jsCode += `const sensorAliases = {\n`;
    jsCode += `  battery: ['BATTERY'],\n`;
    jsCode += `  steps: ['STEP'],\n`;
    jsCode += `  heart: ['HEART'],\n`;
    jsCode += `  calories: ['CALORIE'],\n`;
    jsCode += `  distance: ['DISTANCE'],\n`;
    jsCode += `  sleep: ['SLEEP'],\n`;
    jsCode += `  stress: ['STRESS'],\n`;
    jsCode += `  spo2: ['SPO2', 'BLOOD_OXYGEN'],\n`;
    jsCode += `  pai: ['PAI'],\n`;
    jsCode += `  weather: ['WEATHER'],\n`;
    jsCode += `  altitude: ['ALTITUDE'],\n`;
    jsCode += `  pressure: ['PRESSURE', 'BAROMETER'],\n`;
    jsCode += `  alarm: ['ALARM'],\n`;
    jsCode += `  bluetooth: ['BLE', 'BLUETOOTH']\n`;
    jsCode += `}\n\n`;
    jsCode += `function createSafeSensorByType(type) {\n`;
    jsCode += `  if (typeof hmSensor === 'undefined' || !hmSensor.id || typeof hmSensor.createSensor !== 'function') return null\n`;
    jsCode += `  const aliases = sensorAliases[type] || []\n`;
    jsCode += `  for (let i = 0; i < aliases.length; i += 1) {\n`;
    jsCode += `    const sensorId = hmSensor.id[aliases[i]]\n`;
    jsCode += `    if (sensorId !== undefined) {\n`;
    jsCode += `      try {\n`;
    jsCode += `        return hmSensor.createSensor(sensorId)\n`;
    jsCode += `      } catch (err) {}\n`;
    jsCode += `    }\n`;
    jsCode += `  }\n`;
    jsCode += `  return null\n`;
    jsCode += `}\n\n`;
    jsCode += `function startRefreshTimer() {\n`;
    jsCode += `  if (typeof timer !== 'undefined' && typeof timer.createTimer === 'function') {\n`;
    jsCode += `    return timer.createTimer(1, ${refreshInterval}, updateDynamicWidgets, {})\n`;
    jsCode += `  }\n`;
    jsCode += `  return null\n`;
    jsCode += `}\n\n`;
    jsCode += `function stopRefreshTimer(timerRef) {\n`;
    jsCode += `  if (timerRef && typeof timer !== 'undefined' && typeof timer.stopTimer === 'function') {\n`;
    jsCode += `    timer.stopTimer(timerRef)\n`;
    jsCode += `  }\n`;
    jsCode += `}\n\n`;
    jsCode += `function readNumber(source, methods, props, fallback) {\n`;
    jsCode += `  if (!source) return fallback\n`;
    jsCode += `  for (let i = 0; i < methods.length; i += 1) {\n`;
    jsCode += `    const method = methods[i]\n`;
    jsCode += `    if (typeof source[method] === 'function') {\n`;
    jsCode += `      const value = source[method]()\n`;
    jsCode += `      if (typeof value === 'number' && value === value) return value\n`;
    jsCode += `      if (value && typeof value.current === 'number') return value.current\n`;
    jsCode += `    }\n`;
    jsCode += `  }\n`;
    jsCode += `  for (let i = 0; i < props.length; i += 1) {\n`;
    jsCode += `    const value = source[props[i]]\n`;
    jsCode += `    if (typeof value === 'number' && value === value) return value\n`;
    jsCode += `  }\n`;
    jsCode += `  return fallback\n`;
    jsCode += `}\n\n`;
    jsCode += `function readString(source, methods, props, fallback) {\n`;
    jsCode += `  if (!source) return fallback\n`;
    jsCode += `  for (let i = 0; i < methods.length; i += 1) {\n`;
    jsCode += `    const method = methods[i]\n`;
    jsCode += `    if (typeof source[method] === 'function') {\n`;
    jsCode += `      const value = source[method]()\n`;
    jsCode += `      if (typeof value === 'string' && value) return value\n`;
    jsCode += `      if (value && typeof value.text === 'string') return value.text\n`;
    jsCode += `      if (value && typeof value.name === 'string') return value.name\n`;
    jsCode += `    }\n`;
    jsCode += `  }\n`;
    jsCode += `  for (let i = 0; i < props.length; i += 1) {\n`;
    jsCode += `    const value = source[props[i]]\n`;
    jsCode += `    if (typeof value === 'string' && value) return value\n`;
    jsCode += `  }\n`;
    jsCode += `  return fallback\n`;
    jsCode += `}\n\n`;
    jsCode += `function clamp(value, min, max) {\n`;
    jsCode += `  return Math.max(min, Math.min(max, value))\n`;
    jsCode += `}\n\n`;
    jsCode += `function pad2(value) {\n`;
    jsCode += `  return value < 10 ? '0' + value : String(value)\n`;
    jsCode += `}\n\n`;
    jsCode += `function formatDateText(format, date) {\n`;
    jsCode += `  const weekdaysShort = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']\n`;
    jsCode += `  const weekdaysLong = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']\n`;
    jsCode += `  const monthsShort = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']\n`;
    jsCode += `  const monthsLong = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']\n`;
    jsCode += `  const startOfYear = new Date(date.getFullYear(), 0, 1)\n`;
    jsCode += `  const dayOfYear = Math.floor((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - startOfYear) / 86400000) + 1\n`;
    jsCode += `  const isoDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))\n`;
    jsCode += `  const isoDay = isoDate.getUTCDay() || 7\n`;
    jsCode += `  isoDate.setUTCDate(isoDate.getUTCDate() + 4 - isoDay)\n`;
    jsCode += `  const isoYearStart = new Date(Date.UTC(isoDate.getUTCFullYear(), 0, 1))\n`;
    jsCode += `  const isoWeek = Math.ceil((((isoDate - isoYearStart) / 86400000) + 1) / 7)\n`;
    jsCode += `  const day = pad2(date.getDate())\n`;
    jsCode += `  const month = pad2(date.getMonth() + 1)\n`;
    jsCode += `  const year = String(date.getFullYear())\n`;
    jsCode += `  const weekdayShort = weekdaysShort[date.getDay()]\n`;
    jsCode += `  const weekdayLong = weekdaysLong[date.getDay()]\n`;
    jsCode += `  const monthShort = monthsShort[date.getMonth()]\n`;
    jsCode += `  const monthLong = monthsLong[date.getMonth()]\n`;
    jsCode += `  if (format === 'weekday-day-month-long') return weekdayLong + ', ' + day + ' ' + monthLong\n`;
    jsCode += `  if (format === 'day-month-short') return day + ' ' + monthShort\n`;
    jsCode += `  if (format === 'day-month-long') return day + ' ' + monthLong\n`;
    jsCode += `  if (format === 'day-month-numeric') return day + '/' + month\n`;
    jsCode += `  if (format === 'day-month-year-numeric') return day + '/' + month + '/' + year\n`;
    jsCode += `  if (format === 'iso') return year + '-' + month + '-' + day\n`;
    jsCode += `  if (format === 'month-day') return monthShort + ' ' + day\n`;
    jsCode += `  if (format === 'day-padded') return day\n`;
    jsCode += `  if (format === 'day-number') return String(date.getDate())\n`;
    jsCode += `  if (format === 'month-number-padded') return month\n`;
    jsCode += `  if (format === 'month-number') return String(date.getMonth() + 1)\n`;
    jsCode += `  if (format === 'month-short') return monthShort\n`;
    jsCode += `  if (format === 'month-long') return monthLong\n`;
    jsCode += `  if (format === 'year-full') return year\n`;
    jsCode += `  if (format === 'year-short') return year.slice(-2)\n`;
    jsCode += `  if (format === 'weekday-short') return weekdayShort\n`;
    jsCode += `  if (format === 'weekday-long') return weekdayLong\n`;
    jsCode += `  if (format === 'day-of-year') return String(dayOfYear)\n`;
    jsCode += `  if (format === 'day-of-year-padded') return dayOfYear < 10 ? '00' + dayOfYear : (dayOfYear < 100 ? '0' + dayOfYear : String(dayOfYear))\n`;
    jsCode += `  if (format === 'iso-week') return String(isoWeek)\n`;
    jsCode += `  if (format === 'week-padded') return pad2(isoWeek)\n`;
    jsCode += `  return weekdayShort + ', ' + day + ' ' + monthShort\n`;
    jsCode += `}\n\n`;
    jsCode += `function formatTimeText(format, date) {\n`;
    jsCode += `  const hour24 = date.getHours()\n`;
    jsCode += `  const hour12 = hour24 % 12 || 12\n`;
    jsCode += `  const minute = pad2(date.getMinutes())\n`;
    jsCode += `  const second = pad2(date.getSeconds())\n`;
    jsCode += `  const period = hour24 >= 12 ? 'PM' : 'AM'\n`;
    jsCode += `  if (format === 'hh-mm-ss-24') return pad2(hour24) + ':' + minute + ':' + second\n`;
    jsCode += `  if (format === 'hh-mm-12') return pad2(hour12) + ':' + minute + ' ' + period\n`;
    jsCode += `  if (format === 'hh-mm-ss-12') return pad2(hour12) + ':' + minute + ':' + second + ' ' + period\n`;
    jsCode += `  if (format === 'h-mm-12') return hour12 + ':' + minute + ' ' + period.toLowerCase()\n`;
    jsCode += `  if (format === 'hhmm-24') return pad2(hour24) + minute\n`;
    jsCode += `  if (format === 'hh-mm-dot') return pad2(hour24) + '.' + minute\n`;
    jsCode += `  if (format === 'hh-mm-space') return pad2(hour24) + ' ' + minute\n`;
    jsCode += `  if (format === 'hour-only') return pad2(hour24)\n`;
    jsCode += `  if (format === 'minute-only') return minute\n`;
    jsCode += `  if (format === 'second-only') return second\n`;
    jsCode += `  return pad2(hour24) + ':' + minute\n`;
    jsCode += `}\n\n`;
    jsCode += `function formatDistance(value) {\n`;
    jsCode += `  if (value >= 1000) return (Math.round(value / 100) / 10) + ' KM'\n`;
    jsCode += `  return Math.round(value) + ' M'\n`;
    jsCode += `}\n\n`;
    jsCode += `function formatDistanceValue(value) {\n`;
    jsCode += `  if (value >= 1000) return String(Math.round(value / 100) / 10)\n`;
    jsCode += `  return String(Math.round(value))\n`;
    jsCode += `}\n\n`;
    jsCode += `function formatDuration(minutes) {\n`;
    jsCode += `  const total = Math.max(0, Math.round(minutes))\n`;
    jsCode += `  return Math.floor(total / 60) + 'H ' + pad2(total % 60) + 'M'\n`;
    jsCode += `}\n\n`;
    jsCode += `function formatDurationValue(minutes) {\n`;
    jsCode += `  const total = Math.max(0, Math.round(minutes))\n`;
    jsCode += `  return Math.floor(total / 60) + ':' + pad2(total % 60)\n`;
    jsCode += `}\n\n`;
    jsCode += `function getRawMetric(type, fallback) {\n`;
    jsCode += `  const source = metricSensors[type]\n`;
    jsCode += `  if (type === 'battery') return clamp(Math.round(readNumber(source, ['getCurrent', 'getBattery'], ['current', 'battery', 'value'], 0)), 0, 100)\n`;
    jsCode += `  if (type === 'steps') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'step', 'steps', 'value'], 0)))\n`;
    jsCode += `  if (type === 'heart') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getLast'], ['current', 'last', 'heartRate', 'bpm', 'value'], 0)))\n`;
    jsCode += `  if (type === 'calories') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'calorie', 'calories', 'value'], 0)))\n`;
    jsCode += `  if (type === 'distance') return Math.max(0, readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'distance', 'value'], 0))\n`;
    jsCode += `  if (type === 'sleep') return Math.max(0, readNumber(source, ['getTotal', 'getCurrent'], ['total', 'duration', 'minutes', 'value'], 0))\n`;
    jsCode += `  if (type === 'stress') return clamp(Math.round(readNumber(source, ['getCurrent'], ['current', 'stress', 'value'], 0)), 0, 100)\n`;
    jsCode += `  if (type === 'spo2') return clamp(Math.round(readNumber(source, ['getCurrent', 'getLast'], ['current', 'spo2', 'oxygen', 'value'], 0)), 0, 100)\n`;
    jsCode += `  if (type === 'pai') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'pai', 'value'], 0)))\n`;
    jsCode += `  if (type === 'temperature') return Math.round(readNumber(metricSensors.weather, ['getCurrent'], ['temperature', 'temp', 'currentTemp'], 0))\n`;
    jsCode += `  if (type === 'humidity') return clamp(Math.round(readNumber(metricSensors.weather, ['getCurrent'], ['humidity'], 0)), 0, 100)\n`;
    jsCode += `  if (type === 'uv') return Math.max(0, Math.round(readNumber(metricSensors.weather, ['getCurrent'], ['uv', 'uvIndex'], 0)))\n`;
    jsCode += `  if (type === 'altitude') return Math.round(readNumber(source, ['getCurrent'], ['current', 'altitude', 'value'], 0))\n`;
    jsCode += `  if (type === 'pressure') return Math.round(readNumber(source, ['getCurrent'], ['current', 'pressure', 'value'], 0))\n`;
    jsCode += `  return fallback\n`;
    jsCode += `}\n\n`;
    jsCode += `function getMetricPercent(type) {\n`;
    jsCode += `  if (type === 'battery') return getRawMetric('battery', 0)\n`;
    jsCode += `  if (type === 'steps') return clamp(Math.round((getRawMetric('steps', 0) / 10000) * 100), 0, 100)\n`;
    jsCode += `  if (type === 'heart') return clamp(Math.round(((getRawMetric('heart', 0) - 40) / 140) * 100), 0, 100)\n`;
    jsCode += `  if (type === 'calories') return clamp(Math.round((getRawMetric('calories', 0) / 500) * 100), 0, 100)\n`;
    jsCode += `  if (type === 'distance') return clamp(Math.round((getRawMetric('distance', 0) / 5000) * 100), 0, 100)\n`;
    jsCode += `  if (type === 'sleep') return clamp(Math.round((getRawMetric('sleep', 0) / 480) * 100), 0, 100)\n`;
    jsCode += `  if (type === 'stress') return getRawMetric('stress', 0)\n`;
    jsCode += `  if (type === 'spo2') return getRawMetric('spo2', 0)\n`;
    jsCode += `  if (type === 'pai') return clamp(getRawMetric('pai', 0), 0, 100)\n`;
    jsCode += `  return 0\n`;
    jsCode += `}\n\n`;
    jsCode += `function getMetricText(type, fallback, options) {\n`;
    jsCode += `  options = options || {}\n`;
    jsCode += `  const now = new Date()\n`;
    jsCode += `  if (type === 'time') return formatTimeText(options.timeFormat || 'hh-mm-24', now)\n`;
    jsCode += `  if (type === 'hour') return formatTimeText('hour-only', now)\n`;
    jsCode += `  if (type === 'minute') return formatTimeText('minute-only', now)\n`;
    jsCode += `  if (type === 'second') return formatTimeText('second-only', now)\n`;
    jsCode += `  if (type === 'date' || type === 'day' || type === 'month' || type === 'year' || type === 'weekday' || type === 'day-of-year' || type === 'week') return formatDateText(options.dateFormat || 'weekday-day-month-short', now)\n`;
    jsCode += `  if (type === 'battery') return String(getRawMetric('battery', 0))\n`;
    jsCode += `  if (type === 'steps') return String(getRawMetric('steps', 0))\n`;
    jsCode += `  if (type === 'heart') return String(getRawMetric('heart', 0))\n`;
    jsCode += `  if (type === 'calories') return String(getRawMetric('calories', 0))\n`;
    jsCode += `  if (type === 'distance') return formatDistanceValue(getRawMetric('distance', 0))\n`;
    jsCode += `  if (type === 'sleep') return formatDurationValue(getRawMetric('sleep', 0))\n`;
    jsCode += `  if (type === 'stress') return String(getRawMetric('stress', 0))\n`;
    jsCode += `  if (type === 'spo2') return String(getRawMetric('spo2', 0))\n`;
    jsCode += `  if (type === 'pai') return String(getRawMetric('pai', 0))\n`;
    jsCode += `  if (type === 'weather') return readString(metricSensors.weather, ['getCurrent'], ['weather', 'condition', 'text', 'name'], fallback || '')\n`;
    jsCode += `  if (type === 'temperature') return String(getRawMetric('temperature', 0))\n`;
    jsCode += `  if (type === 'humidity') return String(getRawMetric('humidity', 0))\n`;
    jsCode += `  if (type === 'uv') return String(getRawMetric('uv', 0))\n`;
    jsCode += `  if (type === 'altitude') return String(getRawMetric('altitude', 0))\n`;
    jsCode += `  if (type === 'pressure') return String(getRawMetric('pressure', 0))\n`;
    jsCode += `  if (type === 'sunrise') return readString(metricSensors.weather, ['getSunrise'], ['sunrise'], fallback || '')\n`;
    jsCode += `  if (type === 'sunset') return readString(metricSensors.weather, ['getSunset'], ['sunset'], fallback || '')\n`;
    jsCode += `  if (type === 'alarm') return readString(metricSensors.alarm, ['getNext'], ['next', 'time'], fallback || '')\n`;
    jsCode += `  if (type === 'bluetooth') return readNumber(metricSensors.bluetooth, ['getStatus'], ['connected', 'value'], 1) ? (options.okText || 'BT OK') : (options.koText || 'BT KO')\n`;
    jsCode += `  if (type === 'stopwatch') return '00:00'\n`;
    jsCode += `  return fallback || ''\n`;
    jsCode += `}\n\n`;
    jsCode += `function updateDynamicWidgets() {\n`;
    jsCode += `  for (let i = 0; i < dynamicTexts.length; i += 1) {\n`;
    jsCode += `    const item = dynamicTexts[i]\n`;
    jsCode += `    item.node.setProperty(prop.TEXT, (item.prefix || '') + getMetricText(item.type, item.fallback, item.options) + (item.suffix || ''))\n`;
    jsCode += `    if (item.type === 'bluetooth') {\n`;
    jsCode += `      const connected = readNumber(metricSensors.bluetooth, ['getStatus'], ['connected', 'value'], 1)\n`;
    jsCode += `      item.node.setProperty(prop.COLOR, connected ? item.okColor : item.koColor)\n`;
    jsCode += `    }\n`;
    jsCode += `  }\n`;
    jsCode += `  for (let i = 0; i < dynamicBars.length; i += 1) {\n`;
    jsCode += `    const item = dynamicBars[i]\n`;
    jsCode += `    const percent = getMetricPercent(item.type)\n`;
    jsCode += `    item.node.setProperty(prop.MORE, {\n`;
    jsCode += `      x: item.x,\n`;
    jsCode += `      y: item.y,\n`;
    jsCode += `      w: Math.round(item.width * (percent / 100)),\n`;
    jsCode += `      h: item.height,\n`;
    jsCode += `      color: item.color\n`;
    jsCode += `    })\n`;
    jsCode += `    if (item.label) item.label.setProperty(prop.TEXT, getMetricText(item.type, item.fallback))\n`;
    jsCode += `  }\n`;
    jsCode += `  for (let i = 0; i < dynamicArcs.length; i += 1) {\n`;
    jsCode += `    const item = dynamicArcs[i]\n`;
    jsCode += `    const percent = getMetricPercent(item.type)\n`;
    jsCode += `    item.node.setProperty(prop.MORE, {\n`;
    jsCode += `      center_x: item.centerX,\n`;
    jsCode += `      center_y: item.centerY,\n`;
    jsCode += `      radius: item.radius,\n`;
    jsCode += `      start_angle: item.startAngle,\n`;
    jsCode += `      end_angle: item.endAngle,\n`;
    jsCode += `      line_width: item.lineWidth,\n`;
    jsCode += `      color: item.color,\n`;
    jsCode += `      level: percent\n`;
    jsCode += `    })\n`;
    jsCode += `    if (item.label) item.label.setProperty(prop.TEXT, String(percent) + '%')\n`;
    jsCode += `  }\n`;
    jsCode += `}\n\n`;
    jsCode += `WatchFace({\n  onInit() {\n    console.log('Esfera Cargada con Éxito')\n  },\n\n  build() {\n`;
    jsCode += `    const sensorTypes = Object.keys(sensorAliases)\n`;
    jsCode += `    for (let i = 0; i < sensorTypes.length; i += 1) {\n`;
    jsCode += `      const type = sensorTypes[i]\n`;
    jsCode += `      metricSensors[type] = createSafeSensorByType(type)\n`;
    jsCode += `    }\n\n`;

    // Configurar fondo en código
    if (watchConfig.bgType === 'color') {
        jsCode += `    // Fondo Sólido de Esfera\n`;
        jsCode += `    createWidget(widget.FILL_RECT, {\n`;
        jsCode += `      x: 0, y: 0, w: ${getCanvasWidth()}, h: ${getCanvasHeight()},\n`;
        jsCode += `      color: 0x${watchConfig.bgColor.replace('#', '')}\n`;
        jsCode += `    })\n\n`;
    } else {
        jsCode += `    // Fondo Gradiente / Imagen\n`;
        jsCode += `    createWidget(widget.FILL_RECT, {\n`;
        jsCode += `      x: 0, y: 0, w: ${getCanvasWidth()}, h: ${getCanvasHeight()},\n`;
        jsCode += `      color: 0x${watchConfig.bgGradStart.replace('#', '')}\n`;
        jsCode += `    })\n\n`;
    }

    // Recorrer los widgets en pantalla
    elements.forEach((el, idx) => {
        normalizeElement(el);
        jsCode += `    // [Widget ${idx + 1}] Tipo: ${el.type.toUpperCase()}\n`;

        let zeppAlign = 'align.CENTER_H';
        if (el.textAlign === 'left') zeppAlign = 'align.LEFT';
        if (el.textAlign === 'right') zeppAlign = 'align.RIGHT';
        const titleOffset = getTitleContentHeight(el);
        const contentY = el.y + titleOffset;
        const contentHeight = Math.max(1, el.height - titleOffset);
        const contentFontPath = getZeppFontPath(el.fontFamily || 'font-inter');
        const contentTextSize = getZeppTextSize(el.fontFamily || 'font-inter', el.fontSize || 18);
        const contentTextHeight = getZeppTextBoxHeight(el.fontFamily || 'font-inter', el.fontSize || 18, contentHeight);

        const fullImageFallback = shouldRenderAsZeppImage(el);

        if (el.titleEnabled && !fullImageFallback) {
            const titleFontPath = getZeppFontPath(el.titleFontFamily || 'font-rajdhani');
            const titleTextSize = getZeppTextSize(el.titleFontFamily || 'font-rajdhani', el.titleFontSize || 10);
            const titleTextHeight = getZeppTextBoxHeight(el.titleFontFamily || 'font-rajdhani', el.titleFontSize || 10, el.titleFontSize || 10);
            jsCode += `    createWidget(widget.TEXT, {\n`;
            jsCode += `      x: ${el.x}, y: ${el.y}, w: ${el.width}, h: ${titleTextHeight},\n`;
            jsCode += `      text: '${escapeGeneratedText(el.titleText)}',\n`;
            jsCode += `      text_size: ${titleTextSize},\n`;
            jsCode += `      font: '${titleFontPath}',\n`;
            jsCode += `      color: 0x${el.titleColor.replace('#', '')},\n`;
            jsCode += `      align_h: ${zeppAlign}\n`;
            jsCode += `    })\n`;
        }

        if (el.type === 'progress-bar') {
            // Genera código para dibujar barra de progreso nativa
            const progressType = el.progressType || 'battery';
            const fallbackText = escapeGeneratedText(metricDefaults[progressType]?.text || `${progressType}: ${el.progressValue || 0}%`);
            const fillName = `progressFill${idx}`;
            const labelName = `progressLabel${idx}`;
            jsCode += `    // Fondo de Barra de Progreso\n`;
            jsCode += `    createWidget(widget.FILL_RECT, {\n`;
            jsCode += `      x: ${el.x}, y: ${contentY + 12}, w: ${el.width}, h: ${el.progressThickness},\n`;
            jsCode += `      color: 0x${el.progressBgColor.replace('#', '')}\n`;
            jsCode += `    })\n`;
            jsCode += `    const ${fillName} = createWidget(widget.FILL_RECT, {\n`;
            jsCode += `      x: ${el.x}, y: ${contentY + 12}, w: 0, h: ${el.progressThickness},\n`;
            jsCode += `      color: 0x${el.color.replace('#', '')}\n`;
            jsCode += `    })\n`;
            jsCode += `    const ${labelName} = createWidget(widget.TEXT, {\n`;
            jsCode += `      x: ${el.x}, y: ${contentY}, w: ${el.width}, h: ${getZeppTextBoxHeight(el.fontFamily || 'font-inter', 10, 12)},\n`;
            jsCode += `      text: getMetricText('${progressType}', '${fallbackText}'),\n`;
            jsCode += `      text_size: ${getZeppTextSize(el.fontFamily || 'font-inter', 10)},\n`;
            jsCode += `      font: '${contentFontPath}',\n`;
            jsCode += `      color: 0x${el.color.replace('#', '')},\n`;
            jsCode += `      align_h: align.RIGHT\n`;
            jsCode += `    })\n`;
            jsCode += `    dynamicBars.push({ node: ${fillName}, label: ${labelName}, type: '${progressType}', fallback: '${fallbackText}', x: ${el.x}, y: ${contentY + 12}, width: ${el.width}, height: ${el.progressThickness}, color: 0x${el.color.replace('#', '')} })\n\n`;
        }
        else if (el.type === 'arc-progress') {
            const progressType = el.progressType || 'steps';
            const centerX = Math.round(el.x + (el.width / 2));
            const centerY = Math.round(contentY + (contentHeight / 2));
            const lineWidth = el.progressThickness || 10;
            const radius = Math.max(1, Math.round((Math.min(el.width, contentHeight) / 2) - (lineWidth / 2) - 1));
            const startAngle = -90;
            const endAngle = 270;
            const arcName = `arcProgress${idx}`;
            const labelName = `arcLabel${idx}`;
            jsCode += `    // Progreso circular vinculado a ${progressType}\n`;
            jsCode += `    createWidget(widget.ARC, {\n`;
            jsCode += `      x: ${el.x}, y: ${contentY}, w: ${el.width}, h: ${contentHeight},\n`;
            jsCode += `      start_angle: ${startAngle},\n`;
            jsCode += `      end_angle: ${endAngle},\n`;
            jsCode += `      color: 0x${(el.progressBgColor || '#1e293b').replace('#', '')},\n`;
            jsCode += `      line_width: ${lineWidth}\n`;
            jsCode += `    })\n`;
            jsCode += `    const ${arcName} = createWidget(widget.ARC_PROGRESS, {\n`;
            jsCode += `      center_x: ${centerX}, center_y: ${centerY}, radius: ${radius},\n`;
            jsCode += `      start_angle: ${startAngle},\n`;
            jsCode += `      end_angle: ${endAngle},\n`;
            jsCode += `      color: 0x${el.color.replace('#', '')},\n`;
            jsCode += `      line_width: ${lineWidth},\n`;
            jsCode += `      level: ${Math.max(0, Math.min(100, el.progressValue || 0))}\n`;
            jsCode += `    })\n`;
            jsCode += `    const ${labelName} = createWidget(widget.TEXT, {\n`;
            jsCode += `      x: ${el.x}, y: ${Math.round(centerY - ((el.fontSize || 18) / 2))}, w: ${el.width}, h: ${getZeppTextBoxHeight(el.fontFamily || 'font-inter', el.fontSize || 18, el.fontSize || 18)},\n`;
            jsCode += `      text: '${Math.max(0, Math.min(100, el.progressValue || 0))}%',\n`;
            jsCode += `      text_size: ${getZeppTextSize(el.fontFamily || 'font-inter', el.fontSize || 18)},\n`;
            jsCode += `      font: '${contentFontPath}',\n`;
            jsCode += `      color: 0x${el.color.replace('#', '')},\n`;
            jsCode += `      align_h: align.CENTER_H\n`;
            jsCode += `    })\n`;
            jsCode += `    dynamicArcs.push({ node: ${arcName}, label: ${labelName}, type: '${progressType}', centerX: ${centerX}, centerY: ${centerY}, radius: ${radius}, startAngle: ${startAngle}, endAngle: ${endAngle}, lineWidth: ${lineWidth}, color: 0x${el.color.replace('#', '')} })\n\n`;
        }
        else if (el.type === 'circle') {
            const radius = Math.max(1, Math.round(Math.min(el.width, contentHeight) / 2));
            jsCode += `    createWidget(widget.CIRCLE, {\n`;
            jsCode += `      center_x: ${Math.round(el.x + (el.width / 2))},\n`;
            jsCode += `      center_y: ${Math.round(contentY + (contentHeight / 2))},\n`;
            jsCode += `      radius: ${radius},\n`;
            jsCode += `      color: 0x${el.color.replace('#', '')},\n`;
            jsCode += `      alpha: ${Math.max(0, Math.min(255, Math.round((el.opacity === undefined ? 1 : el.opacity) * 255)))}\n`;
            jsCode += `    })\n\n`;
        }
        else if (el.type === 'stroke-rect') {
            jsCode += `    createWidget(widget.STROKE_RECT, {\n`;
            jsCode += `      x: ${el.x}, y: ${contentY}, w: ${el.width}, h: ${contentHeight},\n`;
            jsCode += `      radius: ${Math.min(18, Math.max(0, Math.round(Math.min(el.width, contentHeight) * 0.16)))},\n`;
            jsCode += `      line_width: ${el.progressThickness || 3},\n`;
            jsCode += `      color: 0x${el.color.replace('#', '')}\n`;
            jsCode += `    })\n\n`;
        }
        else if (el.type === 'chart') {
            // Generación simulada de widget gráfico avanzado
            jsCode += `    // Gráfico de Onda cardíaca (Líneas poligonales)\n`;
            jsCode += `    createWidget(widget.POLYLINE, {\n`;
            jsCode += `      x: ${el.x}, y: ${contentY}, w: ${el.width}, h: ${contentHeight},\n`;
            jsCode += `      line_color: 0x${el.color.replace('#', '')},\n`;
            jsCode += `      line_width: 3\n`;
            jsCode += `    })\n\n`;
        }
        else if (el.type === 'image') {
            // Generación de imagen nativa
            jsCode += `    createWidget(widget.IMG, {\n`;
            jsCode += `      x: ${el.x}, y: ${contentY},\n`;
            jsCode += `      src: 'icon_${idx}.png'\n`;
            jsCode += `    })\n\n`;
        }
        else if (shouldRenderAsZeppImage(el)) {
            jsCode += `    // Texto rasterizado para conservar la fuente elegida en el simulador\n`;
            jsCode += `    createWidget(widget.IMG, {\n`;
            jsCode += `      x: ${el.x}, y: ${el.y},\n`;
            jsCode += `      src: 'text_${idx}.png'\n`;
            jsCode += `    })\n\n`;
        }
        else {
            // Texto estándar (Hora, fecha, métricas)
            const dynamicType = getDynamicMetricType(el);
            const textWidgetName = `textWidget${idx}`;
            jsCode += `    const ${textWidgetName} = createWidget(widget.TEXT, {\n`;
            jsCode += `      x: ${el.x}, y: ${contentY}, w: ${el.width}, h: ${contentTextHeight},\n`;
            jsCode += `      text: ${getGeneratedTextExpression(el)},\n`;
            jsCode += `      text_size: ${contentTextSize},\n`;
            jsCode += `      font: '${contentFontPath}',\n`;
            jsCode += `      color: 0x${getElementDisplayColor(el).replace('#', '')},\n`;
            jsCode += `      align_h: ${zeppAlign}\n`;
            jsCode += `    })\n`;
            if (dynamicType) {
                if (el.type === 'bluetooth') {
                    jsCode += `    dynamicTexts.push({ node: ${textWidgetName}, type: 'bluetooth', fallback: '${escapeGeneratedText(getElementDisplayText(el))}', options: { okText: '${escapeGeneratedText(el.statusOkText || 'BT OK')}', koText: '${escapeGeneratedText(el.statusKoText || 'BT KO')}' }, prefix: '${escapeGeneratedText(el.metricPrefix || '')}', suffix: '${escapeGeneratedText(el.metricSuffix || '')}', okColor: 0x${(el.statusOkColor || '#60a5fa').replace('#', '')}, koColor: 0x${(el.statusKoColor || '#f87171').replace('#', '')} })\n`;
                } else if (el.type === 'time') {
                    jsCode += `    dynamicTexts.push({ node: ${textWidgetName}, type: 'time', fallback: '${escapeGeneratedText(getElementDisplayText(el))}', options: { timeFormat: '${escapeGeneratedText(el.timeFormat || 'hh-mm-24')}' }, prefix: '${escapeGeneratedText(el.metricPrefix || '')}', suffix: '${escapeGeneratedText(el.metricSuffix || '')}' })\n`;
                } else if (isCalendarMetricType(el.type)) {
                    jsCode += `    dynamicTexts.push({ node: ${textWidgetName}, type: '${el.type}', fallback: '${escapeGeneratedText(getElementDisplayText(el))}', options: { dateFormat: '${escapeGeneratedText(el.dateFormat || metricDefaults[el.type]?.dateFormat || 'weekday-day-month-short')}' }, prefix: '${escapeGeneratedText(el.metricPrefix || '')}', suffix: '${escapeGeneratedText(el.metricSuffix || '')}' })\n`;
                } else {
                    jsCode += `    dynamicTexts.push({ node: ${textWidgetName}, type: '${dynamicType}', fallback: '${escapeGeneratedText(el.text)}', prefix: '${escapeGeneratedText(el.metricPrefix || '')}', suffix: '${escapeGeneratedText(el.metricSuffix || '')}' })\n`;
                }
            }
            jsCode += `\n`;
        }
    });

    jsCode += `    updateDynamicWidgets()\n`;
    jsCode += `    refreshTimer = startRefreshTimer()\n`;
    jsCode += `  },\n  onDestroy() {\n`;
    jsCode += `    stopRefreshTimer(refreshTimer)\n`;
    jsCode += `    dynamicTexts.length = 0\n`;
    jsCode += `    dynamicBars.length = 0\n`;
    jsCode += `    dynamicArcs.length = 0\n`;
    jsCode += `    console.log('Esfera Destruida')\n`;
    jsCode += `  }\n})`;

    codeBox.innerText = jsCode;
}
// --- EXTENSIONES AVANZADAS INTEGRADAS ---
// Añadido directamente al app.js original para evitar ficheros JS extra.
(function () {
    const ADVANCED_VERSION = '2026-07-02-v3';
    const ADVANCED_VISUAL_TYPES = [
        'analog-hands',
        'multi-rings',
        'weather-icon',
        'sun-position',
        'separator-line',
        'preset-icon',
        'step-goal',
        'date-circle',
        'battery-icon'
    ];
    const ADVANCED_TEXT_DYNAMIC_TYPES = [
        'temp-range',
        'moon-phase',
        'countdown',
        'work-remaining',
        'day-progress'
    ];
    const ADVANCED_TYPES = ADVANCED_VISUAL_TYPES.concat(ADVANCED_TEXT_DYNAMIC_TYPES);
    const ADVANCED_IMAGE_EXPORT_TYPES = ADVANCED_VISUAL_TYPES.concat(['chart']);

    let advancedPositionCopyTargetId = null;
    let advancedPositionCopyAxis = null;
    let advancedHistory = [];
    let advancedRedo = [];
    let advancedHistorySuspended = false;

    const originalAddElement = addElement;
    const originalRenderCanvas = renderCanvas;
    const originalSelectElement = selectElement;
    const originalUpdateElementProp = updateElementProp;
    const originalCopyStyle = copyStyle;
    const originalGetMetricLabel = getMetricLabel;
    const originalSupportsOptionalTitle = supportsOptionalTitle;
    const originalHasAutoContentHeight = hasAutoContentHeight;
    const originalGetAutoContentHeight = getAutoContentHeight;
    const originalFitElementHeightToContent = fitElementHeightToContent;
    const originalCanRenderElementAsImage = canRenderElementAsImage;
    const originalGetElementDisplayText = getElementDisplayText;
    const originalGetElementDisplayColor = getElementDisplayColor;
    const originalNormalizeElement = normalizeElement;
    const originalStartDrag = startDrag;
    const originalStartResize = startResize;
    const originalDeleteSelectedElement = deleteSelectedElement;
    const originalClearCanvas = clearCanvas;
    const originalApplyTemplate = applyTemplate;
    const originalStopDrag = stopDrag;
    const originalStopResize = stopResize;
    const originalMoveSelectedElementBy = moveSelectedElementBy;
    const originalCenterSelectedElement = centerSelectedElement;
    const originalGetGeneratedTextExpression = getGeneratedTextExpression;
    const originalGetDynamicMetricType = getDynamicMetricType;
    const originalElementNeedsSecondRefresh = elementNeedsSecondRefresh;
    const originalAddElementImageAssets = addElementImageAssets;
    const originalGenerateZeppCode = generateZeppCode;

    ADVANCED_TEXT_DYNAMIC_TYPES.forEach((type) => {
        if (!DYNAMIC_METRIC_TYPES.includes(type)) DYNAMIC_METRIC_TYPES.push(type);
    });

    Object.assign(metricDefaults, {
        'temp-range': { text: '18°/31°', color: '#fbbf24', fontSize: 22, fontFamily: 'font-chakra', metricSuffix: '°' },
        'moon-phase': { text: 'LUNA CREC.', color: '#c4b5fd', fontSize: 18, fontFamily: 'font-rajdhani' },
        countdown: { text: '2D 04:30', color: '#67e8f9', fontSize: 22, fontFamily: 'font-orbitron', countdownTarget: getDefaultCountdownTarget() },
        'work-remaining': { text: 'SALIDA EN 3H 25M', color: '#86efac', fontSize: 20, fontFamily: 'font-chakra', workStart: '08:00', workEnd: '15:00', workWeekdaysOnly: true },
        'day-progress': { text: 'DÍA 62%', color: '#facc15', fontSize: 20, fontFamily: 'font-chakra' }
    });

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getDefaultCountdownTarget() {
        const target = new Date();
        target.setDate(target.getDate() + 7);
        target.setHours(18, 0, 0, 0);
        return target.toISOString().slice(0, 16);
    }

    function parseClockToMinutes(value, fallback) {
        const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return fallback;
        const hours = Math.max(0, Math.min(23, parseInt(match[1], 10)));
        const minutes = Math.max(0, Math.min(59, parseInt(match[2], 10)));
        return (hours * 60) + minutes;
    }

    function minutesToText(totalMinutes) {
        const safe = Math.max(0, Math.round(totalMinutes));
        const hours = Math.floor(safe / 60);
        const minutes = safe % 60;
        if (hours <= 0) return `${minutes}M`;
        return `${hours}H ${pad2(minutes)}M`;
    }

    function formatWorkRemainingForDisplay(element, date = new Date()) {
        const weekdaysOnly = element.workWeekdaysOnly !== false;
        const day = date.getDay();
        if (weekdaysOnly && (day === 0 || day === 6)) return 'LIBRE';

        const start = parseClockToMinutes(element.workStart || '08:00', 8 * 60);
        const end = parseClockToMinutes(element.workEnd || '15:00', 15 * 60);
        const now = (date.getHours() * 60) + date.getMinutes();
        const normalizedEnd = end <= start ? end + 1440 : end;
        const normalizedNow = now < start && end <= start ? now + 1440 : now;

        if (normalizedNow < start) return `ENTRA EN ${minutesToText(start - normalizedNow)}`;
        if (normalizedNow >= normalizedEnd) return 'JORNADA OK';
        return `SALIDA EN ${minutesToText(normalizedEnd - normalizedNow)}`;
    }

    function formatCountdownForDisplay(element, date = new Date()) {
        const rawTarget = element.countdownTarget || getDefaultCountdownTarget();
        const target = new Date(rawTarget);
        if (Number.isNaN(target.getTime())) return 'SIN FECHA';
        const diff = target.getTime() - date.getTime();
        if (diff <= 0) return 'FINALIZADO';
        const totalMinutes = Math.floor(diff / 60000);
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        if (days > 0) return `${days}D ${pad2(hours)}:${pad2(minutes)}`;
        return `${hours}H ${pad2(minutes)}M`;
    }

    function getMoonPhaseName(date = new Date()) {
        const synodicMonth = 29.53058867;
        const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
        const days = (date.getTime() - knownNewMoon.getTime()) / 86400000;
        const phase = ((days % synodicMonth) + synodicMonth) % synodicMonth;
        if (phase < 1.85) return 'LUNA NUEVA';
        if (phase < 5.54) return 'CRECIENTE';
        if (phase < 9.23) return 'CUARTO CREC.';
        if (phase < 12.92) return 'GIBOSA CREC.';
        if (phase < 16.61) return 'LUNA LLENA';
        if (phase < 20.30) return 'GIBOSA MENG.';
        if (phase < 23.99) return 'CUARTO MENG.';
        if (phase < 27.68) return 'MENGUANTE';
        return 'LUNA NUEVA';
    }

    function getDayProgressPercent(date = new Date()) {
        const seconds = (date.getHours() * 3600) + (date.getMinutes() * 60) + date.getSeconds();
        return Math.max(0, Math.min(100, Math.round((seconds / 86400) * 100)));
    }

    function getWeatherIcon(condition) {
        const text = String(condition || '').toLowerCase();
        if (text.includes('torment') || text.includes('storm')) return '⛈';
        if (text.includes('lluv') || text.includes('rain')) return '🌧';
        if (text.includes('nieve') || text.includes('snow')) return '❄';
        if (text.includes('nube') || text.includes('cloud')) return '☁';
        if (text.includes('niebla') || text.includes('fog')) return '≋';
        if (text.includes('luna') || text.includes('night')) return '☾';
        return '☀';
    }

    function getSunProgress(element, date = new Date()) {
        const sunrise = parseClockToMinutes(element.sunriseTime || element.sunRise || '06:42', 402);
        const sunset = parseClockToMinutes(element.sunsetTime || element.sunSet || '21:38', 1298);
        const now = (date.getHours() * 60) + date.getMinutes();
        if (sunset <= sunrise) return 0;
        return Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise)));
    }

    function getAdvancedDisplayText(element) {
        if (element.type === 'work-remaining') return applyMetricAffixes(element, formatWorkRemainingForDisplay(element));
        if (element.type === 'countdown') return applyMetricAffixes(element, formatCountdownForDisplay(element));
        if (element.type === 'moon-phase') return applyMetricAffixes(element, getMoonPhaseName());
        if (element.type === 'day-progress') return applyMetricAffixes(element, `DÍA ${getDayProgressPercent()}%`);
        if (element.type === 'temp-range') {
            const min = element.tempMin ?? 18;
            const max = element.tempMax ?? 31;
            return applyMetricAffixes(element, `${min}°/${max}°`);
        }
        return element.text || '';
    }

    function ensureAdvancedElementDefaults(element) {
        if (!element || !ADVANCED_TYPES.includes(element.type)) return element;
        if (element.locked === undefined) element.locked = false;
        if (element.hidden === undefined) element.hidden = false;
        if (element.zIndex === undefined) element.zIndex = elements.indexOf(element);
        if (element.opacity === undefined) element.opacity = 1;
        if (!element.fontFamily) element.fontFamily = 'font-inter';
        if (!element.color) element.color = '#ffffff';

        if (element.type === 'analog-hands') {
            element.width = element.width || 180;
            element.height = element.height || 180;
            element.handHourColor = element.handHourColor || '#ffffff';
            element.handMinuteColor = element.handMinuteColor || '#38bdf8';
            element.handSecondColor = element.handSecondColor || '#f43f5e';
            element.showSecondHand = element.showSecondHand !== false;
        }
        if (element.type === 'multi-rings') {
            element.width = element.width || 180;
            element.height = element.height || 180;
            element.ringMetrics = element.ringMetrics || 'battery,steps,heart';
            element.ringValues = element.ringValues || '82,62,38';
            element.progressThickness = element.progressThickness || 10;
            element.progressBgColor = element.progressBgColor || '#1e293b';
        }
        if (element.type === 'weather-icon') {
            element.width = element.width || 70;
            element.height = element.height || 70;
            element.weatherConditionPreview = element.weatherConditionPreview || 'soleado';
            element.fontSize = element.fontSize || 44;
            element.color = element.color || '#fde047';
        }
        if (element.type === 'temp-range') {
            element.tempMin = element.tempMin ?? 18;
            element.tempMax = element.tempMax ?? 31;
        }
        if (element.type === 'moon-phase') {
            element.text = getMoonPhaseName();
        }
        if (element.type === 'countdown') {
            element.countdownTarget = element.countdownTarget || getDefaultCountdownTarget();
            element.text = formatCountdownForDisplay(element);
        }
        if (element.type === 'work-remaining') {
            element.workStart = element.workStart || '08:00';
            element.workEnd = element.workEnd || '15:00';
            element.workWeekdaysOnly = element.workWeekdaysOnly !== false;
            element.text = formatWorkRemainingForDisplay(element);
        }
        if (element.type === 'sun-position') {
            element.width = element.width || 220;
            element.height = element.height || 100;
            element.sunriseTime = element.sunriseTime || '06:42';
            element.sunsetTime = element.sunsetTime || '21:38';
            element.progressBgColor = element.progressBgColor || '#334155';
            element.color = element.color || '#fbbf24';
        }
        if (element.type === 'separator-line') {
            element.width = element.width || 180;
            element.height = element.height || 12;
            element.progressThickness = element.progressThickness || 2;
            element.lineDirection = element.lineDirection || 'horizontal';
            element.color = element.color || '#64748b';
        }
        if (element.type === 'preset-icon') {
            element.width = element.width || 54;
            element.height = element.height || 54;
            element.text = element.text || '★';
            element.fontSize = element.fontSize || 38;
            element.color = element.color || '#fbbf24';
        }
        if (element.type === 'step-goal') {
            element.width = element.width || 180;
            element.height = element.height || 180;
            element.stepGoal = element.stepGoal || 10000;
            element.progressValue = element.progressValue ?? 5420;
            element.progressThickness = element.progressThickness || 12;
            element.progressBgColor = element.progressBgColor || '#1e293b';
            element.color = element.color || '#fbbf24';
        }
        if (element.type === 'date-circle') {
            element.width = element.width || 92;
            element.height = element.height || 92;
            element.progressBgColor = element.progressBgColor || '#0f172a';
            element.color = element.color || '#38bdf8';
        }
        if (element.type === 'battery-icon') {
            element.width = element.width || 110;
            element.height = element.height || 46;
            element.progressValue = element.progressValue ?? 80;
            element.progressBgColor = element.progressBgColor || '#1e293b';
            element.color = element.color || '#2dd4bf';
        }
        if (element.type === 'day-progress') {
            element.text = `DÍA ${getDayProgressPercent()}%`;
        }
        return element;
    }

    function createAdvancedElement(type) {
        const base = {
            id: 'el_' + Date.now(),
            type,
            x: 40,
            y: 100 + (elements.length * 30) % 220,
            width: 180,
            height: 60,
            color: '#ffffff',
            fontSize: 22,
            fontFamily: 'font-inter',
            opacity: 1,
            textAlign: 'center',
            locked: false,
            hidden: false,
            zIndex: getNextZIndex()
        };
        switch (type) {
            case 'analog-hands':
                Object.assign(base, { x: 143, y: 143, width: 180, height: 180, color: '#ffffff' });
                break;
            case 'multi-rings':
                Object.assign(base, { x: 143, y: 143, width: 180, height: 180, color: '#38bdf8' });
                break;
            case 'weather-icon':
                Object.assign(base, { width: 72, height: 72, color: '#fde047', fontSize: 46, weatherConditionPreview: 'soleado' });
                break;
            case 'temp-range':
                Object.assign(base, { width: 150, height: 32, color: '#fbbf24', fontSize: 24, fontFamily: 'font-chakra', tempMin: 18, tempMax: 31 });
                break;
            case 'moon-phase':
                Object.assign(base, { width: 160, height: 28, color: '#c4b5fd', fontSize: 18, fontFamily: 'font-rajdhani' });
                break;
            case 'countdown':
                Object.assign(base, { width: 180, height: 34, color: '#67e8f9', fontSize: 22, fontFamily: 'font-orbitron', countdownTarget: getDefaultCountdownTarget() });
                break;
            case 'work-remaining':
                Object.assign(base, { width: 230, height: 34, color: '#86efac', fontSize: 20, fontFamily: 'font-chakra', workStart: '08:00', workEnd: '15:00', workWeekdaysOnly: true });
                break;
            case 'sun-position':
                Object.assign(base, { width: 230, height: 104, color: '#fbbf24', progressBgColor: '#334155', sunriseTime: '06:42', sunsetTime: '21:38' });
                break;
            case 'separator-line':
                Object.assign(base, { width: 180, height: 12, color: '#64748b', progressThickness: 2, lineDirection: 'horizontal' });
                break;
            case 'preset-icon':
                Object.assign(base, { width: 54, height: 54, color: '#fbbf24', fontSize: 38, text: '★' });
                break;
            case 'step-goal':
                Object.assign(base, { width: 170, height: 170, color: '#fbbf24', progressBgColor: '#1e293b', progressValue: 5420, stepGoal: 10000, progressThickness: 12, fontSize: 18, fontFamily: 'font-chakra' });
                break;
            case 'date-circle':
                Object.assign(base, { width: 92, height: 92, color: '#38bdf8', progressBgColor: '#0f172a', fontSize: 24, fontFamily: 'font-chakra' });
                break;
            case 'battery-icon':
                Object.assign(base, { width: 112, height: 46, color: '#2dd4bf', progressBgColor: '#1e293b', progressValue: 80, fontSize: 14, fontFamily: 'font-chakra' });
                break;
            case 'day-progress':
                Object.assign(base, { width: 140, height: 30, color: '#facc15', fontSize: 20, fontFamily: 'font-chakra' });
                break;
        }
        return normalizeElement(base);
    }

    function getNextZIndex() {
        return elements.reduce((max, element, index) => Math.max(max, Number(element.zIndex ?? index)), -1) + 1;
    }

    function sortElementsByLayer() {
        elements.forEach((element, index) => {
            if (element.zIndex === undefined) element.zIndex = index;
        });
        elements.sort((a, b) => Number(a.zIndex || 0) - Number(b.zIndex || 0));
        elements.forEach((element, index) => {
            element.zIndex = index;
        });
    }

    getMetricLabel = function (type) {
        const labels = {
            'analog-hands': 'AGUJAS',
            'multi-rings': 'ANILLOS',
            'weather-icon': 'CLIMA ICONO',
            'temp-range': 'TEMP MIN/MAX',
            'moon-phase': 'LUNA',
            countdown: 'CUENTA ATRÁS',
            'work-remaining': 'TRABAJO',
            'sun-position': 'SOL',
            'separator-line': 'LÍNEA',
            'preset-icon': 'ICONO',
            'step-goal': 'OBJETIVO PASOS',
            'date-circle': 'FECHA CÍRCULO',
            'battery-icon': 'BATERÍA ICONO',
            'day-progress': 'PROGRESO DÍA',
            weather: 'CLIMA',
            temperature: 'TEMPERATURA',
            sunrise: 'AMANECER',
            sunset: 'ATARDECER',
            bluetooth: 'BLUETOOTH',
        };
        return labels[type] || originalGetMetricLabel(type);
    };

    supportsOptionalTitle = function (type) {
        if (['separator-line'].includes(type)) return false;
        return originalSupportsOptionalTitle(type);
    };

    hasAutoContentHeight = function (element) {
        if (element && ADVANCED_VISUAL_TYPES.includes(element.type)) return false;
        return originalHasAutoContentHeight(element);
    };

    getAutoContentHeight = function (element) {
        if (element && ADVANCED_TEXT_DYNAMIC_TYPES.includes(element.type)) {
            return Math.max(1, getTitleContentHeight(element) + getTextContentHeight(element));
        }
        return originalGetAutoContentHeight(element);
    };

    fitElementHeightToContent = function (element) {
        if (element && ADVANCED_VISUAL_TYPES.includes(element.type)) return element.height;
        return originalFitElementHeightToContent(element);
    };

    canRenderElementAsImage = function (element) {
        if (element && ADVANCED_IMAGE_EXPORT_TYPES.includes(element.type)) return false;
        return originalCanRenderElementAsImage(element);
    };

    getElementDisplayText = function (element) {
        if (element && ADVANCED_TEXT_DYNAMIC_TYPES.includes(element.type)) return getAdvancedDisplayText(element);
        return originalGetElementDisplayText(element);
    };

    getElementDisplayColor = function (element) {
        if (element && element.type === 'work-remaining') {
            const text = formatWorkRemainingForDisplay(element);
            if (text === 'LIBRE') return element.freeColor || '#93c5fd';
            if (text === 'JORNADA OK') return element.doneColor || '#a3e635';
        }
        return originalGetElementDisplayColor(element);
    };

    normalizeElement = function (element) {
        ensureAdvancedElementDefaults(element);
        return originalNormalizeElement(element);
    };

    addElement = function (type) {
        if (ADVANCED_TYPES.includes(type)) {
            pushAdvancedHistory('Añadir widget');
            closeWidgetDropdowns();
            const element = createAdvancedElement(type);
            elements.push(element);
            sortElementsByLayer();
            renderCanvas();
            selectElement(element.id);
            showNotification(`Widget de ${getMetricLabel(type)} añadido`, 'success');
            return;
        }
        pushAdvancedHistory('Añadir widget');
        closeWidgetDropdowns();
        originalAddElement(type);
        const added = elements[elements.length - 1];
        if (added && added.zIndex === undefined) added.zIndex = getNextZIndex();
    };

    renderCanvas = function () {
        sortElementsByLayer();
        originalRenderCanvas();
        decorateAdvancedRenderedElements();
        updateAdvancedInspectorUi();
    };

    function decorateAdvancedRenderedElements() {
        elements.forEach((element, index) => {
            const node = document.getElementById(element.id);
            if (!node) return;
            node.style.zIndex = String(element.zIndex ?? index);
            node.classList.toggle('opacity-30', !!element.locked);
            node.classList.toggle('outline', !!element.locked);
            node.classList.toggle('outline-1', !!element.locked);
            node.classList.toggle('outline-amber-300', !!element.locked);
            node.style.display = element.hidden ? 'none' : '';
            if (element.locked) node.title = 'Capa bloqueada';

            if (ADVANCED_VISUAL_TYPES.includes(element.type)) {
                node.innerHTML = renderAdvancedVisualHtml(element);
                if (selectedElementId === element.id && !styleCopyTargetId) {
                    const resizeHandle = document.createElement('button');
                    resizeHandle.type = 'button';
                    resizeHandle.className = 'element-resize-handle';
                    resizeHandle.title = 'Redimensionar';
                    resizeHandle.setAttribute('aria-label', 'Redimensionar elemento');
                    resizeHandle.addEventListener('mousedown', (e) => startResize(e, element.id));
                    resizeHandle.addEventListener('touchstart', (e) => startResize(e, element.id), { passive: false });
                    node.appendChild(resizeHandle);
                }
            }
        });
    }

    function renderAdvancedVisualHtml(element) {
        const title = element.titleEnabled ? `<div class="leading-none w-full" style="font-family:${getCssFontFamily(element.titleFontFamily || 'font-rajdhani')};font-size:${(element.titleFontSize || 10) * SCALE}px;color:${element.titleColor || '#94a3b8'};text-align:${element.textAlign || 'center'};">${escapeHtml(element.titleText || '')}</div>` : '';
        const contentHeight = Math.max(1, element.height - getTitleContentHeight(element));
        const w = Math.max(1, element.width * SCALE);
        const h = Math.max(1, contentHeight * SCALE);
        const color = element.color || '#ffffff';
        const bg = element.progressBgColor || '#1e293b';

        if (element.type === 'analog-hands') {
            const now = new Date();
            const hour = (now.getHours() % 12) + (now.getMinutes() / 60);
            const minute = now.getMinutes() + (now.getSeconds() / 60);
            const second = now.getSeconds();
            return `${title}<svg width="${w}" height="${h}" viewBox="0 0 100 100" class="w-full h-full">
                <circle cx="50" cy="50" r="47" fill="none" stroke="${bg}" stroke-width="2" opacity="0.9" />
                ${Array.from({ length: 12 }).map((_, i) => `<line x1="50" y1="7" x2="50" y2="12" stroke="${color}" stroke-width="${i % 3 === 0 ? 2 : 1}" transform="rotate(${i * 30} 50 50)" opacity="0.8" />`).join('')}
                <line x1="50" y1="50" x2="50" y2="27" stroke="${element.handHourColor || '#fff'}" stroke-width="4" stroke-linecap="round" transform="rotate(${hour * 30} 50 50)" />
                <line x1="50" y1="50" x2="50" y2="16" stroke="${element.handMinuteColor || '#38bdf8'}" stroke-width="2.6" stroke-linecap="round" transform="rotate(${minute * 6} 50 50)" />
                ${element.showSecondHand !== false ? `<line x1="50" y1="55" x2="50" y2="11" stroke="${element.handSecondColor || '#f43f5e'}" stroke-width="1.2" stroke-linecap="round" transform="rotate(${second * 6} 50 50)" />` : ''}
                <circle cx="50" cy="50" r="4" fill="${color}" />
            </svg>`;
        }

        if (element.type === 'multi-rings') {
            const metrics = String(element.ringMetrics || 'battery,steps,heart').split(',').map(item => item.trim()).filter(Boolean).slice(0, 4);
            const values = String(element.ringValues || '82,62,38').split(',').map(item => Math.max(0, Math.min(100, parseInt(item, 10) || 0)));
            const colors = ['#2dd4bf', '#fbbf24', '#f43f5e', '#a78bfa'];
            const rings = metrics.map((metric, index) => {
                const radius = 44 - (index * 8);
                const circumference = 2 * Math.PI * radius;
                const value = values[index] ?? 50;
                return `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${bg}" stroke-width="5" opacity="0.75" />
                    <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${colors[index] || color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - value / 100)}" transform="rotate(-90 50 50)" />`;
            }).join('');
            return `${title}<svg width="${w}" height="${h}" viewBox="0 0 100 100" class="w-full h-full">${rings}<text x="50" y="52" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="10" font-weight="700">${escapeHtml(metrics[0] || 'RINGS')}</text></svg>`;
        }

        if (element.type === 'weather-icon') {
            return `${title}<div class="w-full h-full flex items-center justify-center leading-none" style="font-size:${(element.fontSize || 44) * SCALE}px;color:${color};">${getWeatherIcon(element.weatherConditionPreview)}</div>`;
        }

        if (element.type === 'sun-position') {
            const progress = getSunProgress(element);
            const sunX = 10 + (progress * 80);
            const sunY = 82 - (Math.sin(progress * Math.PI) * 62);
            return `${title}<svg width="${w}" height="${h}" viewBox="0 0 100 50" class="w-full h-full">
                <path d="M8 42 Q50 -18 92 42" fill="none" stroke="${bg}" stroke-width="2" stroke-linecap="round" />
                <path d="M8 42 Q50 -18 92 42" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-dasharray="140" stroke-dashoffset="${140 * (1 - progress)}" />
                <line x1="8" y1="42" x2="92" y2="42" stroke="${bg}" stroke-width="1" />
                <circle cx="${sunX}" cy="${sunY}" r="5" fill="${color}" />
                <text x="8" y="49" fill="#94a3b8" font-size="6">${escapeHtml(element.sunriseTime || '06:42')}</text>
                <text x="92" y="49" text-anchor="end" fill="#94a3b8" font-size="6">${escapeHtml(element.sunsetTime || '21:38')}</text>
            </svg>`;
        }

        if (element.type === 'separator-line') {
            const thick = Math.max(1, (element.progressThickness || 2) * SCALE);
            if (element.lineDirection === 'vertical') {
                return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><div style="width:${thick}px;height:100%;background:${color};border-radius:999px;"></div></div>`;
            }
            return `<div style="width:100%;height:100%;display:flex;align-items:center;"><div style="width:100%;height:${thick}px;background:${color};border-radius:999px;"></div></div>`;
        }

        if (element.type === 'preset-icon') {
            return `${title}<div class="w-full h-full flex items-center justify-center leading-none" style="font-size:${(element.fontSize || 38) * SCALE}px;color:${color};">${escapeHtml(element.text || '★')}</div>`;
        }

        if (element.type === 'step-goal') {
            const steps = Math.max(0, parseInt(element.progressValue, 10) || 0);
            const goal = Math.max(1, parseInt(element.stepGoal, 10) || 10000);
            const percent = Math.max(0, Math.min(100, Math.round((steps / goal) * 100)));
            const radius = 43;
            const circumference = 2 * Math.PI * radius;
            return `${title}<svg width="${w}" height="${h}" viewBox="0 0 100 100" class="w-full h-full">
                <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${bg}" stroke-width="8" />
                <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - percent / 100)}" transform="rotate(-90 50 50)" />
                <text x="50" y="47" text-anchor="middle" fill="${color}" font-size="13" font-weight="700">${percent}%</text>
                <text x="50" y="62" text-anchor="middle" fill="#cbd5e1" font-size="7">${steps}/${goal}</text>
            </svg>`;
        }

        if (element.type === 'date-circle') {
            const parts = getDateParts(new Date());
            return `${title}<svg width="${w}" height="${h}" viewBox="0 0 100 100" class="w-full h-full">
                <circle cx="50" cy="50" r="46" fill="${bg}" stroke="${color}" stroke-width="3" />
                <text x="50" y="42" text-anchor="middle" fill="${color}" font-size="28" font-weight="700">${parts.day}</text>
                <text x="50" y="66" text-anchor="middle" fill="#cbd5e1" font-size="14" font-weight="700">${parts.monthShort}</text>
            </svg>`;
        }

        if (element.type === 'battery-icon') {
            const value = Math.max(0, Math.min(100, parseInt(element.progressValue, 10) || 0));
            return `${title}<svg width="${w}" height="${h}" viewBox="0 0 120 50" class="w-full h-full">
                <rect x="4" y="10" width="100" height="30" rx="7" fill="none" stroke="${color}" stroke-width="4" />
                <rect x="108" y="19" width="8" height="12" rx="2" fill="${color}" />
                <rect x="10" y="16" width="${Math.max(2, 88 * value / 100)}" height="18" rx="4" fill="${color}" />
                <text x="54" y="30" text-anchor="middle" dominant-baseline="middle" fill="#020617" font-size="13" font-weight="700">${value}%</text>
            </svg>`;
        }

        return `${title}<div style="color:${color};font-size:${(element.fontSize || 18) * SCALE}px;">${escapeHtml(element.text || '')}</div>`;
    }

    startDrag = function (event, id) {
        if (handlePositionCopyPick(event, id)) return;
        const element = elements.find((item) => item.id === id);
        if (element && element.locked) {
            event.preventDefault();
            event.stopPropagation();
            selectElement(id);
            showNotification('Capa bloqueada: desbloquéala para moverla', 'error');
            return;
        }
        originalStartDrag(event, id);
    };

    startResize = function (event, id) {
        const element = elements.find((item) => item.id === id);
        if (element && element.locked) {
            event.preventDefault();
            event.stopPropagation();
            showNotification('Capa bloqueada: desbloquéala para redimensionarla', 'error');
            return;
        }
        originalStartResize(event, id);
    };

    selectElement = function (id) {
        closeWidgetDropdowns();
        originalSelectElement(id);
        injectAdvancedInspectorControls();
        updateAdvancedInspectorUi();
    };

    updateElementProp = function (key, value) {
        pushAdvancedHistory('Editar widget');
        originalUpdateElementProp(key, value);
        const element = elements.find((item) => item.id === selectedElementId);
        if (element) {
            ensureAdvancedElementDefaults(element);
            updateAdvancedInspectorUi();
        }
    };

    copyStyle = function (source, target) {
        originalCopyStyle(source, target);
        [
            'color', 'progressBgColor', 'progressThickness', 'lineDirection',
            'handHourColor', 'handMinuteColor', 'handSecondColor', 'showSecondHand',
            'weatherConditionPreview', 'ringMetrics', 'ringValues'
        ].forEach((prop) => {
            if (source[prop] !== undefined) target[prop] = source[prop];
        });
    };

    getGeneratedTextExpression = function (element) {
        if (element.type === 'work-remaining') {
            return wrapGeneratedMetricText(element, `getMetricText('work-remaining', '${escapeGeneratedText(formatWorkRemainingForDisplay(element))}', { workStart: '${escapeGeneratedText(element.workStart || '08:00')}', workEnd: '${escapeGeneratedText(element.workEnd || '15:00')}', weekdaysOnly: ${element.workWeekdaysOnly !== false} })`);
        }
        if (element.type === 'countdown') {
            return wrapGeneratedMetricText(element, `getMetricText('countdown', '${escapeGeneratedText(formatCountdownForDisplay(element))}', { target: '${escapeGeneratedText(element.countdownTarget || getDefaultCountdownTarget())}' })`);
        }
        if (element.type === 'moon-phase') {
            return wrapGeneratedMetricText(element, `getMetricText('moon-phase', '${escapeGeneratedText(getMoonPhaseName())}', {})`);
        }
        if (element.type === 'day-progress') {
            return wrapGeneratedMetricText(element, `getMetricText('day-progress', '${escapeGeneratedText(`DÍA ${getDayProgressPercent()}%`)}', {})`);
        }
        if (element.type === 'temp-range') {
            return wrapGeneratedMetricText(element, `getMetricText('temp-range', '${escapeGeneratedText(getAdvancedDisplayText(element))}', { minFallback: ${parseInt(element.tempMin, 10) || 18}, maxFallback: ${parseInt(element.tempMax, 10) || 31} })`);
        }
        return originalGetGeneratedTextExpression(element);
    };

    getDynamicMetricType = function (element) {
        if (element && ADVANCED_TEXT_DYNAMIC_TYPES.includes(element.type)) return element.type;
        return originalGetDynamicMetricType(element);
    };

    elementNeedsSecondRefresh = function (element) {
        if (element && ['work-remaining', 'countdown', 'day-progress'].includes(element.type)) return true;
        return originalElementNeedsSecondRefresh(element);
    };

    function injectAdvancedToolbar() {
        if (document.getElementById('advanced-widget-group')) return;
        const toolbar = document.querySelector('.widget-toolbar');
        if (!toolbar) return;
        const group = document.createElement('details');
        group.id = 'advanced-widget-group';
        group.className = 'widget-group';
        group.innerHTML = `
            <summary><i data-lucide="sparkles" class="w-4 h-4 text-cyan-300"></i><span>Avanzados</span></summary>
            <div class="widget-group-menu advanced-widget-menu">
                <button onclick="addElement('analog-hands')" class="widget-tool"><i data-lucide="clock" class="w-4 h-4 text-cyan-300"></i><span>Agujas</span></button>
                <button onclick="addElement('multi-rings')" class="widget-tool"><i data-lucide="circle-gauge" class="w-4 h-4 text-emerald-300"></i><span>Anillos</span></button>
                <button onclick="addElement('weather-icon')" class="widget-tool"><i data-lucide="cloud-sun" class="w-4 h-4 text-yellow-300"></i><span>Icono clima</span></button>
                <button onclick="addElement('temp-range')" class="widget-tool"><i data-lucide="thermometer" class="w-4 h-4 text-orange-300"></i><span>Min/Max</span></button>
                <button onclick="addElement('moon-phase')" class="widget-tool"><i data-lucide="moon" class="w-4 h-4 text-violet-300"></i><span>Luna</span></button>
                <button onclick="addElement('countdown')" class="widget-tool"><i data-lucide="hourglass" class="w-4 h-4 text-sky-300"></i><span>Cuenta atrás</span></button>
                <button onclick="addElement('work-remaining')" class="widget-tool"><i data-lucide="briefcase" class="w-4 h-4 text-lime-300"></i><span>Salida trabajo</span></button>
                <button onclick="addElement('sun-position')" class="widget-tool"><i data-lucide="sun" class="w-4 h-4 text-amber-300"></i><span>Posición sol</span></button>
                <button onclick="addElement('separator-line')" class="widget-tool"><i data-lucide="minus" class="w-4 h-4 text-slate-300"></i><span>Línea</span></button>
                <button onclick="addElement('preset-icon')" class="widget-tool"><i data-lucide="star" class="w-4 h-4 text-yellow-300"></i><span>Icono</span></button>
                <button onclick="addElement('step-goal')" class="widget-tool"><i data-lucide="footprints" class="w-4 h-4 text-amber-300"></i><span>Objetivo pasos</span></button>
                <button onclick="addElement('date-circle')" class="widget-tool"><i data-lucide="calendar-days" class="w-4 h-4 text-cyan-300"></i><span>Fecha círculo</span></button>
                <button onclick="addElement('battery-icon')" class="widget-tool"><i data-lucide="battery" class="w-4 h-4 text-teal-300"></i><span>Batería icono</span></button>
                <button onclick="addElement('day-progress')" class="widget-tool"><i data-lucide="sun-medium" class="w-4 h-4 text-yellow-300"></i><span>Progreso día</span></button>
            </div>`;
        toolbar.appendChild(group);
        lucide.createIcons();
    }

    function closeWidgetDropdowns(except) {
        document.querySelectorAll('.widget-group[open]').forEach((details) => {
            if (details !== except) details.removeAttribute('open');
        });
    }

    function setupDropdownAutoClose() {
        document.addEventListener('click', (event) => {
            const current = event.target.closest('.widget-group');
            if (!current) closeWidgetDropdowns();
            document.querySelectorAll('.widget-group').forEach((details) => {
                if (details !== current) details.removeAttribute('open');
            });
        });
        document.querySelectorAll('.widget-group button').forEach((button) => {
            button.addEventListener('click', () => closeWidgetDropdowns());
        });
    }

    function injectAdvancedStyles() {
        if (document.getElementById('advanced-integrated-styles')) return;
        const style = document.createElement('style');
        style.id = 'advanced-integrated-styles';
        style.textContent = `
            .advanced-widget-menu{min-width:260px;grid-template-columns:repeat(2,minmax(0,1fr));}
            .advanced-panel{border:1px solid rgba(30,41,59,.9);background:rgba(2,6,23,.5);border-radius:.75rem;padding:.65rem;}
            .advanced-panel-title{font-size:10px;color:#93c5fd;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem;display:flex;align-items:center;gap:.35rem;}
            .advanced-mini-btn{height:2rem;border-radius:.45rem;background:#0f172a;border:1px solid #1e293b;color:#cbd5e1;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:.25rem;transition:.15s ease;}
            .advanced-mini-btn:hover{background:#1e293b;color:#fff;}
            .advanced-mini-btn.is-active{border-color:#fbbf24;color:#fde68a;background:rgba(120,53,15,.35);}
            .advanced-field{width:100%;background:#020617;border:1px solid #1e293b;border-radius:.35rem;padding:.35rem .45rem;font-size:11px;color:#e2e8f0;}
            .advanced-label{font-size:9px;color:#94a3b8;font-weight:700;display:block;margin-bottom:.2rem;}
        `;
        document.head.appendChild(style);
    }

    function injectAdvancedInspectorControls() {
        const form = document.getElementById('inspector-form');
        if (!form || document.getElementById('advanced-layer-panel')) return;
        const copyStyle = document.getElementById('prop-copy-style-container');
        const panel = document.createElement('div');
        panel.id = 'advanced-layer-panel';
        panel.className = 'advanced-panel space-y-2';
        panel.innerHTML = `
            <div class="advanced-panel-title"><i data-lucide="layers" class="w-3.5 h-3.5"></i>Capas y edición</div>
            <div class="grid grid-cols-4 gap-1.5">
                <button type="button" onclick="advancedSendBackward()" class="advanced-mini-btn" title="Enviar atrás"><i data-lucide="chevron-down" class="w-3.5 h-3.5"></i></button>
                <button type="button" onclick="advancedBringForward()" class="advanced-mini-btn" title="Traer adelante"><i data-lucide="chevron-up" class="w-3.5 h-3.5"></i></button>
                <button type="button" onclick="advancedSendToBack()" class="advanced-mini-btn" title="Enviar al fondo"><i data-lucide="corner-down-left" class="w-3.5 h-3.5"></i></button>
                <button type="button" onclick="advancedBringToFront()" class="advanced-mini-btn" title="Traer al frente"><i data-lucide="corner-up-right" class="w-3.5 h-3.5"></i></button>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
                <button type="button" id="advanced-lock-btn" onclick="advancedToggleLock()" class="advanced-mini-btn"><i data-lucide="lock" class="w-3.5 h-3.5"></i>Lock</button>
                <button type="button" id="advanced-hide-btn" onclick="advancedToggleHidden()" class="advanced-mini-btn"><i data-lucide="eye-off" class="w-3.5 h-3.5"></i>Hide</button>
                <button type="button" onclick="advancedDuplicateSelected()" class="advanced-mini-btn"><i data-lucide="copy-plus" class="w-3.5 h-3.5"></i>Dup</button>
                <button type="button" onclick="advancedUndo()" class="advanced-mini-btn"><i data-lucide="undo-2" class="w-3.5 h-3.5"></i></button>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
                <button type="button" onclick="advancedRedoAction()" class="advanced-mini-btn"><i data-lucide="redo-2" class="w-3.5 h-3.5"></i></button>
                <button type="button" onclick="advancedStartPositionCopy('x')" class="advanced-mini-btn">Copiar X</button>
                <button type="button" onclick="advancedStartPositionCopy('y')" class="advanced-mini-btn">Copiar Y</button>
                <input id="advanced-z-index" type="number" class="advanced-field text-center" title="z-index" onchange="advancedSetZIndex(parseInt(this.value)||0)">
            </div>
            <div class="grid grid-cols-4 gap-1.5">
                <button type="button" onclick="centerSelectedElement('horizontal')" class="advanced-mini-btn">Centro X</button>
                <button type="button" onclick="centerSelectedElement('vertical')" class="advanced-mini-btn">Centro Y</button>
                <button type="button" onclick="advancedDistributeSelected('horizontal')" class="advanced-mini-btn">Distrib. X</button>
                <button type="button" onclick="advancedDistributeSelected('vertical')" class="advanced-mini-btn">Distrib. Y</button>
            </div>`;
        if (copyStyle) copyStyle.insertAdjacentElement('afterend', panel);
        else form.prepend(panel);

        const advancedProps = document.createElement('div');
        advancedProps.id = 'advanced-widget-props';
        advancedProps.className = 'advanced-panel space-y-2 hidden';
        advancedProps.innerHTML = `<div class="advanced-panel-title"><i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>Opciones avanzadas</div><div id="advanced-widget-props-body" class="space-y-2"></div>`;
        const titleContainer = document.getElementById('prop-title-container');
        if (titleContainer) titleContainer.insertAdjacentElement('beforebegin', advancedProps);
        else form.appendChild(advancedProps);
        lucide.createIcons();
    }

    function updateAdvancedInspectorUi() {
        const element = elements.find((item) => item.id === selectedElementId);
        const panel = document.getElementById('advanced-layer-panel');
        if (panel) panel.classList.toggle('hidden', !element);
        if (!element) return;
        const zInput = document.getElementById('advanced-z-index');
        if (zInput) zInput.value = element.zIndex ?? 0;
        const lockButton = document.getElementById('advanced-lock-btn');
        if (lockButton) lockButton.classList.toggle('is-active', !!element.locked);
        const hideButton = document.getElementById('advanced-hide-btn');
        if (hideButton) hideButton.classList.toggle('is-active', !!element.hidden);
        updateAdvancedWidgetProps(element);
    }

    function updateAdvancedWidgetProps(element) {
        const container = document.getElementById('advanced-widget-props');
        const body = document.getElementById('advanced-widget-props-body');
        if (!container || !body) return;
        if (!ADVANCED_TYPES.includes(element.type)) {
            container.classList.add('hidden');
            body.innerHTML = '';
            return;
        }
        container.classList.remove('hidden');
        const input = (label, key, type = 'text', attrs = '') => `
            <div><label class="advanced-label">${label}</label><input class="advanced-field" type="${type}" value="${escapeHtml(element[key] ?? '')}" ${attrs} oninput="updateElementProp('${key}', this.type === 'number' ? parseFloat(this.value) : this.value)"></div>`;
        const checkbox = (label, key) => `
            <label class="flex items-center gap-2 text-[10px] text-slate-300 font-bold uppercase"><input type="checkbox" class="accent-cyan-500" ${element[key] ? 'checked' : ''} onchange="updateElementProp('${key}', this.checked)">${label}</label>`;
        const select = (label, key, options) => `
            <div><label class="advanced-label">${label}</label><select class="advanced-field" onchange="updateElementProp('${key}', this.value)">${options.map(([value, text]) => `<option value="${value}" ${element[key] === value ? 'selected' : ''}>${text}</option>`).join('')}</select></div>`;
        let html = '';
        if (element.type === 'work-remaining') {
            html += `<div class="grid grid-cols-2 gap-2">${input('Hora entrada', 'workStart', 'time')}${input('Hora salida', 'workEnd', 'time')}</div>`;
            html += checkbox('Solo días de diario', 'workWeekdaysOnly');
        } else if (element.type === 'sun-position') {
            html += `<div class="grid grid-cols-2 gap-2">${input('Amanecer', 'sunriseTime', 'time')}${input('Anochecer', 'sunsetTime', 'time')}</div>`;
        } else if (element.type === 'countdown') {
            html += input('Fecha/hora objetivo', 'countdownTarget', 'datetime-local');
        } else if (element.type === 'temp-range') {
            html += `<div class="grid grid-cols-2 gap-2">${input('Temp. mínima', 'tempMin', 'number')}${input('Temp. máxima', 'tempMax', 'number')}</div>`;
        } else if (element.type === 'separator-line') {
            html += select('Dirección', 'lineDirection', [['horizontal', 'Horizontal'], ['vertical', 'Vertical']]);
            html += input('Grosor', 'progressThickness', 'number', 'min="1" max="30"');
        } else if (element.type === 'preset-icon') {
            html += input('Icono/texto', 'text');
        } else if (element.type === 'step-goal') {
            html += `<div class="grid grid-cols-2 gap-2">${input('Pasos muestra', 'progressValue', 'number')}${input('Objetivo', 'stepGoal', 'number')}</div>`;
            html += input('Grosor aro', 'progressThickness', 'number', 'min="2" max="40"');
        } else if (element.type === 'battery-icon') {
            html += input('Batería muestra', 'progressValue', 'number', 'min="0" max="100"');
        } else if (element.type === 'weather-icon') {
            html += input('Condición muestra', 'weatherConditionPreview');
        } else if (element.type === 'analog-hands') {
            html += `<div class="grid grid-cols-3 gap-2">${input('Hora', 'handHourColor', 'color')}${input('Minuto', 'handMinuteColor', 'color')}${input('Segundo', 'handSecondColor', 'color')}</div>`;
            html += checkbox('Mostrar segundero', 'showSecondHand');
        } else if (element.type === 'multi-rings') {
            html += input('Métricas', 'ringMetrics');
            html += input('Valores %', 'ringValues');
            html += input('Grosor', 'progressThickness', 'number', 'min="2" max="40"');
        }
        body.innerHTML = html || '<p class="text-xs text-slate-500">Sin opciones específicas.</p>';
    }

    function handlePositionCopyPick(event, sourceId) {
        if (!advancedPositionCopyTargetId || !advancedPositionCopyAxis) return false;
        event.preventDefault();
        event.stopPropagation();
        if (sourceId === advancedPositionCopyTargetId) {
            showNotification('Elige otro elemento como origen de posición', 'error');
            return true;
        }
        const source = elements.find((item) => item.id === sourceId);
        const target = elements.find((item) => item.id === advancedPositionCopyTargetId);
        if (!source || !target) return true;
        pushAdvancedHistory('Copiar posición');
        if (advancedPositionCopyAxis === 'x') target.x = source.x;
        if (advancedPositionCopyAxis === 'y') target.y = source.y;
        clampElementToCanvas(target);
        advancedPositionCopyTargetId = null;
        advancedPositionCopyAxis = null;
        renderCanvas();
        selectElement(target.id);
        showNotification('Posición copiada', 'success');
        return true;
    }

    window.advancedStartPositionCopy = function (axis) {
        if (!selectedElementId) return;
        if (!elements.some((item) => item.id !== selectedElementId)) {
            showNotification('Añade otro elemento para copiar su posición', 'error');
            return;
        }
        advancedPositionCopyTargetId = selectedElementId;
        advancedPositionCopyAxis = axis;
        showNotification(`Selecciona el widget origen para copiar ${axis.toUpperCase()}`);
    };

    function selectedIndex() {
        sortElementsByLayer();
        return elements.findIndex((item) => item.id === selectedElementId);
    }

    function renumberLayers() {
        elements.forEach((item, index) => { item.zIndex = index; });
    }

    window.advancedBringForward = function () {
        const index = selectedIndex();
        if (index < 0 || index >= elements.length - 1) return;
        pushAdvancedHistory('Traer adelante');
        [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
        renumberLayers();
        renderCanvas();
        selectElement(selectedElementId);
    };

    window.advancedSendBackward = function () {
        const index = selectedIndex();
        if (index <= 0) return;
        pushAdvancedHistory('Enviar atrás');
        [elements[index], elements[index - 1]] = [elements[index - 1], elements[index]];
        renumberLayers();
        renderCanvas();
        selectElement(selectedElementId);
    };

    window.advancedBringToFront = function () {
        const index = selectedIndex();
        if (index < 0) return;
        pushAdvancedHistory('Traer al frente');
        const [item] = elements.splice(index, 1);
        elements.push(item);
        renumberLayers();
        renderCanvas();
        selectElement(item.id);
    };

    window.advancedSendToBack = function () {
        const index = selectedIndex();
        if (index < 0) return;
        pushAdvancedHistory('Enviar al fondo');
        const [item] = elements.splice(index, 1);
        elements.unshift(item);
        renumberLayers();
        renderCanvas();
        selectElement(item.id);
    };

    window.advancedToggleLock = function () {
        const element = elements.find((item) => item.id === selectedElementId);
        if (!element) return;
        pushAdvancedHistory('Bloquear capa');
        element.locked = !element.locked;
        renderCanvas();
        selectElement(element.id);
    };

    window.advancedToggleHidden = function () {
        const element = elements.find((item) => item.id === selectedElementId);
        if (!element) return;
        pushAdvancedHistory('Ocultar capa');
        element.hidden = !element.hidden;
        renderCanvas();
        selectElement(element.id);
    };

    window.advancedDuplicateSelected = function () {
        const source = elements.find((item) => item.id === selectedElementId);
        if (!source) return;
        pushAdvancedHistory('Duplicar widget');
        const clone = JSON.parse(JSON.stringify(source));
        clone.id = 'el_' + Date.now();
        clone.x = Math.min(getCanvasWidth() - clone.width, clone.x + 12);
        clone.y = Math.min(getCanvasHeight() - clone.height, clone.y + 12);
        clone.zIndex = getNextZIndex();
        clone.locked = false;
        clone.hidden = false;
        elements.push(normalizeElement(clone));
        renderCanvas();
        selectElement(clone.id);
        showNotification('Widget duplicado', 'success');
    };

    window.advancedSetZIndex = function (value) {
        const element = elements.find((item) => item.id === selectedElementId);
        if (!element) return;
        pushAdvancedHistory('Cambiar z-index');
        element.zIndex = Math.max(0, value);
        sortElementsByLayer();
        renderCanvas();
        selectElement(element.id);
    };

    window.advancedDistributeSelected = function (axis) {
        if (elements.length < 3) {
            showNotification('Necesitas al menos 3 widgets para distribuir', 'error');
            return;
        }
        pushAdvancedHistory('Distribuir widgets');
        const visible = elements.filter((item) => !item.hidden).sort((a, b) => axis === 'vertical' ? a.y - b.y : a.x - b.x);
        if (visible.length < 3) return;
        const first = visible[0];
        const last = visible[visible.length - 1];
        const start = axis === 'vertical' ? first.y : first.x;
        const end = axis === 'vertical' ? last.y : last.x;
        const step = (end - start) / (visible.length - 1);
        visible.forEach((item, index) => {
            if (axis === 'vertical') item.y = Math.round(start + (step * index));
            else item.x = Math.round(start + (step * index));
            clampElementToCanvas(item);
        });
        renderCanvas();
        if (selectedElementId) selectElement(selectedElementId);
    };

    function getAdvancedSnapshot() {
        return JSON.stringify({ elements, watchConfig });
    }

    function applyAdvancedSnapshot(snapshot) {
        const parsed = JSON.parse(snapshot);
        elements = Array.isArray(parsed.elements) ? parsed.elements.map(normalizeElement) : [];
        watchConfig = { ...watchConfig, ...(parsed.watchConfig || {}) };
        selectedElementId = elements.some((item) => item.id === selectedElementId) ? selectedElementId : null;
        updateWatchViewport();
        renderCanvas();
        selectElement(selectedElementId);
        saveCurrentDesignNow();
    }

    function pushAdvancedHistory(label) {
        if (advancedHistorySuspended) return;
        const snapshot = getAdvancedSnapshot();
        if (advancedHistory[advancedHistory.length - 1] === snapshot) return;
        advancedHistory.push(snapshot);
        if (advancedHistory.length > 60) advancedHistory.shift();
        advancedRedo.length = 0;
    }

    window.advancedUndo = function () {
        if (!advancedHistory.length) return;
        advancedHistorySuspended = true;
        const current = getAdvancedSnapshot();
        const previous = advancedHistory.pop();
        advancedRedo.push(current);
        applyAdvancedSnapshot(previous);
        advancedHistorySuspended = false;
        showNotification('Deshacer', 'success');
    };

    window.advancedRedoAction = function () {
        if (!advancedRedo.length) return;
        advancedHistorySuspended = true;
        const current = getAdvancedSnapshot();
        const next = advancedRedo.pop();
        advancedHistory.push(current);
        applyAdvancedSnapshot(next);
        advancedHistorySuspended = false;
        showNotification('Rehacer', 'success');
    };

    deleteSelectedElement = function () {
        pushAdvancedHistory('Eliminar widget');
        originalDeleteSelectedElement();
    };

    clearCanvas = function () {
        pushAdvancedHistory('Limpiar esfera');
        originalClearCanvas();
    };

    applyTemplate = function (key) {
        pushAdvancedHistory('Aplicar plantilla');
        originalApplyTemplate(key);
        elements.forEach((item, index) => { if (item.zIndex === undefined) item.zIndex = index; });
    };

    stopDrag = function () {
        pushAdvancedHistory('Mover widget');
        originalStopDrag();
    };

    stopResize = function () {
        pushAdvancedHistory('Redimensionar widget');
        originalStopResize();
    };

    moveSelectedElementBy = function (deltaX, deltaY) {
        pushAdvancedHistory('Mover widget');
        originalMoveSelectedElementBy(deltaX, deltaY);
    };

    centerSelectedElement = function (axis) {
        pushAdvancedHistory('Centrar widget');
        originalCenterSelectedElement(axis);
    };

    async function createImageElementAssetDataUrl(element) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(element.width));
        canvas.height = Math.max(1, Math.round(element.height));
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (element.imageSrc) {
            await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    ctx.globalAlpha = element.opacity ?? 1;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve();
                };
                img.onerror = resolve;
                img.src = element.imageSrc;
            });
        } else {
            ctx.fillStyle = element.color || '#fff';
            ctx.font = `${Math.max(12, canvas.height * 0.72)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(element.text || '★', canvas.width / 2, canvas.height / 2);
        }
        return canvas.toDataURL('image/png');
    }

    async function createAdvancedElementImageDataUrl(element) {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(element.width));
        canvas.height = Math.max(1, Math.round(element.height));
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = element.opacity ?? 1;
        drawAdvancedElementOnCanvas(ctx, element, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    }

    function drawAdvancedElementOnCanvas(ctx, element, width, height) {
        const color = element.color || '#fff';
        const bg = element.progressBgColor || '#1e293b';
        const titleOffset = element.titleEnabled ? Math.max(0, element.titleFontSize || 10) + 2 : 0;
        if (element.titleEnabled) {
            ctx.fillStyle = element.titleColor || '#94a3b8';
            ctx.font = getCanvasFont(element.titleFontFamily || 'font-rajdhani', element.titleFontSize || 10, 'bold');
            ctx.textAlign = element.textAlign === 'left' ? 'left' : element.textAlign === 'right' ? 'right' : 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(element.titleText || '', element.textAlign === 'left' ? 0 : element.textAlign === 'right' ? width : width / 2, 0);
        }
        const h = Math.max(1, height - titleOffset);
        const cy = titleOffset + (h / 2);
        if (element.type === 'separator-line') {
            ctx.strokeStyle = color;
            ctx.lineWidth = element.progressThickness || 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            if (element.lineDirection === 'vertical') {
                ctx.moveTo(width / 2, titleOffset);
                ctx.lineTo(width / 2, height);
            } else {
                ctx.moveTo(0, cy);
                ctx.lineTo(width, cy);
            }
            ctx.stroke();
            return;
        }
        if (element.type === 'preset-icon' || element.type === 'weather-icon') {
            ctx.fillStyle = color;
            ctx.font = `${element.fontSize || Math.min(width, h) * 0.72}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(element.type === 'weather-icon' ? getWeatherIcon(element.weatherConditionPreview) : (element.text || '★'), width / 2, cy);
            return;
        }
        if (element.type === 'date-circle') {
            const parts = getDateParts(new Date());
            const r = Math.max(2, Math.min(width, h) / 2 - 3);
            ctx.fillStyle = bg;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(width / 2, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = getCanvasFont(element.fontFamily || 'font-chakra', Math.max(14, r * 0.6), 'bold');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(parts.day, width / 2, cy - r * 0.12);
            ctx.fillStyle = '#cbd5e1';
            ctx.font = getCanvasFont(element.fontFamily || 'font-chakra', Math.max(9, r * 0.28), 'bold');
            ctx.fillText(parts.monthShort, width / 2, cy + r * 0.38);
            return;
        }
        if (element.type === 'battery-icon') {
            const value = Math.max(0, Math.min(100, parseInt(element.progressValue, 10) || 0));
            const bodyW = width - 16;
            const bodyH = Math.min(h - 6, height * 0.7);
            const x = 2;
            const y = titleOffset + (h - bodyH) / 2;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(x, y, bodyW, bodyH, 7);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x + bodyW + 3, y + bodyH * 0.32, 8, bodyH * 0.36, 2);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(x + 5, y + 5, Math.max(2, (bodyW - 10) * value / 100), Math.max(1, bodyH - 10), 4);
            ctx.fill();
            ctx.fillStyle = '#020617';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${value}%`, x + bodyW / 2, y + bodyH / 2);
            return;
        }
        if (element.type === 'analog-hands' || element.type === 'multi-rings' || element.type === 'step-goal' || element.type === 'sun-position' || element.type === 'chart') {
            // Para exportación se usa una versión simplificada y fiel al preview.
            const temp = document.createElement('div');
            temp.innerHTML = renderAdvancedVisualHtml(element).replace(/<div[^>]*>.*?<\/div>/, '');
            const label = element.type === 'sun-position' ? 'SOL' : element.type === 'analog-hands' ? '◷' : element.type === 'chart' ? '⌁' : element.type === 'step-goal' ? 'PASOS' : 'RINGS';
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = Math.max(2, element.progressThickness || 3);
            if (element.type === 'sun-position') {
                const p = getSunProgress(element);
                const sx = width * 0.1;
                const ex = width * 0.9;
                const baseY = titleOffset + h * 0.82;
                ctx.strokeStyle = bg;
                ctx.beginPath();
                ctx.moveTo(sx, baseY);
                ctx.quadraticCurveTo(width / 2, titleOffset, ex, baseY);
                ctx.stroke();
                const sunX = sx + ((ex - sx) * p);
                const sunY = baseY - Math.sin(p * Math.PI) * h * 0.65;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(sunX, sunY, Math.max(4, Math.min(width, h) * 0.05), 0, Math.PI * 2);
                ctx.fill();
                return;
            }
            const r = Math.max(4, Math.min(width, h) / 2 - 5);
            ctx.beginPath();
            ctx.arc(width / 2, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, width / 2, cy);
        }
    }

    addElementImageAssets = async function (root) {
        await originalAddElementImageAssets(root);
        for (let idx = 0; idx < elements.length; idx += 1) {
            const element = elements[idx];
            normalizeElement(element);
            if (ADVANCED_IMAGE_EXPORT_TYPES.includes(element.type)) {
                const dataUrl = await createAdvancedElementImageDataUrl(element);
                root.file(`assets/default/advanced_${idx}.png`, dataUrlToUint8Array(dataUrl));
            }
            if (element.type === 'image') {
                const dataUrl = await createImageElementAssetDataUrl(element);
                root.file(`assets/default/image_${idx}.png`, dataUrlToUint8Array(dataUrl));
            }
        }
    };

    generateZeppCode = function () {
        originalGenerateZeppCode();
        const codeBox = document.getElementById('zepp-code-box');
        if (!codeBox) return;
        let code = codeBox.innerText;
        code = patchGeneratedMetricReaders(code);
        code = patchGeneratedActive3PremiumSensors(code);
        code = patchGeneratedSensorDebug(code);
        code = patchGeneratedAdvancedMetricText(code);
        code = code.replace(/src: 'icon_(\d+)\.png'/g, "src: 'image_$1.png'");
        code = insertAdvancedImageWidgets(code);
        codeBox.innerText = code;
    };

    function patchGeneratedSensorDebug(code) {
        const debugHelpers = `const SENSOR_DEBUG = true
let debugUpdateCount = 0
function debugLog(label, value) {
  if (!SENSOR_DEBUG) return
  try {
    if (value === undefined) {
      console.log('[AmazfitEditor] ' + label)
    } else if (value === null) {
      console.log('[AmazfitEditor] ' + label + ': null')
    } else if (typeof value === 'object') {
      const keys = []
      for (const key in value) keys.push(key)
      console.log('[AmazfitEditor] ' + label + ': object keys=' + keys.join(','))
    } else {
      console.log('[AmazfitEditor] ' + label + ': ' + value)
    }
  } catch (err) {
    try { console.log('[AmazfitEditor] log-error ' + label) } catch (e) {}
  }
}
function debugMetric(type, value, fallback) {
  debugLog('metric ' + type, value)
  if (value === fallback || value === '--' || value === '' || value === 0) debugLog('metric ' + type + ' usando fallback/valor vacio', value)
  return value
}
function debugSensorStatus(type, sensor) {
  debugLog('sensor ' + type, sensor ? 'OK' : 'NO DISPONIBLE')
  if (sensor) debugLog('sensor ' + type + ' props', sensor)
}

`;
        if (!code.includes('const SENSOR_DEBUG = true')) {
            code = code.replace('let refreshTimer = null\n', 'let refreshTimer = null\n' + debugHelpers);
        }

        code = code.replace(
            "  if (typeof hmSensor === 'undefined' || !hmSensor.id || typeof hmSensor.createSensor !== 'function') return null\n",
            "  if (typeof hmSensor === 'undefined' || !hmSensor.id || typeof hmSensor.createSensor !== 'function') {\n    debugLog('hmSensor no disponible para ' + type)\n    return null\n  }\n"
        );
        code = code.replace(
            "    const sensorId = hmSensor.id[aliases[i]]\n    if (sensorId !== undefined) {\n      try {\n        return hmSensor.createSensor(sensorId)\n      } catch (err) {}\n    }\n",
            "    const alias = aliases[i]\n    const sensorId = hmSensor.id[alias]\n    debugLog('probando sensor ' + type + ' alias ' + alias, sensorId === undefined ? 'NO EXISTE' : 'EXISTE')\n    if (sensorId !== undefined) {\n      try {\n        const sensor = hmSensor.createSensor(sensorId)\n        debugLog('sensor creado ' + type + ' con ' + alias, sensor ? 'OK' : 'NULL')\n        return sensor\n      } catch (err) {\n        debugLog('error creando sensor ' + type + ' con ' + alias, err && err.message ? err.message : 'ERROR')\n      }\n    }\n"
        );
        code = code.replace(
            "  return null\n}\n\nfunction startRefreshTimer()",
            "  debugLog('sensor no creado ' + type)\n  return null\n}\n\nfunction startRefreshTimer()"
        );

        code = code.replace(
            "      metricSensors[type] = createSafeSensorByType(type)\n",
            "      metricSensors[type] = createSafeSensorByType(type)\n      debugSensorStatus(type, metricSensors[type])\n"
        );
        code = code.replace(
            "    console.log('Esfera Cargada con Éxito')\n",
            "    console.log('Esfera Cargada con Éxito')\n    debugLog('debug sensores activo')\n"
        );
        code = code.replace(
            "function getWeatherForecast() {\n  const weather = metricSensors.weather\n  if (!weather) return null\n  return safeRead(() => {\n    if (typeof weather.getForecastWeather === 'function') return weather.getForecastWeather()\n    if (typeof weather.getForecast === 'function') return weather.getForecast()\n    return null\n  }, null)\n}\n",
            "function getWeatherForecast() {\n  const weather = metricSensors.weather\n  if (!weather) {\n    debugLog('weather forecast', 'SIN SENSOR')\n    return null\n  }\n  const forecast = safeRead(() => {\n    if (typeof weather.getForecastWeather === 'function') {\n      debugLog('weather metodo', 'getForecastWeather')\n      return weather.getForecastWeather()\n    }\n    if (typeof weather.getForecast === 'function') {\n      debugLog('weather metodo', 'getForecast')\n      return weather.getForecast()\n    }\n    debugLog('weather metodo', 'NO DISPONIBLE')\n    return null\n  }, null)\n  debugLog('weather forecast', forecast)\n  if (forecast && forecast.forecastData) debugLog('weather forecastData', forecast.forecastData)\n  if (forecast && forecast.tideData) debugLog('weather tideData', forecast.tideData)\n  return forecast\n}\n"
        );
        code = code.replace(
            "  if (forecast && forecast.forecastData && forecast.forecastData.data && forecast.forecastData.data[0]) return forecast.forecastData.data[0]\n  return null\n",
            "  if (forecast && forecast.forecastData && forecast.forecastData.data && forecast.forecastData.data[0]) {\n    debugLog('weather today forecast item', forecast.forecastData.data[0])\n    return forecast.forecastData.data[0]\n  }\n  debugLog('weather today forecast item', 'NO DISPONIBLE')\n  return null\n",
            1
        );
        code = code.replace(
            "  if (forecast && forecast.tideData && forecast.tideData.data && forecast.tideData.data[0]) return forecast.tideData.data[0]\n  return null\n",
            "  if (forecast && forecast.tideData && forecast.tideData.data && forecast.tideData.data[0]) {\n    debugLog('weather today tide item', forecast.tideData.data[0])\n    return forecast.tideData.data[0]\n  }\n  debugLog('weather today tide item', 'NO DISPONIBLE')\n  return null\n"
        );

        const metricReplacements = {
            "  if (type === 'battery') return clamp(Math.round(readNumber(source, ['getCurrent', 'getBattery'], ['current', 'battery', 'value'], 0)), 0, 100)":
            "  if (type === 'battery') return debugMetric('battery', clamp(Math.round(readNumber(source, ['getCurrent', 'getBattery'], ['current', 'battery', 'value'], 0)), 0, 100), 0)",
            "  if (type === 'steps') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'step', 'steps', 'value'], 0)))":
            "  if (type === 'steps') return debugMetric('steps', Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'step', 'steps', 'value'], 0))), 0)",
            "  if (type === 'heart') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getLast'], ['current', 'last', 'heartRate', 'bpm', 'value'], 0)))":
            "  if (type === 'heart') return debugMetric('heart', Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getLast'], ['current', 'last', 'heartRate', 'bpm', 'value'], 0))), 0)",
            "  if (type === 'calories') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'calorie', 'calories', 'value'], 0)))":
            "  if (type === 'calories') return debugMetric('calories', Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'calorie', 'calories', 'value'], 0))), 0)",
            "  if (type === 'distance') return Math.max(0, readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'distance', 'value'], 0))":
            "  if (type === 'distance') return debugMetric('distance', Math.max(0, readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'distance', 'value'], 0)), 0)",
            "  if (type === 'sleep') return Math.max(0, readNumber(source, ['getTotal', 'getCurrent'], ['total', 'duration', 'minutes', 'value'], 0))":
            "  if (type === 'sleep') return debugMetric('sleep', Math.max(0, readNumber(source, ['getTotal', 'getCurrent'], ['total', 'duration', 'minutes', 'value'], 0)), 0)",
            "  if (type === 'stress') return clamp(Math.round(readNumber(source, ['getCurrent'], ['current', 'stress', 'value'], 0)), 0, 100)":
            "  if (type === 'stress') return debugMetric('stress', clamp(Math.round(readNumber(source, ['getCurrent'], ['current', 'stress', 'value'], 0)), 0, 100), 0)",
            "  if (type === 'spo2') return clamp(Math.round(readNumber(source, ['getCurrent', 'getLast'], ['current', 'spo2', 'oxygen', 'value'], 0)), 0, 100)":
            "  if (type === 'spo2') return debugMetric('spo2', clamp(Math.round(readNumber(source, ['getCurrent', 'getLast'], ['current', 'spo2', 'oxygen', 'value'], 0)), 0, 100), 0)",
            "  if (type === 'pai') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'pai', 'value'], 0)))":
            "  if (type === 'pai') return debugMetric('pai', Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'pai', 'value'], 0))), 0)"
        };
        for (const search in metricReplacements) code = code.replace(search, metricReplacements[search]);
        code = code.replace(
            "function updateDynamicWidgets() {\n",
            "function updateDynamicWidgets() {\n  debugUpdateCount += 1\n  if (debugUpdateCount === 1 || debugUpdateCount % 10 === 0) debugLog('updateDynamicWidgets tick', debugUpdateCount)\n"
        );
        return code;
    }

    function patchGeneratedMetricReaders(code) {
        code = code.replace(
            "      if (typeof value === 'number' && value === value) return value\n      if (value && typeof value.current === 'number') return value.current\n",
            "      if (typeof value === 'number' && value === value) return value\n      if (typeof value === 'boolean') return value ? 1 : 0\n      if (value && typeof value.current === 'number') return value.current\n      if (value && typeof value.value === 'number') return value.value\n      if (value && typeof value === 'object') {\n        for (let j = 0; j < props.length; j += 1) {\n          const nested = value[props[j]]\n          if (typeof nested === 'number' && nested === nested) return nested\n          if (typeof nested === 'boolean') return nested ? 1 : 0\n        }\n      }\n"
        );
        code = code.replace(
            "      if (typeof value === 'string' && value) return value\n      if (value && typeof value.text === 'string') return value.text\n      if (value && typeof value.name === 'string') return value.name\n",
            "      if (typeof value === 'string' && value) return value\n      if (typeof value === 'number' && value === value) return String(value)\n      if (value && typeof value.text === 'string') return value.text\n      if (value && typeof value.name === 'string') return value.name\n      if (value && typeof value === 'object') {\n        for (let j = 0; j < props.length; j += 1) {\n          const nested = value[props[j]]\n          if (typeof nested === 'string' && nested) return nested\n          if (typeof nested === 'number' && nested === nested) return String(nested)\n        }\n      }\n"
        );
        return code;
    }

    function patchGeneratedActive3PremiumSensors(code) {
        code = code.replace('Zepp OS SDK compatible sin imports ESM', 'Zepp OS SDK compatible Active 3 Premium: hmSensor defensivo sin imports ESM');

        const weatherHelpers = `function safeRead(fn, fallback) {
  try {
    const value = fn()
    return value === undefined || value === null ? fallback : value
  } catch (err) {
    return fallback
  }
}

function getWeatherForecast() {
  const weather = metricSensors.weather
  if (!weather) return null
  return safeRead(() => {
    if (typeof weather.getForecastWeather === 'function') return weather.getForecastWeather()
    if (typeof weather.getForecast === 'function') return weather.getForecast()
    return null
  }, null)
}

function getTodayForecastItem() {
  const forecast = getWeatherForecast()
  if (forecast && forecast.forecastData && forecast.forecastData.data && forecast.forecastData.data[0]) return forecast.forecastData.data[0]
  return null
}

function getTodayTideItem() {
  const forecast = getWeatherForecast()
  if (forecast && forecast.tideData && forecast.tideData.data && forecast.tideData.data[0]) return forecast.tideData.data[0]
  return null
}

function formatSunObject(value, fallback) {
  if (!value) return fallback || ''
  if (typeof value === 'string') return value
  if (typeof value.hour === 'number' && typeof value.minute === 'number') return pad2(value.hour) + ':' + pad2(value.minute)
  return fallback || ''
}

function getSunriseText(fallback) {
  const tide = getTodayTideItem()
  return formatSunObject(tide && tide.sunrise, fallback)
}

function getSunsetText(fallback) {
  const tide = getTodayTideItem()
  return formatSunObject(tide && tide.sunset, fallback)
}

function weatherIndexToText(index) {
  const labels = ['NUBLADO', 'CHUBASCOS', 'NIEVE', 'SOLEADO', 'CUBIERTO', 'LLUVIA', 'NIEVE', 'LLUVIA', 'NIEVE', 'NIEVE FUERTE', 'LLUVIA FUERTE', 'TORM. ARENA', 'LLUVIA/NIEVE', 'NIEBLA', 'BRUMA', 'TORMENTA', 'NEVASCA', 'POLVO', 'TORMENTA', 'GRANIZO', 'TORM./GRANIZO', 'TORMENTA', 'POLVO', 'ARENA', 'TORMENTA', 'DESCONOCIDO', 'NUBLADO NOCHE', 'CHUB. NOCHE', 'DESPEJADO']
  return labels[index] || 'CLIMA'
}

function getWeatherText(fallback) {
  const today = getTodayForecastItem()
  if (today && typeof today.index === 'number') return weatherIndexToText(today.index)
  return readString(metricSensors.weather, ['getCurrent'], ['weather', 'condition', 'text', 'name'], fallback || '')
}

function getTempHigh(fallback) {
  const today = getTodayForecastItem()
  if (today && typeof today.high === 'number') return today.high
  return readNumber(metricSensors.weather, ['getCurrent'], ['high', 'max', 'tempMax', 'maxTemp', 'temperature'], fallback || 0)
}

function getTempLow(fallback) {
  const today = getTodayForecastItem()
  if (today && typeof today.low === 'number') return today.low
  return readNumber(metricSensors.weather, ['getCurrent'], ['low', 'min', 'tempMin', 'minTemp', 'temperature'], fallback || 0)
}

`;
        if (!code.includes('function getWeatherForecast()')) {
            code = code.replace('function getRawMetric(type, fallback) {', weatherHelpers + 'function getRawMetric(type, fallback) {');
        }
        code = code.replace(
            "  if (type === 'temperature') return Math.round(readNumber(metricSensors.weather, ['getCurrent'], ['temperature', 'temp', 'currentTemp'], 0))\n  if (type === 'humidity') return clamp(Math.round(readNumber(metricSensors.weather, ['getCurrent'], ['humidity'], 0)), 0, 100)\n  if (type === 'uv') return Math.max(0, Math.round(readNumber(metricSensors.weather, ['getCurrent'], ['uv', 'uvIndex'], 0)))",
            "  if (type === 'temperature') return Math.round(getTempHigh(fallback || 0))\n  if (type === 'humidity') return clamp(Math.round(readNumber(metricSensors.weather, ['getCurrent'], ['humidity'], 0)), 0, 100)\n  if (type === 'uv') return Math.max(0, Math.round(readNumber(metricSensors.weather, ['getCurrent'], ['uv', 'uvIndex'], 0)))"
        );
        code = code.replace(
            "  if (type === 'weather') return readString(metricSensors.weather, ['getCurrent'], ['weather', 'condition', 'text', 'name'], fallback || '')\n  if (type === 'temperature') return String(getRawMetric('temperature', 0))",
            "  if (type === 'weather') return getWeatherText(fallback || '')\n  if (type === 'temperature') return String(getRawMetric('temperature', 0))"
        );
        code = code.replace(
            "  if (type === 'sunrise') return readString(metricSensors.weather, ['getSunrise'], ['sunrise'], fallback || '')\n  if (type === 'sunset') return readString(metricSensors.weather, ['getSunset'], ['sunset'], fallback || '')",
            "  if (type === 'sunrise') return getSunriseText(fallback || '')\n  if (type === 'sunset') return getSunsetText(fallback || '')"
        );
        code = code.replace(
            "  if (type === 'steps') return clamp(Math.round((getRawMetric('steps', 0) / 10000) * 100), 0, 100)",
            "  if (type === 'steps') {\n    const target = readNumber(metricSensors.steps, ['getTarget'], ['target'], 10000)\n    return clamp(Math.round((getRawMetric('steps', 0) / Math.max(1, target)) * 100), 0, 100)\n  }"
        );
        return code;
    }

    function patchGeneratedAdvancedMetricText(code) {
        const helpers = `function parseClockMinutes(value, fallback) {
  const match = String(value || '').match(/^(\\d{1,2}):(\\d{2})$/)
  if (!match) return fallback
  return (Math.max(0, Math.min(23, parseInt(match[1], 10))) * 60) + Math.max(0, Math.min(59, parseInt(match[2], 10)))
}
function minutesText(totalMinutes) {
  const safe = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  return hours <= 0 ? minutes + 'M' : hours + 'H ' + pad2(minutes) + 'M'
}
function getWorkRemainingText(options, fallback) {
  options = options || {}
  const now = new Date()
  const day = now.getDay()
  if (options.weekdaysOnly && (day === 0 || day === 6)) return 'LIBRE'
  const start = parseClockMinutes(options.workStart || '08:00', 480)
  const end = parseClockMinutes(options.workEnd || '15:00', 900)
  const current = (now.getHours() * 60) + now.getMinutes()
  const normalizedEnd = end <= start ? end + 1440 : end
  const normalizedCurrent = current < start && end <= start ? current + 1440 : current
  if (normalizedCurrent < start) return 'ENTRA EN ' + minutesText(start - normalizedCurrent)
  if (normalizedCurrent >= normalizedEnd) return 'JORNADA OK'
  return 'SALIDA EN ' + minutesText(normalizedEnd - normalizedCurrent)
}
function getCountdownText(options, fallback) {
  const target = new Date((options || {}).target || '')
  if (!(target.getTime() === target.getTime())) return fallback || 'SIN FECHA'
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return 'FINALIZADO'
  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  return days > 0 ? days + 'D ' + pad2(hours) + ':' + pad2(minutes) : hours + 'H ' + pad2(minutes) + 'M'
}
function getMoonPhaseText() {
  const cycle = 29.53058867
  const known = new Date(Date.UTC(2000, 0, 6, 18, 14))
  const days = (Date.now() - known.getTime()) / 86400000
  const phase = ((days % cycle) + cycle) % cycle
  if (phase < 1.85) return 'LUNA NUEVA'
  if (phase < 5.54) return 'CRECIENTE'
  if (phase < 9.23) return 'CUARTO CREC.'
  if (phase < 12.92) return 'GIBOSA CREC.'
  if (phase < 16.61) return 'LUNA LLENA'
  if (phase < 20.30) return 'GIBOSA MENG.'
  if (phase < 23.99) return 'CUARTO MENG.'
  if (phase < 27.68) return 'MENGUANTE'
  return 'LUNA NUEVA'
}
function getDayProgressText() {
  const now = new Date()
  const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  return 'DÍA ' + clamp(Math.round((seconds / 86400) * 100), 0, 100) + '%'
}
function getTempRangeText(options, fallback) {
  options = options || {}
  const min = typeof getTempLow === 'function' ? getTempLow(options.minFallback || 18) : readNumber(metricSensors.weather, ['getMin', 'getMinTemperature'], ['min', 'tempMin', 'minTemp'], options.minFallback || 18)
  const max = typeof getTempHigh === 'function' ? getTempHigh(options.maxFallback || 31) : readNumber(metricSensors.weather, ['getMax', 'getMaxTemperature'], ['max', 'tempMax', 'maxTemp'], options.maxFallback || 31)
  return String(Math.round(min)) + '°/' + String(Math.round(max)) + '°'
}
`;
        if (!code.includes('function getWorkRemainingText(')) {
            code = code.replace('function getMetricText(type, fallback, options) {', helpers + '\nfunction getMetricText(type, fallback, options) {');
        }
        code = code.replace(
            "  if (type === 'stopwatch') return '00:00'\n  return fallback || ''",
            "  if (type === 'work-remaining') return getWorkRemainingText(options, fallback)\n  if (type === 'countdown') return getCountdownText(options, fallback)\n  if (type === 'moon-phase') return getMoonPhaseText()\n  if (type === 'day-progress') return getDayProgressText()\n  if (type === 'temp-range') return getTempRangeText(options, fallback)\n  if (type === 'stopwatch') return '00:00'\n  return fallback || ''"
        );
        return code;
    }

    function insertAdvancedImageWidgets(code) {
        const lines = [];
        elements.forEach((element, idx) => {
            if (!ADVANCED_IMAGE_EXPORT_TYPES.includes(element.type)) return;
            const titleOffset = getTitleContentHeight(element);
            lines.push(`    // Imagen exportada para widget avanzado ${element.type}\n` +
                `    createWidget(widget.IMG, {\n` +
                `      x: ${element.x}, y: ${element.y + (element.titleEnabled ? 0 : 0)},\n` +
                `      src: 'advanced_${idx}.png'\n` +
                `    })\n`);
        });
        if (!lines.length) return code;
        return code.replace('    updateDynamicWidgets()\n', `${lines.join('\n')}\n    updateDynamicWidgets()\n`);
    }

    window.getWidgetDataCompatibilityReport = function () {
        return [
            { widget: 'Hora/fecha', status: 'OK', notes: 'Se calculan con Date local en el reloj.' },
            { widget: 'Pasos/batería/pulso/calorías/distancia', status: 'OK probable', notes: 'Se leen con hmSensor defensivo, sin imports ESM para evitar __$$RQR$$__.' },
            { widget: 'Sueño/estrés/SpO2/PAI', status: 'Experimental', notes: 'Dependen del modelo y de los permisos/sensores disponibles.' },
            { widget: 'Clima/temperatura/humedad/UV/amanecer/atardecer', status: 'Experimental mejorado', notes: 'Temp. máx/mín y amanecer/atardecer salen de Weather.getForecastWeather(); humedad/UV siguen dependiendo del firmware.' },
            { widget: 'Bluetooth/alarma', status: 'Experimental mejorado', notes: 'Se admiten booleanos y objetos devueltos por el sensor.' },
            { widget: 'Cronómetro', status: 'Estático', notes: 'Zepp OS no expone aquí un cronómetro real; mantiene 00:00.' },
            { widget: 'Texto/hora/fecha en modo exacto', status: 'PNG estático', notes: 'Con ZEPP_EXACT_PREVIEW_EXPORT=true se rasterizan para que el simulador coincida con el preview HTML. Cambia a false si prefieres datos dinámicos nativos.' },
            { widget: 'Imagen/chart/widgets visuales avanzados', status: 'Exportación como PNG', notes: 'Se rasterizan como asset para que se vean en Zeus.' }
        ];
    };

    window.showWidgetDataCompatibilityReport = function () {
        console.table(window.getWidgetDataCompatibilityReport());
        showNotification('Revisión de datos escrita en la consola', 'info');
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectAdvancedStyles();
        injectAdvancedToolbar();
        injectAdvancedInspectorControls();
        setupDropdownAutoClose();
        setTimeout(() => {
            advancedHistory = [getAdvancedSnapshot()];
            advancedRedo = [];
            renderCanvas();
        }, 0);
    });

    window.AMAZFIT_ADVANCED_WIDGETS_VERSION = ADVANCED_VERSION;
})();


/*
 * Patch final: adapta sensores según logs reales del simulador Active 3 Premium.
 * - Evita consultar sensores que no existen en hmSensor.id para este target.
 * - Cachea Weather.getForecastWeather() para no llamarlo en cada tick/widget.
 * - Usa forecastData.data[0].high/low/index y tideData.data[0].sunrise/sunset.
 * - Mantiene logs, pero reduce el spam a carga inicial y cada 10 ticks.
 */
(function () {
  if (typeof generateZeppCode !== 'function') return;
  const previousGenerateZeppCode = generateZeppCode;

  function replaceFunction(code, functionName, replacement) {
    const start = code.indexOf('function ' + functionName + '(');
    if (start < 0) return code;
    const bodyStart = code.indexOf('{', start);
    if (bodyStart < 0) return code;
    let depth = 0;
    for (let i = bodyStart; i < code.length; i += 1) {
      const ch = code[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          return code.slice(0, start) + replacement + code.slice(i + 1);
        }
      }
    }
    return code;
  }

  function patchGeneratedCodeFromRealLogs(code) {
    code = code.replace(
      'Zepp OS SDK compatible Active 3 Premium: hmSensor defensivo sin imports ESM',
      'Zepp OS SDK compatible Active 3 Premium: hmSensor adaptado a logs reales'
    );
    code = code.replace(
      'Zepp OS SDK compatible sin imports ESM',
      'Zepp OS SDK compatible Active 3 Premium: hmSensor adaptado a logs reales'
    );

    // En los logs del Active 3 Premium no existen hmSensor.id para ALTITUDE/PRESSURE/ALARM/BLE/BLUETOOTH.
    // Los dejamos sin alias para evitar llamadas inútiles y ruido en consola.
    code = code.replace("  altitude: ['ALTITUDE'],", "  altitude: [],");
    code = code.replace("  pressure: ['PRESSURE', 'BAROMETER'],", "  pressure: [],");
    code = code.replace("  alarm: ['ALARM'],", "  alarm: [],");
    code = code.replace("  bluetooth: ['BLE', 'BLUETOOTH']", "  bluetooth: []");

    // Variables de caché para no pedir getForecastWeather() dos veces por widget en cada tick.
    if (!code.includes('let cachedWeatherForecast = null')) {
      code = code.replace(
        'const metricSensors = {}\n',
        'const metricSensors = {}\nlet cachedWeatherForecast = null\nlet cachedWeatherReadAt = 0\nlet weatherLastLoggedAt = -1\n'
      );
    }

    const shouldLogFn = `function shouldLogSensorDetails() {
  if (typeof SENSOR_DEBUG === 'undefined' || !SENSOR_DEBUG) return false
  if (typeof debugUpdateCount === 'undefined') return true
  return debugUpdateCount <= 1 || debugUpdateCount % 10 === 0
}
`;
    if (!code.includes('function shouldLogSensorDetails()')) {
      code = code.replace('function debugSensorStatus(type, sensor) {', shouldLogFn + 'function debugSensorStatus(type, sensor) {');
    }

    const getWeatherForecastReplacement = `function getWeatherForecast() {
  const weather = metricSensors.weather
  if (!weather) {
    if (shouldLogSensorDetails()) debugLog('weather forecast', 'SIN SENSOR')
    return null
  }

  const nowMs = Date.now()
  // En watchface no hace falta leer el forecast cada segundo: cambia muy poco.
  // 10 minutos reducen consumo y evitan spam del simulador.
  if (cachedWeatherForecast && (nowMs - cachedWeatherReadAt) < 600000) return cachedWeatherForecast

  const forecast = safeRead(() => {
    if (typeof weather.getForecastWeather === 'function') {
      if (shouldLogSensorDetails()) debugLog('weather metodo', 'getForecastWeather')
      return weather.getForecastWeather()
    }
    if (typeof weather.getForecast === 'function') {
      if (shouldLogSensorDetails()) debugLog('weather metodo', 'getForecast')
      return weather.getForecast()
    }
    if (shouldLogSensorDetails()) debugLog('weather metodo', 'NO DISPONIBLE')
    return null
  }, null)

  cachedWeatherForecast = forecast
  cachedWeatherReadAt = nowMs

  if (shouldLogSensorDetails() && weatherLastLoggedAt !== debugUpdateCount) {
    weatherLastLoggedAt = debugUpdateCount
    debugLog('weather forecast', forecast)
    if (forecast && forecast.forecastData) debugLog('weather forecastData', forecast.forecastData)
    if (forecast && forecast.tideData) debugLog('weather tideData', forecast.tideData)
  }

  return forecast
}`;
    code = replaceFunction(code, 'getWeatherForecast', getWeatherForecastReplacement);

    const getTodayForecastItemReplacement = `function getTodayForecastItem() {
  const forecast = getWeatherForecast()
  if (forecast && forecast.forecastData && forecast.forecastData.data && forecast.forecastData.data[0]) {
    const item = forecast.forecastData.data[0]
    if (shouldLogSensorDetails()) debugLog('weather today forecast item', item)
    return item
  }
  if (shouldLogSensorDetails()) debugLog('weather today forecast item', 'NO DISPONIBLE')
  return null
}`;
    code = replaceFunction(code, 'getTodayForecastItem', getTodayForecastItemReplacement);

    const getTodayTideItemReplacement = `function getTodayTideItem() {
  const forecast = getWeatherForecast()
  if (forecast && forecast.tideData && forecast.tideData.data && forecast.tideData.data[0]) {
    const item = forecast.tideData.data[0]
    if (shouldLogSensorDetails()) debugLog('weather today tide item', item)
    return item
  }
  if (shouldLogSensorDetails()) debugLog('weather today tide item', 'NO DISPONIBLE')
  return null
}`;
    code = replaceFunction(code, 'getTodayTideItem', getTodayTideItemReplacement);

    // Weather real según logs: forecastData.data[0] trae high, low, index; tideData.data[0] trae sunrise/sunset.
    code = code.replace(
      "  if (type === 'temperature') return Math.round(getTempHigh(fallback || 0))",
      "  if (type === 'temperature') return debugMetric('temperature', Math.round(getTempHigh(fallback || 0)), fallback || 0)"
    );
    code = code.replace(
      "  if (type === 'weather') return getWeatherText(fallback || '')",
      "  if (type === 'weather') return debugMetric('weather', getWeatherText(fallback || ''), fallback || '')"
    );

    // Paso objetivo real: en hmSensor antiguo existe step.target; si no, 10000.
    code = code.replace(
      "  if (type === 'steps') {\n    const target = readNumber(metricSensors.steps, ['getTarget'], ['target'], 10000)\n    return clamp(Math.round((getRawMetric('steps', 0) / Math.max(1, target)) * 100), 0, 100)\n  }",
      "  if (type === 'steps') {\n    const target = readNumber(metricSensors.steps, ['getTarget'], ['target'], 10000)\n    if (shouldLogSensorDetails()) debugLog('steps target', target)\n    return clamp(Math.round((getRawMetric('steps', 0) / Math.max(1, target)) * 100), 0, 100)\n  }"
    );

    // Si no existe sensor, que muestre fallback vacío en vez de 0 para no confundir en altitud/presión/BT/alarma.
    code = code.replace(
      "  if (type === 'altitude') return String(getRawMetric('altitude', 0))\n  if (type === 'pressure') return String(getRawMetric('pressure', 0))\n  if (type === 'sunrise') return getSunriseText(fallback || '')",
      "  if (type === 'altitude') return metricSensors.altitude ? String(getRawMetric('altitude', 0)) : (fallback || '--')\n  if (type === 'pressure') return metricSensors.pressure ? String(getRawMetric('pressure', 0)) : (fallback || '--')\n  if (type === 'sunrise') return getSunriseText(fallback || '')"
    );
    code = code.replace(
      "  if (type === 'alarm') return readString(metricSensors.alarm, ['getNext'], ['next', 'time'], fallback || '')\n  if (type === 'bluetooth') return readNumber(metricSensors.bluetooth, ['getStatus'], ['connected', 'value'], 1) ? (options.okText || 'BT OK') : (options.koText || 'BT KO')",
      "  if (type === 'alarm') return metricSensors.alarm ? readString(metricSensors.alarm, ['getNext'], ['next', 'time'], fallback || '') : (fallback || '--')\n  if (type === 'bluetooth') {\n    if (!metricSensors.bluetooth) return options.koText || 'BT KO'\n    return readNumber(metricSensors.bluetooth, ['getStatus'], ['connected', 'value'], 1) ? (options.okText || 'BT OK') : (options.koText || 'BT KO')\n  }"
    );

    // Ajusta el informe interno para que refleje lo visto en los logs.
    code = code.replace(
      "status: 'Experimental mejorado', notes: 'Temp. máx/mín y amanecer/atardecer salen de Weather.getForecastWeather(); humedad/UV siguen dependiendo del firmware.'",
      "status: 'OK parcial', notes: 'Logs Active 3 Premium: Weather.getForecastWeather() devuelve forecastData(high/low/index) y tideData(sunrise/sunset). No hay humedad/UV en esos logs.'"
    );
    code = code.replace(
      "status: 'Experimental mejorado', notes: 'Se admiten booleanos y objetos devueltos por el sensor.'",
      "status: 'No disponible en hmSensor Active 3 Premium', notes: 'Los logs muestran que BLE/BLUETOOTH y ALARM no existen como hmSensor.id en el simulador.'"
    );

    return code;
  }

  generateZeppCode = function () {
    previousGenerateZeppCode();
    const codeBox = document.getElementById('zepp-code-box');
    if (!codeBox) return;
    codeBox.innerText = patchGeneratedCodeFromRealLogs(codeBox.innerText || '');
  };
})();

// --- PARCHE: Bluetooth por hmBle + pruebas adicionales de APIs ---
(function () {
  if (typeof generateZeppCode !== 'function') return;

  const previousGenerateZeppCodeBluetoothProbe = generateZeppCode;

  function patchGeneratedBluetoothHmBle(code) {
    code = code.replace(
      'Zepp OS SDK compatible Active 3 Premium: hmSensor adaptado a logs reales',
      'Zepp OS SDK compatible Active 3 Premium: hmSensor + hmBle probado'
    );

    if (!code.includes('let bluetoothProbeDone = false')) {
      code = code.replace(
        'const dynamicArcs = []\n\n',
        'const dynamicArcs = []\nlet bluetoothProbeDone = false\nlet bluetoothListenerRegistered = false\nlet bluetoothStatusCached = null\nlet bluetoothLastLoggedAt = -1\n\n'
      );
    }

    const bluetoothHelpers = `function getHmBleModule() {
  if (typeof hmBle !== 'undefined') return hmBle
  if (typeof ble !== 'undefined') return ble
  return null
}

function valueToBool(value, fallback) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.toLowerCase()
    if (normalized === 'true' || normalized === 'connected' || normalized === 'ok' || normalized === '1') return true
    if (normalized === 'false' || normalized === 'disconnected' || normalized === 'ko' || normalized === '0') return false
  }
  if (value && typeof value === 'object') {
    const props = ['connected', 'status', 'value', 'isConnected', 'connect']
    for (let i = 0; i < props.length; i += 1) {
      const propValue = value[props[i]]
      if (propValue !== undefined && propValue !== null) return valueToBool(propValue, fallback)
    }
  }
  return fallback
}

function probeMethod(name, obj, method, shouldCall) {
  if (!obj) return
  const exists = typeof obj[method] === 'function'
  debugLog(name + '.' + method, exists ? 'FUNCION' : 'NO')
  if (exists && shouldCall) {
    const result = safeRead(() => obj[method](), null)
    debugLog(name + '.' + method + '()', result)
  }
}

function probeSensorExtraMethods() {
  if (!shouldLogSensorDetails()) return
  const sensorTypes = ['battery', 'steps', 'heart', 'calories', 'distance', 'sleep', 'stress', 'spo2', 'pai', 'weather']
  const methods = ['getCurrent', 'getTarget', 'getToday', 'getTotal', 'getLast', 'getForecastWeather', 'getForecast']
  const props = ['current', 'target', 'value', 'today', 'total', 'last', 'status', 'name']
  for (let i = 0; i < sensorTypes.length; i += 1) {
    const type = sensorTypes[i]
    const sensor = metricSensors[type]
    if (!sensor) continue
    for (let m = 0; m < methods.length; m += 1) {
      const method = methods[m]
      if (typeof sensor[method] === 'function') {
        const result = safeRead(() => sensor[method](), null)
        debugLog('probe ' + type + '.' + method + '()', result)
      }
    }
    for (let p = 0; p < props.length; p += 1) {
      const propName = props[p]
      const propValue = safeRead(() => sensor[propName], undefined)
      if (propValue !== undefined) debugLog('probe ' + type + '.' + propName, propValue)
    }
  }
}

function probeBluetoothApis() {
  if (bluetoothProbeDone && !shouldLogSensorDetails()) return
  bluetoothProbeDone = true
  const module = getHmBleModule()

  debugLog('bluetooth hmBle global', typeof hmBle === 'undefined' ? 'NO DISPONIBLE' : 'DISPONIBLE')
  debugLog('bluetooth ble global', typeof ble === 'undefined' ? 'NO DISPONIBLE' : 'DISPONIBLE')

  if (!module) {
    debugLog('bluetooth module', 'NO DISPONIBLE')
    return
  }

  debugLog('bluetooth module props', module)
  probeMethod('bluetooth', module, 'connectStatus', true)
  probeMethod('bluetooth', module, 'addListener', false)
  probeMethod('bluetooth', module, 'removeListener', false)
  probeMethod('bluetooth', module, 'createConnect', false)
  probeMethod('bluetooth', module, 'disConnect', false)
  probeMethod('bluetooth', module, 'send', false)

  if (!bluetoothListenerRegistered && typeof module.addListener === 'function') {
    const registered = safeRead(() => {
      module.addListener(function (status) {
        bluetoothStatusCached = valueToBool(status, false)
        debugLog('bluetooth listener status', status)
      })
      return true
    }, false)
    bluetoothListenerRegistered = registered
    debugLog('bluetooth addListener registro', registered ? 'OK' : 'ERROR')
  }
}

function readBluetoothConnected(fallbackConnected) {
  const module = getHmBleModule()
  if (!module) return fallbackConnected

  if (shouldLogSensorDetails() && bluetoothLastLoggedAt !== debugUpdateCount) {
    bluetoothLastLoggedAt = debugUpdateCount
    probeBluetoothApis()
  }

  if (typeof module.connectStatus === 'function') {
    const status = safeRead(() => module.connectStatus(), null)
    if (shouldLogSensorDetails()) debugLog('bluetooth connectStatus lectura', status)
    const normalized = valueToBool(status, null)
    if (normalized !== null) {
      bluetoothStatusCached = normalized
      return normalized
    }
  }

  return bluetoothStatusCached === null ? fallbackConnected : bluetoothStatusCached
}

`;

    if (!code.includes('function getHmBleModule()')) {
      const getMetricTextMarker = 'function getMetricText(type, fallback, options) {';
      const getMetricTextMarkerDefault = 'function getMetricText(type, fallback, options = {}) {';
      const getRawMetricMarker = 'function getRawMetric(type, fallback) {';
      if (code.includes(getMetricTextMarker)) {
        code = code.replace(getMetricTextMarker, bluetoothHelpers + getMetricTextMarker);
      } else if (code.includes(getMetricTextMarkerDefault)) {
        code = code.replace(getMetricTextMarkerDefault, bluetoothHelpers + getMetricTextMarkerDefault);
      } else if (code.includes(getRawMetricMarker)) {
        code = code.replace(getRawMetricMarker, bluetoothHelpers + getRawMetricMarker);
      } else {
        code = bluetoothHelpers + code;
      }
    }

    code = code.replace(
      "  if (type === 'alarm') return metricSensors.alarm ? readString(metricSensors.alarm, ['getNext'], ['next', 'time'], fallback || '') : (fallback || '--')\n  if (type === 'bluetooth') {\n    if (!metricSensors.bluetooth) return options.koText || 'BT KO'\n    return readNumber(metricSensors.bluetooth, ['getStatus'], ['connected', 'value'], 1) ? (options.okText || 'BT OK') : (options.koText || 'BT KO')\n  }",
      "  if (type === 'alarm') return metricSensors.alarm ? readString(metricSensors.alarm, ['getNext'], ['next', 'time'], fallback || '') : (fallback || '--')\n  if (type === 'bluetooth') return readBluetoothConnected(false) ? (options.okText || 'BT OK') : (options.koText || 'BT KO')"
    );

    code = code.replace(
      "      const connected = readNumber(metricSensors.bluetooth, ['getStatus'], ['connected', 'value'], 1)\n      item.node.setProperty(prop.COLOR, connected ? item.okColor : item.koColor)",
      "      const connected = readBluetoothConnected(false)\n      item.node.setProperty(prop.COLOR, connected ? item.okColor : item.koColor)"
    );

    if (!code.includes('probeBluetoothApis()\n    probeSensorExtraMethods()')) {
      code = code.replace(
        "      debugSensorStatus(type, metricSensors[type])\n    }\n\n",
        "      debugSensorStatus(type, metricSensors[type])\n    }\n    probeBluetoothApis()\n    probeSensorExtraMethods()\n\n"
      );
    }

    code = code.replace(
      "status: 'No disponible en hmSensor Active 3 Premium', notes: 'Los logs muestran que BLE/BLUETOOTH y ALARM no existen como hmSensor.id en el simulador.'",
      "status: 'Probando hmBle', notes: 'BLE/BLUETOOTH no existen como hmSensor.id, pero la API de watchface expone hmBle.connectStatus() para estado de conexión.'"
    );

    return code;
  }

  generateZeppCode = function () {
    previousGenerateZeppCodeBluetoothProbe();
    const codeBox = document.getElementById('zepp-code-box');
    if (!codeBox) return;
    codeBox.innerText = patchGeneratedBluetoothHmBle(codeBox.innerText || '');
  };
})();



/*
 * --- PATCH BLUETOOTH REAL PARA WATCHFACE ---
 * Confirmado en simulador Active 3 Premium:
 * - hmSensor.id.BLE / hmSensor.id.BLUETOOTH no existen.
 * - hmBle sí existe.
 * - hmBle.connectStatus() devuelve boolean real.
 *
 * Este parche evita depender de sensores BLE inexistentes y fuerza el código exportado
 * a usar hmBle.connectStatus() cuando el widget sea "bluetooth".
 */
(function installAmazfitBluetoothHmBlePatch() {
    if (typeof window === 'undefined') return;
    if (window.__amazfitBluetoothHmBlePatchInstalled) return;
    window.__amazfitBluetoothHmBlePatchInstalled = true;

    const BLUETOOTH_RUNTIME_HELPER = `
function aeBluetoothStatus() {
  try {
    if (typeof hmBle !== 'undefined' && hmBle && typeof hmBle.connectStatus === 'function') {
      return !!hmBle.connectStatus()
    }
  } catch (e) {
    try { console.log('[AmazfitEditor] bluetooth hmBle.connectStatus ERROR: ' + e) } catch (_) {}
  }

  try {
    if (typeof ble !== 'undefined' && ble && typeof ble.connectStatus === 'function') {
      return !!ble.connectStatus()
    }
  } catch (e) {
    try { console.log('[AmazfitEditor] bluetooth ble.connectStatus ERROR: ' + e) } catch (_) {}
  }

  return false
}

function aeBluetoothText(okText, koText) {
  return aeBluetoothStatus() ? (okText || 'BT OK') : (koText || 'BT KO')
}

function aeBluetoothColor(okColor, koColor) {
  return aeBluetoothStatus() ? (okColor || 0x60a5fa) : (koColor || 0xf87171)
}

try {
  if (typeof hmBle !== 'undefined' && hmBle && typeof hmBle.addListener === 'function') {
    hmBle.addListener(function(status) {
      try { console.log('[AmazfitEditor] bluetooth cambio estado: ' + status) } catch (_) {}
      try { if (typeof updateDynamicWidgets === 'function') updateDynamicWidgets() } catch (_) {}
    })
  }
} catch (e) {
  try { console.log('[AmazfitEditor] bluetooth addListener ERROR: ' + e) } catch (_) {}
}
`;

    function injectBluetoothRuntime(code) {
        if (!code || typeof code !== 'string') return code;

        let out = code;

        // Remove useless hmSensor bluetooth creation/probe attempts from generated watchface code when possible.
        out = out.replace(/createSensor\(['"]bluetooth['"][\s\S]{0,7000}?NO DISPONIBLE['"]\)[;\n]*/g, '');

        // Ensure helper is present once.
        if (!out.includes('function aeBluetoothStatus()')) {
            const anchor = 'function safeCall';
            if (out.includes(anchor)) {
                out = out.replace(anchor, BLUETOOTH_RUNTIME_HELPER + '\n\n' + anchor);
            } else {
                out = BLUETOOTH_RUNTIME_HELPER + '\n\n' + out;
            }
        }

        // Replace common old bluetooth accessors if present.
        out = out
            .replace(/getMetricValue\(['"]bluetooth['"]\)/g, "aeBluetoothText('BT OK', 'BT KO')")
            .replace(/readMetricValue\(['"]bluetooth['"]\)/g, "aeBluetoothText('BT OK', 'BT KO')")
            .replace(/getBluetoothValue\(\)/g, "aeBluetoothText('BT OK', 'BT KO')");

        return out;
    }

    // Patch createZeppCode/generateZeppCode if they return strings in this app version.
    ['generateZeppCode', 'createZeppCode', 'buildZeppCode', 'generateWatchfaceCode'].forEach(function(name) {
        const original = window[name];
        if (typeof original !== 'function' || original.__hmBlePatched) return;
        const wrapped = function() {
            const result = original.apply(this, arguments);
            return typeof result === 'string' ? injectBluetoothRuntime(result) : result;
        };
        wrapped.__hmBlePatched = true;
        window[name] = wrapped;
    });

    // Expose helper for any exporter that wants to postprocess generated code.
    window.amazfitInjectBluetoothHmBleRuntime = injectBluetoothRuntime;
})();




/*
 * --- WIDGETS FILTRADOS SEGÚN PRUEBAS EN ACTIVE 3 PREMIUM ---
 *
 * Quitados del editor porque no existen o no tienen una vía razonable de lectura en el simulador:
 * humidity, uv, altitude, pressure, alarm, stopwatch.
 *
 * Conservados:
 * hora/fecha, pasos, calorías, distancia, pulso, batería, estrés, SpO2,
 * clima, temperatura min/max, amanecer, atardecer y Bluetooth por hmBle.
 */
(function installWorkingWidgetsOnlyPatch() {
    if (typeof window === 'undefined') return;
    if (window.__workingWidgetsOnlyPatchInstalled) return;
    window.__workingWidgetsOnlyPatchInstalled = true;

    const removedTypes = ['humidity','uv','altitude','pressure','alarm','stopwatch'];
    const workingTypes = [
        'time','hour','minute','second',
        'date','day','month','year','weekday','day-of-year','week',
        'steps','calories','distance','heart','battery','stress','spo2','sleep','pai','sleep','pai',
        'weather','temperature','sunrise','sunset','bluetooth',
        'temp-range','weather-icon','sun-position','step-goal','battery-icon',
        'date-circle','work-remaining','day-progress','moon-phase','countdown',
        'analog-hands','multi-rings','separator-line','preset-icon',
        'label','progress-bar','arc-progress','circle','stroke-rect','chart','image'
    ];

    function isRemovedType(type) {
        return removedTypes.indexOf(type) !== -1;
    }

    function removeBadToolbarButtons() {
        try {
            removedTypes.forEach(function(type) {
                const buttons = document.querySelectorAll(
                    "button[onclick*=\"addElement('" + type + "')\"],button[onclick*='addElement(\"" + type + "\")']"
                );
                buttons.forEach(function(btn) {
                    const wrapper = btn.closest('button') || btn;
                    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                });
            });

            // Limpia opciones de select que puedan listar sensores no funcionales.
            document.querySelectorAll('select').forEach(function(select) {
                Array.prototype.slice.call(select.options || []).forEach(function(option) {
                    if (isRemovedType(option.value)) option.remove();
                });
            });
        } catch (e) {
            try { console.log('[AmazfitEditor] limpieza widgets no funcionales ERROR: ' + e) } catch (_) {}
        }
    }

    // Filtro directo sobre la lista global si existe.
    try {
        if (typeof DYNAMIC_METRIC_TYPES !== 'undefined' && Array.isArray(DYNAMIC_METRIC_TYPES)) {
            for (let i = DYNAMIC_METRIC_TYPES.length - 1; i >= 0; i -= 1) {
                if (isRemovedType(DYNAMIC_METRIC_TYPES[i])) DYNAMIC_METRIC_TYPES.splice(i, 1);
            }
        }
        if (typeof metricDefaults !== 'undefined') {
            removedTypes.forEach(function(type) { try { delete metricDefaults[type]; } catch (_) {} });
        }
    } catch (_) {}

    // Impide crear widgets retirados aunque quede algún botón antiguo en el HTML.
    function patchAddElement() {
        try {
            if (typeof window.addElement !== 'function' && typeof addElement === 'function') window.addElement = addElement;
            const original = window.addElement || (typeof addElement === 'function' ? addElement : null);
            if (!original || original.__workingWidgetsOnlyPatched) return;
            const wrapped = function(type) {
                if (isRemovedType(type)) {
                    try { showToast('Widget retirado', 'Ese dato no está disponible en Active 3 Premium / simulador.', 'warning'); } catch (_) {}
                    try { console.log('[AmazfitEditor] widget bloqueado por no funcionar: ' + type); } catch (_) {}
                    return null;
                }
                return original.apply(this, arguments);
            };
            wrapped.__workingWidgetsOnlyPatched = true;
            window.addElement = wrapped;
            try { addElement = wrapped; } catch (_) {}
        } catch (e) {}
    }

    // Filtra listas de métricas configurables en widgets avanzados.
    function patchMetricOptions() {
        try {
            if (typeof metricDefaults !== 'undefined') {
                removedTypes.forEach(function(type) { delete metricDefaults[type]; });
            }
        } catch (_) {}
    }

    function sanitizeGeneratedCode(code) {
        if (!code || typeof code !== 'string') return code;

        // No crear sensores que ya sabemos que no existen o no devuelven datos útiles.
        code = code
            .replace("  altitude: ['ALTITUDE'],\n", "  altitude: [],\n")
            .replace("  pressure: ['PRESSURE', 'BAROMETER'],\n", "  pressure: [],\n")
            .replace("  alarm: ['ALARM'],\n", "  alarm: [],\n")
            .replace("  bluetooth: ['BLE', 'BLUETOOTH']", "  bluetooth: []");

        // Humedad/UV no salen de getForecastWeather() en tus logs: evitar mostrar 0 engañoso.
        code = code
            .replace("  if (type === 'humidity') return String(getRawMetric('humidity', 0))\n", "  if (type === 'humidity') return fallback || '--'\n")
            .replace("  if (type === 'uv') return String(getRawMetric('uv', 0))\n", "  if (type === 'uv') return fallback || '--'\n")
                        .replace("  if (type === 'altitude') return String(getRawMetric('altitude', 0))\n", "  if (type === 'altitude') return fallback || '--'\n")
            .replace("  if (type === 'pressure') return String(getRawMetric('pressure', 0))\n", "  if (type === 'pressure') return fallback || '--'\n")
            .replace("  if (type === 'alarm') return readString(metricSensors.alarm, ['getNext'], ['next', 'time'], fallback || '')\n", "  if (type === 'alarm') return fallback || '--'\n")
            .replace("  if (type === 'stopwatch') return '00:00'\n", "  if (type === 'stopwatch') return fallback || '--'\n");

        // Bluetooth real por hmBle.connectStatus().
        if (!code.includes('function readBluetoothConnected(')) {
            const helper = `function readBluetoothConnected(fallbackConnected) {
  try {
    if (typeof hmBle !== 'undefined' && hmBle && typeof hmBle.connectStatus === 'function') {
      return !!hmBle.connectStatus()
    }
  } catch (e) {
    try { console.log('[AmazfitEditor] bluetooth connectStatus ERROR: ' + e) } catch (_) {}
  }
  return !!fallbackConnected
}

try {
  if (typeof hmBle !== 'undefined' && hmBle && typeof hmBle.addListener === 'function') {
    hmBle.addListener(function(status) {
      try { console.log('[AmazfitEditor] bluetooth cambio estado: ' + status) } catch (_) {}
      try { if (typeof updateDynamicWidgets === 'function') updateDynamicWidgets() } catch (_) {}
    })
  }
} catch (e) {
  try { console.log('[AmazfitEditor] bluetooth addListener ERROR: ' + e) } catch (_) {}
}

`;
            const marker = 'function getMetricText(type, fallback, options) {';
            code = code.includes(marker) ? code.replace(marker, helper + marker) : helper + code;
        }

        code = code.replace(
            "  if (type === 'bluetooth') return readNumber(metricSensors.bluetooth, ['getStatus'], ['connected', 'value'], 1) ? (options.okText || 'BT OK') : (options.koText || 'BT KO')\n",
            "  if (type === 'bluetooth') return readBluetoothConnected(false) ? (options.okText || 'BT OK') : (options.koText || 'BT KO')\n"
        );
        code = code.replace(
            "      const connected = readNumber(metricSensors.bluetooth, ['getStatus'], ['connected', 'value'], 1)\n      item.node.setProperty(prop.COLOR, connected ? item.okColor : item.koColor)",
            "      const connected = readBluetoothConnected(false)\n      item.node.setProperty(prop.COLOR, connected ? item.okColor : item.koColor)"
        );

        return code;
    }

    function patchCodeGenerators() {
        ['generateZeppCode', 'createZeppCode', 'buildZeppCode', 'generateWatchfaceCode'].forEach(function(name) {
            const original = window[name] || (typeof globalThis !== 'undefined' ? globalThis[name] : null);
            if (typeof original !== 'function' || original.__workingWidgetsSanitizePatched) return;
            const wrapped = function() {
                const result = original.apply(this, arguments);
                return typeof result === 'string' ? sanitizeGeneratedCode(result) : result;
            };
            wrapped.__workingWidgetsSanitizePatched = true;
            window[name] = wrapped;
            try { globalThis[name] = wrapped; } catch (_) {}
        });
    }

    // Deep probe manual para seguir investigando sin enseñar widgets rotos.
    window.amazfitRunSensorDeepProbe = function() {
        try {
            console.log('[AmazfitEditor] deep probe manual iniciado');
            if (typeof hmSensor === 'undefined' || !hmSensor.id) {
                console.log('[AmazfitEditor] hmSensor no disponible');
                return;
            }
            Object.keys(hmSensor.id).forEach(function(idName) {
                try {
                    const sensor = hmSensor.createSensor(hmSensor.id[idName]);
                    console.log('[AmazfitEditor] sensor id ' + idName + ': creado');
                    ['current','target','total','today','last','status','name'].forEach(function(prop) {
                        try { if (sensor[prop] !== undefined) console.log('[AmazfitEditor] ' + idName + '.' + prop + ': ' + sensor[prop]); } catch (_) {}
                    });
                    ['getCurrent','getTarget','getTotal','getToday','getLast','getStatus','getForecastWeather'].forEach(function(method) {
                        try {
                            if (typeof sensor[method] === 'function') {
                                const value = sensor[method]();
                                const kind = value && typeof value === 'object' ? 'object keys=' + Object.keys(value).join(',') : String(value);
                                console.log('[AmazfitEditor] ' + idName + '.' + method + '(): ' + kind);
                            }
                        } catch (e) {
                            console.log('[AmazfitEditor] ' + idName + '.' + method + ' ERROR: ' + e);
                        }
                    });
                } catch (e) {}
            });
            if (typeof hmBle !== 'undefined') {
                console.log('[AmazfitEditor] hmBle.connectStatus: ' + (typeof hmBle.connectStatus === 'function' ? hmBle.connectStatus() : 'NO_FUNCION'));
                console.log('[AmazfitEditor] hmBle props: ' + Object.keys(hmBle).join(','));
            }
        } catch (e) {
            console.log('[AmazfitEditor] deep probe ERROR: ' + e);
        }
    };

    function init() {
        patchAddElement();
        patchMetricOptions();
        patchCodeGenerators();
        removeBadToolbarButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    setTimeout(init, 500);
    setTimeout(init, 1500);
})();



/*
 * --- PATCH FINAL DE WIDGETS FUNCIONALES SEGÚN LOGS ACTIVE 3 PREMIUM ---
 *
 * Logs confirmados:
 * - battery.current: OK
 * - steps.current + steps.target: OK
 * - heart.current puede venir vacío; heart.last: OK
 * - calories.current + calories.target: OK
 * - distance.current: OK
 * - stress.current: OK aunque puede ser 0
 * - spo2.current: OK aunque puede ser 0
 * - weather.getForecastWeather(): OK con forecastData/tideData
 * - hmBle.connectStatus(): OK para Bluetooth real
 *
 * Sueño y PAI se mantienen en modo best-effort:
 * - sleep: se prueban getTotal/getToday/getCurrent/getLast y propiedades total/today/duration/minutes/current/last/value
 * - pai: se prueban getCurrent/getToday/getTotal/getLast y propiedades current/today/total/last/pai/value
 *
 * Se descartan como widgets de dato:
 * - altitude, pressure, alarm: no existen
 * - bluetooth como hmSensor: no existe; se usa hmBle
 */
(function installActive3PremiumFinalWidgetPatch() {
    if (typeof window === 'undefined') return;
    if (window.__active3PremiumFinalWidgetPatchInstalled) return;
    window.__active3PremiumFinalWidgetPatchInstalled = true;

    const WORKING_TYPES = [
        'time','hour','minute','second',
        'date','day','month','year','weekday','week','day-of-year',
        'battery','steps','heart','calories','distance','stress','spo2','sleep','pai','sleep','pai',
        'weather','temperature','temp-range','sunrise','sunset','sun-position',
        'bluetooth',
        'moon-phase','countdown','work-remaining','day-progress',
        'analog-hands','multi-rings','weather-icon','separator-line','preset-icon',
        'step-goal','date-circle','battery-icon',
        'progress-bar','progress-arc','image','text','shape','chart'
    ];

    function active3SanitizeElements() {
        if (!Array.isArray(window.elements)) return;
        window.elements = window.elements.filter(function(el) {
            if (!el || !el.type) return true;
            return WORKING_TYPES.indexOf(el.type) !== -1;
        });
    }

    function active3PatchGeneratedCode(code) {
        if (!code || typeof code !== 'string') return code;

        // No intentar sensores que no existen como hmSensor en Active 3 Premium.
        code = code
            .replace("  altitude: ['ALTITUDE'],", "  altitude: [],")
            .replace("  pressure: ['PRESSURE', 'BAROMETER'],", "  pressure: [],")
            .replace("  alarm: ['ALARM'],", "  alarm: [],")
            .replace("  bluetooth: ['BLE', 'BLUETOOTH']", "  bluetooth: []");

        // Pulso: los logs muestran heart.current vacío y heart.last = 75.
        code = code.replace(
            "if (type === 'heart') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getLast'], ['current', 'last', 'heartRate', 'bpm', 'value'], 0)))",
            "if (type === 'heart') return Math.max(0, Math.round(readNumber(source, ['getLast', 'getCurrent'], ['last', 'current', 'heartRate', 'bpm', 'value'], 0)))"
        );

        // Sueño y PAI se mantienen con lectura best-effort.
        code = code.replace(
            "  if (type === 'sleep') return Math.max(0, readNumber(source, ['getTotal', 'getCurrent'], ['total', 'duration', 'minutes', 'value'], 0))",
            "  if (type === 'sleep') return Math.max(0, readNumber(source, ['getTotal', 'getToday', 'getCurrent', 'getLast'], ['total', 'today', 'duration', 'minutes', 'current', 'last', 'value'], 0))"
        );
        code = code.replace(
            "  if (type === 'pai') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getTotal'], ['current', 'total', 'pai', 'value'], 0)))",
            "  if (type === 'pai') return Math.max(0, Math.round(readNumber(source, ['getCurrent', 'getToday', 'getTotal', 'getLast'], ['current', 'today', 'total', 'last', 'pai', 'value'], 0)))"
        );
        code = code.replace(
            "  if (type === 'sleep') return formatDurationValue(getRawMetric('sleep', 0))",
            "  if (type === 'sleep') return formatDurationValue(getRawMetric('sleep', 0))"
        );
        code = code.replace(
            "  if (type === 'pai') return String(getRawMetric('pai', 0))",
            "  if (type === 'pai') return String(getRawMetric('pai', 0))"
        );

        // Evita auto-probe largo: deja solo la comprobación de Bluetooth.
        code = code.replace(
            "    probeBluetoothApis()\n    probeSensorExtraMethods()\n",
            "    probeBluetoothApis()\n    // probeSensorExtraMethods() desactivado; usar amazfitRunSensorDeepProbe() si hace falta\n"
        );

        // Si queda una llamada suelta por otra variante.
        code = code.replace("    probeSensorExtraMethods()\n", "    // probeSensorExtraMethods() desactivado\n");

        return code;
    }

    function patchGenerator(name) {
        const original = window[name];
        if (typeof original !== 'function' || original.__active3FinalPatched) return;
        const wrapped = function() {
            active3SanitizeElements();
            const result = original.apply(this, arguments);

            // Algunas versiones escriben el código directamente en #zepp-code-box.
            try {
                const box = document.getElementById('zepp-code-box');
                if (box && box.innerText) box.innerText = active3PatchGeneratedCode(box.innerText);
            } catch (_) {}

            return typeof result === 'string' ? active3PatchGeneratedCode(result) : result;
        };
        wrapped.__active3FinalPatched = true;
        window[name] = wrapped;
        try { globalThis[name] = wrapped; } catch (_) {}
    }

    ['generateZeppCode', 'createZeppCode', 'buildZeppCode', 'generateWatchfaceCode'].forEach(patchGenerator);

    // Botón/función manual de diagnóstico ampliado.
    window.amazfitRunActive3FullProbe = function() {
        try {
            console.log('[AmazfitEditor] Active3 full probe iniciado');

            if (typeof hmBle !== 'undefined') {
                console.log('[AmazfitEditor] hmBle.connectStatus:', typeof hmBle.connectStatus === 'function' ? hmBle.connectStatus() : 'NO FUNCION');
                console.log('[AmazfitEditor] hmBle props:', Object.keys(hmBle).join(','));
                ['getAddress','getAllConnectInfo','getAdvSettings'].forEach(function(method) {
                    try {
                        if (typeof hmBle[method] === 'function') {
                            const value = hmBle[method]();
                            console.log('[AmazfitEditor] hmBle.' + method + '():', value && typeof value === 'object' ? Object.keys(value).join(',') : value);
                        }
                    } catch (e) {
                        console.log('[AmazfitEditor] hmBle.' + method + ' ERROR:', e);
                    }
                });
            } else {
                console.log('[AmazfitEditor] hmBle NO DISPONIBLE');
            }

            if (typeof hmSensor === 'undefined' || !hmSensor.id) {
                console.log('[AmazfitEditor] hmSensor NO DISPONIBLE');
                return;
            }

            Object.keys(hmSensor.id).forEach(function(idName) {
                try {
                    const sensor = hmSensor.createSensor(hmSensor.id[idName]);
                    console.log('[AmazfitEditor] sensor ' + idName + ': OK');
                    ['current','target','value','today','total','last','status','name'].forEach(function(prop) {
                        try {
                            const value = sensor[prop];
                            if (value !== undefined) console.log('[AmazfitEditor] ' + idName + '.' + prop + ':', value && typeof value === 'object' ? Object.keys(value).join(',') : value);
                        } catch (_) {}
                    });
                    ['getCurrent','getTarget','getToday','getTotal','getLast','getStatus','getForecastWeather','getForecast'].forEach(function(method) {
                        try {
                            if (typeof sensor[method] === 'function') {
                                const value = sensor[method]();
                                console.log('[AmazfitEditor] ' + idName + '.' + method + '():', value && typeof value === 'object' ? Object.keys(value).join(',') : value);
                            }
                        } catch (e) {
                            console.log('[AmazfitEditor] ' + idName + '.' + method + ' ERROR:', e);
                        }
                    });
                } catch (e) {
                    console.log('[AmazfitEditor] sensor ' + idName + ' ERROR:', e);
                }
            });
        } catch (e) {
            console.log('[AmazfitEditor] Active3 full probe ERROR:', e);
        }
    };
})();



/*
 * Prueba manual específica para Sleep y PAI.
 * Ejecutar en consola del simulador: amazfitProbeSleepPai()
 */
(function installSleepPaiProbe() {
    if (typeof window === 'undefined') return;
    window.amazfitProbeSleepPai = function() {
        try {
            if (typeof hmSensor === 'undefined' || !hmSensor.id) {
                console.log('[AmazfitEditor] hmSensor no disponible');
                return;
            }
            [['sleep','SLEEP'],['pai','PAI']].forEach(function(entry) {
                var label = entry[0];
                var alias = entry[1];
                try {
                    if (!hmSensor.id[alias]) {
                        console.log('[AmazfitEditor] ' + label + ' alias ' + alias + ': NO EXISTE');
                        return;
                    }
                    var sensor = hmSensor.createSensor(hmSensor.id[alias]);
                    console.log('[AmazfitEditor] probe ' + label + '.name:', sensor && sensor.name);
                    ['current','target','total','today','last','value','minutes','duration','pai'].forEach(function(prop) {
                        try {
                            var v = sensor[prop];
                            if (v !== undefined) {
                                if (v && typeof v === 'object') {
                                    console.log('[AmazfitEditor] probe ' + label + '.' + prop + ': object keys=' + Object.keys(v).join(','));
                                } else {
                                    console.log('[AmazfitEditor] probe ' + label + '.' + prop + ': ' + v);
                                }
                            }
                        } catch (e) {}
                    });
                    ['getCurrent','getTarget','getTotal','getToday','getLast'].forEach(function(method) {
                        try {
                            if (typeof sensor[method] === 'function') {
                                var mv = sensor[method]();
                                if (mv && typeof mv === 'object') {
                                    console.log('[AmazfitEditor] probe ' + label + '.' + method + '(): object keys=' + Object.keys(mv).join(','));
                                } else {
                                    console.log('[AmazfitEditor] probe ' + label + '.' + method + '(): ' + mv);
                                }
                            }
                        } catch (e) {
                            console.log('[AmazfitEditor] probe ' + label + '.' + method + '() ERROR: ' + e);
                        }
                    });
                } catch (e) {
                    console.log('[AmazfitEditor] probe ' + label + ' ERROR: ' + e);
                }
            });
        } catch (e) {
            console.log('[AmazfitEditor] amazfitProbeSleepPai ERROR: ' + e);
        }
    };
})();



/*
 * --- PATCH SLEEP/PAI SIEMPRE VISIBLES + SIN MODULE ERROR ---
 * Logs actuales:
 * - sleep existe, pero solo se ve sleep.name
 * - pai existe, pero solo se ve pai.name
 * Por tanto se mantienen como widgets y muestran:
 * - valor real si algún método/propiedad devuelve número
 * - si no, "SLEEP" / "PAI" para confirmar que el sensor existe
 */
(function installSleepPaiAlwaysPatch() {
    if (typeof window === 'undefined') return;
    if (window.__sleepPaiAlwaysPatchInstalled) return;
    window.__sleepPaiAlwaysPatchInstalled = true;

    function patchSleepPaiGeneratedCode(code) {
        if (!code || typeof code !== 'string') return code;

        // Guard CommonJS por si Zeus carga como ?commonjs-entry en algunos contextos.
        if (!code.includes('Zepp CommonJS compatibility guard')) {
            code = "var module = (typeof module !== 'undefined') ? module : { exports: {} };\\n" +
                   "var exports = (typeof exports !== 'undefined') ? exports : module.exports;\\n" +
                   "// Zepp CommonJS compatibility guard\\n" + code;
        }

        // Nunca desactivar Sleep/PAI en el mapa de sensores.
        code = code
          .replace("  sleep: [],", "  sleep: ['SLEEP'],")
          .replace("  pai: [],", "  pai: ['PAI'],");

        // Añade helpers si no existen.
        if (!code.includes('function readSleepBestEffort(')) {
            const helper = `
function readSleepBestEffort(source) {
  if (!source) return 'SLEEP'
  try {
    var v = readNumber(source, ['getTotal', 'getToday', 'getCurrent', 'getLast'], ['total', 'today', 'duration', 'minutes', 'current', 'last', 'value'], null)
    if (v !== null && v !== undefined && !isNaN(v) && Number(v) > 0) {
      return formatDurationValue(Number(v))
    }
  } catch (e) {}
  try {
    if (source.name) return 'SLEEP'
  } catch (e) {}
  return 'SLEEP'
}

function readPaiBestEffort(source) {
  if (!source) return 'PAI'
  try {
    var v = readNumber(source, ['getCurrent', 'getToday', 'getTotal', 'getLast'], ['current', 'today', 'total', 'last', 'pai', 'value'], null)
    if (v !== null && v !== undefined && !isNaN(v) && Number(v) > 0) {
      return String(Math.round(Number(v)))
    }
  } catch (e) {}
  try {
    if (source.name) return 'PAI'
  } catch (e) {}
  return 'PAI'
}
`;
            if (code.includes('function getMetricText')) {
                code = code.replace('function getMetricText', helper + '\nfunction getMetricText');
            } else {
                code += '\n' + helper + '\n';
            }
        }

        // Cambia salida de texto para que no sea -- ni 0 engañoso.
        code = code
          .replace("  if (type === 'sleep') return fallback || '--'", "  if (type === 'sleep') return readSleepBestEffort(metricSensors.sleep)")
          .replace("  if (type === 'pai') return fallback || '--'", "  if (type === 'pai') return readPaiBestEffort(metricSensors.pai)")
          .replace("  if (type === 'sleep') return formatDurationValue(getRawMetric('sleep', 0))", "  if (type === 'sleep') return readSleepBestEffort(metricSensors.sleep)")
          .replace("  if (type === 'pai') return String(getRawMetric('pai', 0))", "  if (type === 'pai') return readPaiBestEffort(metricSensors.pai)");

        // Para progress/rings, si no hay número, usar 0 pero el texto seguirá indicando SLEEP/PAI.
        code = code
          .replace("  if (type === 'sleep') return fallback", "  if (type === 'sleep') return 0")
          .replace("  if (type === 'pai') return fallback", "  if (type === 'pai') return 0");

        return code;
    }

    function patchGenerator(name) {
        const original = window[name];
        if (typeof original !== 'function' || original.__sleepPaiAlwaysPatched) return;
        const wrapped = function() {
            const result = original.apply(this, arguments);
            try {
                const box = document.getElementById('zepp-code-box');
                if (box && box.innerText) box.innerText = patchSleepPaiGeneratedCode(box.innerText);
                if (box && box.value) box.value = patchSleepPaiGeneratedCode(box.value);
            } catch (_) {}
            return typeof result === 'string' ? patchSleepPaiGeneratedCode(result) : result;
        };
        wrapped.__sleepPaiAlwaysPatched = true;
        window[name] = wrapped;
        try { globalThis[name] = wrapped; } catch (_) {}
    }

    ['generateZeppCode', 'createZeppCode', 'buildZeppCode', 'generateWatchfaceCode'].forEach(patchGenerator);

    window.amazfitPatchSleepPaiGeneratedCode = patchSleepPaiGeneratedCode;
})();

