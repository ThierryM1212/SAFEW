import { DEFAULT_EXPLORER_API_ADDRESS } from '../utils/constants';
import { LS } from '../utils/utils';
import { get } from './rest';


const SHORT_CACHE = 15;

async function getRequestV1(url, ttl = 0) {
    const explorerApi = (await LS.getItem('explorerAPIAddress')) ?? DEFAULT_EXPLORER_API_ADDRESS;
    return get(explorerApi + 'api/v1' + url, '', ttl).then(res => {
        return { data: res };
    });
}

export async function boxByTokenId(tokenId) {
    return getRequestV1(`/boxes/unspent/byTokenId/${tokenId}`, SHORT_CACHE).then((res) => res.data.items);
}
