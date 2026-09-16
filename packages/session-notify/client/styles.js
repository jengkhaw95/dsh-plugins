// One stylesheet for the settings section.
//
// Every colour is a `--dsw-alias-*` theme token with a translucent-neutral
// fallback, so the section follows whatever theme the shell is in. The
// fallbacks deliberately avoid solid light greys (#fff, #f3f4f6): a solid light
// fallback looks correct in the light theme and unreadable in the dark one, and
// the dark theme is the shell's default. `.dsn-warn` is coloured text on a
// neutral surface for the same reason — a red fill would be wrong in both.

export const CSS = `
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
