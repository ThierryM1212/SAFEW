import { DEFAULT_NODE_ADDRESS } from '../utils/constants';
import { LS } from '../utils/utils';
import { get, post, postTx } from './rest';
import { addressToErgoTree } from './serializer';

// in order to secure the node requests (port 9053) the following setting have been done on apache
// prevent any connection to 9053 except from localhost
// proxy https://transaction-builder.ergo.ga/blocks to http://localhost:9053/blocks/lastHeaders/10


async function getRequest(url) {
    const nodeApi = (await LS.getItem('nodeAddress')) ?? DEFAULT_NODE_ADDRESS;
    const res = await get(nodeApi + url);
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

async function postRequest(url, body = {}, apiKey = '') {
    const nodeApi = (await LS.getItem('nodeAddress')) ?? DEFAULT_NODE_ADDRESS;
    try {
        const res = await post(nodeApi + url, body)
        console.log("postRequest res", res);
        return { data: res };
    } catch (err) {
        console.log("postRequest", err);
        return { data: err.toString() }
    }
}

export async function currentHeight() {
    const res = await getRequest('blocks/lastHeaders/1');
    console.log("currentHeight", res);
    return res.data[0].height;
}

export async function getLastHeaders() {
    return await getRequest('blocks/lastHeaders/10')
        .then(res => res.data);
}

export async function unspentBoxesFor(address) {
    const res = await postRequest(`blockchain/box/unspent/byAddress?offset=0&limit=5`, address );
    console.log("unspentBoxesFor", address, res)
    return res.data;
}

export async function sendTx(json) {
    const res = await postRequestTx('transactions', json);
    return res.data;
}

export async function boxByIdMempool(id) {
    const res = await getRequest(`utxo/withPool/byId/${id}`);
    //console.log("boxByIdMempool", res)
    return res.data;
}



export async function getUnconfirmedTxs() {
    console.log("getUnconfirmedTxs")
    return await getRequest(`transactions/unconfirmed?limit=100`);
}

export async function getUnconfirmedTxsFor(addr) {
    console.log("getUnconfirmedTxsFor", addr)
    const unconfirmedTx = await getRequest(`transactions/unconfirmed?limit=100`);
    console.log("getUnconfirmedTxsFor", unconfirmedTx);
    const ergoTree = await addressToErgoTree(addr);

    var res = [];
    if (unconfirmedTx.data) {
        for (const tx of unconfirmedTx.data) {
            if (tx.inputs.map(b => b.ergoTree).includes(ergoTree) ||
                tx.outputs.map(b => b.ergoTree).includes(ergoTree)) {
                res.push(tx);
            }
        }
    }

    console.log("getUnconfirmedTxsFor", res);
    return res;
}