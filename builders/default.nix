# A builder takes an engine manifest and gives a static folder: the engine's page,
# with the embed shim loaded first in <head>.
{ pkgs }:
{
  fm1-emu = import ./fm1-emu.nix { inherit pkgs; };
}
