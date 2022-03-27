
const LS = {
    getAllItems: () => {
        // Immediately return a promise and start asynchronous work
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.get(null, (items) => {
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                // Pass the data retrieved from storage down the promise chain.
                resolve(items);
            });
        });
    },
    getItem: (key) => {
        return new Promise(function(resolve, reject) {
            chrome.storage.local.get(key, function(items) {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError.message);
              } else {
                resolve(items[key]);
              }
            });
          });
    },
    setItem: (key, val) => {
        //console.log("setItem", key, val)
        chrome.storage.local.set({ [key]: val })
    },
    removeItems: keys => chrome.storage.local.remove(keys),
};

/* global chrome BigInt */
chrome.runtime.onInstalled.addListener(() => {
    console.log('SAFEW extension successfully installed!');
    LS.setItem('disclaimerAccepted', false)
    return;
});

// handlers for extension popup response
var connectResponseHandlers = new Map();
var signResponseHandlers = new Map();

// transfer to popup
var transactionsToSign = new Map();
var explorerApi = "https://api.ergoplatform.com/";
var nodeApi = "http://213.239.193.208:9053/";


// Where we will expose all the data we retrieve from storage.sync.
const local_storage = {};
// Asynchronously retrieve data from storage.sync, then cache it.
const initStorageCache = getAllStorageSyncData().then(items => {
    // Copy the data retrieved from storage into storageCache.
    Object.assign(local_storage, items);
});
// Get local storage consts
chrome.browserAction.onClicked.addListener(async (tab) => {
    try {
        await initStorageCache;
    } catch (e) {
        // Handle error that occurred during storage initialization.
    }
    explorerApi = local_storage["explorerAPIAddress"] ?? "https://api.ergoplatform.com/";
    nodeApi = local_storage['nodeAddress'] ?? "http://213.239.193.208:9053/";

    // launch extension
    chrome.tabs.create({
        'url': chrome.runtime.getURL("index.html")
    });
});
// Reads all data out of storage.sync and exposes it via a promise.
//
// Note: Once the Storage API gains promise support, this function
// can be greatly simplified.
function getAllStorageSyncData() {
    // Immediately return a promise and start asynchronous work
    return new Promise((resolve, reject) => {
        // Asynchronously fetch all data from storage.sync.
        chrome.storage.local.get(null, (items) => {
            // Pass any observed errors down the promise chain.
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            // Pass the data retrieved from storage down the promise chain.
            resolve(items);
        });
    });
}

// launch extension popup
function launchPopup(message, sender, param = '') {
    const searchParams = new URLSearchParams();
    console.log("launchPopup sender", sender, location.origin);
    if (Object.keys(sender).includes('origin')) {
        searchParams.set('origin', sender.origin);
    } else {
        const origin = (new URL(sender.url)).origin;
        console.log("launchPopup origin", origin, sender.url)
        searchParams.set('origin', origin);
    }

    //searchParams.set('request', JSON.stringify(message.data));
    var type = message.data.type;
    console.log("launchPopup", message, type, param);
    if (type === 'ergo_api') {
        type = message.data.func;
        searchParams.set('requestId', param);
    }
    console.log("launchPopup", type);
    const URLpopup = 'index.html#' + type + '?' + searchParams.toString()

    // TODO consolidate popup dimensions
    chrome.windows.getLastFocused((focusedWindow) => {
        chrome.windows.create({
            url: URLpopup,
            type: 'popup',
            width: 800,
            height: 700,
            top: focusedWindow.top,
            left: focusedWindow.left + (focusedWindow.width - 375),
            focused: true,
        });
    });
}

// emulate localstorage-slim
const APX = String.fromCharCode(0);
async function ls_slim_flush() {
    const items = await LS.getAllItems();
    return await Promise.all(Object.keys(items).map(async (key) => {
        const item = await LS.getItem(key);
        if (typeof item === 'object' && APX in item && (Date.now() > item.ttl)) {
            LS.removeItems([key]);
        }
    }));
}
async function ls_slim_get(key) {
    const item = await LS.getItem(key);
    const hasTTL = typeof item === 'object' && APX in item;
    if (!hasTTL) {
        return item;
    }
    if (Date.now() > item.ttl) {
        LS.removeItems([key]);
        return null;
    }
    return item[APX];
}
async function ls_slim_set(key, value, ttl) {
    try {
        let val = ttl && ttl > 0 ? { [APX]: value, ttl: Date.now() + ttl * 1e3 } : value;
        await LS.setItem(key, val);
    } catch (e) {
        return false;
    }
}

function getConnectedWalletName(url) {
    const connectedSites = local_storage['connectedSites'] ?? {};
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
        const walletList = local_storage['walletList'] ?? [];
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
                if (typeof body === 'object') {
                    return { result: true, data: body.id };
                } else {
                    return { result: true, data: body };
                }

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
    try {
        const res = await post(nodeApi + url, body)
        return { detail: res };
    } catch (err) {
        console.log("postRequest", err);
        return { detail: { result: false, data: err.toString() } }
    }
}
async function postTxMempool(tx) {
    try {
        const res = await post(explorerApi + 'api/v1/mempool/transactions/submit', tx);
        console.log("postTxMempool", tx, res);
        return { detail: res };
    } catch (err) {
        console.log("postTxMempool", err);
        return { detail: { result: false, data: err.toString() } }
    }
}

async function sendTx(tx) {
    //return await postRequest("transactions", tx);
    return await postTxMempool(tx);
}
async function getRequest(url, ttl = 0) {
    return get(explorerApi + 'api/v0' + url, '').then(res => {
        return { data: res };
    });
}
async function getRequestV1(url) {
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
    var boxList = await Promise.all(addressList.map(async (address) => {
        const addressBoxes = await unspentBoxesForV1(address);
        return addressBoxes;
    }));
    var [spentBoxes, newBoxes] = await getSpentAndUnspentBoxesFromMempool(addressList);
    const spentInputBoxIds = spentBoxes.map(box => box.boxId);
    const adjustedUtxos = newBoxes.concat(boxList).flat().filter(box => !spentInputBoxIds.includes(box.boxId));
    console.log("getUnspentBoxesForAddressList", spentBoxes, newBoxes, spentInputBoxIds, adjustedUtxos);
    if (spentBoxes && Array.isArray(spentBoxes) && spentBoxes.length > 0) {
        memPoolTransaction = true;
        var cache_spentBoxes = await ls_slim_get('cache_spentBoxes') ?? [];
        await ls_slim_set('cache_spentBoxes', boxList.filter(b => spentInputBoxIds.includes(b.boxId)).concat(cache_spentBoxes).flat(), 600);
    }

    return adjustedUtxos.flat().sort(function (a, b) {
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
async function getUnconfirmedTxsFor(addr) {
    return getRequest(`/transactions/unconfirmed/byAddress/${addr}`)
        .then((res) => res.data)
        .then((res) => res.items);
}
async function getUnconfirmedTransactionsForAddressList(addressList) {
    const addressUnConfirmedTransactionsList = await Promise.all(addressList.map(async (address) => {
        var addressTransactions = await getUnconfirmedTxsFor(address);
        return addressTransactions;
    }));
    return addressUnConfirmedTransactionsList.flat();
}
async function getSpentAndUnspentBoxesFromMempool(addressList) {
    var unconfirmedTxs = (await getUnconfirmedTransactionsForAddressList(addressList, false));
    var spentBoxes = [];
    var newBoxes = [];
    if (unconfirmedTxs.length > 0) {
        spentBoxes = unconfirmedTxs.map(tx => tx.inputs).flat();
        for (const i in spentBoxes) {
            spentBoxes[i].boxId = spentBoxes[i].id
        }
        newBoxes = unconfirmedTxs.map(tx => tx.outputs).flat().filter(box => addressList.includes(box.address));
    }
    ls_slim_flush();
    if (newBoxes.length > 0) {
        for (const i in newBoxes) {
            newBoxes[i]["boxId"] = newBoxes[i].id;
            delete newBoxes[i].id;
        }
        var cache_newBoxes = (await ls_slim_get('cache_newBoxes')) ?? [];
        await ls_slim_set('cache_newBoxes', newBoxes.concat(cache_newBoxes), 600);
        //console.log('getUtxosForSelectedInputs cache_newBoxes', ls.get('cache_newBoxes'))
    }
    console.log("getSpentAndUnspentBoxesFromMempool", spentBoxes, newBoxes)
    return [spentBoxes, newBoxes];
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

        if (message.data && message.data.type === "ergopay_request") {
            console.log("ergopay_request", message.data);


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
                        if (amount) {
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
                //console.log("sign_tx", message.data)
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
                //console.log("submit_tx", message.data.data);
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
        //console.log("background safew_extension_background_channel", message, connectResponseHandlers);
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
