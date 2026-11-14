# FM-1 firmwares with a browser emulator in web/emu/ (the AMB-1 family: AMB-1, DUB-1,
# NACHTFAHRT, X0X, FoMni ...). Builds the firmware to WebAssembly with Emscripten and
# runs the repo's own emulator test (it fails with no sound).
#
# Manifest keys this builder reads, with defaults:
#   buildScript = "web/emu/build.sh";  outDir = "build/emu";
#   test = "tests/host/emu_test.mjs";  testWasm = "build/emu/amb.wasm"
{ pkgs }:
engine:
let
  buildScript = engine.buildScript or "web/emu/build.sh";
  outDir = engine.outDir or "build/emu";
  test = engine.test or "tests/host/emu_test.mjs";
  testWasm = engine.testWasm or "build/emu/amb.wasm";
  shim = ''<script src="../_embed/embed.js" data-engine="${engine.id}" data-adapter="${engine.builder}" data-homepage="${engine.homepage or ""}" data-source="${engine.source}"></script><script src="../_embed/adapters/${engine.builder}.js"></script>'';
in
pkgs.stdenvNoCC.mkDerivation {
  pname = "synth-${engine.id}";
  version = builtins.substring 0 7 engine.rev;
  inherit (engine) src;

  nativeBuildInputs = [
    pkgs.emscripten
    (pkgs.python3.withPackages (ps: [ ps.pillow ]))
    pkgs.nodejs
  ];

  dontConfigure = true;
  buildPhase = ''
    runHook preBuild
    export HOME=$TMPDIR EM_CACHE=$TMPDIR/emcache
    EN_VERSION=${builtins.substring 0 7 engine.rev} sh ${buildScript}
    runHook postBuild
  '';

  doCheck = true;
  checkPhase = ''
    runHook preCheck
    node ${test} ${testWasm}
    runHook postCheck
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p $out
    cp -r ${outDir}/. $out/
    # The shim must run before the page's own scripts: first thing in <head>.
    grep -q '<head>' $out/index.html
    sed -i '0,/<head>/s##<head>\n${shim}#' $out/index.html
    runHook postInstall
  '';
}
