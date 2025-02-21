# Cardano Mainnet

## Cardano Node with Mithril Snapshot

### Prerequisites
- docker
- docker compose
- git
- GITHUB_TOKEN to authenticate to ghcr.io
```shell
docker login ghcr.io -u <username> -p <token>
```
### Purpose

Fast setup of the Cardano Node docker image with the Mithril snapshot

### Usage

```shell
./start-cardano-node-with-mithril.sh
```