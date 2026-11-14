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

  const post = (m, transfer) => {
    if (embedded) window.parent.postMessage({ synth: V, engine: cfg.engine, ...m }, "*", transfer || []);
  };

  // Audio: everything the page connects to a destination goes into one "pre" node per context, then
  // through the host's gain (mute, volume) to the destination. The tap records "pre": what the engine
  // plays, whatever the host's level, as a server records a radio whatever its listeners hear.
  let volume = 1, muted = false, started = false;
  const level = () => (muted ? 0 : volume);
  const outs = new Map(); // AudioContext -> { pre, gain }
  const setStarted = () => { if (!started) { started = true; post({ t: "started" }); } startTap(); };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (!(dest instanceof AudioDestinationNode)) return connect.call(this, dest, ...rest);
    const ctx = dest.context;
    let o = outs.get(ctx);
    if (!o) {
      o = { pre: ctx.createGain(), gain: ctx.createGain() };
      o.gain.gain.value = level();
      connect.call(o.pre, o.gain);
      connect.call(o.gain, dest);
      outs.set(ctx, o);
      ctx.addEventListener("statechange", () => { if (ctx.state === "running") setStarted(); });
      if (ctx.state === "running") setStarted();
    }
    connect.call(this, o.pre, ...rest);
    return dest;
  };
  const applyLevel = () => {
    for (const { gain } of outs.values()) gain.gain.setTargetAtTime(level(), gain.context.currentTime, 0.02);
  };

  // The tap: MediaRecorder on "pre", one chunk a second to the host, in order. Each recorder has an id
  // (rid) and counts its chunks from 0; the first chunk holds the container's header.
  const MIMES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"];
  let tapOn = false, rec = null, rids = 0;
  function startTap() {
    if (!tapOn || rec || !started) return;
    const [ctx, o] = outs.entries().next().value || [];
    if (!ctx) return;
    if (typeof MediaRecorder === "undefined") { post({ t: "tap-error", error: "no MediaRecorder" }); return; }
    const mimeType = MIMES.find((m) => MediaRecorder.isTypeSupported(m));
    const dest = ctx.createMediaStreamDestination();
    connect.call(o.pre, dest);
    const r = rec = new MediaRecorder(dest.stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 128000 });
    const rid = ++rids;
    let seq = 0, chain = Promise.resolve();
    r.ondataavailable = (e) => {
      if (!e.data.size) return;
      const n = seq++;
      chain = chain.then(() => e.data.arrayBuffer()).then((data) => post({ t: "chunk", rid, seq: n, mime: r.mimeType, data }, [data]));
    };
    r.onstop = () => { try { o.pre.disconnect(dest); } catch { /* gone */ } };
    r.onerror = (e) => post({ t: "tap-error", error: String(e.error || e) });
    r.start(1000);
  }
  function stopTap() {
    const r = rec;
    rec = null;
    if (r && r.state !== "inactive") r.stop();
  }

  // Host -> engine.
  const hello = () => post({ t: "ready", v: V, started, muted, volume, tap: tapOn });
  addEventListener("message", (e) => {
    const m = e.data;
    if (e.source !== window.parent || !m || m.synth !== V) return;
    if (m.t === "hello") hello();
    else if (m.t === "mute") { muted = !!m.on; applyLevel(); }
    else if (m.t === "volume") { volume = Math.max(0, Math.min(1, Number(m.v) || 0)); applyLevel(); }
    else if (m.t === "tap") { tapOn = !!m.on; if (tapOn) startTap(); else stopTap(); }
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
