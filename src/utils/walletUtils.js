import { discoverAddresses } from "../ergo-related/ergolibUtils";
import { NANOERG_TO_ERG, PASSWORD_SALT, WALLET_VERSION } from "./constants";
import '@sweetalert2/theme-dark/dark.css';
import { enrichUtxos } from "../ergo-related/utxos";
import { hexToRgbA } from "./utils";
import { LS } from '../utils/utils';
import { addressHasTransactions, getBalanceForAddress, getTransactionsForAddress, getUnconfirmedTxs } from "../ergo-related/node";
import { getAMMPrices } from "../ergo-related/amm";
import { addressToErgoTree } from "../ergo-related/serializer";
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
    return await _addNewWallet(name, walletAccounts, color, " ", " ", "ergopay")
}

export async function addLedgerWallet(name, accounts, color) {
    return await _addNewWallet(name, accounts, color, " ", " ", "ledger")
}

export async function addNewWallet(name, mnemonic, password, color) {
    const walletAccounts = await discoverAddresses(mnemonic);
    return await _addNewWallet(name, walletAccounts, color, mnemonic, password, "mnemonic")
}

async function _addNewWallet(name, walletAccounts, color, mnemonic, password, type) {
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
    var walletList = await LS.getItem('walletList');
    walletList.push(newWallet);
    LS.setItem('walletList', walletList);
    return walletList.length;
}

export async function upgradeWallets() {
    var walletList = await LS.getItem('walletList');
    LS.setItem('walletList', walletList.map(wallet => upgradeWallet(wallet)));
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
export function isUpgradeWalletRequired(walletList) {
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

export async function getWalletById(id) {
    const walletList = await LS.getItem('walletList');
    return walletList[id];
}

export async function updateWallet(wallet, id) {
    var walletList = await LS.getItem('walletList');
    walletList[id] = wallet;
    LS.setItem('walletList', walletList);
}

export async function addWallet(wallet) {
    var walletList = await LS.getItem('walletList');
    walletList.push(wallet);
    LS.setItem('walletList', walletList);
}

export async function deleteWallet(walletId) {
    var walletList = await LS.getItem('walletList');
    var newWalletList = walletList.filter((wallet, id) => id !== walletId);
    LS.setItem('walletList', newWalletList);
}

export function changePassword(encryptedMnemonic, oldPassword, newPassword) {
    return CryptoJS.AES.encrypt(CryptoJS.AES.decrypt(encryptedMnemonic, oldPassword + PASSWORD_SALT).toString(CryptoJS.enc.Utf8), newPassword + PASSWORD_SALT).toString();
}

export async function convertToErgoPay(walletId) {
    var wallet = await getWalletById(walletId);
    wallet.mnemonic = "";
    wallet.type = 'ergopay';
    await updateWallet(wallet, walletId);
}

export async function deleteWalletAddress(walletId, address) {
    console.log("deleteWalletAddress", address);
    var newWallet = await getWalletById(walletId);
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
    await updateWallet(newWallet, walletId);
}

export async function addWalletAddress(walletId, address) {
    // used for ErgoPay wallet, add to account 0
    console.log("addWalletAddress", address);
    var newWallet = await getWalletById(walletId);
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
    await updateWallet(newWallet, walletId);
}


// return formatted token amount like 6,222,444.420
// amountInt: number of token as provided in utxo (to be divided by 10^decimals)
// decimalsInt: number of decimals of the token
export function formatTokenAmount(amountInt, decimalsInt, trimTrailing0 = true) {
    if (decimalsInt > 0) {
        var str = '';
        //console.log("formatTokenAmount", amountInt, decimalsInt);
        const amountStr = amountInt.toString();
        if (amountStr.length > decimalsInt) {
            //console.log("formatTokenAmount2",amountStr.slice(0, Math.abs(decimalsInt - amountStr.length)), amountStr.slice(amountStr.length - decimalsInt))
            str = [amountStr.substring(0, amountStr.length - decimalsInt), amountStr.substring(amountStr.length - decimalsInt)]
        } else {
            str = ['0', '0'.repeat(decimalsInt - amountStr.length) + amountStr]
        }

        //console.log("formatTokenAmount3", str);

        //const numberAmount = (BigInt(amountInt) / BigInt(Math.pow(10, parseInt(decimalsInt)))).toFixed(parseInt(decimalsInt));
        //const strAmount = amountInt.toString();
        //const numberAmount = strAmount.substring(0, parseInt(decimalsInt)-1) + "." + strAmount.substring(parseInt(decimalsInt)-1);
        //var str = numberAmount.toString().split(".");
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

export async function getWalletNames() {
    const walletList = (await LS.getItem('walletList')) ?? [];
    console.log('getWalletNames', walletList);
    return walletList.map((wallet) => wallet.name);
}

export async function getOtherWalletNames(walletId) {
    const walletList = (await LS.getItem('walletList')) ?? [];
    return walletList.filter((wallet, id) => id !== walletId).map((wallet) => wallet.name);
}

export function getWalletAddressList(wallet) {
    let addressList = [];
    if (wallet) {
        if (Object.keys(wallet).includes('accounts')) {
            for (var account of wallet.accounts) {
                for (var address of account.addresses) {
                    addressList.push(address.address);
                }
            }
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
async function getConnectedWalletName(url) {
    const connectedSites = (await LS.getItem('connectedSites')) ?? {};
    for (const walletName of Object.keys(connectedSites)) {
        if (connectedSites[walletName].includes(url)) {
            return walletName;
        }
    }
    return null;
}
export async function getConnectedWalletByURL(url) {
    const walletName = await getConnectedWalletName(url);
    if (walletName) {
        const walletList = (await LS.getItem('walletList')) ?? [];
        for (const wallet of walletList) {
            if (wallet.name === walletName) {
                return wallet;
            }
        }
    }
    return null;
}
export async function getWalletId(wallet) {
    var walletId = undefined;
    const walletList = (await LS.getItem('walletList')) ?? [];
    for (const i in walletList) {
        if (wallet.name === walletList[i].name) {
            walletId = i;
        }
    }
    return walletId;
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
        for (const j in wallet.accounts[i].addresses) {
            addressPathMap[wallet.accounts[i].addresses[j].address] = getDerivationPath(i, j);
        }
    }
    return addressPathMap;
}

export function getDerivationPath(accountId, index) {
    return `m/44'/429'/${accountId}'/0/` + index;
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

export async function setAccountName(walletId, accountId, accountName) {
    console.log("setAccountName", walletId, accountId, accountName);
    var wallet = getWalletById(walletId);
    wallet.accounts.find(account => parseInt(account.id) === parseInt(accountId))["name"] = accountName;
    updateWallet(wallet, walletId);
}

export async function setAddressUsed(addressToSet) {
    console.log("setAddressUsed", addressToSet);
    var walletList = await LS.getItem('walletList');
    for (var k in walletList) {
        var newWallet = { ...walletList[k] };
        for (var i in newWallet.accounts) {
            var account = newWallet.accounts[i];
            for (var j in account.addresses) {
                var addr = account.addresses[j];
                if (addr.address === addressToSet) {
                    newWallet.accounts[i].addresses[j]["used"] = true;
                    await updateWallet(newWallet, k);
                }
            }
        }
    }
}

export async function updateUnusedAddresses() {
    //var alert = waitingAlert("Searching new used addresses");
    var walletList = await LS.getItem('walletList');
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
                        await updateWallet(newWallet, k);
                    }
                }
            }
        }
    }
    //alert.close();
}

export async function setChangeAddress(walletId, address) {
    var wallet = await getWalletById(walletId);
    wallet.changeAddress = address;
    await updateWallet(wallet, walletId);
}

export async function getTokenValue() {
    const AMMPrices = await getAMMPrices();
    //console.log('getTokenValue AMMPrices', AMMPrices);
    return AMMPrices;
}

export async function getAddressListContent(addressList) {
    //console.log("getAddressListContent", addressList);
    const addressContentList = await Promise.all(addressList.map(async (address) => {
        try {
            const addressContent = await getBalanceForAddress(address);
            // console.log("getAddressListContent", address, addressContent, JSON.stringify(addressContent))
            const addressListContent = { address: address, content: addressContent.confirmed, unconfirmed: { ...addressContent.unconfirmed } };
            addressListContent.content.tokens.forEach(token => {
            })
            // console.log('addressListContent', addressListContent);
            return addressListContent;
        } catch (e) {
            console.log(e)
            return { address: address, content: { nanoErgs: 0, tokens: [] }, unconfirmed: { nanoErgs: 0, tokens: [] } };;
        }

    }));
    return addressContentList;
}

export async function getTransactionsForAddressList(addressList, limit) {
    var addressTransactionsList = [];
    if (limit > 100) { // avoid spam the node with big requests, process sequentially
        for (const address of addressList) {
            const addressTransactions = await getTransactionsForAddress(address, limit);
            addressTransactionsList.push({ address: address, transactions: addressTransactions.items, total: addressTransactions.total });
        }
    } else {
        addressTransactionsList = await Promise.all(addressList.map(async (address) => {
            const addressTransactions = await getTransactionsForAddress(address, limit);
            //console.log("addressTransactions", address, addressTransactions)
            return { address: address, transactions: addressTransactions.items, total: addressTransactions.total };
        }));
    }
    return addressTransactionsList;
}

export async function getUnconfirmedTransactionsForAddressList(addressList, enrich = true) {
    const ergoTreeList = await Promise.all(addressList.map(async (address) => {
        return await addressToErgoTree(address);
    }));

    const unconfirmedTx = await getUnconfirmedTxs(200);
    var addressesUnconfirmedTx = [];
    if (unconfirmedTx) {
        for (const tx of unconfirmedTx) {
            var addressTx = [];
            for (let i = 0; i < addressList.length; i++) {
                if (tx.inputs.map(b => b.ergoTree).includes(ergoTreeList[i]) ||
                    tx.outputs.map(b => b.ergoTree).includes(ergoTreeList[i])) {
                    if (enrich) {
                        try {
                            tx.inputs = await enrichUtxos(tx.inputs);
                        } catch (e) {
                            console.log(e);
                        }
                    }
                    addressTx.push(tx);
                }
                addressesUnconfirmedTx.push({ address: addressList[i], transactions: addressTx });
            }
        }
    };

    return addressesUnconfirmedTx;
}

export function getSummaryFromAddressListContent(addressContentList) {
    //console.log('CONTENTLIST', addressContentList);
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
                    var token = { ...addrInfo.tokens[i] };
                    token.amount = BigInt(token.amount);
                    //if (addressList.includes(addrInfo.address)) {
                    const tokIndex = tokens.findIndex(e => (e.tokenId === token.tokenId));
                    if (tokIndex >= 0) {
                        //console.log("getSummaryFromSelectedAddressListContent adding", i, addressList[i], token.tokenId, token.amount)
                        tokens[tokIndex].amount += BigInt(token.amount);
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

