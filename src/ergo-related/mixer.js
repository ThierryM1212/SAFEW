import { DEFAULT_MIXER_ADDRESS } from '../utils/constants';
import { get2, post } from './rest';

const mixerURL = localStorage.getItem('mixerAddress') ?? DEFAULT_MIXER_ADDRESS;

async function getRequest(url) {
    return get2(mixerURL + url).then(res => {
        return { data: res };
    });
}

export async function isMixerAvailable() {
    try {
        const res = await getRequest('info');
        return true;
    } catch (e) {
        return false;
    }
}

export async function getActiveMixes() {
    try {
        const res = await getRequest('mix/request/activeList');
        console.log("getActiveMixes",res.data);
        return res.data;
    } catch (e) {
        console.log(e);
        return [];
    }
}

export function getMixURL(mixId) {
    return mixerURL + "dashboard/mix/active/" + mixId;
}

