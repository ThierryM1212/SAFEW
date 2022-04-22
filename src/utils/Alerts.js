import Swal from 'sweetalert2/src/sweetalert2.js';
import '@sweetalert2/theme-dark/dark.css';
import Spinner from '../resources/Spin-1.5s-94px.svg';

export function errorAlert(title, msg) {
    Swal.fire({
        title: title,
        text: msg,
        icon: 'error',
        confirmButtonText: 'Ok'
    })
}

export function successAlert(title, msg) {
    return Swal.fire({
        title: title,
        text: msg,
        icon: 'success',
        confirmButtonText: 'Ok',
        showConfirmButton: true,
    })
}

export function copySuccess() {
    Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Copy OK',
        showConfirmButton: false,
        timer: 1000
    })
}

export function waitingAlert(title, html = null) {
  return Swal.fire({
    title: title,
    html: html,
    imageUrl: Spinner,
    showConfirmButton: false,
  });
}

export function confirmAlert(msg, txt, confirmMsg = 'Yes', denyMsg = 'No') {
    return Swal.fire({
        title: msg,
        html: txt,
        showDenyButton: true,
        confirmButtonText: confirmMsg,
        denyButtonText: denyMsg,
        allowOutsideClick: false,
    })
}

export function displayMnemonic(mnemonic) {
    return Swal.fire({
        icon: 'warning',
        title: 'Backup the mnemonic off-line !',
        html: '<div class="card m-1 p-1"><h4>' + mnemonic + '</h4></div>',
        showConfirmButton: true,
    })
}

export function displayTransaction(txId) {
    return new Promise(function (resolve, reject) {
        Swal.fire({
            title: 'Transaction sent succesfully',
            allowOutsideClick: false,
            icon: 'success',
            html: `<p>The transaction will be visible in the explorer in few seconds: <a href="https://explorer.ergoplatform.com/en/transactions/${txId}" target="_blank" > ${txId} </a></p>`,
            preConfirm: () => {
                return txId;
            }
        }).then((txId) => {
            resolve(txId);
        });
    });
}

export function displayNFT(type, name, desc, url, amount, tokenId) {
    var html = '<div>';

    if (type === 'Video') {
        html += '<video controls src="' + url + '" alt="NFT video" width="550" />';
    }
    if (type === 'Audio') {
        html += '<audio controls src="' + url + '" alt="NFT video" width="550" />';
    }
    html += '</div>';
    html += '<div class="card m-1 p-1 d-flex flex-row align-items-center justify-content-between">';
    html += '<div class="col-sm-3">Description: </div><div class="col-sm">' + desc + '</div>';
    html += '</div>';
    html += '<div class="card m-1 p-1 d-flex flex-row align-items-center justify-content-between">';
    html += '<div class="col-sm-3">Amount:</div><div class="col-sm"> ' + amount + '</div>';
    html += '</div>';
    html += '<div class="card m-1 p-1 d-flex flex-row align-items-center justify-content-between">';
    html += '<div class="col-sm-3">URL:</div><div class="textSmall col-sm"><a href="' + url + '" alt="NFT URL" target="_blank noreferer" >' + url + '</a></div>';
    html += '</div>';
    html += '<div class="card m-1 p-1 d-flex flex-row align-items-center justify-content-between">';
    html += '<div class="col-sm-3">TokenId:</div><div class="textSmall col-sm"> ' + tokenId + '</div>';
    html += '</div>';

    if (type === 'Picture') {
        return Swal.fire({
            title: name,
            html: html,
            text: desc,
            showConfirmButton: true,
            width: 650,
            imageUrl: url,
            imageWidth: 600,
            imageAlt: name,
        });
    } else {
        return Swal.fire({
            title: name,
            html: html,
            text: desc,
            showConfirmButton: true,
            width: 650,
        });
    }

}


export function promptPassword(title, html, confirmText) {
    return new Promise(function (resolve, reject) {
        Swal.fire({
            title: title,
            html: `<div>${html}<input type="password" id="password" class="swal2-input" placeholder="Password"></div>`,
            confirmButtonText: confirmText,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const password = Swal.getPopup().querySelector('#password').value;
                if (!password) {
                    Swal.showValidationMessage(`Please enter password`);
                }
                return { password: password };
            }
        }).then((result) => {
            if (result.value) {
                resolve(result.value.password);
            } else {
                reject();
            }
        });
    });
}

export function promptNumTx() {
    return new Promise(function (resolve, reject) {
        Swal.fire({
            title: "Max number of transactions per address",
            html: `<div><p>Maximum 500. Reduce that number if the export fails (mining wallet)</p><input type="text" id="txNum" class="swal2-input" placeholder="Max 500"></div>`,
            confirmButtonText: "export",
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const txNum = Swal.getPopup().querySelector('#txNum').value;

                if (!txNum || !txNum.match(/^[0-9]+$/) || parseInt(txNum) > 500) {
                    Swal.showValidationMessage(`The number of transaction per address must be from 0 to 500`);
                }
                return { txNum: txNum };
            }
        }).then((result) => {
            if (result.value) {
                resolve(result.value.txNum);
            } else {
                reject();
            }
        });
    });
}
