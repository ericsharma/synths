{ inputs }:
{
  id = "nachtfahrt";
  label = "NACHTFAHRT";
  description = "Generative Berlin School: repeating sequences, a drone, a lead that answers you";
  family = "fm1";
  builder = "fm1-emu";
  src = inputs.fm1-nachtfahrt;
  repo = "https://github.com/FartyPants/fm1-nachtfahrt";
  homepage = "https://fartypants.github.io/fm1-nachtfahrt/";
  licence = "GPL-3.0-only";
  order = 20;
}
