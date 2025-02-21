# Deployment

**NOTE**: The following instructions are the example of deployment the Identus Platform and the Cardano stack.
!!!DON'T USE IT BLINDLY IN PRODUCTION ENVIRONMENT!!!

## Cardano Stack for Prism Node
Prism Node uses the Cardano Wallet for publishing the transactions to the Cardano blockchain and data populated by the db-sync.
The default deployment topology consists of the following required components:
- Cardano Node
- Cardano Wallet
- Cardano db-sync
- Postgres database db-sync-db
- Postgres database wallet-db