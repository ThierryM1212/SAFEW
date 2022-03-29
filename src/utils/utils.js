import { get, getBlob } from "../ergo-related/rest";

var CryptoJS = require("crypto-js");


export const delay = ms => new Promise(res => setTimeout(res, ms));

export function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return parseInt(hex.length) === parseInt(1) ? "0" + hex : hex;
}

export function hexToRgbA(hex) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (parseInt(c.length) === parseInt(3)) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255, a: 1 };
        //return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
    }
    throw new Error('Bad Hex');
}

export function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

export function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

export function computeSHA256(file, setHash) {
    var reader = new FileReader();
    reader.onload = function (event) {
        var data = event.target.result;
        console.log('computeSHA256 data: ', data);
        var hash = CryptoJS.SHA256(data);
        console.log('computeSHA256 SHA-256: ', hash);
        setHash(hash);
    };
    reader.readAsArrayBuffer(file);
}

export async function downloadAndSetSHA256(url) {
    const blob = await getBlob(url);
    var hash = await getHashAsync(blob);
    return hash;
}

function getHashAsync(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = function (event) {
            var data = event.target.result;
            var hash = CryptoJS.SHA256(data);
            resolve(hash);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    })
}

export const LS = {
    getAllItems: () => {
        // Immediately return a promise and start asynchronous work
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.get(null, (items) => {
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                // Pass the data retrieved from storage down the promise chain.
                resolve(items);
            });
        });
    },
    getItem: (key) => {
        return new Promise(function(resolve, reject) {
            chrome.storage.local.get(key, function(items) {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError.message);
              } else {
                resolve(items[key]);
              }
            });
          });
    },
    setItem: (key, val) => {
        //console.log("setItem", key, val)
        return chrome.storage.local.set({ [key]: val })
    },
    removeItems: keys => chrome.storage.local.remove(keys),
};

// emulate localstorage-slim
const APX = String.fromCharCode(0);
export async function ls_slim_flush() {
    const items = await LS.getAllItems();
    return await Promise.all(Object.keys(items).map(async (key) => {
        const item = await LS.getItem(key);
        if (typeof item === 'object' && APX in item && (Date.now() > item.ttl)) {
            LS.removeItems([key]);
        }
    }));
}
export async function ls_slim_get(key) {
    const item = await LS.getItem(key);
    const hasTTL = typeof item === 'object' && APX in item;
    if (!hasTTL) {
        return item;
    }
    if (Date.now() > item.ttl) {
        LS.removeItems([key]);
        return null;
    }
    return item[APX];
}
export async function ls_slim_set(key, value, ttl) {
    try {
        let val = ttl && ttl > 0 ? { [APX]: value, ttl: Date.now() + ttl * 1e3 } : value;
        await LS.setItem(key, val);
    } catch (e) {
        return false;
    }
}