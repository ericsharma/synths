// Adapter for the FM-1 emulator pages (web/emu/index.html of the AMB-1 family).
(() => {
  "use strict";
  // In a host: only the FM-1 (and its status line). Added now, in <head>, so nothing else flashes.
  const css = document.createElement("style");
  css.textContent = `
    html.synth-embed body { padding: 8px 8px 12px; }
    html.synth-embed main { max-width: none; }
    html.synth-embed header, html.synth-embed .turn, html.synth-embed section.reader,
    html.synth-embed section.help, html.synth-embed .bar > :not(#status) { display: none !important; }
    html.synth-embed .bar { margin: 6px 0 0; font-size: 13px; opacity: .75; }`;
  document.head.append(css);

  SynthEmbed.register("fm1-emu", ({ cfg, embedded, now }) => {
    if (!embedded) {
      // On its own: the header's links go to the upstream site (its install page, its manual), the
      // title to the hub's catalog, and a link to this build's exact source (GPL).
      const nav = document.querySelector("header nav");
      for (const a of nav ? nav.querySelectorAll("a[href^='../']") : []) {
        const rest = a.getAttribute("href").slice(3);
        if (rest === "emu/") a.setAttribute("href", "./");
        else if (cfg.homepage) a.href = new URL(rest, cfg.homepage).href;
      }
      if (nav && cfg.source) {
        const a = document.createElement("a");
        a.href = cfg.source;
        a.textContent = "This build's source";
        nav.append(a);
      }
      return;
    }
    // What the screen says (the firmware's screen-reader text) is the "now" text.
    const said = document.getElementById("said-text");
    if (said) new MutationObserver(() => { const t = said.textContent.trim().split(/\.\s/)[0]; if (t) now(t); })
      .observe(said, { childList: true, characterData: true, subtree: true });
  });
})();
