{
  description = "Synth hub: browser synth engines, built from source, served as one static site";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

    # Engines. One input per engine, never a flake: we build them ourselves.
    # Update one: nix flake update fm1-dub
    fm1-dub = {
      url = "github:sbegueria/fm1-dub";
      flake = false;
    };
    fm1-nachtfahrt = {
      url = "github:FartyPants/fm1-nachtfahrt";
      flake = false;
    };
  };

  outputs =
    { self, nixpkgs, ... }@inputs:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAll = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
      engines = import ./engines {
        inherit inputs;
        inherit (nixpkgs) lib;
      };
      build =
        pkgs:
        let
          builders = import ./builders { inherit pkgs; };
          pkgsById = nixpkgs.lib.listToAttrs (
            map (e: {
              name = e.id;
              value = builders.${e.builder} e;
            }) engines
          );
        in
        pkgsById
        // {
          site = import ./site { inherit pkgs engines pkgsById; };
        };
    in
    {
      inherit engines;
      packages = forAll (pkgs: build pkgs // { default = (build pkgs).site; });
      # Each engine's build runs its own sound test (checkPhase), so building is checking.
      checks = forAll build;
      formatter = forAll (pkgs: pkgs.nixfmt-tree);
    };
}
