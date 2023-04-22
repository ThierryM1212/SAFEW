# ![](./public/images/safew_icon_32.png) SAFEW

Simple And Fast Ergo Wallet

Ergo wallet integrating a dApp connector compatible EIP-12.

SAFEW is compatible with 
- Chrome based browser (Opera, Brave, Edge, Kiwi...).
- Firefox 

SAFEW was awarded as project participating in ErgoHack 3: https://ergoplatform.org/en/blog/2022-03-01-ergohack-iii-results/

## Releases
- For Chrome, Edge, Brave,... https://chrome.google.com/webstore/detail/simple-and-fast-ergo-wall/fmpbldieijjehhalgjblbpgjmijencll/
- For Firefox: https://addons.mozilla.org/en-US/firefox/addon/safew/

## Features
Wallet features:
 - Wallets:
    - Wallet with mnemonic for signing from SAFEW extension
    - Ergopay/Read only wallet for signing with Android/iOS wallet
    - Ledger 
 - View accounts (expert mode), addresses, their balance in ERG and tokens
 - Discovers wallet used addresses and generates unused addresses (BIP-44)
 - View wallet transactions confirmed and unconfirmed
 - Display unconfirmed balances per wallet, account and address
 - Configure Explorer, Node and Explorer UI addresses used by the wallet
 - ErgoMixer access: interact with ErgoMixer directly from the wallet
 - Transaction builder to manipulate json of ergo transaction in Expert mode
   - How to mint tokens: https://youtu.be/YR0jkbMLaAY
   - How to burn tokens: https://youtu.be/OcyziMIXTtk
   - How to send asset to several addresses: https://youtu.be/3N7Qn2BgH0U
 - Export wallet transactions as csv
 - Display NFT pictures, audio and videos
 - Mint tokens, pictures, audio and videos
 - Burn tokens
 - Chained transactions (send another transaction as soon as your transaction is visible in Explorer in unconfirmed state)

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

## Sample screens
![Wallet list image](./screens/main_page.png)
![Send multi-asset](./screens/send_multiasset.png)
![Ergo mixer](./screens/ergo_mixer_mixes.png)
![Transaction builder](./screens/tx_builder.png)
![Sign with ErgoPay](./screens/sign_ergopay.png)
![Mint NFTs, including image, audio or videos](./screens/mint_tokens.png)
![Display NFTs](./screens/display_nft.png)

## Release notes
v0.7.1
- remove explorer dependency, use the configured node to fetch wallet content and send the transactions
- fix issues with big numbers of tokens (over js max number)
- update the verified token list
- fix token prices

v0.6.10
- fetch boxes by tokenId in transaction builder

v0.6.9.1
- fix balance box generation in transaction builder

v0.6.9
- fix output creation height for v5.0
- fix signing with ledger recent test app

v0.6.8
- fix token media hash for minted tokens
- allow a bigger zoom for the Ergopay transaction QR codes, increase the error correction level
- fix delete key action when editing boxes in Transaction Builder
- fix typo in the README

v0.6.7
- fix dApp connector for ergopad
- fix chained transactions through the dApp connector

v0.6.6
- get headers from Explorer rather than node
- fix loading of unconfirmed transactions in Transaction Builder
- fix isConnected to return a promise

v0.6.5
- improve CSV export: review the format, remove 500 transaction limit, allow export by address
- fix isConnected ergoConnector function to really check if safew is connected

v0.6.4
- fix "Cancel connect" handling
- add "SAFEW" keyword in the title to be found on the store

v0.6.3
- dApp connector disconnect feature
- fix cancel connection response
- update icons

v0.6.2
- Switch back to wasm library
- Update ergo-lib-wasm-browser from 0.15.0 to 0.16.1
- Allow Nautilus and SAFEW to be activated at the same time
- Fixes for Chrome 102

v0.6.1
- Fix signing with ledger when registers are set in output
- Fix explorer links

v0.6.0
- Ledger support
- Embed google fonts
- Display error message when Ergopay QR code fails to be generated
- Bug fixes

v0.5.0
- Manifest v3 support: Use chrome.storage instead of localstorage, dApp connector refactoring

v0.4.7
- Ergold logo
- Bug fix in transaction csv export

v0.4.6
- Chained transactions support in wallet and with dApp connector
- Add caching for some explorer requests
- Improve csv export with UTC date and full ERG amount
- Added COMET and Mi Goreng verified tokens
- Bug fix

v0.4.5
- Fix Ergodex connection
- UI adjustment

v0.4.4
- Display NFT Images (improved), Audio, Videos
- Mint tokens, Images, Audio and Videos
- Burn tokens
- Bug fixes

v0.4.3
- Display NFT images
- Fix csv transaction export
- Fix send tokens that was failing to generate the transaction for some assets

v0.4.2
- Export transactions as csv
- Display the value in Erg for exchangeable tokens (Thanks SoCool)
- Fix transaction with big amounts of tokens (tested with 18 significant numbers)
- Fix Utxo selection when sending multiple assets
- Display token details in transaction builder unspent boxes
- Technical: Remove react-app-rewired, allow to "watch" the build directory (Thanks SoCool)

v0.4.1
- Firefox support
- bug fixes

v0.4
- Transaction builder integration
- bug fixes

v0.3
- ErgoPay improvement: allow to delete mnemonic to convert a wallet to an ErgoPay wallet, add/remove addresses from Ergopay wallets, add ErgoPay button for mobile users
- ErgoMixer integration: Display available Mixes, send mix transactions from the wallet, manage covert addresses
- Update dApp connector functions to allow future Wallet selector in dApps
- Update dependencies, cleanup lint
