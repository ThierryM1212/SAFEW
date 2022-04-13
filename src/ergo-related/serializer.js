import {Serializer} from "@coinbarn/ergo-ts";
import JSONBigInt from 'json-bigint';
import { getLastHeaders } from "./node";

import ergolib from 'ergo-lib-browser.asm';
// let ergolib = import('ergo-lib-wasm-browser')

/* global BigInt */

export async function encodeNum(n, isInt = false) {
    if (isInt) return (await ergolib).Constant.from_i32(n).encode_to_base16()
    else return (await ergolib).Constant.from_i64((await ergolib).I64.from_str(n)).encode_to_base16()
}

export async function decodeNum(n, isInt = false) {
    if (isInt) return (await ergolib).Constant.decode_from_base16(n).to_i32()
    else return (await ergolib).Constant.decode_from_base16(n).to_i64().to_str()

}

export function byteArrayToBase64( byteArray ) {
    var binary = '';
    var len = byteArray.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( byteArray[ i ] );
    }
    return window.btoa( binary );
}

function base64ToByteArray(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

export async function encodeHex(reg) {
    return (await ergolib).Constant.from_byte_array(Buffer.from(reg, 'hex')).encode_to_base16()
}

export async function encodeStr(str) {
    return encodeHex(Serializer.stringToHex(str))
}

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}

export async function decodeString(encoded) {
    return Serializer.stringFromHex(toHexString((await ergolib).Constant.decode_from_base16(encoded).to_byte_array()))
}

export function ergToNano(erg) {
    if (erg === undefined) return 0
    if (erg.startsWith('.')) return parseInt(erg.slice(1) + '0'.repeat(9 - erg.length + 1))
    let parts = erg.split('.')
    if (parts.length === 1) parts.push('')
    if (parts[1].length > 9) return 0
    return parseInt(parts[0] + parts[1] + '0'.repeat(9 - parts[1].length))
}

export function tokenFloatToAmount(amountFloatStr, decimals) {
    if (amountFloatStr === undefined ) return BigInt(0);
    if (decimals === undefined ) decimals = 0;
    const amountStr = amountFloatStr.toString();
    if (amountStr.startsWith('.')) return BigInt(amountStr.slice(1) + '0'.repeat(decimals - amountStr.length + 1))
    let parts = amountStr.split('.')
    if (parts.length === 1) parts.push('')
    if (parts[1].length > decimals) return BigInt(0)
    return BigInt(parts[0] + parts[1] + '0'.repeat(decimals - parts[1].length))
}

export async function encodeAddress(address) {
    const byteArray = (await ergolib).Address.from_mainnet_str(address).to_bytes();
    return (await ergolib).Constant.from_byte_array(byteArray);
}

export async function decodeAddress(addr) {
    const address = (await ergolib).Address.from_bytes(addr);
    return address.to_base58();
}

export async function encodeInt(num) {
    return (await ergolib).Constant.from_i32(num);
}
export async function decodeInt(num) {
    return num.to_i32();
}

export async function encodeLong(num) {
    return (await ergolib).Constant.from_i64((await ergolib).I64.from_str(num));
}
export async function decodeLong(num) {
    return num.to_i64().to_str();
}

export async function encodeLongArray(longArray) {
    return (await ergolib).Constant.from_i64_str_array(longArray);
}

export async function decodeLongArray(encodedArray) {
    return encodedArray.to_i64_str_array();
}

export async function decodeLongArray2(encodedArray) {
    const tmp = (await ergolib).Constant.from_i64_str_array(encodedArray);
    return tmp.to_i64_str_array();
}

export async function encodeContract(address) {
    const tmp = (await ergolib).Contract.pay_to_address((await ergolib).Address.from_base58(address));
    return tmp.ergo_tree().to_base16_bytes();
}

export async function ergoTreeToAddress(ergoTree) {
    //console.log("ergoTreeToAddress",ergoTree);
    const ergoT = (await ergolib).ErgoTree.from_base16_bytes(ergoTree);
    const address = (await ergolib).Address.recreate_from_ergo_tree(ergoT);
    return address.to_base58();
}

export async function getWasmCollection(jsItems, fnToCreateSingleFromJson, ctorToCreateCollectionFromSingle) {
  return jsItems.reduce((acc, cur) => {
    const jsonOfItem = JSONBigInt.stringify(cur);
    const singleItem = fnToCreateSingleFromJson(jsonOfItem);
    if(acc === undefined) acc = ctorToCreateCollectionFromSingle(singleItem);
    else acc.add(singleItem);
    return acc;
  }, undefined);
}

export async function getErgoStateContext() {
    const eLib = await ergolib;
    const lastHeaders = await getLastHeaders();
    const block_headers = await getWasmCollection(lastHeaders, eLib.BlockHeader.from_json, header => new eLib.BlockHeaders(header));
    const pre_header = eLib.PreHeader.from_block_header(block_headers.get(0));
    return new (await ergolib).ErgoStateContext(pre_header, block_headers);
}


export async function getTxReducedFromB64(txReducedB64) {
    return (await ergolib).ReducedTransaction.sigma_parse_bytes(base64ToByteArray(txReducedB64));
}



export async function getTxJsonFromTxReduced(txReduced){
    const reducedTx = await getTxReducedFromB64(txReduced);
    console.log("getTxJsonFromTxReduced", reducedTx);
    return await reducedTx.unsigned_tx().to_js_eip12();
}

export async function signTxReduced(txReducedB64, mnemonic, address) {
    const reducedTx = await getTxReducedFromB64(txReducedB64);
    const wallet = await getWalletForAddress(mnemonic, address);
    const signedTx = wallet.sign_reduced_transaction(reducedTx);
    return await signedTx.to_js_eip12();
}

const deriveSecretKey = (rootSecret, path) =>
    rootSecret.derive(path); 

//const nextPath = (rootSecret, lastPath) => 
//    rootSecret.derive(lastPath).path().next();


export async function signTxWithMnemonic(json, inputs, dataInputs, mnemonic, address) {
    const unsignedTx = (await ergolib).UnsignedTransaction.from_json(JSONBigInt.stringify(json));
    const inputBoxes = (await ergolib).ErgoBoxes.from_boxes_json(inputs);
    const inputDataBoxes = (await ergolib).ErgoBoxes.from_boxes_json(dataInputs);

    const wallet = await getWalletForAddress(mnemonic, address);
    console.log("wallet",wallet);
    const ctx = await getErgoStateContext();
    const signedTx = wallet.sign_transaction(ctx, unsignedTx, inputBoxes, inputDataBoxes);
    return await signedTx.to_js_eip12();
}

export async function signTransaction(unsignedTx, inputs, dataInputs, wallet) {
    //console.log("signTransaction1", unsignedTx, inputs, dataInputs);
    const eLib = await ergolib;
    const unsignedTransaction = eLib.UnsignedTransaction.from_json(JSONBigInt.stringify(unsignedTx));
    const inputBoxes = (await getWasmCollection(inputs, eLib.ErgoBox.from_json, (ergoBox) => new eLib.ErgoBoxes(ergoBox))) || eLib.ErgoBoxes.empty();
    const dataInputsBoxes = (await getWasmCollection(dataInputs, eLib.ErgoBox.from_json, (ergoBox) => new eLib.ErgoBoxes(ergoBox))) || eLib.ErgoBoxes.empty();
    const ctx = await getErgoStateContext();
    //console.log("signTransaction2", unsignedTx, inputs, dataInputs);
    const signedTx = wallet.sign_transaction(ctx, unsignedTransaction, inputBoxes, dataInputsBoxes);
    return await signedTx.to_json();
}

async function getWalletForAddress (mnemonic, address) {
    const dlogSecret = await getSecretForAddress(mnemonic, address);
    var secretKeys = new (await ergolib).SecretKeys();
    secretKeys.add(dlogSecret);
    return (await ergolib).Wallet.from_secrets(secretKeys);
}

async function getSecretForAddress(mnemonic, address) {
    const seed = (await ergolib).Mnemonic.to_seed(mnemonic, "");
    const rootSecret = (await ergolib).ExtSecretKey.derive_master(seed);
    const changePath = await getDerivationPathForAddress(rootSecret, address);
    console.log("changePath", address, changePath.toString());
    const changeSecretKey = deriveSecretKey(rootSecret, changePath);
    //const changePubKey = changeSecretKey.public_key();
    //const changeAddress = (await ergolib).NetworkAddress.new((await ergolib).NetworkPrefix.Mainnet, changePubKey.to_address());
    //console.log(`address: ${changeAddress.to_base58()}`);
    
    const dlogSecret = (await ergolib).SecretKey.dlog_from_bytes(changeSecretKey.secret_key_bytes());
    return dlogSecret;
}

export async function getWalletForAddresses(mnemonic, addressList) {
    var secretKeys = new (await ergolib).SecretKeys();
    for (const addr of addressList) {
        console.log("getWalletForAddresses", addr)
        const secret = await getSecretForAddress(mnemonic, addr);
        secretKeys.add(secret);
    }
    return (await ergolib).Wallet.from_secrets(secretKeys);
}

async function getDerivationPathForAddress(rootSecret, address) {
    let path = (await ergolib).DerivationPath.new(0, new Uint32Array([0]));
    var subsequentsMaxes = [10, 100, 1000];
    
    for (const max of subsequentsMaxes) {
        var i = 0, j = 0, found = false;
        while (i<max && !found) {
            j = 0;
            while (j<max && !found) {
                let path = (await ergolib).DerivationPath.new(i, new Uint32Array([j]));
                //console.log("getDerivationPathForAddress", i, j, path.toString());
                const changeSecretKey = deriveSecretKey(rootSecret, path);
                const changePubKey = changeSecretKey.public_key();
                const changeAddress = (await ergolib).NetworkAddress.new((await ergolib).NetworkPrefix.Mainnet, changePubKey.to_address()).to_base58();
                if (changeAddress === address) {
                    found = true;
                    return (await ergolib).DerivationPath.new(i, new Uint32Array([j]));
                }
                j++;
            }
            i++;
        }
    }
    return path;
}

//export async function signTx(json, inputs, dataInputs, mnemonic) {
//    const unsignedTx = (await ergolib).UnsignedTransaction.from_json(JSONBigInt.stringify(json));
//    const inputBoxes = (await ergolib).ErgoBoxes.from_boxes_json(inputs);
//    const inputDataBoxes = (await ergolib).ErgoBoxes.from_boxes_json(dataInputs);
//    var secrets = new (await ergolib).SecretKeys();
//    const secret = (await ergolib).SecretKey.from
//    const wallet = (await ergolib).Wallet.from_mnemonic(mnemonic, "");
//    const ctx = await getErgoStateContext();
//    const signedTx = wallet.sign_transaction(ctx, unsignedTx, inputBoxes, inputDataBoxes);
//    return await signedTx.to_js_eip12();
//}
