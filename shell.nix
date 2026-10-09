{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/nixos-26.05.tar.gz") {} }:

with pkgs;

mkShell {
	name = "Nextcloud dev";
	buildInputs = [
		php83
		php83Packages.composer
		fnm
		cacert
	];
	shellHook = ''
		echo "Nextcloud dev";
		eval "$(fnm env)"
		fnm use --install-if-missing 24
	'';
}
