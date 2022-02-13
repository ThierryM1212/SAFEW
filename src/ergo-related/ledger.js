import HidTransport from "@ledgerhq/hw-transport-webhid";
import { ErgoLedgerApp } from 'ledgerjs-hw-app-ergo';
import { waitingAlert } from "../utils/Alerts";
import { DEFAULT_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT } from "../utils/constants";
import { addressHasTransactions } from "./explorer";
let ergolib = import('ergo-lib-wasm-browser');


function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

async function getLedgerAddresses(pubKey, chain_code, accountId, index) {
    let path = (await ergolib).DerivationPath.new(accountId, new Uint32Array([index]));
    //console.log(path.toString())
    const pub = hexToBytes(pubKey)
    const chain = hexToBytes(chain_code);
    const extPubKey = (await ergolib).ExtPubKey.new(pub, chain, path);
    return extPubKey.child(index).to_address().to_base58();
}

export async function getNewAccount(wallet) {
    var alert = waitingAlert("Connecting to the Ledger...");
    const ledgerApp = new ErgoLedgerApp(await HidTransport.create());
    const newAccountId = wallet.accounts.length;
    try {
        alert = waitingAlert("Waiting approval to get the public key from the Ledger...");
        const ledgerPubKey = await ledgerApp.getExtendedPublicKey("m/44'/429'/" + newAccountId + "'", true);
        const newAddressStr = await getLedgerAddresses(ledgerPubKey.publicKey, ledgerPubKey.chainCode, newAccountId, 0);
        const accountAddress = {
            id: 0,
            address: newAddressStr,
            used: false,
        };
        return {
            id: newAccountId,
            addresses: [accountAddress],
            name: "Account_" + newAccountId.toString(),
        }
    } catch (e) {

        throw (e);
    } finally {
        alert.close();
        ledgerApp.transport.close();
    }
}

export async function getNewAddress(wallet, accountId) {
    var alert = waitingAlert("Connecting to the Ledger...");
    const ledgerApp = new ErgoLedgerApp(await HidTransport.create());
    const addressId = wallet.accounts[accountId].addresses.length;
    try {
        alert = waitingAlert("Waiting approval to get the public key from the Ledger...");
        const ledgerPubKey = await ledgerApp.getExtendedPublicKey("m/44'/429'/" + accountId + "'", true);
        const newAddressStr = await getLedgerAddresses(ledgerPubKey.publicKey, ledgerPubKey.chainCode, accountId, addressId);
        return {
            id: addressId,
            address: newAddressStr,
            used: false,
        };
    } catch (e) {
        throw (e);
    } finally {
        alert.close();
        ledgerApp.transport.close();
    }
}

export async function discoverLedgerAddresses() {
    var alert = waitingAlert("Connecting to the Ledger...");
    const ledgerApp = new ErgoLedgerApp(await HidTransport.create());
    try {
        alert = waitingAlert("Waiting approval to get the public key from the Ledger...");
        let accountId = 0, txForAccountFound = true, accounts = [], unusedAddresses = [], gotApproval = false;
        const numberOfUnusedAddress = DEFAULT_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT;
        while (txForAccountFound) {
            let index = 0, indexMax = 20, accountAddrressList = [];
            txForAccountFound = false;
            unusedAddresses = [];
            while (index < indexMax) {
                const ledgerPubKey = await ledgerApp.getExtendedPublicKey("m/44'/429'/" + accountId + "'", true);
                if (!gotApproval) alert = waitingAlert("Searching wallet used addresses...");
                gotApproval = true;
                const newAddressStr = await getLedgerAddresses(ledgerPubKey.publicKey, ledgerPubKey.chainCode, accountId, index);
                console.log("discoverLedgerAddresses", newAddressStr, accountId, index)
                if (await addressHasTransactions(newAddressStr)) {
                    indexMax = index + 20;
                    txForAccountFound = true
                    const address = {
                        id: index,
                        address: newAddressStr,
                        used: true,
                    };
                    accountAddrressList.push(address);
                } else {
                    if (unusedAddresses.length < numberOfUnusedAddress) {
                        unusedAddresses.push(newAddressStr);
                        accountAddrressList.push({
                            id: index,
                            address: newAddressStr,
                            used: false,
                        });
                    }
                }
                index++;
            }
            if (accountAddrressList.length > unusedAddresses.length) {
                accounts.push({
                    id: accountId,
                    addresses: accountAddrressList,
                    name: "Account_" + accountId.toString(),
                });
            } else {  // no used addresses in the account add only the first one
                accounts.push({
                    id: accountId,
                    addresses: [accountAddrressList[0]],
                    name: "Account_" + accountId.toString(),
                });
            }
            accountId++;
        }
        if (accounts.length === 0) { // new address
            const ledgerPubKey0 = await ledgerApp.getExtendedPublicKey("m/44'/429'/0'", true);
            const newAddressStr0 = await getLedgerAddresses(ledgerPubKey0.publicKey, ledgerPubKey0.chainCode, 0, 0);;
            const mainAddress = {
                id: 0,
                address: newAddressStr0,
                used: false,
            };
            accounts.push({
                id: 0,
                addresses: [mainAddress],
                name: "Account_0",
            });
        }
        alert.close();
        console.log(accounts);
        return accounts;

    } catch (e) {
        throw (e);
    } finally {
        ledgerApp.transport.close();
    }

}