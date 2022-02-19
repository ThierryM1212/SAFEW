import { boxByBoxId, currentHeight, getTokenBoxV1, unspentBoxesForV1 } from "./explorer";
import { encodeContract, ergoTreeToAddress } from "./serializer";

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
    var utxosFixed = [];

    for (const i in utxos) {
        var key = "boxId";
        if ("id" in utxos[i]) {
            key = "id";
        }
        //console.log("enrichUtxos1", utxos[i][key]);
        var box = await boxByBoxId(utxos[i][key]);
        var newAssets = []
        for (var token of box.assets) {
            var newToken = { ...token }
            //console.log("enrichUtxos2", token.tokenId);
            const tokenDesc = await getTokenBoxV1(token.tokenId);
            newToken["name"] = tokenDesc.name;
            newToken["decimals"] = tokenDesc.decimals;
            newAssets.push(newToken)
        }
        var newBox = {};
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
        } catch(e) {
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
    console.log("parseSignedInputSwagger",input);
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
    return utxos.reduce((acc, utxo) => acc += BigInt(utxo.value), BigInt(0));
}

export function getTokenListFromUtxos(utxos) {
    var tokenList = {};
    for (const i in utxos) {
        for (const j in utxos[i].assets) {
            if (utxos[i].assets[j].tokenId in tokenList) {
                tokenList[utxos[i].assets[j].tokenId] = parseInt(tokenList[utxos[i].assets[j].tokenId]) + parseInt(utxos[i].assets[j].amount);
            } else {
                tokenList[utxos[i].assets[j].tokenId] = parseInt(utxos[i].assets[j].amount);
            }
        }
    }
    return tokenList;
}

export function getMissingErg(inputs, outputs) {
    const amountIn = getUtxosListValue(inputs);
    const amountOut = getUtxosListValue(outputs);
    if (amountIn >= amountOut) {
        return amountIn - amountOut;
    } else {
        return 0;
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

async function getUtxoContentForAddressList(utxos, addressList) {
    var value = 0, tokens = [];
    //console.log("getUtxoContentForAddressList_0", utxos, addressList)
    for (var utxo of utxos) {
        if (!("address" in utxo)) {
            if (!("assets" in utxo)) {
                if ("id" in utxo) {
                    utxo = await boxByBoxId(utxo.id);
                } else {
                    utxo = await boxByBoxId(utxo.boxId);
                }
                //console.log("getUtxoContentForAddressList_1 enriched", utxo)
            }
            try {
                utxo["address"] = await ergoTreeToAddress(utxo.ergoTree);
                //console.log("getUtxoContentForAddressList_2 address", utxo);
            } catch (e) {
                console.log(e);
            }
        }
        if (addressList.includes(utxo.address)) {
            //console.log("getUtxoContentForAddressList_3")
            value = value + parseInt(utxo.value.toString());
            if (!("assets" in utxo)) {
                utxo.assets = (await boxByBoxId(utxo.id)).assets;
            }
            if (!(Array.isArray(utxo.assets))) {
                utxo.assets = [];
            }
            for (const token of utxo.assets) {
                //console.log("getUtxoContentForAddressList_4")
                if (tokens.map(tok => tok.tokenId).includes(token.tokenId)) {
                    const index = tokens.findIndex(t => t.tokenId === token.tokenId);
                    const tokAmount = parseInt(token.amount.toString());
                    //console.log("getUtxoContentForAddressList_4", token.tokenId, tokens[index].amount, tokAmount)
                    tokens[index].amount = tokens[index].amount + tokAmount;
                } else {
                    tokens.push({ ...token });
                }
            }
        }
    }
    return { value: value, tokens: tokens };
}

function getUtxoContentForAddressList2(utxos, addressList) {
    //console.log("getUtxoContentForAddressList_20", utxos, addressList)
    var value = 0, tokens = [];
    for (var utxo of utxos) {
        //console.log("getUtxoContentForAddressList_21", utxo)
        if (addressList.includes(utxo.address)) {
            //console.log("getUtxoContentForAddressList_22", value)
            value += parseInt(utxo.value.toString());
            for (const token of utxo.assets) {
                const index = tokens.findIndex(t => t.tokenId === token.tokenId);
                //console.log("getUtxoContentForAddressList_23", index)
                if (index >= 0) {
                    //console.log("getUtxoContentForAddressList_24", token, tokens[index].amount)
                    const tokAmount = parseInt(token.amount.toString());
                    tokens[index].amount = tokens[index].amount + tokAmount;
                    //console.log("getUtxoContentForAddressList_25", token, tokens[index].amount, tokAmount)
                } else {
                    //console.log("getUtxoContentForAddressList_26", token)
                    tokens.push({ ...token });
                }
            }
        }
    }
    //console.log("getUtxoContentForAddressList_27", { value: value, tokens: tokens })
    return { value: value, tokens: tokens };
}


export async function getUtxoBalanceForAddressList(inputs, outputs, addressList) {
    //console.log("getUtxoBalanceForAddressList params", inputs, outputs, addressList);
    const inputBal = await getUtxoContentForAddressList(inputs, addressList);
    const outputBal = await getUtxoContentForAddressList(outputs, addressList);
    //console.log("getUtxoBalanceForAddressList", inputBal, outputBal, addressList);
    return buildBalance(inputBal, outputBal);
}

export function getUtxoBalanceForAddressList2(inputs, outputs, addressList) {
    //console.log("getUtxoBalanceForAddressList2 params", inputs, outputs, addressList);
    const inputBal = getUtxoContentForAddressList2(inputs, addressList);
    const outputBal = getUtxoContentForAddressList2(outputs, addressList);
    //console.log("getUtxoBalanceForAddressList2", inputBal, outputBal, addressList);
    return buildBalance(inputBal, outputBal);
}

function buildBalance(inputBal, outputBal) {
    //console.log("buildBalance1", inputBal, outputBal)
    const balValue = parseInt(outputBal.value.toString()) - parseInt(inputBal.value.toString());
    var balTokens = [];
    const tokenList = [...new Set([inputBal.tokens.map(tok => tok.tokenId), outputBal.tokens.map(tok => tok.tokenId)].flat())];
    for (const tokId of tokenList) {

        var tokAmount = 0, decimals = 0, tokenName = '';
        for (const outToken of outputBal.tokens) {
            if (outToken.tokenId === tokId) {
                tokAmount += parseInt(outToken.amount.toString());
                decimals = outToken.decimals;
                tokenName = outToken.name;
            }
        }
        for (const inToken of inputBal.tokens) {
            if (inToken.tokenId === tokId) {
                tokAmount -= parseInt(inToken.amount.toString());
                decimals = inToken.decimals;
                tokenName = inToken.name;
            }
        }
        if (tokAmount !== 0) {
            balTokens.push({
                tokenId: tokId,
                amount: tokAmount,
                decimals: decimals,
                name: tokenName,
            });
        }
    }
    //console.log("buildBalance2", inputBal, outputBal, balValue, balTokens);
    return { value: balValue, tokens: balTokens };
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