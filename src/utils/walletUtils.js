import { discoverAddresses } from "../ergo-related/ergolibUtils";
import { addressHasTransactions, getBalanceForAddress, getTransactionsForAddress, getUnconfirmedTxsFor } from "../ergo-related/explorer";
import { NANOERG_TO_ERG, PASSWORD_SALT, WALLET_VERSION } from "./constants";
import '@sweetalert2/theme-dark/dark.css';
import { enrichUtxos } from "../ergo-related/utxos";
import { hexToRgbA } from "./utils";
import { waitingAlert } from "./Alerts";
var CryptoJS = require("crypto-js");


export const MIN_CHAR_WALLET_NAME = 3;
export const MIN_CHAR_WALLET_PASSWORD = 10;
export const INVALID_PASSWORD_LENGTH_MSG = "Min " + MIN_CHAR_WALLET_PASSWORD.toString() + " characters !";
export const INVALID_NAME_LENGTH_MSG = "Min " + MIN_CHAR_WALLET_NAME.toString() + " characters !";

export function isValidPassword(password) {
    console.log(password, password.length);
    if (password.length < MIN_CHAR_WALLET_PASSWORD) {
        return false;
    }
    return true;
}

export async function addErgoPayWallet(name, address, color) {
    const walletAccounts = [{ id: 0, addresses: [{ id: 0, address, used: true }], name }];
    return _addNewWallet(name, walletAccounts, color, " ", " ", "ergopay")
}

export function addLedgerWallet(name, accounts, color) {
    return _addNewWallet(name, accounts, color, " ", " ", "ledger")
}

export async function addNewWallet(name, mnemonic, password, color) {
    const walletAccounts = await discoverAddresses(mnemonic);
    return _addNewWallet(name, walletAccounts, color, mnemonic, password, "mnemonic")
}

function _addNewWallet(name, walletAccounts, color, mnemonic, password, type) {
    var newWallet = {
        name: name,
        accounts: walletAccounts,
        color: color,
        changeAddress: walletAccounts[0].addresses[0].address,
        type: type,
        version: WALLET_VERSION,
    };
    if (type === "ergopay") {
        newWallet["mnemonic"] = "";
    } else {
        newWallet["mnemonic"] = CryptoJS.AES.encrypt(mnemonic, password + PASSWORD_SALT).toString();
    }
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    walletList.push(newWallet);
    localStorage.setItem('walletList', JSON.stringify(walletList));
    return walletList.length;
}

export function upgradeWallets() {
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    localStorage.setItem('walletList', JSON.stringify(walletList.map(wallet => upgradeWallet(wallet))));
}
export function upgradeWallet(wallet) {
    var upgradedWallet = { ...wallet };
    if (!Object.keys(upgradedWallet).includes("version")) {
        // alpha upgrade 0.1 to 0.2 upgrade
        if (Object.keys(upgradedWallet).includes("color")) {
            try {
                upgradedWallet["color"] = hexToRgbA(wallet.color);
            } catch (e) {
                console.log("color already RGB")
            }
        }
    }
    if (!Object.keys(upgradedWallet).includes("ergoPayOnly")) {
        upgradedWallet["ergoPayOnly"] = false;
    }
    for (const account of wallet.accounts) {
        for (var address of account.addresses) {
            if (!Object.keys(address).includes("used")) {
                address["used"] = false;
            }
        }
    }
    if (Object.keys(upgradedWallet).includes("version") && upgradedWallet["version"] < 2) {
        if (upgradedWallet["ergoPayOnly"]) {
            upgradedWallet["type"] = "ergopay";
        } else {
            upgradedWallet["type"] = "mnemonic";
        }
        delete upgradedWallet["ergoPayOnly"];
    }
    upgradedWallet["version"] = WALLET_VERSION;
    return upgradedWallet;
}
export function isUpgradeWalletRequired() {
    const walletList = JSON.parse(localStorage.getItem('walletList'));
    // if a wallet miss the version field, upgrade is required
    if (walletList.filter(wallet => !Object.keys(wallet).includes("version")).length > 0) {
        return true;
    }
    // if a wallet has an older version than the current one
    if (walletList.filter(wallet => wallet.version < WALLET_VERSION).length > 0) {
        return true;
    }
    return false;
}

export function getWalletById(id) {
    const walletList = JSON.parse(localStorage.getItem('walletList'));
    return walletList[id];
}

export function updateWallet(wallet, id) {
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    walletList[id] = wallet;
    localStorage.setItem('walletList', JSON.stringify(walletList));
}

export function addWallet(wallet) {
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    walletList.push(wallet);
    localStorage.setItem('walletList', JSON.stringify(walletList));
}

export function deleteWallet(walletId) {
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    var newWalletList = walletList.filter((wallet, id) => id !== walletId);
    localStorage.setItem('walletList', JSON.stringify(newWalletList));
}

export function changePassword(encryptedMnemonic, oldPassword, newPassword) {
    return CryptoJS.AES.encrypt(CryptoJS.AES.decrypt(encryptedMnemonic, oldPassword + PASSWORD_SALT).toString(CryptoJS.enc.Utf8), newPassword + PASSWORD_SALT).toString();
}

export function convertToErgoPay(walletId) {
    var wallet = getWalletById(walletId);
    wallet.mnemonic = "";
    wallet.type = 'ergopay';
    updateWallet(wallet, walletId);
}

export function deleteWalletAddress(walletId, address) {
    console.log("deleteWalletAddress", address);
    var newWallet = getWalletById(walletId);
    var newAccounts = [];
    for (var i in newWallet.accounts) {
        var account = newWallet.accounts[i];
        var newAddresses = [];
        for (var j in account.addresses) {
            var addr = account.addresses[j];
            if (addr.address !== address) {
                newAddresses.push(account.addresses[j]);
            }
        }
        account.addresses = newAddresses;
        newAccounts.push(account);
    }
    newWallet.accounts = newAccounts;
    updateWallet(newWallet, walletId);
}

export async function addWalletAddress(walletId, address) {
    // used for ErgoPay wallet, add to account 0
    console.log("addWalletAddress", address);
    var newWallet = getWalletById(walletId);
    var newAccounts = [];
    for (var i in newWallet.accounts) {
        var account = newWallet.accounts[i];
        var newAddresses = [...account.addresses];
        if (parseInt(i) === parseInt(0)) {
            newAddresses.push(
                {
                    "id": account.addresses.length,
                    "address": address,
                    "used": (await addressHasTransactions(address)),
                }
            );
        }
        account["addresses"] = newAddresses;
        newAccounts.push(account);
    }
    newWallet["accounts"] = newAccounts;
    updateWallet(newWallet, walletId);
}


// return formatted token amount like 6,222,444.420
// amountInt: number of token as provided in utxo (to be divided by 10^decimals)
// decimalsInt: number of decimals of the token
export function formatTokenAmount(amountInt, decimalsInt, trimTrailing0 = true) {
    if (decimalsInt > 0) {
        const numberAmount = (Number(amountInt) / Number(Math.pow(10, parseInt(decimalsInt)))).toFixed(parseInt(decimalsInt));
        //const strAmount = amountInt.toString();
        //const numberAmount = strAmount.substring(0, parseInt(decimalsInt)-1) + "." + strAmount.substring(parseInt(decimalsInt)-1);
        var str = numberAmount.toString().split(".");
        str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (trimTrailing0) { str[1] = str[1].replace(/0+$/g, "") };
        if (str[1].length > 0) {
            return str.join(".");
        } else {
            return str[0]
        }

    } else {
        return amountInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

export function formatTokenAmount__(amountInt, decimalsInt) {
    if (decimalsInt > 0) {
        const numberAmount = (Number(amountInt) / Number(Math.pow(10, parseInt(decimalsInt)))).toFixed(parseInt(decimalsInt));
        var str = numberAmount.toString().split(".");
        str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return str.join(".");
    } else {
        return amountInt.replace(/\B(?=(\d{3})+(?!\d))/g, ",");;
    }
}

export function formatERGAmount(amountStr) {
    return parseFloat(parseInt(amountStr) / NANOERG_TO_ERG).toFixed(4);
}

export function formatLongString(str, num) {
    if (typeof str !== 'string') return str;
    if (str.length > 2 * num) {
        return str.substring(0, num) + "..." + str.substring(str.length - num, str.length);
    } else {
        return str;
    }
}

export function getWalletNames() {
    const walletList = JSON.parse(localStorage.getItem('walletList'));
    return walletList.map((wallet) => wallet.name);
}

export function getOtherWalletNames(walletId) {
    const walletList = JSON.parse(localStorage.getItem('walletList'));
    return walletList.filter((wallet, id) => id !== walletId).map((wallet) => wallet.name);
}

export function getWalletAddressList(wallet) {
    let addressList = [];
    for (var account of wallet.accounts) {
        for (var address of account.addresses) {
            addressList.push(address.address);
        }
    }
    return addressList;
}
export function getWalletUsedAddressList(wallet) {
    let addressList = [];
    for (var account of wallet.accounts) {
        for (var address of account.addresses) {
            if (address.used) {
                addressList.push(address.address);
            }
        }
    }
    return addressList;
}
export function getWalletUnusedAddressList(wallet) {
    let addressList = [];
    for (var account of wallet.accounts) {
        for (var address of account.addresses) {
            if (!address.used) {
                addressList.push(address.address);
            }
        }
    }
    return addressList;
}
function getConnectedWalletName(url) {
    const connectedSites = JSON.parse(localStorage.getItem('connectedSites')) ?? {};
    for (const walletName of Object.keys(connectedSites)) {
        if (connectedSites[walletName].includes(url)) {
            return walletName;
        }
    }
    return null;
}
export function getConnectedWalletByURL(url) {
    const walletName = getConnectedWalletName(url);
    if (walletName !== null) {
        const walletList = JSON.parse(localStorage.getItem('walletList')) ?? [];
        for (const wallet of walletList) {
            if (wallet.name === walletName) {
                return wallet;
            }
        }
    }
    return null;
}

export function getWalletListAddressList(walletList) {
    let walletListAddressList = [];
    for (var wallet of walletList) {
        walletListAddressList.push(getWalletAddressList(wallet));
    }
    return walletListAddressList
}

export function getWalletAddressesPathMap(wallet) {
    var addressPathMap = {}
    for (const i in wallet.accounts) {
        for (const j in wallet.accounts[i].addresses){
            addressPathMap[wallet.accounts[i].addresses[j].address] = getDerivationPath(i, j);
        }
    }
    return addressPathMap;
}

export function getDerivationPath(accountId, index) {
    return `m/44'/429'/${accountId}'/0` + '/' + index;
}


export function getAccountAddressList(account) {
    return account.addresses.map((addr) => addr.address);
}

export function getLastAccountId(wallet) {
    return wallet.accounts.length - 1;
}

export async function lastAccountHasTransaction(wallet) {
    const lastAccountId = getLastAccountId(wallet);
    const lastAccountAddressList = getAccountAddressList(wallet.accounts[lastAccountId]);
    var txFound = false;
    for (const addr of lastAccountAddressList) {
        if (await addressHasTransactions(addr)) {
            txFound = true;
            break;
        }
    }
    return txFound;
}

export function decryptMnemonic(mnemonicCrypted, password) {
    if (password === null) {
        return null;
    }
    var mnemonic = '';
    try {
        mnemonic = CryptoJS.AES.decrypt(mnemonicCrypted, password + PASSWORD_SALT).toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.log(e);
        return '';
    }
    return mnemonic;
}

export function passwordIsValid(mnemonicCrypted, password) {
    try {
        const mnemonic = CryptoJS.AES.decrypt(mnemonicCrypted, password + PASSWORD_SALT).toString(CryptoJS.enc.Utf8);
        if (mnemonic.length < 10) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

export function setAccountName(walletId, accountId, accountName) {
    console.log("setAccountName", walletId, accountId, accountName);
    var wallet = getWalletById(walletId);
    wallet.accounts.find(account => parseInt(account.id) === parseInt(accountId))["name"] = accountName;
    updateWallet(wallet, walletId);
}

export function setAddressUsed(addressToSet) {
    console.log("setAddressUsed", addressToSet);
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    for (var k in walletList) {
        var newWallet = { ...walletList[k] };
        for (var i in newWallet.accounts) {
            var account = newWallet.accounts[i];
            for (var j in account.addresses) {
                var addr = account.addresses[j];
                if (addr.address === addressToSet) {
                    newWallet.accounts[i].addresses[j]["used"] = true;
                    updateWallet(newWallet, k);
                }
            }
        }
    }
}

export async function updateUnusedAddresses() {
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    for (var k in walletList) {
        var newWallet = { ...walletList[k] };
        const walletUnusedAddressList = getWalletUnusedAddressList(newWallet);
        const checkResultList = await Promise.all(walletUnusedAddressList.map(async (addr) => {
            const isUsed = await addressHasTransactions(addr);
            return isUsed;
        }));
        for (var i in newWallet.accounts) {
            var account = newWallet.accounts[i];
            for (var j in account.addresses) {
                var addr = account.addresses[j];
                //console.log("updateUnusedAddresses",addr);
                var addrIndex = walletUnusedAddressList.indexOf(addr);
                if (addrIndex > -1) {
                    newWallet.accounts[i].addresses[j]["used"] = checkResultList[addrIndex];
                    if (checkResultList[addrIndex]) {
                        updateWallet(newWallet, k);
                    }
                }
            }
        }
    }
}

export function setChangeAddress(walletId, address) {
    var wallet = getWalletById(walletId);
    wallet.changeAddress = address;
    updateWallet(wallet, walletId);
}

export async function getAddressListContent(addressList) {
    const addressContentList = await Promise.all(addressList.map(async (address) => {
        const addressContent = await getBalanceForAddress(address);
        //console.log("getAddressListContent", address, addressContent, JSON.stringify(addressContent))
        return { address: address, content: addressContent.confirmed, unconfirmed: { ...addressContent.unconfirmed } };
    }));
    return addressContentList;
}

export async function getTransactionsForAddressList(addressList, limit) {
    const addressTransactionsList = await Promise.all(addressList.map(async (address) => {
        const addressTransactions = await getTransactionsForAddress(address, limit);
        //console.log("addressTransactions", address, addressTransactions)
        return { address: address, transactions: addressTransactions.items, total: addressTransactions.total };
    }));
    return addressTransactionsList;
}

export async function getUnconfirmedTransactionsForAddressList(addressList, enrich = true) {
    const addressUnConfirmedTransactionsList = await Promise.all(addressList.map(async (address) => {
        var addressTransactions = await getUnconfirmedTxsFor(address);
        //console.log("getUnconfirmedTransactionsForAddressList", address, addressTransactions);
        if (enrich) {
            try { // if we fail to fetch one box, skip the unconfirmed transactions for that address
                for (const tx of addressTransactions) {
                    tx.inputs = await enrichUtxos(tx.inputs);
                }
                return { address: address, transactions: addressTransactions };
            } catch (e) {
                console.log(e);
                return { address: address, transactions: [] };
            }
        } else {
            return { address: address, transactions: addressTransactions };
        }
    }));
    return addressUnConfirmedTransactionsList;
}

export function getSummaryFromAddressListContent(addressContentList) {
    const addressList = addressContentList.map(addrContent => addrContent.address);
    const selectedAddressList = new Array(addressList.length).fill(true);
    return getSummaryFromSelectedAddressListContent(addressList, addressContentList, selectedAddressList);
}

export function getSummaryFromSelectedAddressListContent(addressList, addressContentList, selectedAddressList) {
    var nanoErgs = 0, tokens = [];
    //console.log("getSummaryFromSelectedAddressListContent0", addressList, addressContentList, selectedAddressList)
    for (const i in addressList) {
        if (selectedAddressList[i]) {
            const addrInfo = { ...addressContentList[i].content };
            //console.log("getSummaryFromSelectedAddressListContent adding", addressList[i], addrInfo)
            nanoErgs += addrInfo.nanoErgs;
            //nanoErgsUnconfirmed += addrUnconfirmedInfo.nanoErgs;
            if (Array.isArray(addrInfo.tokens)) {
                for (const i in addrInfo.tokens) {
                    const token = { ...addrInfo.tokens[i] };
                    //if (addressList.includes(addrInfo.address)) {
                    const tokIndex = tokens.findIndex(e => (e.tokenId === token.tokenId));
                    if (tokIndex >= 0) {
                        //console.log("getSummaryFromSelectedAddressListContent adding", i, addressList[i], token.tokenId, token.amount)
                        tokens[tokIndex].amount += token.amount;
                    } else {
                        tokens.push({ ...token });
                    }
                }
            }
        }
    }
    //console.log("getSummaryFromSelectedAddressListContent3", nanoErgs, tokens, JSON.stringify(addressContentList));
    return [nanoErgs, tokens]
}

