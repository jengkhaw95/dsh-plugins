// Styles for the badge, its popover, and the settings section.
//
// Colours come from the shell's `--dsw-alias-*` tokens with translucent-neutral
// fallbacks, so everything follows the active theme. The period colours are the
// only semantic exception: peak is the warning colour and off-peak the success
// colour, which is the same convention the shell's own status dots use.

export const CSS = `
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
