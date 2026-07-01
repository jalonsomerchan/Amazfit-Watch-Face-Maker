// --- CONSTANTES Y VARIABLES DE ESTADO ---
let elements = [];
let selectedElementId = null;
let isDragging = false;
let isResizing = false;
let dragOffset = { x: 0, y: 0 };
let resizeState = { startX: 0, startY: 0, width: 0, height: 0 };
let showGuides = false;
const GRID_SIZE = 10;

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
    'date',
    'steps',
    'calories',
    'distance',
    'heart',
    'battery',
    'sleep',
    'stress',
    'spo2',
    'pai',
    'weather',
    'temperature',
    'humidity',
    'uv',
    'altitude',
    'pressure',
    'sunrise',
    'sunset',
    'alarm',
    'bluetooth',
    'stopwatch'
];

const metricDefaults = {
    time: { text: '10:09', color: '#38bdf8', fontSize: 55, fontFamily: 'font-teko' },
    date: { text: 'MIE, 30 JUN', color: '#34d399', fontSize: 18, fontFamily: 'font-rajdhani', dateFormat: 'weekday-day-month-short' },
    steps: { text: '👣 5,420', color: '#fbbf24', fontSize: 24, fontFamily: 'font-chakra' },
    calories: { text: '🔥 420 KCAL', color: '#fb923c', fontSize: 22, fontFamily: 'font-chakra' },
    distance: { text: '📍 4.8 KM', color: '#a3e635', fontSize: 22, fontFamily: 'font-chakra' },
    heart: { text: '❤️ 75 BPM', color: '#f43f5e', fontSize: 24, fontFamily: 'font-chakra' },
    battery: { text: '🔋 80%', color: '#2dd4bf', fontSize: 24, fontFamily: 'font-orbitron' },
    sleep: { text: '🌙 7H 35M', color: '#a5b4fc', fontSize: 22, fontFamily: 'font-rajdhani' },
    stress: { text: '⚡ 34', color: '#f87171', fontSize: 22, fontFamily: 'font-chakra' },
    spo2: { text: '💧 98%', color: '#38bdf8', fontSize: 22, fontFamily: 'font-chakra' },
    pai: { text: 'PAI 86', color: '#c084fc', fontSize: 22, fontFamily: 'font-orbitron' },
    weather: { text: '☀️ SOLEADO', color: '#fde047', fontSize: 18, fontFamily: 'font-rajdhani' },
    temperature: { text: '24°C', color: '#fca5a5', fontSize: 26, fontFamily: 'font-orbitron' },
    humidity: { text: '💧 58%', color: '#93c5fd', fontSize: 22, fontFamily: 'font-chakra' },
    uv: { text: 'UV 6', color: '#facc15', fontSize: 22, fontFamily: 'font-chakra' },
    altitude: { text: '650 M', color: '#d6d3d1', fontSize: 22, fontFamily: 'font-rajdhani' },
    pressure: { text: '1018 HPA', color: '#67e8f9', fontSize: 20, fontFamily: 'font-rajdhani' },
    sunrise: { text: '06:42', color: '#fdba74', fontSize: 20, fontFamily: 'font-orbitron' },
    sunset: { text: '21:38', color: '#f9a8d4', fontSize: 20, fontFamily: 'font-orbitron' },
    alarm: { text: '07:30', color: '#d8b4fe', fontSize: 20, fontFamily: 'font-orbitron' },
    bluetooth: { text: 'BT ON', color: '#60a5fa', fontSize: 18, fontFamily: 'font-rajdhani' },
    stopwatch: { text: '00:00', color: '#cbd5e1', fontSize: 22, fontFamily: 'font-orbitron' }
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
    'month-day': 'JUN 30'
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

function pad2(value) {
    return value < 10 ? `0${value}` : String(value);
}

function getDateParts(date) {
    const weekdaysShort = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const weekdaysLong = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const monthsShort = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const monthsLong = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return {
        day: pad2(date.getDate()),
        month: pad2(date.getMonth() + 1),
        year: String(date.getFullYear()),
        weekdayShort: weekdaysShort[date.getDay()],
        weekdayLong: weekdaysLong[date.getDay()],
        monthShort: monthsShort[date.getMonth()],
        monthLong: monthsLong[date.getMonth()]
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
        case 'weekday-day-month-short':
        default:
            return `${parts.weekdayShort}, ${parts.day} ${parts.monthShort}`;
    }
}

function isDynamicMetricType(type) {
    return DYNAMIC_METRIC_TYPES.includes(type);
}

function getMetricLabel(type) {
    const labels = {
        battery: 'BATERÍA',
        steps: 'PASOS',
        heart: 'RITMO C.',
        calories: 'CALORÍAS',
        distance: 'DISTANCIA',
        sleep: 'SUEÑO',
        stress: 'ESTRÉS',
        spo2: 'SPO2',
        pai: 'PAI'
    };
    return labels[type] || String(type || 'DATO').toUpperCase();
}

function supportsOptionalTitle(type) {
    return type !== 'label';
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
    if (element.type !== 'date') return;
    if (!element.dateFormat) element.dateFormat = 'weekday-day-month-short';
    element.text = dateFormatLabels[element.dateFormat] || dateFormatLabels['weekday-day-month-short'];
}

function ensureMetricAffixDefaults(element) {
    if (!isDynamicMetricType(element.type)) return;
    if (element.metricPrefix === undefined) element.metricPrefix = '';
    if (element.metricSuffix === undefined) element.metricSuffix = '';
}

function canRenderElementAsImage(element) {
    return element && !['progress-bar', 'chart', 'image'].includes(element.type);
}

function applyMetricAffixes(element, value) {
    if (!isDynamicMetricType(element.type)) return value || '';
    return `${element.metricPrefix || ''}${value || ''}${element.metricSuffix || ''}`;
}

function getElementDisplayText(element) {
    if (element.type === 'bluetooth') {
        const value = element.statusPreview === 'ko'
            ? (element.statusKoText || 'BT KO')
            : (element.statusOkText || 'BT OK');
        return applyMetricAffixes(element, value);
    }
    if (element.type === 'date') {
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
    ensureStatusDefaults(element);
    ensureDateDefaults(element);
    ensureMetricAffixDefaults(element);
    return element;
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
        screen.style.width = `${Math.round(width * SCALE)}px`;
        screen.style.height = `${Math.round(height * SCALE)}px`;
        screen.style.setProperty('--grid-small', `${GRID_SIZE * SCALE}px`);
        screen.style.setProperty('--grid-large', `${GRID_SIZE * 5 * SCALE}px`);
    }

    const label = document.getElementById('watch-resolution-label');
    if (label) label.innerText = `${width} x ${height} px`;

    const summary = document.getElementById('watch-resolution-summary');
    if (summary) summary.innerText = `${watchConfig.modelName || 'Reloj'} · ${width} x ${height}`;

    const modelSelect = document.getElementById('watch-model');
    if (modelSelect && watchConfig.model) modelSelect.value = watchConfig.model;

    const shapeSelect = document.getElementById('watch-shape');
    if (shapeSelect) shapeSelect.value = watchConfig.shape || 'square';
    applyWatchShape();
}

function changeWatchModel(modelKey) {
    const model = watchModels[modelKey] || watchModels.active;
    watchConfig.model = modelKey;
    watchConfig.modelName = model.name;
    watchConfig.width = model.width;
    watchConfig.height = model.height;
    watchConfig.shape = model.shape || 'square';
    updateWatchViewport();
    renderCanvas();
    showNotification(`${model.name}: ${model.width} x ${model.height}px`, 'success');
}

function changeWatchShape(shape) {
    watchConfig.shape = shape === 'round' ? 'round' : 'square';
    applyWatchShape();
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
        { id: 't6', type: 'heart', x: 20, y: 330, width: 350, height: 25, color: '#ef4444', fontSize: 18, fontFamily: 'font-chakra', opacity: 0.9, text: '❤️ 124 PPM', textAlign: 'center' }
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
        { id: 'c4', type: 'steps', x: 20, y: 275, width: 350, height: 30, color: '#fbbf24', fontSize: 16, fontFamily: 'font-montserrat', opacity: 0.9, text: 'Pasos hoy: 7,450', textAlign: 'center' }
    ]
};

// --- INICIALIZACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    updateWatchViewport();
    applyTemplate('sport'); // Carga deportiva por defecto
    updateBgSettings();

    const installModal = document.getElementById('install-modal');
    installModal.addEventListener('click', (event) => {
        if (event.target === installModal) closeInstallModal();
    });
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeInstallModal();
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
        case 'date':
        case 'steps':
        case 'calories':
        case 'distance':
        case 'heart':
        case 'battery':
        case 'sleep':
        case 'stress':
        case 'spo2':
        case 'pai':
        case 'weather':
        case 'temperature':
        case 'humidity':
        case 'uv':
        case 'altitude':
        case 'pressure':
        case 'sunrise':
        case 'sunset':
        case 'alarm':
        case 'bluetooth':
        case 'stopwatch':
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
        div.className = `absolute cursor-move select-none flex flex-col transition-all ${selectedElementId === el.id ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-black z-30' : 'hover:ring-1 hover:ring-slate-700'}`;

        // Conversión escala del plano nativo al simulador visual
        div.style.left = `${el.x * SCALE}px`;
        div.style.top = `${el.y * SCALE}px`;
        div.style.width = `${el.width * SCALE}px`;
        div.style.height = `${el.height * SCALE}px`;
        div.style.opacity = el.opacity;

        // Alineación horizontal según la propiedad
        if (el.textAlign === 'left') {
            div.style.justifyContent = 'flex-start';
        } else if (el.textAlign === 'right') {
            div.style.justifyContent = 'flex-end';
        } else {
            div.style.justifyContent = 'center';
        }

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
            div.style.justifyContent = 'center';
            div.innerHTML = `${el.titleEnabled ? `<div class="leading-none w-full" style="font-family: ${getCssFontFamily(el.titleFontFamily || 'font-rajdhani')}; font-size: ${(el.titleFontSize || 10) * SCALE}px; color: ${el.titleColor || '#94a3b8'}; text-align: ${el.textAlign || 'center'};">${el.titleText || ''}</div>` : ''}<div class="leading-none w-full" style="font-family: ${getCssFontFamily(el.fontFamily || 'font-inter')}; font-size: ${(el.fontSize || 14) * SCALE}px; color: ${getElementDisplayColor(el)}; text-align: ${el.textAlign || 'center'};">${getElementDisplayText(el)}</div>`;
        }

        if (selectedElementId === el.id) {
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
        div.addEventListener('touchstart', (e) => startDrag(e, el.id), { passive: true });

        container.appendChild(div);
    });

    generateZeppCode();
}

// --- ARRASTRE DE ELEMENTOS (DRAG & DROP) ---
function startDrag(e, id) {
    if (isResizing) return;
    e.stopPropagation();
    selectElement(id);
    isDragging = true;

    const element = elements.find(el => el.id === id);
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    // Diferencia
    dragOffset.x = (clientX / SCALE) - element.x;
    dragOffset.y = (clientY / SCALE) - element.y;

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
}

function drag(e) {
    if (!isDragging || isResizing || !selectedElementId) return;
    if (e.type === 'touchmove') e.preventDefault(); // detiene scroll móvil

    const element = elements.find(el => el.id === selectedElementId);
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    let newX = snapToGrid(Math.round((clientX / SCALE) - dragOffset.x));
    let newY = snapToGrid(Math.round((clientY / SCALE) - dragOffset.y));

    // Límites para evitar que se pierdan fuera de la pantalla elegida
    newX = Math.max(-50, Math.min(getCanvasWidth() - 20, newX));
    newY = Math.max(-30, Math.min(getCanvasHeight() - 10, newY));

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
}

function startResize(e, id) {
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

function resizeElement(e) {
    if (!isResizing || !selectedElementId) return;
    if (e.type === 'touchmove') e.preventDefault();

    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;

    const point = getPointerPoint(e);
    const deltaX = Math.round((point.x - resizeState.startX) / SCALE);
    const deltaY = Math.round((point.y - resizeState.startY) / SCALE);
    const minWidth = element.type === 'progress-bar' || element.type === 'chart' ? 32 : 18;
    const minHeight = element.type === 'progress-bar' ? 18 : 16;

    element.width = Math.max(minWidth, Math.min(getCanvasWidth() - element.x, snapToGrid(resizeState.width + deltaX)));
    element.height = Math.max(minHeight, Math.min(getCanvasHeight() - element.y, snapToGrid(resizeState.height + deltaY)));

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
        return;
    }

    document.getElementById('no-selection-msg').classList.add('hidden');
    document.getElementById('inspector-form').classList.remove('hidden');

    // Cargar datos en el inspector
    document.getElementById('elem-badge').innerText = `Widget: ${element.type}`;
    document.getElementById('prop-x').value = element.x;
    document.getElementById('prop-y').value = element.y;
    document.getElementById('prop-w').value = element.width;
    document.getElementById('prop-h').value = element.height;
    document.getElementById('prop-font').value = element.fontFamily || 'font-inter';
    document.getElementById('prop-size').value = element.fontSize || 14;
    document.getElementById('prop-size-slider').value = element.fontSize || 14;
    document.getElementById('prop-color').value = element.color;
    document.getElementById('prop-color-hex').value = element.color;
    document.getElementById('prop-opacity').value = element.opacity * 100;

    // Control de visibilidad según tipo de Widget
    const textContainer = document.getElementById('prop-text-container');
    const dateFormatContainer = document.getElementById('prop-date-format-container');
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

    if (element.type === 'date') {
        dateFormatContainer.classList.remove('hidden');
        document.getElementById('prop-date-format').value = element.dateFormat || 'weekday-day-month-short';
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

    if (element.type === 'progress-bar') {
        fontContainer.classList.add('hidden');
        progressContainer.classList.remove('hidden');

        document.getElementById('prop-progress-type').value = element.progressType || 'battery';
        document.getElementById('prop-progress-val').value = element.progressValue || 75;
        document.getElementById('prop-progress-thickness').value = element.progressThickness || 6;
        document.getElementById('prop-progress-bg').value = element.progressBgColor || '#1e293b';
    }

    if (element.type === 'chart') {
        textContainer.classList.add('hidden');
        fontContainer.classList.add('hidden');
        document.getElementById('prop-size').closest('div').parentElement.classList.add('hidden'); // Ocultar tamaño
    } else {
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
    renderCanvas();
    selectElement(null);
    showNotification("Widget eliminado", "info");
}

function clearCanvas() {
    elements = [];
    selectedElementId = null;
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
        y += (el.titleFontSize || 10) + 2;
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
        .filter(({ el }) => canRenderElementAsImage(el) && el.renderAsImage);

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
        const fullImageFallback = canRenderElementAsImage(el) && el.renderAsImage;
        if (el.titleEnabled && !fullImageFallback) usedFontFiles.add(getZeppFontFile(el.titleFontFamily || 'font-rajdhani'));
        if (el.type === 'progress-bar') usedFontFiles.add(getZeppFontFile(el.fontFamily || 'font-inter'));
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
            if (parsed.watchConfig && parsed.elements) {
                watchConfig = {
                    ...watchConfig,
                    ...parsed.watchConfig
                };
                if (!watchConfig.modelName) watchConfig.modelName = watchModels[watchConfig.model]?.name || 'Personalizado';
                if (!watchConfig.width) watchConfig.width = watchModels[watchConfig.model]?.width || 390;
                if (!watchConfig.height) watchConfig.height = watchModels[watchConfig.model]?.height || 450;
                if (!watchConfig.shape) watchConfig.shape = watchModels[watchConfig.model]?.shape || 'square';
                elements = parsed.elements.map(normalizeElement);
                updateWatchViewport();

                changeBgType(watchConfig.bgType);
                if (watchConfig.bgType === 'color') {
                    document.getElementById('bg-color').value = watchConfig.bgColor;
                } else if (watchConfig.bgType === 'gradient') {
                    document.getElementById('bg-grad-start').value = watchConfig.bgGradStart;
                    document.getElementById('bg-grad-end').value = watchConfig.bgGradEnd;
                    document.getElementById('bg-grad-angle').value = watchConfig.bgGradAngle;
                }

                updateBgSettings();
                renderCanvas();
                selectElement(null);
                showNotification("Proyecto cargado con éxito!", "success");
            } else {
                showNotification("Formato JSON incompatible.", "error");
            }
        } catch (err) {
            showNotification("Error procesando archivo.", "error");
        }
    };
    reader.readAsText(file);
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
            const titleOffset = el.titleEnabled ? (el.titleFontSize || 10) + 2 : 0;
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
    const textArea = document.createElement("textarea");
    textArea.value = codeBox.innerText;
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
    if (el.type === 'bluetooth') {
        return wrapGeneratedMetricText(el, `getMetricText('bluetooth', '${escapeGeneratedText(getElementDisplayText(el))}', { okText: '${escapeGeneratedText(el.statusOkText || 'BT OK')}', koText: '${escapeGeneratedText(el.statusKoText || 'BT KO')}' })`);
    }
    if (el.type === 'date') {
        return wrapGeneratedMetricText(el, `getMetricText('date', '${escapeGeneratedText(getElementDisplayText(el))}', { dateFormat: '${escapeGeneratedText(el.dateFormat || 'weekday-day-month-short')}' })`);
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

// --- GENERADOR DE CÓDIGO ZEPP OS SDK COMPATIBLE ---
function generateZeppCode() {
    const codeBox = document.getElementById('zepp-code-box');

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
    jsCode += `    return timer.createTimer(1, 30000, updateDynamicWidgets, {})\n`;
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
    jsCode += `  return weekdayShort + ', ' + day + ' ' + monthShort\n`;
    jsCode += `}\n\n`;
    jsCode += `function formatDistance(value) {\n`;
    jsCode += `  if (value >= 1000) return (Math.round(value / 100) / 10) + ' KM'\n`;
    jsCode += `  return Math.round(value) + ' M'\n`;
    jsCode += `}\n\n`;
    jsCode += `function formatDuration(minutes) {\n`;
    jsCode += `  const total = Math.max(0, Math.round(minutes))\n`;
    jsCode += `  return Math.floor(total / 60) + 'H ' + pad2(total % 60) + 'M'\n`;
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
    jsCode += `  if (type === 'time') return pad2(now.getHours()) + ':' + pad2(now.getMinutes())\n`;
    jsCode += `  if (type === 'date') return formatDateText(options.dateFormat || 'weekday-day-month-short', now)\n`;
    jsCode += `  if (type === 'battery') return getRawMetric('battery', 0) + '%'\n`;
    jsCode += `  if (type === 'steps') return String(getRawMetric('steps', 0))\n`;
    jsCode += `  if (type === 'heart') return getRawMetric('heart', 0) + ' PPM'\n`;
    jsCode += `  if (type === 'calories') return getRawMetric('calories', 0) + ' KCAL'\n`;
    jsCode += `  if (type === 'distance') return formatDistance(getRawMetric('distance', 0))\n`;
    jsCode += `  if (type === 'sleep') return formatDuration(getRawMetric('sleep', 0))\n`;
    jsCode += `  if (type === 'stress') return 'EST ' + getRawMetric('stress', 0)\n`;
    jsCode += `  if (type === 'spo2') return getRawMetric('spo2', 0) + '%'\n`;
    jsCode += `  if (type === 'pai') return 'PAI ' + getRawMetric('pai', 0)\n`;
    jsCode += `  if (type === 'weather') return readString(metricSensors.weather, ['getCurrent'], ['weather', 'condition', 'text', 'name'], fallback || '')\n`;
    jsCode += `  if (type === 'temperature') return getRawMetric('temperature', 0) + '°C'\n`;
    jsCode += `  if (type === 'humidity') return getRawMetric('humidity', 0) + '%'\n`;
    jsCode += `  if (type === 'uv') return 'UV ' + getRawMetric('uv', 0)\n`;
    jsCode += `  if (type === 'altitude') return getRawMetric('altitude', 0) + ' M'\n`;
    jsCode += `  if (type === 'pressure') return getRawMetric('pressure', 0) + ' HPA'\n`;
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
        const titleOffset = el.titleEnabled ? (el.titleFontSize || 10) + 2 : 0;
        const contentY = el.y + titleOffset;
        const contentHeight = Math.max(1, el.height - titleOffset);
        const contentFontPath = getZeppFontPath(el.fontFamily || 'font-inter');

        const fullImageFallback = canRenderElementAsImage(el) && el.renderAsImage;

        if (el.titleEnabled && !fullImageFallback) {
            const titleFontPath = getZeppFontPath(el.titleFontFamily || 'font-rajdhani');
            jsCode += `    createWidget(widget.TEXT, {\n`;
            jsCode += `      x: ${el.x}, y: ${el.y}, w: ${el.width}, h: ${Math.max(10, el.titleFontSize || 10)},\n`;
            jsCode += `      text: '${escapeGeneratedText(el.titleText)}',\n`;
            jsCode += `      text_size: ${el.titleFontSize || 10},\n`;
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
            jsCode += `      x: ${el.x}, y: ${contentY}, w: ${el.width}, h: 12,\n`;
            jsCode += `      text: getMetricText('${progressType}', '${fallbackText}'),\n`;
            jsCode += `      text_size: 10,\n`;
            jsCode += `      font: '${contentFontPath}',\n`;
            jsCode += `      color: 0x${el.color.replace('#', '')},\n`;
            jsCode += `      align_h: align.RIGHT\n`;
            jsCode += `    })\n`;
            jsCode += `    dynamicBars.push({ node: ${fillName}, label: ${labelName}, type: '${progressType}', fallback: '${fallbackText}', x: ${el.x}, y: ${contentY + 12}, width: ${el.width}, height: ${el.progressThickness}, color: 0x${el.color.replace('#', '')} })\n\n`;
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
        else if (canRenderElementAsImage(el) && el.renderAsImage) {
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
            jsCode += `      x: ${el.x}, y: ${contentY}, w: ${el.width}, h: ${contentHeight},\n`;
            jsCode += `      text: ${getGeneratedTextExpression(el)},\n`;
            jsCode += `      text_size: ${el.fontSize || 18},\n`;
            jsCode += `      font: '${contentFontPath}',\n`;
            jsCode += `      color: 0x${getElementDisplayColor(el).replace('#', '')},\n`;
            jsCode += `      align_h: ${zeppAlign}\n`;
            jsCode += `    })\n`;
            if (dynamicType) {
                if (el.type === 'bluetooth') {
                    jsCode += `    dynamicTexts.push({ node: ${textWidgetName}, type: 'bluetooth', fallback: '${escapeGeneratedText(getElementDisplayText(el))}', options: { okText: '${escapeGeneratedText(el.statusOkText || 'BT OK')}', koText: '${escapeGeneratedText(el.statusKoText || 'BT KO')}' }, prefix: '${escapeGeneratedText(el.metricPrefix || '')}', suffix: '${escapeGeneratedText(el.metricSuffix || '')}', okColor: 0x${(el.statusOkColor || '#60a5fa').replace('#', '')}, koColor: 0x${(el.statusKoColor || '#f87171').replace('#', '')} })\n`;
                } else if (el.type === 'date') {
                    jsCode += `    dynamicTexts.push({ node: ${textWidgetName}, type: 'date', fallback: '${escapeGeneratedText(getElementDisplayText(el))}', options: { dateFormat: '${escapeGeneratedText(el.dateFormat || 'weekday-day-month-short')}' }, prefix: '${escapeGeneratedText(el.metricPrefix || '')}', suffix: '${escapeGeneratedText(el.metricSuffix || '')}' })\n`;
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
    jsCode += `    console.log('Esfera Destruida')\n`;
    jsCode += `  }\n})`;

    codeBox.innerText = jsCode;
}
