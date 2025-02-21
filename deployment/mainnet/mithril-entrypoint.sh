#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------- #

if [[ -z ${NETWORK:-} ]]; then
  echo NETWORK must be explicitly set
  exit 1
fi
if [[ -z ${UNPACK_DIR:-} ]]; then
  echo UNPACK_DIR must be explicitly set
  exit 1
fi

if [ -d "$UNPACK_DIR/db" ]; then
  echo "Directory $UNPACK_DIR/db exists, nothing to do. If you are having issues with your cardano node database please remove the volume and restart"
  exit 0
fi

case "$NETWORK" in
"mainnet") MITHRIL_NETWORK="release-mainnet" ;;
"preprod") MITHRIL_NETWORK="release-preprod" ;;
"preview") MITHRIL_NETWORK="pre-release-preview" ;;
*)
  echo >&2 "fatal: invalid \$NETWORK value: $NETWORK"
  exit 1
  ;;
esac
export MITHRIL_NETWORK

export AGGREGATOR_ENDPOINT="https://aggregator.${MITHRIL_NETWORK}.api.mithril.network/aggregator"

# ---------------------------------------------------------------------------- #

apt update
apt install jq curl -y

# ---------------------------------------------------------------------------- #

snapshotDigest=$(/app/bin/mithril-client cardano-db snapshot list --json | jq -r ".[0].digest")
export snapshotDigest

GENESIS_VERIFICATION_KEY=$(curl -fsSL "https://raw.githubusercontent.com/input-output-hk/mithril/refs/heads/main/mithril-infra/configuration/${MITHRIL_NETWORK}/genesis.vkey")
export GENESIS_VERIFICATION_KEY

/app/bin/mithril-client cardano-db download "$snapshotDigest" --download-dir "$UNPACK_DIR" --json