window.__ModuleLoader__.load({
  id: "dsh-rate-badge",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
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
var import_react3 = require("react");

// client/api.js
var RPC_CHANNEL = "dsh-rate-badge";
var RPC_ENDPOINTS = Object.freeze({
  /** Read the stored preferences. */
  getPrefs: "prefs.get",
  /** Persist a partial preference patch; resolves to the full new preferences. */
  setPrefs: "prefs.set"
});

// client/i18n.js
var dictionaries = {
  en: {
    settingsLabel: "Rate period",
    cardTitle: "API rate period",
    cardSub: "DeepSeek prices peak and off-peak windows differently. Peak hours are 01:00–04:00 and 06:00–10:00 UTC, Monday to Friday; every other hour costs half as much.",
    badgeToggleLabel: "Show the rate badge",
    badgeToggleHintOn: "The peak/off-peak badge is visible in the session header.",
    badgeToggleHintOff: "The badge is hidden. Pricing still applies as usual.",
    countdownLabel: "Count down to the next change",
    countdownHint: "Show a live timer in the badge popover.",
    peak: "Peak",
    offPeak: "Off-peak",
    badgeAria: "API rate period",
    rateLabel: "Rate",
    ratePeakValue: "Full price",
    rateOffPeakValue: "50% of peak",
    nextChangeLabel: "Next change",
    utcClockLabel: "UTC now",
    scheduleLabel: "Peak schedule",
    scheduleValue: "Mon–Fri 01:00–04:00, 06:00–10:00 UTC",
    allOtherOffPeak: "All other hours are off-peak.",
    closePopover: "Close",
    unreachable: "Could not reach the host half. Restart DSH so the plugin loads on both sides.",
    readingPrefs: "Reading preferences…",
    saveFailed: "Saved for this session, but writing the preferences file failed."
  },
  zh: {
    settingsLabel: "价格时段",
    cardTitle: "API 价格时段",
    cardSub: "DeepSeek 的峰时与闲时价格不同。峰时为 UTC 周一至周五 01:00–04:00 与 06:00–10:00；其余时段价格减半。",
    badgeToggleLabel: "显示价格时段徽标",
    badgeToggleHintOn: "会话标题栏中显示峰时/闲时徽标。",
    badgeToggleHintOff: "徽标已隐藏，计费方式不受影响。",
    countdownLabel: "显示距下次切换的倒计时",
    countdownHint: "在徽标弹层中显示实时倒计时。",
    peak: "峰时",
    offPeak: "闲时",
    badgeAria: "API 价格时段",
    rateLabel: "价格",
    ratePeakValue: "全价",
    rateOffPeakValue: "峰时价的 50%",
    nextChangeLabel: "下次切换",
    utcClockLabel: "当前 UTC",
    scheduleLabel: "峰时安排",
    scheduleValue: "UTC 周一至周五 01:00–04:00、06:00–10:00",
    allOtherOffPeak: "其余时段均为闲时。",
    closePopover: "关闭",
    unreachable: "无法连接宿主半边。请重启 DSH，让插件的两半都加载。",
    readingPrefs: "正在读取偏好设置…",
    saveFailed: "本次会话已生效，但写入偏好文件失败。"
  }
};
function getUiLocale() {
  if (typeof document !== "undefined") {
    const tag = (document.documentElement?.lang ?? "").toLowerCase();
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("en")) return "en";
  }
  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  }
  return "en";
}
function strings(locale) {
  return dictionaries[locale] ?? dictionaries.en;
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
  showCountdown: true
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
  const listeners = /* @__PURE__ */ new Set();
  function publish() {
    for (const listener of [...listeners]) listener();
  }
  function adopt(value) {
    if (value === null || typeof value !== "object") return false;
    if (value.prefs === null || typeof value.prefs !== "object") return false;
    prefs = { ...FALLBACK_PREFS, ...value.prefs };
    status = LoadStatus.ready;
    if (value.persisted === false) writeFailed = true;
    else if (value.persisted === true) writeFailed = false;
    publish();
    return true;
  }
  return {
    getPrefs: () => prefs,
    getStatus: () => status,
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

// client/RateBadge.jsx
var import_react = require("react");

// client/rate-period.js
var MINUTE_MS = 6e4;
var DAY_MS = 864e5;
var RATE_SCHEDULE = Object.freeze({
  /** `getUTCDay()` numbers on which peak windows apply (0 = Sunday). */
  peakWeekdays: Object.freeze([1, 2, 3, 4, 5]),
  /** Peak windows as minutes after UTC midnight, ascending and non-overlapping. */
  windows: Object.freeze([
    Object.freeze({ startMinutes: 60, endMinutes: 240 }),
    // 01:00–04:00 UTC
    Object.freeze({ startMinutes: 360, endMinutes: 600 })
    // 06:00–10:00 UTC
  ]),
  /** Off-peak price as a factor of the peak price. */
  offPeakRate: 0.5
});
function minuteOfDayUtc(date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}
function isPeakWeekday(day) {
  return RATE_SCHEDULE.peakWeekdays.includes(day);
}
function inPeakWindow(minute) {
  return RATE_SCHEDULE.windows.some(
    (window) => minute >= window.startMinutes && minute < window.endMinutes
  );
}
function currentPeriod(nowMs) {
  const date = new Date(nowMs);
  return isPeakWeekday(date.getUTCDay()) && inPeakWindow(minuteOfDayUtc(date)) ? "peak" : "off-peak";
}
function nextChangeAt(nowMs) {
  const probe = new Date(nowMs);
  const startOfDay = Date.UTC(probe.getUTCFullYear(), probe.getUTCMonth(), probe.getUTCDate());
  const current = currentPeriod(nowMs);
  for (let day = 0; day < 8; day += 1) {
    const dayStart = startOfDay + day * DAY_MS;
    if (!isPeakWeekday(new Date(dayStart).getUTCDay())) continue;
    for (const window of RATE_SCHEDULE.windows) {
      const startAt = dayStart + window.startMinutes * MINUTE_MS;
      if (startAt > nowMs && currentPeriod(startAt) !== current) return startAt;
      const endAt = dayStart + window.endMinutes * MINUTE_MS;
      if (endAt > nowMs && currentPeriod(endAt) !== current) return endAt;
    }
  }
  return nowMs + 8 * DAY_MS;
}
function pad2(value) {
  return value < 10 ? `0${value}` : `${value}`;
}
function formatUtcClock(nowMs, withSeconds = false) {
  const date = new Date(nowMs);
  const clock = `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
  return withSeconds ? `${clock}:${pad2(date.getUTCSeconds())}` : clock;
}
function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1e3));
  const days = Math.floor(total / 86400);
  const hours = Math.floor(total / 3600) % 24;
  const minutes = Math.floor(total / 60) % 60;
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${pad2(minutes)}m`;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}
function rateFactor(period) {
  return period === "peak" ? 1 : RATE_SCHEDULE.offPeakRate;
}

// client/RateBadge.jsx
var import_jsx_runtime = require("react/jsx-runtime");
function useUiLocale() {
  const [locale, setLocale] = (0, import_react.useState)(getUiLocale);
  (0, import_react.useEffect)(() => subscribeUiLocale(() => setLocale(getUiLocale())), []);
  return locale;
}
function PeriodDot({ period }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `drb-dot drb-dot-${period}`, "aria-hidden": "true" });
}
function RateBadge({ controller }) {
  const locale = useUiLocale();
  const L = strings(locale);
  const [prefs, setPrefs] = (0, import_react.useState)(() => ({ ...controller.getPrefs() }));
  const [open, setOpen] = (0, import_react.useState)(false);
  const [now, setNow] = (0, import_react.useState)(() => Date.now());
  const rootRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(
    () => controller.subscribe(() => setPrefs({ ...controller.getPrefs() })),
    [controller]
  );
  const showCountdown = prefs.showCountdown !== false;
  (0, import_react.useEffect)(() => {
    const remaining = Math.max(250, nextChangeAt(Date.now()) - Date.now() + 50);
    const id = setTimeout(() => setNow(Date.now()), remaining);
    return () => clearTimeout(id);
  }, [now]);
  (0, import_react.useEffect)(() => {
    if (!open || !showCountdown) return void 0;
    const id = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(id);
  }, [open, showCountdown]);
  (0, import_react.useEffect)(() => {
    if (!open) return void 0;
    const onPointerDown = (event) => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  if (prefs.enabled !== true) return null;
  const period = currentPeriod(now);
  const isPeak = period === "peak";
  const label = isPeak ? L.peak : L.offPeak;
  const factor = rateFactor(period);
  const boundary = nextChangeAt(now);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "drb-root", ref: rootRef, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: "drb-pill",
        "data-period": period,
        "aria-expanded": open,
        "aria-label": `${L.badgeAria}: ${label}`,
        title: `${L.badgeAria}: ${label}`,
        onClick: () => setOpen((value) => !value),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeriodDot, { period }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "drb-pillLabel", children: label })
        ]
      }
    ),
    open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "drb-popover", role: "dialog", "aria-label": L.badgeAria, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "drb-popHead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeriodDot, { period }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "drb-popPeriod", children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: "drb-popClose",
            "aria-label": L.closePopover,
            onClick: () => setOpen(false),
            children: "×"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { className: "drb-rows", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "drb-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: L.rateLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
            isPeak ? L.ratePeakValue : L.rateOffPeakValue,
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "drb-mono drb-factor", children: [
              factor,
              "×"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "drb-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: L.utcClockLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { className: "drb-mono", children: formatUtcClock(now, showCountdown) })
        ] }),
        showCountdown ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "drb-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: L.nextChangeLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { className: "drb-mono", children: formatCountdown(boundary - now) })
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "drb-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: L.scheduleLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
            L.scheduleValue,
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "drb-note", children: L.allOtherOffPeak })
          ] })
        ] })
      ] })
    ] }) : null
  ] });
}

// client/SettingsSection.jsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function useUiLocale2() {
  const [locale, setLocale] = (0, import_react2.useState)(getUiLocale);
  (0, import_react2.useEffect)(() => subscribeUiLocale(() => setLocale(getUiLocale())), []);
  return locale;
}
function usePrefs(controller) {
  const [prefs, setPrefs] = (0, import_react2.useState)(() => ({ ...controller.getPrefs() }));
  (0, import_react2.useEffect)(
    () => controller.subscribe(() => setPrefs({ ...controller.getPrefs() })),
    [controller]
  );
  return prefs;
}
function SwitchRow({ label, hint, on, disabled, onToggle }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "drb-row-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "drb-rowText", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "drb-rowLabel", children: label }),
      hint === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "drb-rowHint", children: hint })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: "drb-switch",
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
function RateBadgeSection({ controller }) {
  const locale = useUiLocale2();
  const L = strings(locale);
  const prefs = usePrefs(controller);
  const status = controller.getStatus();
  const ready = status === LoadStatus.ready;
  const set = (patch) => {
    void controller.patch(patch);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "drb-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "drb-title", children: L.cardTitle }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "drb-sub", children: L.cardSub }),
    status === LoadStatus.loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "drb-muted", children: L.readingPrefs }) : null,
    status === LoadStatus.unreachable ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "drb-warn", children: L.unreachable }) : null,
    controller.didWriteFail() ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "drb-warn", children: L.saveFailed }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      SwitchRow,
      {
        label: L.badgeToggleLabel,
        hint: prefs.enabled ? L.badgeToggleHintOn : L.badgeToggleHintOff,
        on: prefs.enabled === true,
        disabled: !ready,
        onToggle: () => set({ enabled: prefs.enabled !== true })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      SwitchRow,
      {
        label: L.countdownLabel,
        hint: L.countdownHint,
        on: prefs.showCountdown === true,
        disabled: !ready || prefs.enabled !== true,
        onToggle: () => set({ showCountdown: prefs.showCountdown !== true })
      }
    )
  ] });
}

// client/styles.js
var CSS = `
/* ── the header pill ─────────────────────────────────────────────────────── */
.drb-root{position:relative;display:inline-flex}
.drb-pill{
  display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 9px;
  font:inherit;font-size:11.5px;font-weight:600;line-height:1;cursor:pointer;
  border-radius:999px;
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));
  background:var(--dsw-alias-fill-secondary,rgba(127,127,127,.12));
  color:var(--dsw-alias-label-secondary,inherit);
  transition:background .15s ease,border-color .15s ease}
.drb-pill:hover{background:var(--dsw-alias-fill-tertiary,rgba(127,127,127,.2))}
.drb-pill[data-period="peak"]{
  border-color:var(--dsw-alias-state-warn-primary,#f59e0b);
  color:var(--dsw-alias-state-warn-primary,#f59e0b)}
.drb-pill[data-period="off-peak"]{
  border-color:var(--dsw-alias-state-success-primary,#22c55e);
  color:var(--dsw-alias-state-success-primary,#22c55e)}
.drb-dot{width:7px;height:7px;border-radius:50%;flex:none;
  background:var(--dsw-alias-label-quaternary,#9aa1ab)}
.drb-dot-peak{background:var(--dsw-alias-state-warn-primary,#f59e0b)}
.drb-dot-off-peak{background:var(--dsw-alias-state-success-primary,#22c55e)}
.drb-pillLabel{white-space:nowrap}

/* ── the popover ─────────────────────────────────────────────────────────── */
.drb-popover{
  position:absolute;top:calc(100% + 8px);left:0;z-index:40;width:290px;
  padding:12px 14px 14px;border-radius:12px;
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));
  background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-layer-2,#1c1d21));
  box-shadow:0 10px 30px rgba(0,0,0,.32);
  color:var(--dsw-alias-label-primary,inherit);
  font-size:12px;line-height:1.5}
.drb-popHead{display:flex;align-items:center;gap:8px}
.drb-popPeriod{font-weight:600;font-size:13px}
.drb-popClose{
  margin-left:auto;cursor:pointer;border:none;background:none;padding:0 2px;
  color:var(--dsw-alias-label-tertiary,#78808c);font-size:16px;line-height:1;
  border-radius:6px}
.drb-popClose:hover{color:var(--dsw-alias-label-primary,inherit)}
.drb-rows{margin:10px 0 0;display:flex;flex-direction:column;gap:8px}
.drb-row{display:flex;gap:12px;align-items:flex-start}
.drb-row dt{margin:0;flex:none;width:96px;color:var(--dsw-alias-label-tertiary,#78808c);font-size:11.5px}
.drb-row dd{margin:0;flex:1;min-width:0}
.drb-mono{font-family:ui-monospace,Menlo,monospace;font-size:11.5px}
.drb-factor{margin-left:8px;color:var(--dsw-alias-label-tertiary,#78808c)}
.drb-note{color:var(--dsw-alias-label-tertiary,#78808c);font-size:11px;margin-top:2px}

/* ── the settings section ────────────────────────────────────────────────── */
.drb-card{
  background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-layer-2,rgba(127,127,127,.07)));
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.28));
  border-radius:12px;padding:18px 20px 20px;max-width:560px;
  font:inherit;font-size:13px;color:var(--dsw-alias-label-primary,inherit)}
.drb-title{font-size:14px;font-weight:600}
.drb-sub{color:var(--dsw-alias-label-tertiary,#78808c);font-size:12px;line-height:1.65;margin:4px 0 0}
.drb-row-card{align-items:center;gap:16px;margin-top:12px;padding:12px 14px;
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));border-radius:12px;display:flex}
.drb-rowText{flex:1;min-width:0}
.drb-rowLabel{font-weight:600;font-size:13px}
.drb-rowHint{color:var(--dsw-alias-label-tertiary,#78808c);font-size:11.5px;line-height:1.55;margin-top:2px}
.drb-switch{flex:none;cursor:pointer;position:relative;width:44px;height:24px;border-radius:999px;
  border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.4));
  background:var(--dsw-alias-fill-secondary,rgba(127,127,127,.35));
  transition:background .15s ease,border-color .15s ease;padding:0;margin:0;
  -webkit-appearance:none;appearance:none}
.drb-switch::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;
  background:#fff;border:1px solid rgba(0,0,0,.1);box-shadow:0 1px 3px #0003;transition:transform .15s ease}
.drb-switch[data-on]{background:var(--dsw-alias-state-success-primary,#22c55e);
  border-color:var(--dsw-alias-state-success-primary,#22c55e)}
.drb-switch[data-on]::after{transform:translateX(20px)}
.drb-switch:disabled{cursor:default;opacity:.55}
.drb-muted{color:var(--dsw-alias-label-tertiary,#78808c);font-size:12px;line-height:1.6;margin-top:12px}
.drb-warn{color:var(--dsw-alias-state-error-primary,#e5484d);font-size:12.5px;font-weight:500;line-height:1.6;margin-top:10px}
`;

// client/index.jsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var name = "dsh-rate-badge";
var inject = ["slots", "connection"];
function injectCss() {
  if (typeof document === "undefined") return;
  for (const stale of document.querySelectorAll('style[data-plugin="dsh-rate-badge"]')) {
    stale.remove();
  }
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-rate-badge";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
function useUiLocale3() {
  const [locale, setLocale] = (0, import_react3.useState)(getUiLocale);
  (0, import_react3.useEffect)(() => subscribeUiLocale(() => setLocale(getUiLocale())), []);
  return locale;
}
function BadgeSlot(props) {
  useUiLocale3();
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RateBadge, { ...props });
}
function SectionSlot(props) {
  useUiLocale3();
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RateBadgeSection, { ...props });
}
function apply(ctx) {
  injectCss();
  const rpcCall = (endpoint, payload, signal) => ctx.connection.rpc.call(RPC_CHANNEL, endpoint, payload, signal);
  const store = createPrefsStore(rpcCall);
  void store.load();
  ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register(
    {
      name: "conversation.session.header.actions",
      id: "rate-badge",
      // Matches the position the harness reserves for pricing chrome.
      order: 30,
      label: () => strings(getUiLocale()).badgeAria,
      inject: () => ({ controller: store })
    },
    BadgeSlot
  ));
  ctx.slots.inject("settings.section", () => ctx.slots.register(
    {
      name: "settings.section",
      id: "rate-badge",
      order: 21,
      label: () => strings(getUiLocale()).settingsLabel,
      inject: () => ({ controller: store })
    },
    SectionSlot
  ));
}

    return module.exports;
  }
});
