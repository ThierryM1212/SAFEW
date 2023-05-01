import JSONBigInt from 'json-bigint';


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
        return new Promise(function (resolve, reject) {
            chrome.storage.local.get(key, function (items) {
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
    console.log('[SAFEW] Extension successfully installed!');
    LS.setItem('disclaimerAccepted', false)
    return;
});

// handlers for extension popup response
var connectResponseHandlers = new Map();
var signResponseHandlers = new Map();

var nodeApi = "http://213.239.193.208:9053/";
const SHORT_CACHE = 15, LONG_CACHE = 86400;


// Where we will expose all the data we retrieve from storage.sync.
var local_storage = {};
// Asynchronously retrieve data from storage.sync, then cache it.
const initStorageCache = getAllStorageSyncData().then(items => {
    // Copy the data retrieved from storage into storageCache.
    Object.assign(local_storage, items);
});
chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        //console.log(
        //    `Storage key "${key}" in namespace "${namespace}" changed.`,
        //    `Old value was "${oldValue}", new value is "${newValue}".`
        //);
        local_storage[key] = newValue;
    }
    nodeApi = local_storage['nodeAddress'] ?? "http://213.239.193.208:9053/";
});

var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
if (isFirefox) {
    chrome.browserAction.onClicked.addListener(handleBrowserActionClicked)
} else {
    chrome.action.onClicked.addListener(handleBrowserActionClicked)
}

async function handleBrowserActionClicked() {
    try {
        await initStorageCache;
    } catch (e) {
        // Handle error that occurred during storage initialization.
    }
    nodeApi = local_storage['nodeAddress'] ?? "http://213.239.193.208:9053/";

    chrome.tabs.create({
        'url': chrome.runtime.getURL("index.html")
    });
}
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
    //console.log("launchPopup sender", sender, location.origin);
    if (Object.keys(sender).includes('origin')) {
        searchParams.set('origin', sender.origin);
    } else {
        const origin = (new URL(sender.url)).origin;
        //console.log("launchPopup origin", origin, sender.url)
        searchParams.set('origin', origin);
    }
    searchParams.set('tabId', sender.tab.id);

    //searchParams.set('request', JSON.stringify(message.data));
    var type = message.data.type;
    //console.log("launchPopup", message, type, param);
    if (type === 'ergo_api') {
        type = message.data.func;
        searchParams.set('requestId', param);
    }
    //console.log("launchPopup", type);
    const URLpopup = 'index.html#' + type + '?' + searchParams.toString()

    // TODO consolidate popup dimensions
    chrome.windows.getLastFocused((focusedWindow) => {
        chrome.windows.create({
            url: URLpopup,
            type: 'popup',
            width: Math.ceil(focusedWindow.width / 2),
            height: focusedWindow.height - Math.floor(focusedWindow.height / 3),
            top: focusedWindow.top,
            left: focusedWindow.left + (focusedWindow.width - Math.floor(focusedWindow.width / 2)),
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
function ls_slim_set(key, value, ttl) {
    try {
        let val = ttl && ttl > 0 ? { [APX]: value, ttl: Date.now() + ttl * 1e3 } : value;
        LS.setItem(key, val);
    } catch (e) {
        return false;
    }
}

function getConnectedWalletName(url) {
    const connectedSites = local_storage['connectedSites'] ?? {};
    //console.log("getConnectedWalletName connectedSites", connectedSites, url);
    for (const walletName of Object.keys(connectedSites)) {
        //console.log("getConnectedWalletName test", connectedSites[walletName], connectedSites[walletName].includes(url));
        if (connectedSites[walletName].includes(url)) {
            return walletName;
        }
    }
    return null;
}
function isConnected(url) {
    const connectedSites = local_storage['connectedSites'] ?? {};
    for (const walletName of Object.keys(connectedSites)) {
        if (connectedSites[walletName].includes(url)) {
            return true;
        }
    }
    return false;
}
function disconnectSite(url) {
    const connectedSites = local_storage['connectedSites'] ?? {};
    var newConnectedSites = {};
    var connectionFound = false;
    for (const walletName of Object.keys(connectedSites)) {
        if (connectedSites[walletName].includes(url)) {
            connectionFound = true;
        }
        const newList = connectedSites[walletName].filter(site => site !== url)
        if (newList.length > 0) {
            newConnectedSites[walletName] = newList;
        }
    }
    LS.setItem('connectedSites', newConnectedSites);
    local_storage['connectedSites'] = newConnectedSites;
    //console.log("disconnectSite", connectedSites, newConnectedSites, connectionFound)
    return connectionFound;
}
function getConnectedWalletByURL(url) {
    const walletName = getConnectedWalletName(url);
    //console.log("getConnectedWalletByURL walletName", walletName);
    if (walletName !== null) {
        const walletList = local_storage['walletList'] ?? [];
        //console.log("getConnectedWalletByURL walletList", walletList);

        for (const wallet of walletList) {
            if (wallet.name === walletName) {
                return wallet;
            }
        }
    }
    return null;
}
async function get(url, apiKey = '', ttl = 0) {
    var res_cache = {};
    if (ttl > 0) {
        await ls_slim_flush();
        res_cache = await ls_slim_get('web_cache_' + ttl.toString()) ?? {};
        if (Object.keys(res_cache).includes(url)) {
            //console.log("res_cache", res_cache[url])
            return res_cache[url];
        }
    }
    const result = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            api_key: apiKey,
        }
    });
    const restext = await result.text();
    const resJSON = JSONBigInt.parse(restext);
    if (ttl > 0) {
        res_cache = await ls_slim_get('web_cache_' + ttl.toString()) ?? {};
        res_cache[url] = resJSON;
        ls_slim_set('web_cache_' + ttl.toString(), res_cache, { ttl: ttl })
    }
    return resJSON;
}
async function post(url, body = {}, apiKey = '') {
    //console.log("post0", url, body);
    var postedBody = body;
    if (postedBody && typeof postedBody === 'object' && postedBody.constructor === Object) {
        postedBody = JSONBigInt.stringify(body)
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'mode': 'cors',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        },
        body: postedBody
    });

    const [responseOk, bodyText] = await Promise.all([response.ok, response.text()]);
    const bodyRes = JSONBigInt.parse(bodyText);
    //console.log("post1", bodyRes, responseOk)
    if (responseOk) {
        return { result: true, data: bodyRes };
    } else {
        if (Object.keys(bodyRes).includes("detail")) {
            return { result: false, data: bodyRes.detail };
        } else {
            return { result: false, data: bodyRes.reason };
        }
    }
}

async function sendTx(tx) {
    try {
        const url = nodeApi + "transactions";
        //return await postRequest("transactions", tx);
        const res = await post(url, tx);
        if (typeof res.data === 'object') {
            //console.log("post2", body2.id)
            return { detail: { result: true, data: res.data.id } };
        } else {
            return { detail: { result: true, data: res.data } };
        }
    } catch (err) {
        console.log("sendTx", err);
        return { detail: { result: false, data: err.toString() } }
    }
}
async function getRequest(url, ttl = 0) {
    return get(nodeApi + url, '', ttl).then(res => {
        return { data: res };
    });
}
async function postRequest(url, body) {
    return post(nodeApi + url, body, '');
}

async function getBalanceForAddress(address) {
    const res = await postRequest(`blockchain/balance`, address);
    //console.log("getBalanceForAddress", address, res)
    return res.data;
}
async function getBalanceConfirmedForAddress(addr) {
    const res = await getBalanceForAddress(addr);
    if (res && res.confirmed) {
        return res.confirmed;
    }
}
async function addressToErgoTree(addr) { // P2PK only
    const res = await getRequest(`utils/addressToRaw/${addr}`, LONG_CACHE);
    //console.log("addressToErgoTree", addr, res);
    return "0008cd" + res.data.raw;
}

async function unspentBoxesFor(address) {
    const res = await postRequest(`blockchain/box/unspent/byAddress?offset=0&limit=50`, address);
    //console.log("unspentBoxesFor", address, res)
    return res.data;
}
async function getUnspentBoxesForAddressList(addressList) {
    var boxList = await Promise.all(addressList.map(async (address) => {
        const addressBoxes = await unspentBoxesFor(address);
        return addressBoxes;
    }));
    var [spentBoxes, newBoxes] = await getSpentAndUnspentBoxesFromMempool(addressList);
    const spentInputBoxIds = spentBoxes.map(box => box.boxId);
    const adjustedUtxos = newBoxes.concat(boxList).flat().filter(box => !spentInputBoxIds.includes(box.boxId));
    //console.log("getUnspentBoxesForAddressList", spentBoxes, newBoxes, spentInputBoxIds, adjustedUtxos);
    if (spentBoxes && Array.isArray(spentBoxes) && spentBoxes.length > 0) {
        memPoolTransaction = true;
        var cache_spentBoxes = await ls_slim_get('cache_spentBoxes') ?? [];
        ls_slim_set('cache_spentBoxes', boxList.filter(b => spentInputBoxIds.includes(b.boxId)).concat(cache_spentBoxes).flat(), 600);
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

async function getUnconfirmedTxsFor(ergoTree) {
    const res = await postRequest(`transactions/unconfirmed/byErgoTree`, '"' + ergoTree + '"');
    //console.log("getUnconfirmedTxsFor", ergoTree, res);
    return res.data;
}

async function getUnconfirmedTransactionsForAddressList(addressList) {
    const ergoTreeList = await Promise.all(addressList.map(async (address) => {
        return await addressToErgoTree(address);
    }));
    const addressUnConfirmedTransactionsList = await Promise.all(ergoTreeList.map(async (ergoTree) => {
        var addressTransactions = await getUnconfirmedTxsFor(ergoTree);
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
    await ls_slim_flush();
    if (newBoxes.length > 0) {
        for (const i in newBoxes) {
            newBoxes[i]["boxId"] = newBoxes[i].id;
            delete newBoxes[i].id;
        }
        var cache_newBoxes = (await ls_slim_get('cache_newBoxes')) ?? [];
        ls_slim_set('cache_newBoxes', newBoxes.concat(cache_newBoxes), 600);
        //console.log('getUtxosForSelectedInputs cache_newBoxes', ls.get('cache_newBoxes'))
    }
    //console.log("getSpentAndUnspentBoxesFromMempool", spentBoxes, newBoxes)
    return [spentBoxes, newBoxes];
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //console.log("background addListener", message, sender, sendResponse);
    if (message.channel === 'safew_contentscript_background_channel') {
        if (message.data && message.data.type === "connect") {
            const walletFound = (getConnectedWalletName(message.data.url) !== null);
            //console.log("background walletFound", walletFound);
            if (walletFound) {
                //console.log("background walletFound");
                if (isFirefox) {
                    //console.log("background firefox response");
                    sendResponse({
                        type: "connect_response",
                        result: true,
                        url: message.data.url
                    });
                    return true;
                } else {
                    getTabId().then(tabId => {
                        console.log("background walletFound", tabId);
                        chrome.scripting.executeScript({
                            target: { tabId: parseInt(tabId), allFrames: true },
                            files: ['inject2.js'],
                            world: "MAIN",
                            injectImmediately: true,
                        },
                            () => {
                                sendResponse({
                                    type: "connect_response",
                                    result: true,
                                    url: message.data.url
                                });
                            })


                    })
                    return true;
                }
            }
            launchPopup(message, sender, sendResponse);
            connectResponseHandlers.set(message.data.url, sendResponse);
            return true;
        }

        if (message.data && message.data.type === "ergopay_request") {
            console.log("ergopay_request", message.data);


        }

        if (message.data && message.data.type === "disconnect") {
            console.log("Disconnecting", message.data.url);
            const disconnectSuccess = disconnectSite(message.data.url);
            sendResponse({
                type: "disconnect_response",
                result: disconnectSuccess,
                url: message.data.url,
            });
            return;
        }

        if (message.data && message.data.type === "is_connected") {
            console.log("is_connected", message.data.url);
            sendResponse({
                type: "is_connected_response",
                result: isConnected(message.data.url),
                url: message.data.url,
            });
            return;
        }

        if (message.data && message.data.type === "ergo_api") {
            const wallet = getConnectedWalletByURL(message.data.url);
            //console.log("wallet", wallet);

            const addressList = wallet.accounts.map(account => account.addresses).flat();
            //console.log("background ergo_api", wallet, addressList);
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
                        console.log("selectedUtxos", selectedUtxos)
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
                        signResponseHandlers.set(message.data.requestId, sendResponse);
                        ls_slim_get("transactionsToSign").then(transactionsToSign => {
                            var tx = {};
                            if (transactionsToSign) {
                                tx = transactionsToSign;
                            }
                            tx[message.data.requestId.toString()] = message.data.data[0];
                            ls_slim_set("transactionsToSign", tx, 60);
                            console.log("transactionsToSign set ", tx);
                            launchPopup(message, sender, message.data.requestId);
                        })
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
        //console.log("background safew_extension_background_channel", message, connectResponseHandlers);
        if (message.data && message.data.type && message.data.type === "connect_response") {
            const responseHandler = connectResponseHandlers.get(message.data.url);
            connectResponseHandlers.delete(message.data.url);
            if (message.data.result) {
                if (isFirefox) {
                    //console.log("firefox connected")
                    responseHandler(message.data)
                    return;
                } else {
                    //console.log("chrome connected")
                    chrome.scripting.executeScript({
                        target: { tabId: parseInt(message.data.tabId), allFrames: true },
                        files: ['inject2.js'],
                        world: "MAIN",
                        injectImmediately: true,
                    },
                        () => { responseHandler(message.data) })
                }
            } else {
                console.log("[SAFEW] Connection failed")
            }
            return true;
        }
        if (message.data && message.data.type && message.data.type === "ergo_api_response") {
            const responseHandler = signResponseHandlers.get(message.data.requestId);
            signResponseHandlers.delete(message.data.requestId);
            responseHandler(message.data);
            return true;
        }
    }

});

async function getTabId() {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    //console.log("getTabId", tabs);
    if (tabs.length > 0) {
        return tabs[0].id;
    } else {
        return null;
    }

}
