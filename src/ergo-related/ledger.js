import TransportU2F from "@ledgerhq/hw-transport-u2f";
import WebUSBTransport from "@ledgerhq/hw-transport-webusb";
import { ErgoLedgerApp, Network } from 'ledger-ergo-js';
import { waitingAlert } from "../utils/Alerts";
import { DEFAULT_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT } from "../utils/constants";
import { convertToHex, hexToBytes } from "../utils/utils";
import { getWalletAddressesPathMap } from "../utils/walletUtils";
import { getUnsignedTransaction } from "./ergolibUtils";
import { addressHasTransactions } from "./explorer";
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { Address } from "@coinbarn/ergo-ts";
import ergolib from 'ergo-lib-browser.asm';
// let ergolib = import('ergo-lib-wasm-browser')
const bip32 = BIP32Factory(ecc);

function getLedgerAddresses(pubKey, chain_code, index) {
    const bip = bip32.fromPublicKey(
        Buffer.from(pubKey, "hex"),
        Buffer.from(chain_code, "hex")
    );
    const derivedPk = bip.derivePath("0").derive(index).publicKey;
    const bip32Address = Address.fromPk(derivedPk.toString("hex")).address;
    //console.log("getLedgerAddresses", index, bip32Address);
    return bip32Address;
}

async function getTransport() {
    try {
        console.log("getTransport WebUSB");
        return await WebUSBTransport.create();
    }
    catch {
        console.log("getTransport U2F");
        return await TransportU2F.create();
    }
}

export async function ledgerPubKey(wallet) {
    var alert = waitingAlert("Connecting to the Ledger...");
    const ledgerApp = new ErgoLedgerApp(await getTransport());
    const newAccountId = wallet.accounts.length;
    try {
        alert = waitingAlert("Waiting approval to get the public key from the Ledger...");
        const ledgerPubKey = await ledgerApp.getExtendedPublicKey("m/44'/429'/" + newAccountId + "'", true);
        //console.log("ledgerPubKey ledgerPubKey", ledgerPubKey);
        const newAddressStr = getLedgerAddresses(ledgerPubKey.publicKey, ledgerPubKey.chainCode, 0);
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

export async function getNewAccount(wallet) {
    var alert = waitingAlert("Connecting to the Ledger...");
    const ledgerApp = new ErgoLedgerApp(await getTransport());
    const newAccountId = wallet.accounts.length;
    try {
        alert = waitingAlert("Waiting approval to get the public key from the Ledger...");
        const ledgerPubKey = await ledgerApp.getExtendedPublicKey("m/44'/429'/" + newAccountId + "'", true);
        const newAddressStr = getLedgerAddresses(ledgerPubKey.publicKey, ledgerPubKey.chainCode, 0);
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
    const ledgerApp = new ErgoLedgerApp(await getTransport());
    const index = wallet.accounts[accountId].addresses.length;
    try {
        alert = waitingAlert("Waiting approval to get the public key from the Ledger...");
        const ledgerPubKey = await ledgerApp.getExtendedPublicKey("m/44'/429'/" + accountId + "'", true);
        //console.log("ledgerPubKey ledgerPubKey", ledgerPubKey);
        const newAddressStr = getLedgerAddresses(ledgerPubKey.publicKey, ledgerPubKey.chainCode, index);
        return {
            id: index,
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
    //console.log("signTxLedger", wallet, unsignedTx, selectedUtxos, txSummaryHtml);
    const unsignedTxWASM = await getUnsignedTransaction(unsignedTx);
    const addressPathMap = getWalletAddressesPathMap(wallet);
    const ledgerApp = new ErgoLedgerApp(await getTransport()).useAuthToken().enableDebugMode();
    //console.log("ledgerApp", ledgerApp);
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
            const boxAddress = Address.fromErgoTree(box.ergoTree);
            //console.log("signTxLedger address input", box.index, boxAddress.address, addressPathMap[boxAddress.address])
            inputs.push({
                txId: box.transactionId,
                index: box.index,
                value: wasmBox.value().as_i64().to_str(),
                ergoTree: Buffer.from(wasmBox.ergo_tree().sigma_serialize_bytes()),
                creationHeight: wasmBox.creation_height(),
                tokens: mapTokens(wasmBox.tokens()),
                additionalRegisters: Buffer.from(wasmBox.serialized_additional_registers()),
                extension: Buffer.from(input.extension().sigma_serialize_bytes()),
                signPath: addressPathMap[boxAddress.address]
            });
        }
        for (let i = 0; i < unsignedTxWASM.output_candidates().len(); i++) {
            const wasmOutput = unsignedTxWASM.output_candidates().get(i);
            outputs.push({
                value: wasmOutput.value().as_i64().to_str(),
                ergoTree: Buffer.from(wasmOutput.ergo_tree().sigma_serialize_bytes()),
                creationHeight: wasmOutput.creation_height(),
                tokens: mapTokens(wasmOutput.tokens()),
                registers: (await serializeRegisters(wasmOutput))
            });
        }
        //console.log("outputs",outputs);

        const changeAddress = wallet.changeAddress;
        const distinctTokens = unsignedTxWASM.distinct_token_ids();
        //console.log("distinctTokens",distinctTokens);
        const signatures = await ledgerApp.signTx(
            {
                inputs,
                dataInputs: [],
                outputs,
                distinctTokenIds: distinctTokens,
                changeMap: {
                    address: convertToHex(wallet.changeAddress),
                    path: addressPathMap[changeAddress]
                }
            },
            Network.Mainnet
        );
        return (await ergolib).Transaction.from_unsigned_tx(
            unsignedTxWASM,
            signatures
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
    const ledgerApp = new ErgoLedgerApp(await getTransport());
    try {
        alert = waitingAlert("Waiting approval to get the public key from the Ledger...");
        let accountId = 0, txForAccountFound = true, accounts = [], unusedAddresses = [], gotApproval = false;
        const numberOfUnusedAddress = DEFAULT_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT;
        while (txForAccountFound) {
            let index = 0, indexMax = 20, accountAddrressList = [];
            txForAccountFound = false;
            unusedAddresses = [];
            const ledgerPubKey = await ledgerApp.getExtendedPublicKey("m/44'/429'/" + accountId.toString() + "'");
            //console.log("discoverLedgerAddresses ledgerPubKey", accountId, ledgerPubKey);
            while (index < indexMax) {
                if (!gotApproval) alert = waitingAlert("Searching wallet used addresses...");
                gotApproval = true;

                const newAddressStr = getLedgerAddresses(ledgerPubKey.publicKey, ledgerPubKey.chainCode, index);
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
            const newAddressStr0 = getLedgerAddresses(ledgerPubKey0.publicKey, ledgerPubKey0.chainCode, 0);;
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
        //console.log(accounts);
        return accounts;

    } catch (e) {
        throw (e);
    } finally {
        ledgerApp.transport.close();
    }

}

async function serializeRegisters(box) {
    const registerEnum = (await ergolib).NonMandatoryRegisterId;
    if (!box.register_value(registerEnum.R4)) {
        return Buffer.from([]);
    }

    const registers = [
        Buffer.from(box.register_value(registerEnum.R4)?.sigma_serialize_bytes() ?? []),
        Buffer.from(box.register_value(registerEnum.R5)?.sigma_serialize_bytes() ?? []),
        Buffer.from(box.register_value(registerEnum.R6)?.sigma_serialize_bytes() ?? []),
        Buffer.from(box.register_value(registerEnum.R7)?.sigma_serialize_bytes() ?? []),
        Buffer.from(box.register_value(registerEnum.R8)?.sigma_serialize_bytes() ?? []),
        Buffer.from(box.register_value(registerEnum.R9)?.sigma_serialize_bytes() ?? [])
    ].filter((b) => b.length > 0);

    return Buffer.concat([...[Buffer.from([registers.length])], ...registers]);
}