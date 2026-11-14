# The whole hub as one static folder:
#   /<id>/          each engine (a store path, linked)
#   /_embed/        the embed shim and its adapters
#   /engines.json   the catalog
#   /index.html     the catalog page
{
  pkgs,
  engines,
  pkgsById,
}:
let
  catalog = map (e: {
    inherit (e)
      id
      label
      description
      family
      repo
      licence
      rev
      source
      ;
    homepage = e.homepage or e.repo;
    url = "${e.id}/";
  }) engines;
in
pkgs.runCommand "synths-site" { } ''
  mkdir -p $out
  cp -r ${../embed} $out/_embed
  cp ${./index.html} $out/index.html
  cp ${pkgs.writeText "engines.json" (builtins.toJSON catalog)} $out/engines.json
  ${pkgs.lib.concatMapStrings (e: ''
    ln -s ${pkgsById.${e.id}} $out/${e.id}
  '') engines}
''
