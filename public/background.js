/* global chrome BigInt */
chrome.runtime.onInstalled.addListener(() => {
    console.log('SAFEW extension successfully installed!');
    localStorage.setItem('disclaimerAccepted', "false")
    return;
});

// launch extension
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.create({
        'url': chrome.runtime.getURL("index.html")
    });
});

// handlers for extension popup response
var connectResponseHandlers = new Map();
var signResponseHandlers = new Map();

// transfer to popup
var transactionsToSign = new Map();

// launch extension popup
function launchPopup(message, sender, param = '') {
    const searchParams = new URLSearchParams();
    searchParams.set('origin', sender.origin);
    //searchParams.set('request', JSON.stringify(message.data));
    var type = message.data.type;
    console.log("launchPopup", message, type, param);
    if (type === 'ergo_api') {
        type = message.data.func;
        searchParams.set('requestId', param);
    }
    console.log("launchPopup", type);
    const URL = 'index.html#' + type + '?' + searchParams.toString()

    // TODO consolidate popup dimensions
    chrome.windows.getLastFocused((focusedWindow) => {
        chrome.windows.create({
            url: URL,
            type: 'popup',
            width: 800,
            height: 700,
            top: focusedWindow.top,
            left: focusedWindow.left + (focusedWindow.width - 375),
            setSelfAsOpener: true,
            focused: true,
        });
    });
}

function getConnectedWalletName(url) {
    const connectedSites = JSON.parse(localStorage.getItem('connectedSites')) ?? {};
    for (const walletName of Object.keys(connectedSites)) {
        if (connectedSites[walletName].includes(url)) {
            return walletName;
        }
    }
    return null;
}
function getConnectedWalletByURL(url) {
    const walletName = getConnectedWalletName(url);
    if (walletName !== null) {
        const walletList = JSON.parse(localStorage.getItem('walletList')) ?? [];
        for (const wallet of walletList) {
            if (wallet.name === walletName) {
                return wallet;
            }
        }
    }
    return null;
}
async function get(url, apiKey = '') {
    const result = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            api_key: apiKey,
        }
    }).then(res => res.json());
    return result;
}
async function post(url, body = {}, apiKey = '') {

    return fetch(url, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'mode': 'cors',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        },
        body: JSON.stringify(body)
    }).then(response => Promise.all([response.ok, response.json()]))
        .then(([responseOk, body]) => {
            if (responseOk) {
                console.log("post1", body, responseOk)
                return { result: true, data: body };
            } else {
                return { result: false, data: body.detail };
            }
        })
        .catch(error => {
            console.log("post4", error);
            // catches error case and if fetch itself rejects
        });
}
async function postRequest(url, body = {}, apiKey = '') {
    const nodeApi = localStorage.getItem('nodeAddress') ?? "http://213.239.193.208:9053/";
    try {
        const res = await post(nodeApi + url, body)
        return { detail: res };
    } catch (err) {
        console.log("postRequest", err);
        return { detail: { result: false, data: err.toString() } }
    }
}
async function sendTx(tx) {
    return await postRequest("transactions", tx);
}
async function getRequestV1(url) {
    const explorerApi = localStorage.getItem("explorerAPIAddress") ?? "https://api.ergoplatform.com/";
    const res = await get(explorerApi + 'api/v1' + url);
    return { data: res };
}
async function getBalanceConfirmedForAddress(addr) {
    const res = await getRequestV1(`/addresses/${addr}/balance/confirmed`);
    return res.data;
}
async function unspentBoxesForV1(address) {
    const res = await getRequestV1(`/boxes/unspent/byAddress/${address}`);
    return res.data.items;
}
async function getUnspentBoxesForAddressList(addressList) {
    const boxList = await Promise.all(addressList.map(async (address) => {
        const addressBoxes = await unspentBoxesForV1(address);
        //console.log("getUnspentBoxesForAddressList", address, addressBoxes)
        return addressBoxes;
    }));
    return boxList.flat().sort(function (a, b) {
        return a.globalIndex - b.globalIndex;
    });
}
async function getAddressListContent(addressList) {
    const addressContentList = await Promise.all(addressList.map(async (address) => {
        const addressContent = await getBalanceConfirmedForAddress(address);
        //console.log("getAddressListContent", address, addressContent, JSON.stringify(addressContent))
        return { address: address, content: addressContent };
    }));
    return addressContentList;
}
function getUtxosListValue(utxos) {
    return utxos.reduce((acc, utxo) => acc += BigInt(utxo.nanoErgs), BigInt(0));
}
function getTokenListFromUtxos(utxos) {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("background addListener", message, sender, sendResponse);
    if (message.channel === 'safew_contentscript_background_channel') {
        if (message.data && message.data.type === "connect") {
            const walletFound = (getConnectedWalletName(message.data.url) !== null);
            if (walletFound) {
                sendResponse({
                    type: "connect_response",
                    result: true,
                    url: message.data.url
                });
                return;
            }
            launchPopup(message, sender, sendResponse);
            connectResponseHandlers.set(message.data.url, sendResponse);
            return true;
        }

        if (message.data && message.data.type === "ergo_api") {
            const wallet = getConnectedWalletByURL(message.data.url);
            const addressList = wallet.accounts.map(account => account.addresses).flat();
            console.log("background ergo_api", wallet, addressList);
            if (message.data.func === "ping") {
                sendResponse({
                    type: "ergo_api_response",
                    result: true,
                    data: true,
                    requestId: message.data.requestId,
                });
            }
            if (message.data.func === "get_used_addresses") {
                sendResponse({
                    type: "ergo_api_response",
                    result: true,
                    data: addressList.filter(addr => addr.used).map(addr => addr.address),
                    requestId: message.data.requestId,
                });
            }
            if (message.data.func === "get_unused_addresses") {
                sendResponse({
                    type: "ergo_api_response",
                    result: true,
                    data: addressList.filter(addr => !addr.used).map(addr => addr.address),
                    requestId: message.data.requestId,
                });
            }
            if (message.data.func === "get_change_address") {
                sendResponse({
                    type: "ergo_api_response",
                    result: true,
                    data: wallet.changeAddress,
                    requestId: message.data.requestId,
                });
            }
            if (message.data.func === "get_balance") {
                getAddressListContent(addressList.map(addr => addr.address))
                    .then(addressContentList => {
                        //console.log("addressContentList", addressContentList.map(addr => addr.content));
                        var res = 0;
                        if (message.data.data && message.data.data[0]) {
                            if (message.data.data[0] === 'ERG') {
                                res = addressContentList.map(addr => addr.content).reduce((acc, utxo) => acc += BigInt(utxo.nanoErgs), BigInt(0));
                            } else {
                                const tokenId = message.data.data[0];
                                const tokenList = addressContentList.map(addr => addr.content)
                                    .map(content => content.tokens.filter(token => token.tokenId === tokenId))
                                    .flat();
                                res = tokenList.reduce((acc, token) => acc += BigInt(token.amount), BigInt(0));
                            }
                        }
                        sendResponse({
                            type: "ergo_api_response",
                            result: true,
                            data: res.toString(),
                            requestId: message.data.requestId,
                        });
                    })
                return true;
            }
            if (message.data.func === "get_utxos") {
                getUnspentBoxesForAddressList(addressList.map(addr => addr.address))
                    .then(addressBoxes => {
                        const [amount, token_id, paginate] = message.data.data;
                        var selectedUtxos = [], unSelectedUtxos = addressBoxes, amountSelected = BigInt(0);
                        if (amount !== null) {
                            const amountInt = BigInt(amount.toString());
                            if (token_id === 'ERG') {
                                while (amountSelected < amountInt && unSelectedUtxos.length > 0) {
                                    selectedUtxos.push(unSelectedUtxos.shift());
                                    amountSelected = selectedUtxos.reduce((acc, utxo) => acc += BigInt(utxo.value), BigInt(0));
                                }
                                if (amountSelected < amountInt) {
                                    selectedUtxos = undefined;
                                }
                            } else {
                                unSelectedUtxos = unSelectedUtxos.filter(utxo => utxo.assets.map(tok => tok.tokenId).includes(token_id));
                                while (amountSelected < amountInt && unSelectedUtxos.length > 0) {
                                    selectedUtxos.push(unSelectedUtxos.shift());
                                    amountSelected = selectedUtxos.reduce((acc, utxo) => acc += BigInt(utxo.assets.find(tok => tok.tokenId === token_id).amount), BigInt(0));
                                }
                                if (amountSelected < amountInt) {
                                    selectedUtxos = undefined;
                                }
                            }
                        } else { // all utxos
                            selectedUtxos = addressBoxes;
                        }
                        sendResponse({
                            type: "ergo_api_response",
                            result: true,
                            data: selectedUtxos,
                            requestId: message.data.requestId,
                        });
                    })
                return true;
            }
            if (message.data.func === "sign_tx") {
                console.log("sign_tx", message.data)
                const walletFound = (getConnectedWalletName(message.data.url) !== null);
                if (!walletFound) { // No wallet
                    sendResponse({
                        type: "ergo_api_response",
                        result: false,
                        url: message.data.url,
                        data: "Connected wallet not found ?!?",
                        requestId: message.data.requestId,
                    });
                    return;
                }
                if (message.data.data && Array.isArray(message.data.data) && message.data.data.length === 1) {
                    if (message.data.data[0].inputs && message.data.data[0].dataInputs && message.data.data[0].outputs) {
                        transactionsToSign.set(message.data.requestId, message.data.data[0]);
                        signResponseHandlers.set(message.data.requestId, sendResponse);
                        launchPopup(message, sender, message.data.requestId);
                    } else {
                        sendResponse({ // Not a transaction
                            type: "ergo_api_response",
                            result: false,
                            url: message.data.url,
                            data: "Incorrect transaction : inputs, dataInputs or outputs missing",
                            requestId: message.data.requestId,
                        });
                    }
                } else {
                    sendResponse({ // Not 1 param
                        type: "ergo_api_response",
                        result: false,
                        url: message.data.url,
                        data: "Incorrect number of parameter, sign_tx(transaction)",
                        requestId: message.data.requestId,
                    });
                }
                return true;
            }
            if (message.data.func === "submit_tx") {
                // TO DO minimal check inputs
                console.log("submit_tx", message.data.data);
                sendTx(message.data.data[0]).then(res => {
                    console.log("submit_tx response", res);
                    sendResponse({
                        type: "ergo_api_response",
                        result: res.detail.result,
                        url: message.data.url,
                        data: res.detail.data,
                        requestId: message.data.requestId,
                    });
                }).catch(e => {
                    sendResponse({
                        type: "ergo_api_response",
                        result: false,
                        url: message.data.url,
                        data: e.toString(),
                        requestId: message.data.requestId,
                    });
                })
                return true;
            }
        }

    } else if (message.channel === 'safew_extension_background_channel') {
        console.log("background safew_extension_background_channel", message, connectResponseHandlers);
        if (message.data && message.data.type && message.data.type === "connect_response") {
            const responseHandler = connectResponseHandlers.get(message.data.url);
            connectResponseHandlers.delete(message.data.url);
            responseHandler(message.data);
        }
        if (message.data && message.data.type && message.data.type === "ergo_api_response") {
            const responseHandler = signResponseHandlers.get(message.data.requestId);
            signResponseHandlers.delete(message.data.requestId);
            responseHandler(message.data);
        }
    }

});
