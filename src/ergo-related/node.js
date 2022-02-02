import { DEFAULT_NODE_ADDRESS } from '../utils/constants';
import { get, postTx } from './rest';

// in order to secure the node requests (port 9053) the following setting have been done on apache
// prevent any connection to 9053 except from localhost
// proxy https://transaction-builder.ergo.ga/blocks to http://localhost:9053/blocks/lastHeaders/10

export const nodeApi = localStorage.getItem('nodeAddress') ?? DEFAULT_NODE_ADDRESS;

async function getRequest(url) {
    return await get(nodeApi + url).then(res => {
        return { data: res };
    });
}

async function postRequest(url, body = {}, apiKey = '') {
    try {
        const res = await postTx(nodeApi + url, body)
        return { data: res };
    } catch(err) {
        console.log("postRequest", err);
        return { data: err.toString() }
    }
}

export async function getLastHeaders() {
    return await getRequest('blocks/lastHeaders/10')
        .then(res => res.data);
}

export async function sendTx(json) {
    const res = await postRequest('transactions', json);
    return res.data;
}
