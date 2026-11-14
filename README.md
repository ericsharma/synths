# synths

Synth engines that run in the browser, built from source with Nix and served as one static site
(<https://synths.ericsharma.xyz>). Host apps (EternaTV first) embed an engine in an iframe and talk
to it with the [embed protocol](embed/protocol.md).

| Engine | From | Licence |
|---|---|---|
| DUB-1 | [sbegueria/fm1-dub](https://github.com/sbegueria/fm1-dub) | GPL-3.0-only |
| NACHTFAHRT | [FartyPants/fm1-nachtfahrt](https://github.com/FartyPants/fm1-nachtfahrt) | GPL-3.0-only |

## Layout

```
flake.nix            one input per engine (flake = false), pinned in flake.lock
engines/<id>.nix     one manifest per engine: id, label, description, family, builder, src, repo, homepage, licence
builders/<name>.nix  manifest -> static folder (the engine's page with the embed shim first in <head>)
embed/               the embed shim, one adapter per engine family, the protocol
site/                the catalog page and the site assembly: /<id>/, /_embed/, /engines.json, /index.html
```

## Add an engine

1. Add an input to `flake.nix`: `fm1-x0x = { url = "github:charlesvestal/fm1-x0x"; flake = false; };`
2. Add `engines/<id>.nix` (copy `engines/dub1.nix`). `builder` names a file in `builders/`.
   A builder reads optional manifest keys for repos that differ (see the comment at the top of the builder).
3. `nix build .#<id>` builds it and runs its sound test. `nix build` builds the site.

A new engine family needs a builder in `builders/` and, for the embed, an adapter in `embed/adapters/`.

## Update an engine

```sh
nix flake update fm1-dub && nix build
```

## Run locally

```sh
nix build && nix shell nixpkgs#python3 -c python3 -m http.server -d result 8000
```

## Licence

The hub's own files (Nix, embed shim, catalog page): MIT, see `LICENSE`. Each engine keeps its own
licence; every built engine links to its exact source commit.
