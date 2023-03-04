import { get } from './rest';

const AMMApi = 'https://api.spectrum.fi/v1/amm/pools/summary';

export async function getAMMPrices() {
    const AMMPrices = await get(AMMApi, '', 15);
    var res = {};
    for (const tok of AMMPrices) {
        res[tok.quoteId] = tok.lastPrice;
    }
    return res;
}

