{ inputs }:
{
  id = "dub1";
  label = "DUB-1";
  description = "Generative dub techno: chord stabs into a tape echo, sub bass, a kick that ducks the rest";
  family = "fm1";
  builder = "fm1-emu";
  src = inputs.fm1-dub;
  repo = "https://github.com/sbegueria/fm1-dub";
  homepage = "https://sbegueria.github.io/fm1-dub/";
  licence = "GPL-3.0-only";
  order = 10;
}
