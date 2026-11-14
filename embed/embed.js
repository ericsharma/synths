// Synth hub embed shim, protocol v1 (see protocol.md). The builders put this first in each engine
// page's <head>, then the engine family's adapter (adapters/<name>.js). It runs before the page's
// own scripts, so it can wrap what they use.
(() => {
  "use strict";
  const V = 1;
  const cfg = { ...document.currentScript.dataset }; // engine, adapter, homepage, source
  const embedded = window.parent !== window;
  if (embedded) document.documentElement.classList.add("synth-embed");

  // localStorage under the engine's id: every engine shares the hub's origin, and forks of one
  // firmware can keep the same keys.
  try {
    const ls = window.localStorage, P = Storage.prototype, prefix = `synth:${cfg.engine}:`;
    const wrap = (fn) => function (k, ...rest) { return fn.call(this, this === ls ? prefix + k : k, ...rest); };
    P.getItem = wrap(P.getItem);
    P.setItem = wrap(P.setItem);
    P.removeItem = wrap(P.removeItem);
  } catch { /* storage blocked: the page copes on its own */ }

  const post = (m) => { if (embedded) window.parent.postMessage({ synth: V, engine: cfg.engine, ...m }, "*"); };

  // Audio: everything the page connects to a destination goes through one gain per context. The host
  // sets its level (mute, volume); Phase 2's capture tap will hang off it too.
  let volume = 1, muted = false, started = false;
  const level = () => (muted ? 0 : volume);
  const outs = new Map(); // AudioContext -> GainNode
  const setStarted = () => { if (!started) { started = true; post({ t: "started" }); } };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (!(dest instanceof AudioDestinationNode)) return connect.call(this, dest, ...rest);
    const ctx = dest.context;
    let g = outs.get(ctx);
    if (!g) {
      g = ctx.createGain();
      g.gain.value = level();
      connect.call(g, dest);
      outs.set(ctx, g);
      ctx.addEventListener("statechange", () => { if (ctx.state === "running") setStarted(); });
      if (ctx.state === "running") setStarted();
    }
    connect.call(this, g, ...rest);
    return dest;
  };
  const applyLevel = () => { for (const g of outs.values()) g.gain.setTargetAtTime(level(), g.context.currentTime, 0.02); };

  // Host -> engine.
  const hello = () => post({ t: "ready", v: V, started, muted, volume });
  addEventListener("message", (e) => {
    const m = e.data;
    if (e.source !== window.parent || !m || m.synth !== V) return;
    if (m.t === "hello") hello();
    else if (m.t === "mute") { muted = !!m.on; applyLevel(); }
    else if (m.t === "volume") { volume = Math.max(0, Math.min(1, Number(m.v) || 0)); applyLevel(); }
  });

  // Shift+Escape gives the focus back to the host. Plain Escape stays the engine's (the FM-1's HOME).
  addEventListener("keydown", (e) => {
    if (!embedded || e.key !== "Escape" || !e.shiftKey) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    post({ t: "escape" });
  }, true);

  // "now": what plays, a short text for the host's readout. At most 4 a second, the newest wins.
  let nowText = null, nowTimer = 0;
  const now = (text) => {
    nowText = String(text).trim().slice(0, 120);
    if (!nowTimer) nowTimer = setTimeout(() => { nowTimer = 0; post({ t: "now", text: nowText }); }, 250);
  };

  // Adapters register here; their function runs once the page is parsed.
  const api = { cfg, embedded, post, now };
  window.SynthEmbed = {
    register(name, fn) {
      if (name !== cfg.adapter) return;
      const run = () => fn(api);
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
      else run();
    },
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hello);
  else hello();
})();
