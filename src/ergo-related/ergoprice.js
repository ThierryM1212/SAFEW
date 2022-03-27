import { get } from "./rest";
import { LS } from '../utils/utils';

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
    const ergoPriceStr = (await getErgoPrice());
    console.log("updateErgoPrice", ergoPriceStr);
    LS.setItem('ergoPrice', ergoPriceStr);
}

export async function readErgoPrice() {
    return await LS.getItem('ergoPrice');
}

