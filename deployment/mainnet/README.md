# Cardano Mainnet

**NOTE**: The following instructions are the example of deployment the Identus Platform and the Cardano stack.
!!!DON'T USE IT BLINDLY IN PRODUCTION ENVIRONMENT!!!

## Configuration
The following guide uses the environmental variables that should be hidden.
The file `.env` must be created locally with the following content:

```shell
export WALLET_MNEMONIC='["sun", ...]'
export WALLET_PASSPHRASE="your wallet passphrase"
export WALLET_ID="your wallet id"
export PAYMENT_ADDRESS="your wallet payment address"
```
Variables will be added on the go of the deployment setup

## Cardano Node with Mithril Snapshot
Fast setup of the Cardano Node docker image with the Mithril snapshot

### Prerequisites
- docker
- docker compose
- git
- GITHUB_TOKEN to authenticate to ghcr.io
```shell
docker login ghcr.io -u <username> -p <token>
```

### Usage

```shell
export NETWORK="mainnet"
docker compose -f docker-compose-cardano-node.yml up -d
```
or
```shell
./start-cardano-node-with.mithril.sh
```

Based on your network bandwidth, the script will take some time to download the docker image and the snapshot. ETA is around 30-90 minutes.

## DB Sync with Postgres
Starts two services:
- db-sync - to sync the Cardano Node with the Postgres database
- postgres - the Postgres database to store the Cardano Node data

### Prerequisites
- Cardano Node is up and running

### Usage

```shell
export NETWORK="mainnet"
docker compose -f docker-compose-db-sync.yml up -d
```
or
```shell
./start-db-sync-with-postgresql.sh
```

## Cardano Wallet
Starts and configure the Cardano Wallet

### Prerequisites
- Cardano Node is up and running

### Usage

```shell
docker compose -f docker-compose-cardano-wallet.yml up -d
```
or
```shell
./start-cardano-wallet.sh
```

### Create the wallet and addresses
Define the environment variables CARDANO_WALLET_MNEMONIC and CARDANO_WALLET_PASSPHRASE and run the script create-wallet.sh

```shell
echo $CARDANO_WALLET_MNEMONIC
echo $CARDANO_WALLET_PASSPHRASE
./create-wallet.sh
```

after execution, you need to grab the wallet id and the address id to use in the next steps
```shell
export CARDANO_WALLET_ID=<wallet_id>
curl -X GET http://localhost:8090/v2/wallets/${CARDANO_WALLET_ID}/addresses | jq
```

and define the environment variable CARDANO_PAYMENT_ADDRESS with the address id

## PRISM NODE with Postgres

### Prerequisites
Environment variable must be set to be used in the docker-compose-prism-node.yml file
- NODE_CARDANO_WALLET_ID: ${CARDANO_WALLET_ID}
- NODE_CARDANO_WALLET_PASSPHRASE: ${CARDANO_WALLET_PASSPHRASE}
- NODE_CARDANO_PAYMENT_ADDRESS: ${CARDANO_PAYMENT_ADDRESS}

### Usage

```shell
docker compose -f docker-compose-prism-node.yml up -d
```
or
```shell
./start-prism-node.sh
```
