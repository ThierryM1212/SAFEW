# ![](./public/images/safew_icon_32.png) SAFEW

Simple And Fast Ergo Wallet

Ergo wallet integrating a dApp connector compatible EIP-12.

SAFEW is compatible with 
- Chrome based browser (Opera, Brave, Edge...) but not released on Chrome store yet.
How to install: https://www.youtube.com/watch?v=4ZEIcr0udkI
- Firefox and available at: https://addons.mozilla.org/en-US/firefox/addon/safew/

SAFEW was awarded as project participating in ErgoHack 3: https://ergoplatform.org/en/blog/2022-03-01-ergohack-iii-results/

## Releases
Download at: https://github.com/ThierryM1212/SAFEW/releases

## Features
Wallet features:
 - Add, restore, edit wallets (BIP-32/39)
 - View accounts (expert mode), addresses, their balance in ERG and tokens
 - Discovers wallet used addresses and generates unused addresses (BIP-44)
 - View wallet transactions confirmed and unconfirmed
 - Display unconfirmed balances per wallet, account and address
 - Configure Explorer, Node and Explorer UI addresses used by the wallet
 - ErgoPay/ReadOnly wallet and signing (only the public address are provided, signing is delegated to ErgoPay EIP-19 with iOS or Android wallet v1.6+)
 - ErgoMixer access: interact with ErgoMixer directly from the wallet
 - Transaction builder to manipulate json of ergo transaction in Expert mode
 - Export wallet transactions as csv

## Security
The wallets are stored in the local storage of the SAFEW browser extension.<br/>
The mnemonic is encrypted (AES-256) with the spending password, that is not stored in the application.<br/>
The password will be required to spend funds or to add or discover new addresses.<br/>
You can use ErgoPay wallet to keep your secrets on a mobile device (iOS or Android wallet)<br/>
ErgoPay wallets are available to sign remotely the transaction using iOS or Android wallet v1.6+, to avoid to store the encrypted mnemonic in your browser extension local storage.<br/>

## Privacy
The address discovery can be launched at any time to generate unused addresses in the wallets.<br/>
Non connected sites have no access to the information of your wallet.<br/>
Connected sites can read the wallet content.<br/>
The explorer and node used to interact with Ergo blockchain are configurable.<br/>
ErgoPay/ReadOnly wallets allow you to keep the content of your wallet hidden..<br/>
ErgoMixer integration ease the usage of privacy tools.<br/>

## Reliability
The transaction balance displayed when sending funds using SAFEW is computed from the unsigned transaction, not from the UI inputs.<br/>

## Build the project
> git clone https://github.com/ThierryM1212/SAFEW.git<br/>
> cd SAFEW <br/>
> npm install <br/>
> npm run build-prod <br/>
<br/>
Load the unpacked extension as described at: https://developer.chrome.com/docs/extensions/mv3/getstarted/ <br/>
<br/>
It requires to disable Yoroi or Nautilus extension to use the dApp connector.<br/>

## debug
> npm run watch<br/>
And reload the extension from the build directory<br/>
Set the key "debug" = "true" in the local storage to display dApp connector popups buttons<br/>

## dApp Connector
It tries to follow https://github.com/Emurgo/Emurgo-Research/blob/master/ergo/EIP-0012.md
sign_tx_input, sign_data and add_external_box are not implemented yet

Same ergo_request_read_access and ergo_check_read_access than Yoroi method are declared to ensure the compatibility of existing dApp using Yoroi.

## Next steps ?
Publish on Chrome Web Store (currently blocked by https://bugs.chromium.org/p/chromium/issues/detail?id=1173354 and the requirement to publish the new extensions with manifest v3)<br/>
Publish on Opera Addons (available on Opera beta store waiting for validation)<br/>
Ledger signing (Waiting on ledger-ergo-app fix)<br/>
<br/>

## Release notes
v0.3
- ErgoPay improvement: allow to delete mnemonic to convert a wallet to an ErgoPay wallet, add/remove addresses from Ergopay wallets, add ErgoPay button for mobile users
- ErgoMixer integration: Display available Mixes, send mix transactions from the wallet, manage covert addresses
- Update dApp connector functions to allow future Wallet selector in dApps
- Update dependencies, cleanup lint

v0.4
- Transaction builder integration
- bug fixes

v0.4.1
- Firefox support
- bug fixes

v0.4.2
- Export transactions as csv
- Display the value in Erg for exchangeable tokens (Thanks SoCool)
- Fix transaction with big amounts of tokens (tested with 18 significant numbers)
- Fix Utxo selection when sending multiple assets
- Display token details in transaction builder unspent boxes
- Technical: Remove react-app-rewired, allow to "watch" the build directory (Thanks SoCool)

## Sample screens
![Wallet list image](./screens/main_page.png)
![Send multi-asset](./screens/send_multiasset.png)
![Ergo mixer](./screens/ergo_mixer_mixes.png)
![Transaction builder](./screens/tx_builder.png)
![Sign with ErgoPay](./screens/sign_ergopay.png)
