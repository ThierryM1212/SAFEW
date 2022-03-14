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