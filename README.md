# SAFEW  

Simple And Fast Ergo Wallet

Ergo wallet integrating a dApp connector compatible EIP-12.

## Features
Wallet features:
 - Add, restore, edit wallets (BIP-32/39)
 - View accounts (expert mode), addresses, their balance in ERG and tokens
 - Discovers wallet used addresses and generates unused addresses (BIP-44)
 - View wallet transactions confirmed and unconfirmed
 - Display unconfirmed balances per wallet, account and address
 - Configure Explorer, Node and Explorer UI addresses used by the wallet

## Security
The wallets are stored in the local storage of the SAFEW browser extension.<br/>
The mnemonic is encrypted (AES-256) with the spending password, that is not stored in the application.<br/>
The password will be required to spend funds or to add or discover new addresses.<br/>

## Privacy
The address discovery can be launched at any time to generate unused addresses in the wallets.<br/>
Non connected sites have no access to the information of your wallet.<br/>
Connected sites can read the wallet content.<br/>
The explorer and node used to interact with Ergo blockchain are configurable.<br/>

## Build the project
> git clone https://github.com/ThierryM1212/SAFEW.git<br/>
> cd SAFEW <br/>
> npm install <br/>
> npm run build <br/>
<br/>
Load the unpacked extension as described at: https://developer.chrome.com/docs/extensions/mv3/getstarted/ <br/>
<br/>
It requires to disable Yoroi extension to use the dApp connector.<br/>

## dApp Connector
It tries to follow https://github.com/Emurgo/Emurgo-Research/blob/master/ergo/EIP-0012.md
sign_tx_input, sign_data and add_external_box are not implemented yet

Same ergo_request_read_access and ergo_check_read_access than Yoroi method are declared to ensure the compatibility of existing dApp using Yoroi.

## Next steps ?
Publish on Chrome Web Stored (currently blocked by https://bugs.chromium.org/p/chromium/issues/detail?id=1173354 and the requirement to publish the new extensions with manifest v3)<br/>
Publish on Opera Addons<br/>
Build for Firefox<br/>
Ergo mixer integration: https://github.com/ergoMixer/ergoMixBack<br/>
Transaction builder integration: https://transaction-builder.ergo.ga/<br/>
Display NFT images ?<br/>
Ledger integration ?<br/>
<br/>
