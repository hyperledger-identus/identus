echo $CARDANO_WALLET_MNEMONIC
echo $CARDANO_WALLET_PASSPHRASE
REQUEST='{"mnemonic_sentence":'${CARDANO_WALLET_MNEMONIC}',
        "passphrase":"'${CARDANO_WALLET_PASSPHRASE}'",
        "name":"Identus Demo Wallet",
        "address_pool_gap":20}'
echo $REQUEST
curl -X POST http://localhost:8090/v2/wallets \
    -d "$REQUEST" \
    -H "Content-Type: application/json" \
    --verbose
