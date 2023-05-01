import { DEFAULT_NODE_ADDRESS } from '../utils/constants';
import { LS, range } from '../utils/utils';
import { get, post, postTx } from './rest';
import { addressToErgoTree } from './serializer';

// in order to secure the node requests (port 9053) the following setting have been done on apache
// prevent any connection to 9053 except from localhost
// proxy https://transaction-builder.ergo.ga/blocks to http://localhost:9053/blocks/lastHeaders/10


const SHORT_CACHE = 15;
const LONG_CACHE = 86400;

async function getRequest(url, ttl = 0) {
    const nodeApi = (await LS.getItem('nodeAddress')) ?? DEFAULT_NODE_ADDRESS;
    const res = await get(nodeApi + url, '', ttl);
    return { data: res };
}

async function postRequestTx(url, body = {}, apiKey = '') {
    const nodeApi = (await LS.getItem('nodeAddress')) ?? DEFAULT_NODE_ADDRESS;
    try {
        const res = await postTx(nodeApi + url, body)
        return { data: res };
    } catch (err) {
        console.log("postRequest", err);
        return { data: err.toString() }
    }
}

async function postRequest(url, body = {}, apiKey = '', ttl = 0) {
    const nodeApi = (await LS.getItem('nodeAddress')) ?? DEFAULT_NODE_ADDRESS;
    try {
        const res = await post(nodeApi + url, body, apiKey, ttl)
        //console.log("postRequest res", res);
        return { data: res };
    } catch (err) {
        console.log("postRequest", err);
        return { data: err.toString() }
    }
}

export async function currentHeight() {
    const res = await getRequest('blocks/lastHeaders/1');
    //console.log("currentHeight", res);
    return res.data[0].height;
}

export async function getLastHeaders() {
    return await getRequest('blocks/lastHeaders/10')
        .then(res => res.data);
}

export async function unspentBoxesFor(address) {
    const res = await postRequest(`blockchain/box/unspent/byAddress?offset=0&limit=50`, address);
    //console.log("unspentBoxesFor", address, res)
    return res.data;
}

export async function sendTx(json) {
    const res = await postRequestTx('transactions', json);
    return res.data;
}

export async function boxByIdMempool(id) {
    const res = await getRequest(`utxo/withPool/byId/${id}`, SHORT_CACHE);
    //console.log("boxByIdMempool", res)
    return res.data;
}

export async function boxByBoxId(id) {
    const res = await getRequest(`blockchain/box/byId/${id}`, LONG_CACHE);
    //console.log("boxByIdMempool", res)
    return res.data;
}

export async function getTokenInfo(tokenId) {
    const tokenInfo = await getRequest(`blockchain/token/byId/${tokenId}`, LONG_CACHE);
    return tokenInfo.data;
}

export async function getTokenBox(tokenId) {
    const tokenInfo = await getTokenInfo(tokenId);
    //console.log("getTokenBox tokenInfo", tokenInfo);
    if (tokenInfo.boxId) {
        return await boxByBoxId(tokenInfo.boxId);
    }
}

export async function getBalanceForAddress(address) {
    const res = await postRequest(`blockchain/balance`, address, '', SHORT_CACHE);
    //console.log("getBalanceForAddress", address, res)
    return res.data;
}

export async function getTransactionsForAddress(addr, limit = -1) {
    if (limit <= 100) {
        return postRequest(
            `blockchain/transaction/byAddress?limit=${limit}`, addr)
            .then((res) => res.data);
    } else {
        const offsets = range(0, limit, 100);
        const addressTransactionsList = await Promise.all(offsets.map(async (offset) => {
            try {
                const tx = await postRequest(`blockchain/transaction/byAddress?limit=100&offset=${offset}`, addr, '', SHORT_CACHE)
                return tx.data;
            } catch (e) {
                console.log(e);
                return {
                    items: [],
                    total: 0
                }
            }
        }));
        var items = []; var total = 0;
        //console.log("addressTransactionsList", addressTransactionsList);
        for (const txList of addressTransactionsList) {
            items = items.concat(txList.items);
            total += parseInt(txList.total);
        }
        //console.log("items", items, total)
        return { "items": items, "total": total };
    }
}

export async function addressHasTransactions(addr) {
    const txList = await getTransactionsForAddress(addr, 1);
    return (txList.items.length > 0);
}

export async function getUnconfirmedTxs(limit = 100) {
    //console.log("getUnconfirmedTxs")
    const res = await getRequest(`transactions/unconfirmed?limit=${limit}`);
    return res.data;
}

export async function getCurrentHeights(nodeUrl) {
    //console.log("getUnconfirmedTxs")
    return await get(nodeUrl + `blockchain/indexedHeight`);
}

export async function getNodeInfo(nodeUrl) {
    //console.log("getUnconfirmedTxs")
    return await get(nodeUrl + `info`);
}
