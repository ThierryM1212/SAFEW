import { displayTransaction, errorAlert } from "../utils/Alerts";
import JSONBigInt from 'json-bigint';

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
                displayTransaction(body)
                return JSON.parse(body);
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

export async function get(url, apiKey = '') {
    try {
        const result = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                api_key: apiKey,
            }
        }).then(res => res.json());
        return result;
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