# Embed protocol v1

A host page (for example EternaTV) shows an engine in an `<iframe src="https://synths.ericsharma.xyz/<id>/">`.
Host and engine talk with `postMessage` only. This works across origins. The host knows no engine
family; the shim (`embed.js`) and the family's adapter (`adapters/<name>.js`) do the engine side.

Every message is an object with `synth: 1`. Messages from the engine also have `engine: "<id>"`.

## Host → engine

| Message | Effect |
|---|---|
| `{synth: 1, t: "hello"}` | The engine answers with `ready`. |
| `{synth: 1, t: "mute", on: true\|false}` | Mute or unmute the engine's output. |
| `{synth: 1, t: "volume", v: 0..1}` | Output level. |
| `{synth: 1, t: "tap", on: true\|false}` | Start or stop sending the engine's audio as `chunk` messages. Off then on starts a new recorder. |

## Engine → host

| Message | Meaning |
|---|---|
| `{t: "ready", v: 1, started, muted, volume, tap}` | The page is loaded (also the answer to `hello`). |
| `{t: "started"}` | Audio runs. Browsers start audio only after a click in the engine's own frame. |
| `{t: "escape"}` | The viewer pressed Shift+Escape: give the focus back to the host. |
| `{t: "now", text}` | What plays now, short text (at most 4 a second). |
| `{t: "chunk", rid, seq, mime, data}` | About 1 s of the engine's audio (`data`: ArrayBuffer, transferred). `rid` names the recorder, `seq` counts from 0 per recorder; chunk 0 holds the container header (`mime`, Opus in WebM where the browser can), so a receiver needs every chunk from 0 in order. The tap records before the host's mute and volume. |
| `{t: "tap-error", error}` | The tap could not start (no MediaRecorder) or failed. |

## The shim also

- puts the page's `localStorage` keys under `synth:<id>:`, because all engines share one origin;
- adds the class `synth-embed` to `<html>` when the page is in a frame, so adapters can hide the
  page's own help and chrome.

