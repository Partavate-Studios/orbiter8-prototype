#!/bin/sh
# Fetches the contracts' libraries into lib/ at pinned release tags (lib/ isn't committed).
# Run once after cloning, from anywhere: contracts/setup.sh
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
fetch_commit() {
  # fetch_commit <folder> <repo> <commit>  (for libraries without release tags)
  if [ -d "lib/$1" ]; then
    echo "lib/$1 already present"
  else
    git clone --quiet "https://github.com/$2" "lib/$1"
    git -C "lib/$1" -c advice.detachedHead=false checkout --quiet "$3"
    echo "lib/$1 at $3"
  fi
}
mkdir -p lib
fetch forge-std foundry-rs/forge-std v1.17.0
fetch openzeppelin-contracts OpenZeppelin/openzeppelin-contracts v5.7.0
fetch openzeppelin-contracts-upgradeable OpenZeppelin/openzeppelin-contracts-upgradeable v5.7.0
# BN254 BLS verification for drand's evmnet beacon (docs/demo4-plan.md, D35). MIT; not audited.
fetch_commit bls-solidity randa-mu/bls-solidity 11af179a8287d978659aae07adb66aa60f64b8a6
