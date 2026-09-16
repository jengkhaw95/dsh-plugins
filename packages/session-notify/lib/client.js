window.__ModuleLoader__.load({
  id: "dsh-session-notify",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
/*! dsh-session-notify — bundles cuelume v0.2.2 (MIT, Copyright (c) 2026 Daniel Belyi). See THIRD_PARTY_NOTICES.md. */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);
var import_react2 = require("react");

// client/api.js
var RPC_CHANNEL = "dsh-session-notify";
var RPC_ENDPOINTS = Object.freeze({
  /** Read the stored preferences (and the host's cue allowlist). */
  getPrefs: "prefs.get",
  /** Persist a partial preference patch; resolves to the full new preferences. */
  setPrefs: "prefs.set"
});

// node_modules/cuelume/dist/sounds/recipes.js
var RECIPES = {
  /** A soft two-note ascending bell, like an iOS/macOS confirmation tink. */
  chime: {
    masterGain: 0.5,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 1046.5, attack: 6e-3, decay: 0.22, peak: 0.09 },
      { kind: "tone", waveform: "sine", frequency: 1568, offset: 0.09, attack: 6e-3, decay: 0.26, peak: 0.08 }
    ],
    shimmer: { delay: 0.12, feedback: 0.25, wet: 0.18, lowpass: 4e3 }
  },
  /** A quick ascending twinkle of four notes — bright and playful. */
  sparkle: {
    masterGain: 0.5,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 1760, offset: 0, attack: 3e-3, decay: 0.09, peak: 0.045 },
      { kind: "tone", waveform: "sine", frequency: 2217, offset: 0.045, attack: 3e-3, decay: 0.09, peak: 0.04 },
      { kind: "tone", waveform: "sine", frequency: 2637, offset: 0.09, attack: 3e-3, decay: 0.1, peak: 0.038 },
      { kind: "tone", waveform: "sine", frequency: 3520, offset: 0.135, attack: 3e-3, decay: 0.12, peak: 0.032 }
    ],
    shimmer: { delay: 0.07, feedback: 0.35, wet: 0.22, lowpass: 6e3 }
  },
  /** A single note gliding smoothly downward, like a drop of water. */
  droplet: {
    masterGain: 0.55,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 1200, glideTo: 550, glideTime: 0.14, attack: 4e-3, decay: 0.2, peak: 0.075 }
    ],
    shimmer: { delay: 0.09, feedback: 0.2, wet: 0.15, lowpass: 3e3 }
  },
  /** A warm, slow-swelling pad from two gently detuned sines. */
  bloom: {
    masterGain: 0.5,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 528, attack: 0.06, decay: 0.32, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 528, detune: 12, attack: 0.06, decay: 0.34, peak: 0.05 }
    ],
    shimmer: { delay: 0.15, feedback: 0.2, wet: 0.12, lowpass: 2500 }
  },
  /** A soft hush with a falling tone — for tooltips and low-priority previews. */
  whisper: {
    masterGain: 0.48,
    layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 1600, filterQ: 0.7, attack: 0.025, decay: 0.13, peak: 0.04 },
      { kind: "tone", waveform: "sine", frequency: 880, glideTo: 660, glideTime: 0.14, offset: 0.01, attack: 0.012, decay: 0.14, peak: 0.025 }
    ]
  },
  /** A focused, bandpass-filtered tick with a bright sine ping on top — crisp and instant. */
  tick: {
    masterGain: 0.4,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 5400, filterQ: 1.8, attack: 1e-3, decay: 0.018, peak: 0.14 },
      { kind: "tone", waveform: "sine", frequency: 2600, attack: 1e-3, decay: 0.012, peak: 0.018 }
    ]
  },
  /** A dull, muted knock — the "down" half of a press/release pair, like a key bottoming out. */
  press: {
    masterGain: 0.4,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 1700, filterQ: 1.4, attack: 1e-3, decay: 0.02, peak: 0.13 }
    ]
  },
  /** A brighter, springier tick — the "up" half of a press/release pair, like a key returning. */
  release: {
    masterGain: 0.4,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 4600, filterQ: 1.8, attack: 1e-3, decay: 0.016, peak: 0.12 },
      { kind: "tone", waveform: "sine", frequency: 3200, offset: 6e-3, attack: 1e-3, decay: 0.05, peak: 0.02 }
    ]
  },
  /** A two-part click-clack, like a mechanical switch flipping between states. */
  toggle: {
    masterGain: 0.4,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 2200, filterQ: 1.6, attack: 1e-3, decay: 0.016, peak: 0.12 },
      { kind: "noise", filterType: "bandpass", filterFrequency: 3800, filterQ: 1.6, offset: 0.024, attack: 1e-3, decay: 0.02, peak: 0.1 }
    ]
  },
  /** A short, warm three-note ascending confirmation — "done", not a fanfare. */
  success: {
    masterGain: 0.5,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 880, attack: 4e-3, decay: 0.09, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 1108.73, offset: 0.06, attack: 4e-3, decay: 0.1, peak: 0.06 },
      { kind: "tone", waveform: "sine", frequency: 1318.51, offset: 0.12, attack: 4e-3, decay: 0.18, peak: 0.07 }
    ],
    shimmer: { delay: 0.1, feedback: 0.22, wet: 0.16, lowpass: 4500 }
  },
  /** A muted knock followed by two descending tones — a calm, recoverable refusal. */
  error: {
    masterGain: 0.42,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 850, filterQ: 1.1, attack: 1e-3, decay: 0.035, peak: 0.13 },
      { kind: "tone", waveform: "triangle", frequency: 440, offset: 0.025, attack: 4e-3, decay: 0.09, peak: 0.045 },
      { kind: "tone", waveform: "triangle", frequency: 349.23, offset: 0.1, attack: 4e-3, decay: 0.14, peak: 0.04 }
    ]
  },
  /** A papery filtered flick with a tiny glass tick — for pages, galleries, and carousels. */
  page: {
    masterGain: 0.38,
    layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 1800, filterQ: 0.7, attack: 6e-3, decay: 0.08, peak: 0.11 },
      { kind: "noise", filterType: "bandpass", filterFrequency: 4200, filterQ: 1.2, offset: 0.04, attack: 4e-3, decay: 0.065, peak: 0.08 },
      { kind: "tone", waveform: "sine", frequency: 2400, offset: 0.075, attack: 2e-3, decay: 0.045, peak: 0.02 }
    ]
  },
  /** A brief unresolved lift — signals that user-initiated work has started. */
  loading: {
    masterGain: 0.42,
    layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 1400, filterQ: 0.6, attack: 0.035, decay: 0.14, peak: 0.035 },
      { kind: "tone", waveform: "sine", frequency: 420, glideTo: 630, glideTime: 0.18, attack: 0.025, decay: 0.18, peak: 0.05 }
    ],
    shimmer: { delay: 0.11, feedback: 0.18, wet: 0.12, lowpass: 2800 }
  },
  /** A quick lock-on sweep resolving to a clear tone — the system is ready. */
  ready: {
    masterGain: 0.48,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 3600, filterQ: 1.8, attack: 1e-3, decay: 0.02, peak: 0.11 },
      { kind: "tone", waveform: "triangle", frequency: 330, glideTo: 660, glideTime: 0.12, offset: 0.012, attack: 4e-3, decay: 0.16, peak: 0.055 },
      { kind: "tone", waveform: "sine", frequency: 990, offset: 0.13, attack: 4e-3, decay: 0.22, peak: 0.06 }
    ],
    shimmer: { delay: 0.1, feedback: 0.16, wet: 0.1, lowpass: 4200 }
  },
  /** A compact synthetic chirp — crisp feedback for primary buttons and controls. */
  pulse: {
    masterGain: 0.42,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 2600, filterQ: 2.4, attack: 1e-3, decay: 0.022, peak: 0.08 },
      { kind: "tone", waveform: "triangle", frequency: 620, glideTo: 1240, glideTime: 0.07, attack: 2e-3, decay: 0.085, peak: 0.055 }
    ]
  },
  /** A fast three-step locator signal — playful feedback for menus and secondary buttons. */
  scan: {
    masterGain: 0.4,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 740, attack: 2e-3, decay: 0.055, peak: 0.05 },
      { kind: "tone", waveform: "sine", frequency: 1110, offset: 0.045, attack: 2e-3, decay: 0.055, peak: 0.045 },
      { kind: "tone", waveform: "sine", frequency: 1665, offset: 0.09, attack: 2e-3, decay: 0.07, peak: 0.04 }
    ],
    shimmer: { delay: 0.065, feedback: 0.16, wet: 0.1, lowpass: 4200 }
  },
  /** A rising harmonic portal with a soft tail — for client-side page arrivals. */
  arrival: {
    masterGain: 0.44,
    layers: [
      { kind: "noise", filterType: "lowpass", filterFrequency: 900, filterQ: 0.8, attack: 0.05, decay: 0.24, peak: 0.035 },
      { kind: "tone", waveform: "sine", frequency: 220, glideTo: 440, glideTime: 0.32, attack: 0.04, decay: 0.34, peak: 0.055 },
      { kind: "tone", waveform: "sine", frequency: 659.25, offset: 0.12, attack: 0.045, decay: 0.32, peak: 0.04 },
      { kind: "tone", waveform: "sine", frequency: 987.77, offset: 0.19, attack: 0.045, decay: 0.34, peak: 0.032 }
    ],
    shimmer: { delay: 0.16, feedback: 0.28, wet: 0.18, lowpass: 3200 }
  }
};
function isSoundName(value) {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(RECIPES, value);
}
var sounds = Object.keys(RECIPES);

// node_modules/cuelume/dist/audio/engine.js
var SOURCE_STOP_PADDING = 0.05;
var CLEANUP_MARGIN = 0.05;
var INAUDIBLE_GAIN = 1e-3;
var OUTPUT_GAIN = 4;
function renderTone(context, destination, layer, startTime) {
  const oscillator = context.createOscillator();
  oscillator.type = layer.waveform;
  oscillator.frequency.setValueAtTime(layer.frequency, startTime);
  if (layer.detune)
    oscillator.detune.value = layer.detune;
  if (layer.glideTo !== void 0) {
    const glideTime = layer.glideTime ?? layer.attack + layer.decay;
    oscillator.frequency.exponentialRampToValueAtTime(layer.glideTo, startTime + glideTime);
  }
  const gain = context.createGain();
  gain.gain.setValueAtTime(1e-4, startTime);
  gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack);
  gain.gain.exponentialRampToValueAtTime(1e-4, startTime + layer.attack + layer.decay);
  oscillator.connect(gain).connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + layer.attack + layer.decay + SOURCE_STOP_PADDING);
}
function renderNoise(context, destination, layer, startTime) {
  const duration = layer.attack + layer.decay + SOURCE_STOP_PADDING;
  const length = Math.max(1, Math.floor(duration * context.sampleRate));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++)
    data[i] = 2 * Math.random() - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = layer.filterType;
  filter.frequency.value = layer.filterFrequency;
  if (layer.filterQ !== void 0)
    filter.Q.value = layer.filterQ;
  const gain = context.createGain();
  gain.gain.setValueAtTime(1e-4, startTime);
  gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack);
  gain.gain.exponentialRampToValueAtTime(1e-4, startTime + layer.attack + layer.decay);
  source.connect(filter).connect(gain).connect(destination);
  source.start(startTime);
  source.stop(startTime + duration);
}
function attachShimmer(context, source, destination, shimmer) {
  const delay = context.createDelay(1);
  delay.delayTime.value = shimmer.delay;
  const feedbackFilter = context.createBiquadFilter();
  feedbackFilter.type = "lowpass";
  feedbackFilter.frequency.value = shimmer.lowpass;
  const feedbackGain = context.createGain();
  feedbackGain.gain.value = shimmer.feedback;
  const wetGain = context.createGain();
  wetGain.gain.value = shimmer.wet;
  source.connect(delay);
  delay.connect(feedbackFilter);
  feedbackFilter.connect(feedbackGain);
  feedbackGain.connect(delay);
  feedbackFilter.connect(wetGain);
  wetGain.connect(destination);
  return [delay, feedbackFilter, feedbackGain, wetGain];
}
function sourceEnd(recipe) {
  return Math.max(...recipe.layers.map((layer) => (layer.offset ?? 0) + layer.attack + layer.decay + SOURCE_STOP_PADDING));
}
function shimmerTail(shimmer) {
  if (!shimmer || shimmer.feedback <= 0)
    return 0;
  if (shimmer.feedback >= 1)
    return shimmer.delay;
  return shimmer.delay * (1 + Math.ceil(Math.log(INAUDIBLE_GAIN) / Math.log(shimmer.feedback)));
}
var sharedOutput = null;
function getOutput(context) {
  if (sharedOutput)
    return sharedOutput;
  const output = context.createGain();
  output.gain.value = OUTPUT_GAIN;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 2e-3;
  limiter.release.value = 0.08;
  output.connect(limiter).connect(context.destination);
  sharedOutput = output;
  return output;
}
function renderRecipe(context, recipe, volume) {
  const now = context.currentTime;
  const output = getOutput(context);
  const master = context.createGain();
  master.gain.value = recipe.masterGain * volume;
  master.connect(output);
  const shimmerNodes = recipe.shimmer ? attachShimmer(context, master, output, recipe.shimmer) : [];
  for (const layer of recipe.layers) {
    const startTime = now + (layer.offset ?? 0);
    if (layer.kind === "tone")
      renderTone(context, master, layer, startTime);
    else
      renderNoise(context, master, layer, startTime);
  }
  const cleanupAfterMs = (sourceEnd(recipe) + shimmerTail(recipe.shimmer) + CLEANUP_MARGIN) * 1e3;
  setTimeout(() => {
    master.disconnect();
    for (const node of shimmerNodes)
      node.disconnect();
  }, cleanupAfterMs);
}
var sharedContext = null;
var enabled = true;
var globalVolume = 1;
function normalizeVolume(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}
function setEnabled(value) {
  if (typeof value === "boolean")
    enabled = value;
}
function setVolume(value) {
  globalVolume = normalizeVolume(value, globalVolume);
}
function getAudioContext() {
  if (sharedContext)
    return sharedContext;
  if (typeof window === "undefined")
    return null;
  const Ctor = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctor)
    return null;
  try {
    sharedContext = new Ctor();
  } catch {
    return null;
  }
  return sharedContext;
}
function play(sound = "chime", options) {
  if (!enabled || !isSoundName(sound))
    return;
  if (typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === false)
    return;
  const playVolume = globalVolume * normalizeVolume(options?.volume, 1);
  if (playVolume === 0)
    return;
  const context = getAudioContext();
  if (!context)
    return;
  const recipe = RECIPES[sound];
  if (context.state === "running") {
    renderRecipe(context, recipe, playVolume);
  } else {
    try {
      void context.resume().then(() => {
        if (enabled && context.state === "running")
          renderRecipe(context, recipe, playVolume);
      }, () => {
      });
    } catch {
    }
  }
}

// client/cues.js
var CUE_NAMES = Object.freeze(Array.isArray(sounds) ? [...sounds] : []);
function isCue(name2) {
  return typeof name2 === "string" && CUE_NAMES.includes(name2);
}
function audioAvailable() {
  if (typeof window === "undefined") return false;
  return Boolean(window.AudioContext ?? window.webkitAudioContext);
}
function syncAudio(prefs) {
  setEnabled(prefs?.enabled !== false);
  if (typeof prefs?.volume === "number" && Number.isFinite(prefs.volume)) {
    setVolume(prefs.volume);
  }
}
function playCue(name2, prefs) {
  if (!isCue(name2)) return false;
  syncAudio(prefs);
  play(name2);
  return true;
}
function previewCue(name2, prefs) {
  if (!isCue(name2)) return false;
  const volume = typeof prefs?.volume === "number" ? prefs.volume : 0.7;
  setEnabled(true);
  setVolume(volume);
  play(name2);
  setEnabled(prefs?.enabled !== false);
  return true;
}

// client/i18n.js
var strings_ = {
  en: {
    settingsLabel: "Notifications",
    cardTitle: "Session notifications",
    cardSub: "Hear when the main session finishes a turn or needs your answer. Subagent sessions stay silent — only the session you are driving makes a sound.",
    masterLabel: "Play notification sounds",
    masterHintOn: "Cues are on for the main session.",
    masterHintOff: "Cues are muted everywhere in this browser.",
    doneLabel: "Session finished",
    doneHint: "Played when the main session completes a turn.",
    needsInputLabel: "Needs your input",
    needsInputHint: "Played when the main session is waiting on you.",
    volumeLabel: "Volume",
    hiddenLabel: "Only when this tab is in the background",
    hiddenHint: "Stay quiet while you are watching the session. Recommended if you keep DSH open on a second monitor.",
    preview: "Preview",
    previewAria: "Preview the selected sound",
    unavailable: "Notification sounds are unavailable — this browser exposes no Web Audio.",
    unreachable: "Could not reach the host half. Restart DSH so the plugin loads on both sides.",
    readingPrefs: "Reading preferences…",
    saveFailed: "Saved for this session, but writing the preferences file failed."
  },
  zh: {
    settingsLabel: "通知",
    cardTitle: "会话通知",
    cardSub: "主会话完成一轮或需要你回答时发出提示音。子代理会话保持静音——只有你正在驱动的会话会发声。",
    masterLabel: "播放通知音",
    masterHintOn: "主会话提示音已开启。",
    masterHintOff: "此浏览器中的提示音已静音。",
    doneLabel: "会话已完成",
    doneHint: "主会话完成一轮时播放。",
    needsInputLabel: "需要你输入",
    needsInputHint: "主会话在等待你回应时播放。",
    volumeLabel: "音量",
    hiddenLabel: "仅当此标签页在后台时",
    hiddenHint: "你正盯着会话时保持安静。若把 DSH 常驻副屏，建议开启。",
    preview: "试听",
    previewAria: "试听所选提示音",
    unavailable: "此浏览器不支持 Web Audio，无法播放通知音。",
    unreachable: "无法连接宿主半边。请重启 DSH，让插件的两半都加载。",
    readingPrefs: "正在读取偏好设置…",
    saveFailed: "本次会话已生效，但写入偏好文件失败。"
  }
};
function getUiLocale() {
  if (typeof document !== "undefined") {
    const tag = document.documentElement?.lang ?? "";
    if (tag.toLowerCase().startsWith("zh")) return "zh";
    if (tag.toLowerCase().startsWith("en")) return "en";
  }
  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  }
  return "en";
}
function strings(locale) {
  return strings_[locale] ?? strings_.en;
}
function subscribeUiLocale(listener) {
  if (typeof MutationObserver === "undefined" || typeof document === "undefined") {
    return () => {
    };
  }
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  return () => observer.disconnect();
}

// client/prefs-store.js
var FALLBACK_PREFS = Object.freeze({
  enabled: true,
  soundDone: "chime",
  soundNeedsInput: "sparkle",
  volume: 0.7,
  onlyWhenHidden: false
});
var LoadStatus = Object.freeze({
  loading: "loading",
  ready: "ready",
  unreachable: "unreachable"
});
function createPrefsStore(rpcCall) {
  let prefs = { ...FALLBACK_PREFS };
  let status = LoadStatus.loading;
  let writeFailed = false;
  let hostCues = null;
  const listeners = /* @__PURE__ */ new Set();
  function publish() {
    syncAudio(prefs);
    for (const listener of [...listeners]) listener();
  }
  function cueNames() {
    return hostCues ?? CUE_NAMES;
  }
  function adopt(value) {
    if (value === null || typeof value !== "object") return false;
    if (value.prefs === null || typeof value.prefs !== "object") return false;
    prefs = { ...FALLBACK_PREFS, ...value.prefs };
    if (Array.isArray(value.cueNames) && value.cueNames.length > 0) hostCues = value.cueNames;
    status = LoadStatus.ready;
    if (value.persisted === false) writeFailed = true;
    else if (value.persisted === true) writeFailed = false;
    publish();
    return true;
  }
  return {
    getPrefs: () => prefs,
    getStatus: () => status,
    getCueNames: cueNames,
    didWriteFail: () => writeFailed,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Read the stored preferences once at activation. */
    async load() {
      try {
        const result = await rpcCall(RPC_ENDPOINTS.getPrefs, {});
        if (result?.ok === true && adopt(result.value)) return;
      } catch {
      }
      status = LoadStatus.unreachable;
      publish();
    },
    /**
     * Apply a volume change locally and audibly without persisting it.
     *
     * A range input fires on every pixel of a drag; writing the preference file
     * that often would be absurd. The component calls this while dragging and
     * `patch` once on release.
     */
    setVolumeLocal(value) {
      const volume = Math.min(1, Math.max(0, Number(value)));
      if (!Number.isFinite(volume)) return;
      prefs = { ...prefs, volume };
      publish();
    },
    /**
     * Persist a partial patch and adopt the host's normalized result.
     * @returns true when the change reached disk.
     */
    async patch(patch) {
      const result = await rpcCall(RPC_ENDPOINTS.setPrefs, patch);
      if (result?.ok !== true) {
        prefs = { ...prefs, ...patch };
        publish();
        return false;
      }
      adopt(result.value);
      return writeFailed === false;
    }
  };
}

// client/SettingsSection.jsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function useUiLocale() {
  const [locale, setLocale] = (0, import_react.useState)(getUiLocale);
  (0, import_react.useEffect)(() => subscribeUiLocale(() => setLocale(getUiLocale())), []);
  return locale;
}
function usePrefs(controller) {
  const [prefs, setPrefs] = (0, import_react.useState)(() => ({ ...controller.getPrefs() }));
  (0, import_react.useEffect)(
    () => controller.subscribe(() => setPrefs({ ...controller.getPrefs() })),
    [controller]
  );
  return prefs;
}
function SwitchRow({ label, hint, on, disabled, onToggle }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsn-row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsn-rowText", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-rowLabel", children: label }),
      hint === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-rowHint", children: hint })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        className: "dsn-switch",
        role: "switch",
        "aria-checked": String(on),
        "aria-label": label,
        "data-on": on || void 0,
        disabled: disabled === true,
        onClick: onToggle
      }
    )
  ] });
}
function CueRow({ L, label, hint, value, cueNames, disabled, onPick }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsn-row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsn-rowText", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-rowLabel", children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-rowHint", children: hint })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsn-cueControls", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "select",
        {
          className: "dsn-select",
          value,
          disabled: disabled === true,
          "aria-label": label,
          onChange: (event) => onPick(event.target.value),
          children: cueNames.map((name2) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: name2, children: name2 }, name2))
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: "dsn-btn",
          disabled: disabled === true,
          "aria-label": `${L.previewAria}: ${label}`,
          onClick: () => onPick(value, true),
          children: L.preview
        }
      )
    ] })
  ] });
}
function NotificationsSection({ controller }) {
  const locale = useUiLocale();
  const L = strings(locale);
  const prefs = usePrefs(controller);
  const status = controller.getStatus();
  const cueNames = controller.getCueNames();
  const ready = status === LoadStatus.ready;
  const set = (patch) => {
    void controller.patch(patch);
  };
  const pick = (field) => (value, preview) => {
    if (preview === true) previewCue(value, controller.getPrefs());
    else set({ [field]: value });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsn-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-title", children: L.cardTitle }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsn-sub", children: L.cardSub }),
    status === LoadStatus.loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-muted", children: L.readingPrefs }) : null,
    status === LoadStatus.unreachable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-warn", children: L.unreachable }) : null,
    controller.didWriteFail() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-warn", children: L.saveFailed }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SwitchRow,
      {
        label: L.masterLabel,
        hint: prefs.enabled ? L.masterHintOn : L.masterHintOff,
        on: prefs.enabled === true,
        disabled: !ready,
        onToggle: () => set({ enabled: prefs.enabled !== true })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      CueRow,
      {
        L,
        label: L.doneLabel,
        hint: L.doneHint,
        value: prefs.soundDone,
        cueNames,
        disabled: !ready,
        onPick: pick("soundDone")
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      CueRow,
      {
        L,
        label: L.needsInputLabel,
        hint: L.needsInputHint,
        value: prefs.soundNeedsInput,
        cueNames,
        disabled: !ready,
        onPick: pick("soundNeedsInput")
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsn-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-rowText", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsn-rowLabel", children: L.volumeLabel }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsn-volume", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "range",
            min: 0,
            max: 100,
            step: 5,
            value: Math.round((prefs.volume ?? 0.7) * 100),
            disabled: !ready,
            "aria-label": L.volumeLabel,
            onChange: (event) => controller.setVolumeLocal(Number(event.target.value) / 100),
            onMouseUp: (event) => set({ volume: Number(event.target.value) / 100 }),
            onKeyUp: (event) => set({ volume: Number(event.target.value) / 100 }),
            onTouchEnd: (event) => set({ volume: Number(event.target.value) / 100 })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsn-volumeValue", children: Math.round((prefs.volume ?? 0.7) * 100) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SwitchRow,
      {
        label: L.hiddenLabel,
        hint: L.hiddenHint,
        on: prefs.onlyWhenHidden === true,
        disabled: !ready,
        onToggle: () => set({ onlyWhenHidden: prefs.onlyWhenHidden !== true })
      }
    )
  ] });
}

// client/styles.js
var CSS = `
.dsn-card{
  background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-layer-2,rgba(127,127,127,.07)));
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.28));
  border-radius:12px;padding:18px 20px 20px;max-width:560px;
  font:inherit;font-size:13px;color:var(--dsw-alias-label-primary,inherit)}
.dsn-title{font-size:14px;font-weight:600}
.dsn-sub{color:var(--dsw-alias-label-tertiary,#78808c);font-size:12px;line-height:1.65;margin:4px 0 0}
.dsn-row{align-items:center;gap:16px;margin-top:12px;padding:12px 14px;
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));border-radius:12px;display:flex}
.dsn-rowText{flex:1;min-width:0}
.dsn-rowLabel{font-weight:600;font-size:13px}
.dsn-rowHint{color:var(--dsw-alias-label-tertiary,#78808c);font-size:11.5px;line-height:1.55;margin-top:2px}
.dsn-switch{flex:none;cursor:pointer;position:relative;width:44px;height:24px;border-radius:999px;
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.4));
  background:var(--dsw-alias-fill-secondary,rgba(127,127,127,.35));
  transition:background .15s ease,border-color .15s ease;padding:0;margin:0;
  -webkit-appearance:none;appearance:none}
.dsn-switch::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;
  background:#fff;border:1px solid rgba(0,0,0,.1);box-shadow:0 1px 3px #0003;transition:transform .15s ease}
.dsn-switch[data-on]{background:var(--dsw-alias-state-success-primary,#22c55e);
  border-color:var(--dsw-alias-state-success-primary,#22c55e)}
.dsn-switch[data-on]::after{transform:translateX(20px)}
.dsn-switch:disabled{cursor:default;opacity:.55}
.dsn-cueControls{flex:none;display:flex;align-items:center;gap:8px}
.dsn-select{font:inherit;font-size:12.5px;height:32px;border-radius:8px;padding:0 8px;
  background:var(--dsw-alias-bg-layer-1,rgba(127,127,127,.06));
  color:var(--dsw-alias-label-primary,inherit);
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.4));cursor:pointer}
.dsn-select:disabled{cursor:default;opacity:.55}
.dsn-btn{font:inherit;cursor:pointer;font-size:12.5px;height:32px;padding:0 14px;border-radius:999px;
  background:var(--dsw-alias-bg-layer-1,rgba(127,127,127,.06));
  color:var(--dsw-alias-label-primary,inherit);
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.4));
  display:inline-flex;align-items:center;justify-content:center}
.dsn-btn:hover{background:var(--dsw-alias-fill-secondary,rgba(127,127,127,.18))}
.dsn-btn:disabled{cursor:default;opacity:.55}
.dsn-volume{flex:none;display:flex;align-items:center;gap:10px}
.dsn-volume input{width:160px;accent-color:var(--dsw-alias-brand-primary,#4f6bfe);cursor:pointer}
.dsn-volume input:disabled{cursor:default;opacity:.55}
.dsn-volumeValue{color:var(--dsw-alias-label-tertiary,#78808c);font-size:12px;min-width:24px;text-align:right}
.dsn-muted{color:var(--dsw-alias-label-tertiary,#78808c);font-size:12px;line-height:1.6;margin-top:12px}
.dsn-warn{color:var(--dsw-alias-state-error-primary,#e5484d);font-size:12.5px;font-weight:500;line-height:1.6;margin-top:10px}
`;

// client/watch.js
var MAIN = "main";
var SUBAGENT = "subagent";
var UNKNOWN = "unknown";
function installSessionWatch(ctx, store, onCue) {
  const disposers = [];
  const prevRunning = /* @__PURE__ */ new Map();
  const summaries = /* @__PURE__ */ new Map();
  const seenPending = /* @__PURE__ */ new Set();
  let armed = false;
  const sessions = ctx.get("sessions");
  const uiSession = ctx.get("uiSession");
  function classify(sessionId) {
    const summary = summaries.get(sessionId);
    if (summary !== void 0) return summary.origin === "subagent" ? SUBAGENT : MAIN;
    if (sessions?.subagentAddress?.(sessionId) !== void 0) return SUBAGENT;
    return UNKNOWN;
  }
  function audible() {
    const prefs = store.getPrefs();
    if (prefs.enabled !== true) return false;
    if (prefs.onlyWhenHidden === true) {
      const state = typeof document === "undefined" ? "visible" : document.visibilityState;
      if (state === "visible") return false;
    }
    return true;
  }
  function fire(reason) {
    if (!audible()) return;
    const prefs = store.getPrefs();
    onCue(reason, prefs);
  }
  function scanRunning(state) {
    const ids = Array.isArray(state?.ids) ? state.ids : [];
    const byId = state?.byId;
    const seen = /* @__PURE__ */ new Set();
    for (const id of ids) {
      const summary = byId === void 0 || byId === null ? void 0 : byId[id];
      if (summary === void 0 || summary === null) continue;
      seen.add(id);
      summaries.set(id, summary);
      if (summary.origin === "subagent") continue;
      const running = summary.running === true;
      const previous = prevRunning.get(id);
      if (previous === void 0) {
        prevRunning.set(id, running);
        continue;
      }
      if (previous && !running) fire("done");
      prevRunning.set(id, running);
    }
    for (const id of [...prevRunning.keys()]) {
      if (!seen.has(id)) {
        prevRunning.delete(id);
        summaries.delete(id);
      }
    }
  }
  function scanPending(map) {
    if (map === void 0 || map === null || typeof map.forEach !== "function") return;
    const next = /* @__PURE__ */ new Set();
    map.forEach((interaction, sessionId) => {
      const key = `${String(sessionId)}::${String(interaction?.key ?? interaction?.kind ?? "")}`;
      next.add(key);
      if (!seenPending.has(key) && armed && classify(sessionId) === MAIN) fire("needs-input");
    });
    seenPending.clear();
    for (const key of next) seenPending.add(key);
    armed = true;
  }
  const list = sessions?.list;
  if (list !== void 0 && typeof list.subscribe === "function") {
    try {
      scanRunning(list.getSnapshot());
    } catch {
    }
    disposers.push(list.subscribe(() => {
      try {
        scanRunning(list.getSnapshot());
      } catch {
      }
    }));
  }
  const pending = uiSession?.pendingInteractions;
  if (pending !== void 0 && typeof pending.subscribe === "function") {
    try {
      scanPending(pending.getSnapshot());
    } catch {
    }
    disposers.push(pending.subscribe(() => {
      try {
        scanPending(pending.getSnapshot());
      } catch {
      }
    }));
  }
  return () => {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch {
      }
    }
    disposers.length = 0;
  };
}
function playReason(reason, prefs) {
  const sound = reason === "needs-input" ? prefs.soundNeedsInput : prefs.soundDone;
  playCue(sound, prefs);
}

// client/index.jsx
var name = "dsh-session-notify";
var inject = ["slots", "connection", "sessions"];
function injectCss() {
  if (typeof document === "undefined") return;
  for (const stale of document.querySelectorAll('style[data-plugin="dsh-session-notify"]')) {
    stale.remove();
  }
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-session-notify";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
function apply(ctx) {
  injectCss();
  const rpcCall = (endpoint, payload, signal) => ctx.connection.rpc.call(RPC_CHANNEL, endpoint, payload, signal);
  const store = createPrefsStore(rpcCall);
  void store.load();
  if (!audioAvailable()) {
    console.warn("[dsh-session-notify] Web Audio unavailable — cues will not play");
  }
  ctx.effect(
    () => installSessionWatch(ctx, store, (reason, prefs) => playReason(reason, prefs)),
    "dsh-session-notify: session watcher"
  );
  ctx.slots.inject("settings.section", () => ctx.slots.register(
    {
      name: "settings.section",
      id: "session-notify",
      // A preference about how the shell behaves, so it sits with the other
      // behaviour sections rather than above them.
      order: 20,
      label: () => strings(getUiLocale()).settingsLabel,
      inject: () => ({ controller: store })
    },
    NotificationsSection
  ));
}

    return module.exports;
  }
});
