#!/bin/sh
# Fetches the contracts' libraries into lib/ at pinned release tags (lib/ isn't committed).
# Run once after cloning, from anywhere: contracts-v4/setup.sh
set -e
cd "$(dirname "$0")"
fetch() {
  # fetch <folder> <repo> <tag>
  if [ -d "lib/$1" ]; then
    echo "lib/$1 already present"
  else
    git -c advice.detachedHead=false clone --quiet --depth 1 --branch "$3" "https://github.com/$2" "lib/$1"
    echo "lib/$1 at $3"
  fi
}
mkdir -p lib
fetch forge-std foundry-rs/forge-std v1.17.0
fetch openzeppelin-contracts OpenZeppelin/openzeppelin-contracts v5.7.0
fetch openzeppelin-contracts-upgradeable OpenZeppelin/openzeppelin-contracts-upgradeable v5.7.0
