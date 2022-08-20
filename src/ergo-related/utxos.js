import { TX_FEE_ERGO_TREE, VERIFIED_TOKENS } from "../utils/constants";
import { ls_slim_flush, ls_slim_get, ls_slim_set } from "../utils/utils";
import { getUnconfirmedTransactionsForAddressList } from "../utils/walletUtils";
import { boxByBoxId, currentHeight, getTokenBoxV1, unspentBoxesForV1 } from "./explorer";
import { boxByIdMempool } from "./node";
import { decodeString, encodeContract, ergoTreeToAddress } from "./serializer";

/* global BigInt */

export function parseUtxo(json, addExtention = true, mode = 'input') {
    if (json === undefined) {
        return {};
    }
    var res = {};
    if (mode === 'input') {
        if ("id" in json) {
            res["boxId"] = json.id;
        } else {
            res["boxId"] = json.boxId;
        }
    }
    res["value"] = json.value.toString();
    res["ergoTree"] = json.ergoTree;
    if (Array.isArray(json.assets)) {
        res["assets"] = json.assets.map(asset => ({
            tokenId: asset.tokenId,
            amount: asset.amount.toString(),
            name: asset.name ?? '',
            decimals: asset.decimals ?? 0,
        }));
    } else {
        res["assets"] = [];
    }
    if (isDict(json["additionalRegisters"])) {
        res["additionalRegisters"] = parseAdditionalRegisters(json.additionalRegisters);
    } else {
        res["additionalRegisters"] = {};
    }

    res["creationHeight"] = json.creationHeight;

    if ("address" in json) {
        res["address"] = json.address;
    }

    if (mode === 'input') {
        if ("txId" in json) {
            res["transactionId"] = json.txId;
        } else {
            res["transactionId"] = json.transactionId;
        }
        res["index"] = json.index;
    }
    if (addExtention) {
        res["extension"] = {};
    }
    return res;
}

export function parseUtxos(utxos, addExtention, mode = 'input') {
    var utxosFixed = [];
    for (const i in utxos) {
        utxosFixed.push(parseUtxo(utxos[i], addExtention, mode))
    }
    return utxosFixed;
}

export async function enrichUtxos(utxos, addExtension = false) {
    console.log("enrichUtxos utxos", utxos);
    var utxosFixed = [];
    await ls_slim_flush();
    var cache_newBoxes = await ls_slim_get('cache_newBoxes') ?? [];
    var cache_spentBoxes = await ls_slim_get('cache_spentBoxes') ?? [];

    for (const i in utxos) {
        var newBox = {};
        var key = "boxId";
        if ("id" in utxos[i]) {
            key = "id";
        }
        var box = {};
        if (cache_newBoxes.map(b => b.boxId).includes(utxos[i][key])) {
            box = cache_newBoxes.find(b => b.boxId === utxos[i][key]);
        } else if (cache_spentBoxes.map(b => b.boxId).includes(utxos[i][key])) {
            box = cache_spentBoxes.find(b => b.boxId === utxos[i][key]);
        } else {
            box = await boxByIdMempool(utxos[i][key]);

            //console.log("enrichUtxos box", box);
            if(!box && utxos[i]["address"]) {
                const [spentBoxes, newBoxes] = getSpentAndUnspentBoxesFromMempool([utxos[i]["address"]]);
                box = newBoxes.find(box => box.boxId === utxos[i][key]);
            }
        }
        //console.log("enrichUtxos1", utxos[i][key]);
        var newAssets = []
        if (Array.isArray(box.assets)) {
            for (var token of box.assets) {
                var newToken = { ...token }
                //console.log("enrichUtxos2", token.tokenId);
                const tokenDesc = await getTokenBoxV1(token.tokenId);
                //console.log("enrichUtxos2_1", tokenDesc);
                newToken["name"] = tokenDesc.name;
                newToken["decimals"] = tokenDesc.decimals;
                newAssets.push(newToken)
            }
        }
        
        for (const key of Object.keys(box)) {
            if (key === "assets") {
                newBox[key] = newAssets;
            } else {
                newBox[key] = box[key];
            }
        }
        //console.log("enrichUtxos3 newBox", newBox)
        try {
            const addr = await ergoTreeToAddress(newBox["ergoTree"]);
            //console.log("enrichUtxos4 addr", addr)
            if (!("address" in utxos[i])) {
                newBox["address"] = addr;
            }
        } catch (e) {
            console.log(e)
        }
        if (addExtension && !Object.keys(newBox).includes("extension")) {
            newBox["extension"] = {};
        }
        utxosFixed.push(newBox);
    }
    //console.log("enrichUtxos5", utxosFixed)
    return utxosFixed;
}

function parseAdditionalRegisters(json) {
    var registterOut = {};
    Object.entries(json).forEach(([key, value]) => {
        if (isDict(value)) {
            registterOut[key] = value["serializedValue"];
        } else {
            registterOut[key] = value;
        }
    });
    return registterOut;
}

function parseInput(input) {
    var res = {}
    if ("id" in input) {
        res["boxId"] = input.id;
    } else {
        res["boxId"] = input.boxId;
    }
    if ("extension" in input) {
        res["extension"] = input.extension;
    } else {
        res["extension"] = {};
    }
    return res;
}
function parseInputs(inputs) {
    return inputs.map(input => parseInput(input));
}

export function parseUnsignedTx(json) {
    var res = {};
    res["inputs"] = parseInputs(json.inputs);
    res["dataInputs"] = parseInputs(json.dataInputs);
    res["outputs"] = parseUtxos(json.outputs, false, 'output');
    console.log("parseUnsignedTx", json, res)
    return res;
}

function parseSignedInputSwagger(input) {
    console.log("parseSignedInputSwagger", input);
    return {
        boxId: input.id,
        spendingProof: input.spendingProof,
    }
}
function parseSignedInputsSwagger(inputs) {
    return inputs.map(input => parseSignedInputSwagger(input));
}

export function parseSignedTx(tx) {
    var res = {};
    res["dataInputs"] = parseSignedInputsSwagger(tx.dataInputs);
    res["inputs"] = parseSignedInputsSwagger(tx.inputs);
    res["outputs"] = tx.outputs;
    res["id"] = tx.id;
    return res;
}

export function generateSwaggerTx(json) {
    console.log("generateSwaggerTx", json);
    var res = {};

    var newInputs = [];
    for (const input of json.inputs) {
        newInputs.push(parseSignedInputSwagger(input));
    }
    if (json.hasOwnProperty("tx_id")) {
        res["id"] = json.tx_id;
    }
    res["inputs"] = newInputs;
    if (json.hasOwnProperty("data_inputs")) {
        res["dataInputs"] = json.data_inputs;
    } else {
        res["dataInputs"] = json.dataInputs;
    }

    res["outputs"] = json.outputs;
    return res;
}

export function getUtxosListValue(utxos) {
    console.log("getUtxosListValue", utxos);
    return utxos.reduce((acc, utxo) => acc += BigInt(utxo.value), BigInt(0));
}

export function getTokenListFromUtxos(utxos) {
    console.log("getTokenListFromUtxos", utxos);
    var tokenList = {};
    for (const i in utxos) {
        for (const j in utxos[i].assets) {
            if (utxos[i].assets[j].tokenId in tokenList) {
                tokenList[utxos[i].assets[j].tokenId] = BigInt(tokenList[utxos[i].assets[j].tokenId]) + BigInt(utxos[i].assets[j].amount);
            } else {
                tokenList[utxos[i].assets[j].tokenId] = BigInt(utxos[i].assets[j].amount);
            }
        }
    }
    return tokenList;
}

export function enrichTokenInfoFromUtxos(utxos, tokInfo) {
    //[TOKENID_SIGUSD]: ['SigUSD', "token-sigusd.svg", 2],
    console.log("enrichTokenInfoFromUtxos", utxos);
    var tokenInfo = { ...tokInfo };
    for (const i in utxos) {
        for (const j in utxos[i].assets) {
            if (!Object.keys(tokenInfo).includes()) {
                if (Object.keys(VERIFIED_TOKENS).includes(utxos[i].assets[j].tokenId)) {
                    tokenInfo[utxos[i].assets[j].tokenId] = VERIFIED_TOKENS[utxos[i].assets[j].tokenId];
                } else {
                    tokenInfo[utxos[i].assets[j].tokenId] = [utxos[i].assets[j].name, '', utxos[i].assets[j].decimals];
                }
            }
        }
    }
    return tokenInfo;
}

export function getMissingErg(inputs, outputs) {
    const amountIn = getUtxosListValue(inputs);
    const amountOut = getUtxosListValue(outputs);
    if (amountIn >= amountOut) {
        return amountIn - amountOut;
    } else {
        return BigInt(0);
    }
}

export function getMissingTokens(inputs, outputs) {
    const tokensIn = getTokenListFromUtxos(inputs);
    const tokensOut = getTokenListFromUtxos(outputs);
    var res = {};
    console.log("getMissingTokens", tokensIn, tokensOut);
    if (tokensIn !== {}) {
        for (const token in tokensIn) {
            if (tokensOut !== {} && token in tokensOut) {
                if (tokensIn[token] - tokensOut[token] > 0) {
                    res[token] = tokensIn[token] - tokensOut[token];
                }
            } else {
                res[token] = tokensIn[token];
            }
        }
    }
    console.log("getMissingTokens", tokensIn, tokensOut, res);
    return res;
}

export function buildTokenList(tokens) {
    var res = [];
    if (tokens !== {}) {
        for (const i in tokens) {
            res.push({ "tokenId": i, "amount": tokens[i].toString() });
        }
    };
    return res;
}

export async function buildBalanceBox(inputs, outputs, address) {
    const missingErgs = getMissingErg(inputs, outputs).toString();
    const contract = await encodeContract(address);
    const tokens = buildTokenList(getMissingTokens(inputs, outputs));
    const height = await currentHeight();
    console.log("buildBalanceBox", missingErgs, contract, tokens, height)

    return {
        value: missingErgs,
        ergoTree: contract,
        assets: tokens,
        additionalRegisters: {},
        creationHeight: height,
        extension: {}
    };
}

function isDict(v) {
    return typeof v === 'object' && v !== null && !(v instanceof Array) && !(v instanceof Date);
}

async function getUtxoContentForAddressList(utxos, addressList, input0BoxId = "") {
    var value = BigInt(0), tokens = [], fee = 0;
    //console.log("getUtxoContentForAddressList_0", utxos, addressList)
    const cache_newBoxes = await ls_slim_get('cache_newBoxes') ?? [];
    //console.log("getUtxoContentForAddressList cache_newBoxes", cache_newBoxes);
    for (var utxo of utxos) {
        if ("id" in utxo) {
            utxo["boxId"] = utxo.id;
            delete utxo["id"];
        }
        if (cache_newBoxes.map(b => b.boxId).includes(utxo.boxId)) {
            utxo = cache_newBoxes.find(b => b.boxId === utxo.boxId);
            //console.log("getUtxoContentForAddressList UTXO new box found in cache", utxo);
        }
        if (!("address" in utxo)) {
            if (!("assets" in utxo)) {
                utxo = await boxByBoxId(utxo.boxId);
                //console.log("getUtxoContentForAddressList_1 enriched", utxo)
            }
            if (!("address" in utxo) && "ergoTree" in utxo) {
                try {
                    //console.log("getUtxoContentForAddressList_2 address", utxo);
                    utxo["address"] = await ergoTreeToAddress(utxo.ergoTree);
                    //console.log("getUtxoContentForAddressList_22 address", utxo);
                } catch (e) {
                    console.log(e);
                }
            }
        }
        if (utxo.ergoTree === TX_FEE_ERGO_TREE) {
            fee = utxo.value;
            console.log('tx fee found', fee);
        }
        if (addressList.includes(utxo.address)) {
            //console.log("getUtxoContentForAddressList_3")
            value = value + BigInt(utxo.value.toString());
            if (!("assets" in utxo)) {
                utxo.assets = (await boxByBoxId(utxo.id)).assets;
            }
            if (!(Array.isArray(utxo.assets))) {
                utxo.assets = [];
            }
            for (var token of utxo.assets) {
                //console.log("getUtxoContentForAddressList_4", token.name)
                if (token.tokenId === input0BoxId && (token.name === null || token.name === undefined)) { //minted token
                    //console.log("getUtxoContentForAddressList_4 minted token", )
                    if (Object.keys(utxo).includes("additionalRegisters")) {
                        if (Object.keys(utxo.additionalRegisters).includes("R4")) {
                            token.name = await decodeString(utxo.additionalRegisters.R4);
                        }
                        if (Object.keys(utxo.additionalRegisters).includes("R6")) {
                            token.decimals = await decodeString(utxo.additionalRegisters.R6);
                        }
                    }
                }

                if (tokens.map(tok => tok.tokenId).includes(token.tokenId)) {
                    const index = tokens.findIndex(t => t.tokenId === token.tokenId);
                    const tokAmount = BigInt(token.amount.toString());
                    //console.log("getUtxoContentForAddressList_4", token.tokenId, tokens[index].amount, tokAmount)
                    tokens[index].amount = BigInt(tokens[index].amount) + tokAmount;
                } else {
                    tokens.push({ ...token });
                }
            }
        }
    }
    return { value: value, tokens: tokens, fee: fee };
}

export async function getUtxoBalanceForAddressList(inputs, outputs, addressList) {
    //console.log("getUtxoBalanceForAddressList params", inputs, outputs, addressList);
    const inputBal = await getUtxoContentForAddressList(inputs, addressList);
    var input0BoxId = "";
    if (inputs && inputs[0] && inputs[0].boxId) {
        input0BoxId = inputs[0].boxId ?? "";
    }
    const outputBal = await getUtxoContentForAddressList(outputs, addressList, input0BoxId);
    //console.log("getUtxoBalanceForAddressList", inputBal, outputBal, addressList);
    return buildBalance(inputBal, outputBal);
}

function buildBalance(inputBal, outputBal) {
    //console.log("buildBalance1", inputBal, outputBal)
    const balValue = BigInt(outputBal.value.toString()) - BigInt(inputBal.value.toString());
    var balTokens = [];
    const tokenList = [...new Set([inputBal.tokens.map(tok => tok.tokenId), outputBal.tokens.map(tok => tok.tokenId)].flat())];
    for (const tokId of tokenList) {

        var tokAmount = BigInt(0), decimals = 0, tokenName = '';
        for (const outToken of outputBal.tokens) {
            if (outToken.tokenId === tokId) {
                tokAmount = tokAmount + BigInt(outToken.amount.toString());
                decimals = outToken.decimals;
                tokenName = outToken.name;
            }
        }
        for (const inToken of inputBal.tokens) {
            if (inToken.tokenId === tokId) {
                tokAmount = tokAmount - BigInt(inToken.amount.toString());
                decimals = inToken.decimals;
                tokenName = inToken.name;
            }
        }
        //console.log("buildBalance2",tokenName,tokAmount,decimals)
        if (tokAmount !== BigInt(0)) {
            balTokens.push({
                tokenId: tokId,
                amount: tokAmount,
                decimals: decimals,
                name: tokenName,
            });
        }
    }
    //console.log("buildBalance2", inputBal, outputBal, balValue, balTokens);
    return { value: balValue, tokens: balTokens, fee: outputBal.fee };
}

export async function getUnspentBoxesForAddressList(addressList) {
    const boxList = await Promise.all(addressList.map(async (address) => {
        const addressBoxes = await unspentBoxesForV1(address);
        //console.log("getUnspentBoxesForAddressList", address, addressBoxes)
        return addressBoxes;
    }));
    return boxList.flat().sort(function (a, b) {
        return a.globalIndex - b.globalIndex;
    });
}

export async function getSpentAndUnspentBoxesFromMempool(addressList) {
    var unconfirmedTxs = (await getUnconfirmedTransactionsForAddressList(addressList, false))
        .map(tx => tx.transactions)
        .flat();
    //console.log("getSpentAndUnspentBoxesFromMempool", unconfirmedTxs)
    var spentBoxes = [];
    var newBoxes = [];
    if (unconfirmedTxs.length > 0) {
        spentBoxes = unconfirmedTxs.map(tx => tx.inputs).flat();
        for (const i in spentBoxes) {
            spentBoxes[i].boxId = spentBoxes[i].id
        }
        newBoxes = unconfirmedTxs.map(tx => tx.outputs).flat().filter(box => addressList.includes(box.address));
    }
    await ls_slim_flush();
    if (newBoxes.length > 0) {
        for (const i in newBoxes) {
            newBoxes[i]["boxId"] = newBoxes[i].id;
            delete newBoxes[i].id;
        }
        var cache_newBoxes = await ls_slim_get('cache_newBoxes') ?? [];
        ls_slim_set('cache_newBoxes', newBoxes.concat(cache_newBoxes), { ttl: 600 });
    }
    //console.log("getSpentAndUnspentBoxesFromMempool", spentBoxes, newBoxes)
    return [spentBoxes, newBoxes];
}
