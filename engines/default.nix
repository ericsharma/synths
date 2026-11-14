# Every engines/<id>.nix except this file is an engine. Adding a file adds the engine.
{ inputs, lib }:
let
  files = lib.filterAttrs (n: t: t == "regular" && n != "default.nix" && lib.hasSuffix ".nix" n) (
    builtins.readDir ./.
  );
  load =
    name:
    let
      e = import (./. + "/${name}") { inherit inputs; };
    in
    assert e.id == lib.removeSuffix ".nix" name;
    e
    // {
      rev = e.src.rev or "dirty";
      source = "${e.repo}/tree/${e.src.rev or "main"}";
    };
in
lib.sortOn (e: e.order or 100) (map load (builtins.attrNames files))
