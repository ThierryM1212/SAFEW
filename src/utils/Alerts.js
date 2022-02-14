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
