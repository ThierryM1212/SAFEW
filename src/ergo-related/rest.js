import { displayTransaction, errorAlert } from "../utils/Alerts";
import JSONBigInt from 'json-bigint';
import { ls_slim_flush, ls_slim_get, ls_slim_set } from "../utils/utils";

export async function postTx(url, body = {}, apiKey = '') {
    console.log("post", url)
    fetch(url, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'mode': 'cors',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        },
        body: JSONBigInt.stringify(body)
    }).then(response => Promise.all([response.ok, response.json()]))
        .then(([responseOk, body]) => {
            if (responseOk) {
                console.log("fetch1", body);
                if (typeof body === 'object') {
                    displayTransaction(body.id)
                    return body.id;
                } else {
                    displayTransaction(body)
                    return body;
                }
            } else {
                console.log("fetch2", body);
                try {
                    errorAlert("Failed to fetch", JSON.stringify(body))
                } catch (e) {
                    console.log("fetch21", body.toString());
                    errorAlert("Failed to fetch", body.toString())
                }
            }
        })
        .catch(error => {
            console.log("fetch3", error);
            // catches error case and if fetch itself rejects
        });
}

export async function post(url, body = {}, apiKey = '') {
    return await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            api_key: apiKey,
        },
        body: JSONBigInt.stringify(body),
    });
}

export async function get(url, apiKey = '', ttl = 0) {
    //console.log("get", url, apiKey, ttl);
    var res_cache = {};
    try {
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
        })
        const resJson = await result.json();
        if (ttl > 0) {
            res_cache = await ls_slim_get('web_cache_' + ttl.toString()) ?? {};
            res_cache[url] = resJson;
            ls_slim_set('web_cache_' + ttl.toString(), res_cache, { ttl: ttl })
        }
        return resJson;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function getBlob(url) {
    try {
        const result = await fetch(url).then(res => res.blob());
        return result;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function get2(url, apiKey = '') {
    const result = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            api_key: apiKey,
        }
    }).then(res => res.json());
    return result;
}