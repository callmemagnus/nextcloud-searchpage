{ pkgs ? import <nixos-26.05> {} }:

with pkgs;

mkShell {
	name = "Nextcloud dev";
	buildInputs = [
		php83
		cacert
	];
	shellHook = ''
		echo "Nextcloud dev";
		NODE_VERSION=v24

		export NVM_DIR=$HOME/.local/magnus/nvm
		if test ! -d $NVM_DIR; then
			mkdir -p $NVM_DIR
			curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
		fi
		. "$NVM_DIR/nvm.sh"

		if ! nvm ls v$NODE_VERSION > /dev/null; then
			nvm install $NODE_VERSION
		else
			nvm use $NODE_VERSION
		fi

	'';
}
