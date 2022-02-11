import { DEFAULT_MIXER_ADDRESS } from '../utils/constants';
import { get2, post } from './rest';

const mixerURL = localStorage.getItem('mixerAddress') ?? DEFAULT_MIXER_ADDRESS;

async function getRequest(url) {
    return get2(mixerURL + url).then(res => {
        return { data: res };
    });
}

async function postRequest(url, body = {}) {
    try {
        const res = await post(mixerURL + url, body)
        return { data: res };
    } catch (err) {
        console.log("postRequest", err);
        return { data: err.toString() }
    }
}

export async function isMixerAvailable() {
    try {
        await getRequest('info');
        return true;
    } catch (e) {
        return false;
    }
}

export async function getActiveMixes() {
    try {
        const res = await getRequest('mix/request/activeList');
        console.log("getActiveMixes", res.data);
        return res.data;
    } catch (e) {
        console.log(e);
        return [];
    }
}

export function getMixURL(mixId) {
    return mixerURL + "dashboard/mix/active/" + mixId;
}

export async function getMixBoxes(mixId) {
    try {
        const res = await getRequest('mix/request/' + mixId + '/list');
        console.log("getMixBoxes", res.data);
        return res.data;
    } catch (e) {
        console.log(e);
        return [];
    }
}

export async function setBoxWithdrawAddress(boxId, address) {
    return await postRequest('mix/withdraw', {
        "nonStayAtMix": false,
        "withdrawAddress": address,
        "mixId": boxId,
    }
    )
}

export async function withdrawBox(boxId, address) {
    return await postRequest('mix/withdraw', {
        "nonStayAtMix": true,
        "withdrawAddress": address,
        "mixId": boxId,
    }
    )
}

export async function getCovertAddresses() {
    try {
        const res = await getRequest('covert/list');
        console.log("getCovertAddresses", res.data);
        return res.data;
    } catch (e) {
        console.log(e);
        return [];
    }
}

export async function addCovertAddress(name, numround, addressList) {
    return await postRequest('covert', {
        "addresses": addressList,
        "numRounds": numround,
        "nameCovert": name
    }
    )
}

export async function updateCoverName(covertId, name) {
    return await postRequest('covert/' + covertId + '/name', {
        "nameCovert": name
    }
    )
}

export async function updateCoverRingAmount(covertId, tokenId, amount) {
    return await postRequest('covert/' + covertId + '/asset', {
        "tokenId": tokenId,
        "ring": amount
    })
}

export async function getCovertWithdrawAddresses(covertId) {
    try {
        const res = await getRequest('covert/' + covertId + '/address');
        console.log("getCovertWithdrawAddresses", res.data);
        return res.data;
    } catch (e) {
        console.log(e);
        return [];
    }
}

export async function setCovertWithdrawAddresses(covertId, addressList) {
    return await postRequest('covert/' + covertId + '/address', {
        "addresses": addressList
    })
}
