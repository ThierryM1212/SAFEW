import { MAX_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT, NANOERG_TO_ERG } from '../utils/constants';
import { addressHasTransactions, currentHeight, unspentBoxesFor } from './explorer';
import { getTokenListFromUtxos, getUtxosListValue, parseUtxos } from './utxos';
let ergolib = import('ergo-lib-wasm-browser');

/* global BigInt */

const deriveSecretKey = (rootSecret, path) =>
    rootSecret.derive(path);

const nextPath = (rootSecret, lastPath) =>
    rootSecret.derive(lastPath).path().next();

export async function getMainAddress(mnemonic) {
    return getAddress(mnemonic, 0, 0);
}

export async function getAddress(mnemonic, accountId, index) {
    const seed = (await ergolib).Mnemonic.to_seed(mnemonic, "");
    const rootSecret = (await ergolib).ExtSecretKey.derive_master(seed);
    //console.log("seed", seed);
    //console.log("rootSecret", rootSecret);

    let path = (await ergolib).DerivationPath.new(accountId, new Uint32Array([index]));
    const changeSecretKey = deriveSecretKey(rootSecret, path);
    const changePubKey = changeSecretKey.public_key();
    const changeAddress = (await ergolib).NetworkAddress.new((await ergolib).NetworkPrefix.Mainnet, changePubKey.to_address());
    path = (await ergolib).DerivationPath.new(0, new Uint32Array([0]));
    //console.log("derivation path", path.toString());
    //console.log("Change address", changeAddress.to_base58());

    return changeAddress.to_base58();
}

// Search used addresses for a given mnemonic as per BIP-44
// https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
export async function discoverAddresses(mnemonic) {
    const seed = (await ergolib).Mnemonic.to_seed(mnemonic, "");
    const rootSecret = (await ergolib).ExtSecretKey.derive_master(seed);
    let accountId = 0, txForAccountFound = true, accounts = [], unusedAddresses = [];
    const numberOfUnusedAddress = MAX_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT;
    while (txForAccountFound) {
        let index = 0, indexMax = 20, accountAddrressList = [];
        txForAccountFound = false;
        unusedAddresses = [];
        while (index < indexMax) {
            let newPath = (await ergolib).DerivationPath.new(accountId, new Uint32Array([index]));
            const newPubKey = deriveSecretKey(rootSecret, newPath).public_key();
            const newAddress = (await ergolib).NetworkAddress.new((await ergolib).NetworkPrefix.Mainnet, newPubKey.to_address());
            const newAddressStr = newAddress.to_base58();
            //console.log("discoverAddresses", newAddress, accountId, index)
            if (await addressHasTransactions(newAddressStr)) {
                newPath = (await ergolib).DerivationPath.new(accountId, new Uint32Array([index]));
                //console.log("newPath", newPath.toString());
                //console.log("newAddress", newAddress.to_base58());
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
        }
        accountId++;
    }
    if (accounts.length === 0) { // new address
        const mainAddress = {
            id: 0,
            address: await getMainAddress(mnemonic),
            used: false,
        };
        accounts.push({
            id: 0,
            addresses: [mainAddress],
            name: "Account_0",
        });
    }
    console.log(accounts);
    return accounts;
}

export async function testAddrGen(addr) {
    const addrBytes = (await ergolib).Address.from_base58(addr).to_bytes();
    //  static new(secret_key_bytes: Uint8Array, chain_code: Uint8Array, derivation_path: DerivationPath): ExtSecretKey;
    // from_base58(s: string): Address;
    // to_bytes(network_prefix: number): Uint8Array;

    const pubkey = (await ergolib).ExtPubKey.new(addrBytes, [0], (await ergolib).DerivationPath.new(0, new Uint32Array([1])))
    console.log(pubkey.to_address().to_base58())
}

export async function isValidErgAddress(address) {
    try {
        const addrBytes = (await ergolib).Address.from_base58(address).to_bytes();
        console.log("isValidErgAddress addrBytes", addrBytes);
        return true;
    } catch (e) {
        console.log("isValidErgAddress catch", e);
        return false;
    }
}

const findBoxWithToken = (tok,index,array) => {
    
}

// Address list
// Erg amount to send, including the tx fee
// list of tokenId to send
// list of token amount to send
export async function getUtxosForSelectedInputs(inputAddressList, ergAmount, tokens, tokensAmountToSend) {
    const utxos = parseUtxos(await Promise.all(inputAddressList.map(async (address) => {
        return await unspentBoxesFor(address);
    })).then(boxListList => boxListList.flat()));

    // Select boxes to meet tokens selected
    var selectedUtxos = [], unSelectedUtxos = utxos, i = 0;
    while (!hasEnoughSelectedTokens(selectedUtxos, tokens, tokensAmountToSend) && i < 1000) {
        //console.log("getUtxosForSelectedInputs1", selectedUtxos, unSelectedUtxos);
        var boxFound = false, boxIndex = -1;
        for (const j in tokens) {   
            if (tokensAmountToSend[j] > 0 && !boxFound) {
                //console.log("getUtxosForSelectedInputs2", tokens[j].tokenId, tokensAmountToSend[j], boxFound, unSelectedUtxos);
                boxIndex = unSelectedUtxos.findIndex(utxo => utxo.assets.map(tok=>tok.tokenId).includes(tokens[j].tokenId))
                //console.log("getUtxosForSelectedInputs3 boxIndex", boxIndex);
            }
        }
        if (boxIndex > -1) {
            selectedUtxos.push(unSelectedUtxos.splice(boxIndex, 1)[0]);
        }
        i++
    }
    // Select boxes until we meet Erg requirement
    while (BigInt(Math.round(ergAmount*NANOERG_TO_ERG)) > getUtxosListValue(selectedUtxos) && unSelectedUtxos.length > 0) {
        selectedUtxos.push(unSelectedUtxos.shift());
    }
    return selectedUtxos;
}


//
// utxos: utxo list
// requiredTokens: Array of token id selected
// requiredTokenAmounts: Array of token amount (float) synchronized with requiredTokens
function hasEnoughSelectedTokens(utxos, requiredTokens, requiredTokenAmounts) {
    const utxosTokens = getTokenListFromUtxos(utxos);
    const fixedRequiredTokenAmounts = requiredTokenAmounts.map((amount, id) => Math.round(parseFloat(amount.toString()) * Math.pow(10,requiredTokens[id].decimals)))
    for (const i in requiredTokens) {
        if (fixedRequiredTokenAmounts[i] > 0) {
            if (!Object.keys(utxosTokens).includes(requiredTokens[i].tokenId)) {
                //console.log("hasEnoughSelectedTokens 1", Object.keys(utxosTokens), requiredTokens[i].tokenId)
                return false;
            }
            for (const tokenId of Object.keys(utxosTokens)) {
                if (tokenId === requiredTokens[i].tokenId && utxosTokens[tokenId] < fixedRequiredTokenAmounts[i]) {
                    //console.log("hasEnoughSelectedTokens 2", tokenId, requiredTokens[i].tokenId, utxosTokens[tokenId], fixedRequiredTokenAmounts[i]);
                    return false;
                }
            }
        }
    }
    return true;
}

async function getBoxValueAmount(valueInt) {
    return (await ergolib).BoxValue.from_i64((await ergolib).I64.from_str(valueInt.toString()));
}

export async function createTxOutputs(selectedUtxos, sendToAddress, changeAddress, amountToSendFloat, feeFloat, tokens, tokenAmountToSend) {
    const creationHeight = await currentHeight() - 20; // allow some lag between explorer and node
    const amountNano = BigInt(Math.round((amountToSendFloat * NANOERG_TO_ERG)));
    const feeNano =  BigInt(Math.round((feeFloat * NANOERG_TO_ERG)));
    console.log("createTxOutputs", amountNano, feeNano);
    const outputCandidates = (await ergolib).ErgoBoxCandidates.empty();
    // prepare the payment box
    var paymentBox = new (await ergolib).ErgoBoxCandidateBuilder(
        await getBoxValueAmount(amountNano),
        (await ergolib).Contract.pay_to_address((await ergolib).Address.from_base58(sendToAddress)),
        creationHeight);
    for(const i in tokens){
        if(tokenAmountToSend[i] > 0){
            console.log("createTxOutputs tokenAmountToSend", tokenAmountToSend[i])
            paymentBox.add_token((await ergolib).TokenId.from_str(tokens[i].tokenId),
                (await ergolib).TokenAmount.from_i64((await ergolib).I64.from_str(tokenAmountToSend[i].toString())
            ));
        }
    }
    outputCandidates.add(paymentBox.build());

    // prepare the miner fee box
    const feeBox = (await ergolib).ErgoBoxCandidate.new_miner_fee_box(await getBoxValueAmount(feeNano), currentHeight);
    outputCandidates.add(feeBox);

    // prepare the change box
    const changeAmountNano = getUtxosListValue(selectedUtxos) - amountNano - feeNano;
    if (changeAmountNano > 0){
        console.log("createTxOutputs changeAmountNano", getUtxosListValue(selectedUtxos) , amountNano, feeNano, changeAmountNano);
        var changeBox = new (await ergolib).ErgoBoxCandidateBuilder(
            await getBoxValueAmount(changeAmountNano),
            (await ergolib).Contract.pay_to_address((await ergolib).Address.from_base58(changeAddress)),
            creationHeight);
        const inputsTokens = getTokenListFromUtxos(selectedUtxos);
        for(const tokId of Object.keys(inputsTokens)){
            const missingOutputToken = inputsTokens[tokId] - tokenAmountToSend[tokens.findIndex(tok => tok.tokenId === tokId)];
            if (missingOutputToken > 0) {
                changeBox.add_token((await ergolib).TokenId.from_str(tokId),
                    (await ergolib).TokenAmount.from_i64((await ergolib).I64.from_str(missingOutputToken.toString())
                ));
            }
        }
        outputCandidates.add(changeBox.build());
    }

    return outputCandidates;

}

export async function createUnsignedTransaction(selectedUtxos, outputCandidates) {
    console.log("createUnsignedTransaction selectedUtxos",selectedUtxos);
    const inputIds = selectedUtxos.map(utxo => utxo.boxId);
    const unsignedInputArray = inputIds.map((await ergolib).BoxId.from_str).map((await ergolib).UnsignedInput.from_box_id)
    const unsignedInputs = new (await ergolib).UnsignedInputs();
    unsignedInputArray.forEach((i) => unsignedInputs.add(i));
    const unsignedTx = new (await ergolib).UnsignedTransaction(unsignedInputs, new (await ergolib).DataInputs(), outputCandidates);
    console.log("createUnsignedTransaction unsignedTx",unsignedTx.to_json());
    return unsignedTx;
}