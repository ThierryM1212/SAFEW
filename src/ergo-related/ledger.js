import HidTransport from "@ledgerhq/hw-transport-webhid";
import { ErgoLedgerApp } from 'ledgerjs-hw-app-ergo';
import { waitingAlert } from "../utils/Alerts";
import { DEFAULT_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT } from "../utils/constants";
import { convertToHex, hexToBytes } from "../utils/utils";
import { getWalletAddressesPathMap } from "../utils/walletUtils";
import { getUnsignedTransaction } from "./ergolibUtils";
import { addressHasTransactions } from "./explorer";
let ergolib = import('ergo-lib-wasm-browser');


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

export async function signTxLedger(wallet, unsignedTx, selectedUtxos, txSummaryHtml) {
    const alert = waitingAlert("Waiting transaction signing with ledger", txSummaryHtml);
    console.log("signTxLedger", wallet, unsignedTx, selectedUtxos, txSummaryHtml);
    const unsignedTxWASM = await getUnsignedTransaction(unsignedTx);

    const ledgerApp = new ErgoLedgerApp(await HidTransport.create());
    console.log("ledgerApp",ledgerApp);
    try {
        const inputs = [];
        const outputs = [];
        const inputBoxes = (await ergolib).ErgoBoxes.from_boxes_json(selectedUtxos);
        for (let i = 0; i < unsignedTxWASM.inputs().len(); i++) {
            const input = unsignedTxWASM.inputs().get(i);
            const box = selectedUtxos.find((b) => b.boxId === input.box_id().to_str());
            const wasmBox = findBox(inputBoxes, input.box_id().to_str());
            if (!wasmBox || !box) {
                throw Error(`Input ${input.box_id().to_str()} not found in unspent boxes.`);
            }
            inputs.push({
                txId: box.transactionId,
                index: box.index,
                value: wasmBox.value().as_i64().to_str(),
                ergoTree: Buffer.from(wasmBox.ergo_tree().sigma_serialize_bytes()),
                creationHeight: wasmBox.creation_height(),
                tokens: mapTokens(wasmBox.tokens()),
                additionalRegisters: Buffer.from(wasmBox.serialized_additional_registers()),
                extension: Buffer.from(input.extension().sigma_serialize_bytes())
            });
        }
        for (let i = 0; i < unsignedTxWASM.output_candidates().len(); i++) {
            const wasmOutput = unsignedTxWASM.output_candidates().get(i);
            outputs.push({
                value: wasmOutput.value().as_i64().to_str(),
                ergoTree: Buffer.from(wasmOutput.ergo_tree().sigma_serialize_bytes()),
                creationHeight: wasmOutput.creation_height(),
                tokens: mapTokens(wasmOutput.tokens()),
                registers: Buffer.from([]) // todo: try to find out the right way to do that
            });
        }
        const addressPathMap = getWalletAddressesPathMap(wallet);
        const changeAddress = wallet.changeAddress;
        
        const signatures = await ledgerApp.signTx(
            {
                inputs,
                dataInputs: [],
                outputs,
                changeMap: {
                    address: convertToHex(wallet.changeAddress),
                    path: addressPathMap[changeAddress]
                },
                signPaths: Object.values(addressPathMap),
            },
            true
        );
        return (await ergolib).Transaction.from_unsigned_tx(
            unsignedTxWASM,
            signatures.map((s) => Buffer.from(s.signature, "hex"))
        ).to_json();
    } catch (e) {
        throw e;
    } finally {
        alert.close();
        ledgerApp.transport.close();
    }
}

function findBox(wasmBoxes, boxId) {
    for (let i = 0; i < wasmBoxes.len(); i++) {
        if (wasmBoxes.get(i).box_id().to_str() === boxId) {
            return wasmBoxes.get(i);
        }
    }
}
function mapTokens(wasmTokens) {
    const tokens = [];
    for (let i = 0; i < wasmTokens.len(); i++) {
        tokens.push({
            id: wasmTokens.get(i).id().to_str(),
            amount: wasmTokens.get(i).amount().as_i64().to_str()
        });
    }
    return tokens;
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