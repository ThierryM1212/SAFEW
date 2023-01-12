import { DEFAULT_EXPLORER_API_ADDRESS } from '../utils/constants';
import { LS, range } from '../utils/utils';
import { get, postTx } from './rest';


const SHORT_CACHE = 15;
const LONG_CACHE = 86400;

async function getRequest(url, ttl = 0) {
    const explorerApi = (await LS.getItem('explorerAPIAddress')) ?? DEFAULT_EXPLORER_API_ADDRESS;
    return get(explorerApi + 'api/v0' + url, '', ttl).then(res => {
        return { data: res };
    });
}

async function getRequestV1(url, ttl = 0) {
    const explorerApi = (await LS.getItem('explorerAPIAddress')) ?? DEFAULT_EXPLORER_API_ADDRESS;
    return get(explorerApi + 'api/v1' + url, '', ttl).then(res => {
        return { data: res };
    });
}

async function postRequestV1(url, body) {
    const explorerApi = (await LS.getItem('explorerAPIAddress')) ?? DEFAULT_EXPLORER_API_ADDRESS;
    return postTx(explorerApi + 'api/v1' + url, body).then(res => {
        return { data: res };
    });
}

export async function currentHeight() {
    return getRequest('/blocks?limit=1')
        .then(res => res.data)
        .then(res => res.items[0].height);
}

export async function unspentBoxesFor(address) {
    return getRequest(`/transactions/boxes/byAddress/unspent/${address}`).then(
        (res) => res.data
    );
}

export async function getExplorerBlockHeaders() {
    return getRequestV1(`/blocks/headers`).then((res) => res.data.items.slice(0,10));
}

export async function unspentBoxesForV1(address) {
    return getRequestV1(`/boxes/unspent/byAddress/${address}`).then(
        (res) => res.data.items
    );
}

export async function boxById(id) {
    return getRequest(`/transactions/boxes/${id}`, SHORT_CACHE).then((res) => res.data);
}

export async function boxByBoxId(id) {
    return getRequestV1(`/boxes/${id}`, SHORT_CACHE).then((res) => res.data);
}

export async function boxByTokenId(tokenId) {
    return getRequestV1(`/boxes/unspent/byTokenId/${tokenId}`, SHORT_CACHE).then((res) => res.data.items);
}

export async function txById(id) {
    return getRequest(`/transactions/${id}`, LONG_CACHE).then((res) => res.data);
}

export async function getSpendingTx(boxId) {
    const data = getRequest(`/transactions/boxes/${boxId}`, LONG_CACHE);
    return data
        .then((res) => res.data)
        .then((res) => res.spentTransactionId)
        .catch((_) => null);
}

export async function getUnconfirmedTxsFor(addr) {
    return getRequest(
        `/transactions/unconfirmed/byAddress/${addr}`
    )
        .then((res) => res.data)
        .then((res) => res.items);
}

export async function getTokenBox(addr) {
    return getRequest(
        `/assets/${addr}/issuingBox`, LONG_CACHE
    )
        .then((res) => res.data[0])
}

export async function getTokenBoxV1(tokenId) {
    return getRequestV1(
        `/tokens/${tokenId}`, LONG_CACHE
    )
        .then((res) => res.data)
}

export async function getBalanceConfirmedForAddress(addr) {
    return getRequestV1(
        `/addresses/${addr}/balance/confirmed`, SHORT_CACHE
    )
        .then((res) => res.data);
}

export async function getBalanceForAddress(addr) {
    return getRequestV1(
        `/addresses/${addr}/balance/total`, SHORT_CACHE
    )
        .then((res) => res.data);
}

export async function getTransactionsForAddress(addr, limit = -1) {
    if (limit > 0) {
        if (limit <= 100) {
            return getRequestV1(
                `/addresses/${addr}/transactions?limit=${limit}`, SHORT_CACHE
            )
                .then((res) => res.data);
        } else {
            const offsets = range(0, limit, 100);
            const addressTransactionsList = await Promise.all(offsets.map(async (offset) => {
                const tx = await getRequestV1(`/addresses/${addr}/transactions?limit=100&offset=${offset}`, SHORT_CACHE)
                return tx.data;
            }));
            var items = []; var total = 0;
            console.log("addressTransactionsList",addressTransactionsList);
            for (const txList of addressTransactionsList) {
                items = items.concat(txList.items);
                total += parseInt(txList.total);
            }
            console.log("items", items, total)
            return {"items": items, "total": total};
        }
    } else {
        return getRequestV1(
            `/addresses/${addr}/transactions`
        )
            .then((res) => res.data);
    }
}

export async function addressHasTransactions(addr) {
    const txList = await getTransactionsForAddress(addr, 1);
    return (txList.items.length > 0);
}

export async function postTxMempool(tx) {
    const res = await postRequestV1('/mempool/transactions/submit', tx);
    console.log("postTxMempool", tx , res);
    return res.data;
}
