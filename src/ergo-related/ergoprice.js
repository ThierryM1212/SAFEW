import { get } from "./rest";

async function getErgoPrice() {
    return get("https://api.coingecko.com/api/v3/simple/price?ids=ergo&vs_currencies=usd").then(res => {
        if (res.ergo && res.ergo.usd) {
            return res.ergo.usd;
        } else {
            return 0;
        }
    });
}

export async function updateErgoPrice() {
    localStorage.setItem('ergoPrice', (await getErgoPrice()).toString());
}

export function readErgoPrice() {
    return localStorage.getItem('ergoPrice');
}

