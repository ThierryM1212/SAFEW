import { DeviceError } from 'ledgerjs-hw-app-ergo';
import React, { Fragment } from 'react';
import ReactJson from 'react-json-view';
import { getTxReducedB64Safe, getUnsignedTransaction } from '../ergo-related/ergolibUtils';
import { boxByBoxId } from '../ergo-related/explorer';
import { signTxLedger } from '../ergo-related/ledger';
import { getWalletForAddresses, signTransaction } from '../ergo-related/serializer';
import { getUtxoBalanceForAddressList, parseSignedTx, parseUnsignedTx, parseUtxos } from '../ergo-related/utxos';
import { errorAlert } from '../utils/Alerts';
import { sampleTxErgodex, TX_FEE_ERGO_TREE } from '../utils/constants';
import { decryptMnemonic, formatERGAmount, formatTokenAmount, getConnectedWalletByURL, getUnconfirmedTransactionsForAddressList, getWalletAddressList, getWalletById, getWalletUsedAddressList } from '../utils/walletUtils';
import BigQRCode from './BigQRCode';

/* global chrome */

export default class SignPopup extends React.Component {
    constructor(props) {
        super(props);
        const urlFixed = new URL(window.location.href.replace("#sign_tx", '').replace("chrome-extension", "http"));
        const urlOrgigin = urlFixed.searchParams.get("origin");
        var connectedWallet = getConnectedWalletByURL(urlOrgigin);
        const requestId = parseInt(urlFixed.searchParams.get("requestId"));
        var tx = {}
        try { // allow debug of the UI out of chrome extension
            const background = chrome.extension.getBackgroundPage();
            tx = background.transactionsToSign.get(requestId);
        } catch (e) {
            console.log(e);
            tx = sampleTxErgodex;
            connectedWallet = getWalletById(0);
        }
        var parsedUnsignedTx = {};
        try {
            parsedUnsignedTx = parseUnsignedTx(tx);
        } catch (e) {
            chrome.runtime.sendMessage({
                channel: "safew_extension_background_channel",
                data: {
                    type: "ergo_api_response",
                    result: false,
                    data: ['Failed to parse transaction, incorrect format'],
                    requestId: requestId,
                }
            });
            window.close();
        }

        this.state = {
            selectedOption: "",
            wallet: connectedWallet,
            url: urlOrgigin,
            requestId: requestId,
            accepted: false,
            unSignedTx: parsedUnsignedTx,
            password: '',
            expertMode: (localStorage.getItem('expertMode') === 'true') ?? false,
            txBalance: { value: 0, tokens: [] },
            txReducedB64safe: "",
            txId: "",
        };
        this.signTx = this.signTx.bind(this);
        this.setPassword = this.setPassword.bind(this);
        this.showTxReduced = this.showTxReduced.bind(this);
        this.timer = this.timer.bind(this);
        //console.log("SignPopup constructor state", this.state);
    }

    setPassword = (password) => { this.setState({ password: password }) };

    async showTxReduced() {
        const inputsDetails = parseUtxos(await Promise.all(this.state.unSignedTx.inputs.map(async (box) => {
            return await boxByBoxId(box.boxId);
        })));
        const dataInputsDetails = parseUtxos(await Promise.all(this.state.unSignedTx.dataInputs.map(async (box) => {
            return await boxByBoxId(box.boxId);
        })));
        const [txId, txReducedB64safe] = await getTxReducedB64Safe(this.state.unSignedTx, inputsDetails, dataInputsDetails);
        var intervalId = setInterval(this.timer, 3000);
        this.setState({
            txReducedB64safe: txReducedB64safe,
            txId: txId,
            intervalId: intervalId,
        })
    }

    async timer() {
        const walletAddressList = getWalletAddressList(this.state.wallet);
        const unconfirmedTransactions = await getUnconfirmedTransactionsForAddressList(walletAddressList, false);
        const unconfirmedTransactions2 = unconfirmedTransactions.map(tx => tx.transactions).flat();
        //console.log("timer1", unconfirmedTransactions2);
        const ourTx = unconfirmedTransactions2.filter(tx => tx !== undefined && tx.id === this.state.txId);
        //console.log("timer2", ourTx, this.state.txId);
        if (ourTx.length > 0) {
            var fixedTx = parseSignedTx(ourTx[0]);
            fixedTx.id = this.state.txId;
            console.log("fixedTx", fixedTx);
            chrome.runtime.sendMessage({
                channel: "safew_extension_background_channel",
                data: {
                    type: "ergo_api_response",
                    result: true,
                    data: fixedTx,
                    requestId: this.state.requestId,
                }
            });
            window.close();
        }
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    async componentDidMount() {
        const walletAddressList = getWalletAddressList(this.state.wallet);
        const txBalance = await getUtxoBalanceForAddressList(this.state.unSignedTx.inputs, this.state.unSignedTx.outputs, walletAddressList);
        console.log("sendTransaction txBalance", txBalance);
        this.setState({
            txBalance: txBalance,
        });
        if (this.state.wallet.type === "ergopay") {
            await this.showTxReduced();
        }
    }

    async signTx() {
        console.log("signTx", this.state)
        var signedTx = {};
        try {
            const inputsDetails = parseUtxos(await Promise.all(this.state.unSignedTx.inputs.map(async (box) => {
                return await boxByBoxId(box.boxId);
            })));
            const dataInputsDetails = parseUtxos(await Promise.all(this.state.unSignedTx.dataInputs.map(async (box) => {
                return await boxByBoxId(box.boxId);
            })));
            if (this.state.wallet.type === "mnemonic") {
                const walletAddressList = getWalletUsedAddressList(this.state.wallet);
                const mnemonic = decryptMnemonic(this.state.wallet.mnemonic, this.state.password);
                if (mnemonic === null) {
                    return;
                }
                if (mnemonic === '' || mnemonic === undefined) {
                    errorAlert("Failed to decrypt Mnemonic", "Wrong password ?");
                    return;
                }
                const signingWallet = await getWalletForAddresses(mnemonic, walletAddressList);
                signedTx = await signTransaction(this.state.unSignedTx, inputsDetails, dataInputsDetails, signingWallet);
            }
            if (this.state.wallet.type === "ledger") {
                console.log("signTx ledger", this.state)
                try {
                    signedTx = await signTxLedger(this.state.wallet, this.state.unSignedTx, inputsDetails, '');
                    console.log("signTx signedTx", signedTx);
                } catch (e) {
                    console.log("signTxLedger catch", e);
                    if (e instanceof DeviceError) {
                        if (e.toString().includes("denied by user")) {
                            errorAlert(e.toString())
                        } else {
                            errorAlert("Cannot connect Ledger ergo application, unlock the ledger and start the Ergo applicaiton on the ledger.")
                        }
                    }
                }
            }
            console.log("signedTx", signedTx);
        } catch (e) {
            chrome.runtime.sendMessage({
                channel: "safew_extension_background_channel",
                data: {
                    type: "ergo_api_response",
                    result: false,
                    data: [e.toString()],
                    requestId: this.state.requestId,
                }
            });
            window.close();
            return;
        }
        //const res = await sendTx(signedTx);
        chrome.runtime.sendMessage({
            channel: "safew_extension_background_channel",
            data: {
                type: "ergo_api_response",
                result: true,
                data: JSON.parse(signedTx),
                requestId: this.state.requestId,
            }
        });
        window.close();
    }

    cancelSigning = () => {
        chrome.runtime.sendMessage({
            channel: "safew_extension_background_channel",
            data: {
                type: "ergo_api_response",
                result: false,
                data: ["User cancelled transaction signing"],
                requestId: this.state.requestId,
            }
        });
        window.close();
    }

    render() {
        var feeAmount = 0;
        try {
            feeAmount = this.state.unSignedTx.outputs.find(output => output.ergoTree === TX_FEE_ERGO_TREE).value;
        } catch (e) {
            console.log("fee not found...", e)
        }
        return (
            <Fragment>
                <br />
                <div className='card w-75 m-1 p-1 d-flex flex-column'
                    style={{
                        borderColor: `rgba(${this.state.wallet.color.r},${this.state.wallet.color.g},${this.state.wallet.color.b}, 0.95)`,
                    }}>
                    <br />
                    <h5>
                        Sign transaction from {this.state.url}
                    </h5>
                    <h6>Balance for {this.state.wallet.name}</h6>
                    <table>
                        <tbody>
                            <tr>
                                <td>ERGS</td>
                                <td>
                                    {formatERGAmount(this.state.txBalance.value)}&nbsp;
                                    <span className='textSmall'>(Fee -{formatERGAmount(feeAmount)})</span>
                                </td>
                            </tr>
                            {
                                this.state.txBalance.tokens.map(token =>
                                    <tr>
                                        <td className='textSmall'> {token.name}</td>
                                        <td className='textSmall'>{formatTokenAmount(token.amount, token.decimals)}</td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                    <br />
                    {
                        this.state.expertMode ?
                            <div className='card m-1 p-1'>
                                <h6>Unsigned transaction json</h6>
                                <ReactJson
                                    src={this.state.unSignedTx}
                                    theme="monokai"
                                    collapsed={true}
                                    name="unsignedTransaction"
                                    collapseStringsAfterLength={50}
                                />
                                <br />
                            </div>
                            : null
                    }
                    {
                        this.state.wallet.type === "ergopay" ?
                            <div className='card m-1 p-1 d-flex flex-column'>
                                <h6>ErgoPay transaction</h6>
                                {this.state.txId === "" ?
                                    <div className='d-flex flex-row justify-content-center'>
                                        <button className="btn btn-outline-info"
                                            onClick={this.showTxReduced}>
                                            Show ErgoPay transaction
                                        </button>
                                    </div>
                                    :
                                    <div className='d-flex flex-row justify-content-center'>
                                        <BigQRCode QRCodeTx={this.state.txReducedB64safe} />
                                    </div>
                                }
                            </div>
                            : null
                    }
                    <Fragment>
                        {
                            this.state.wallet.type === "mnemonic" ?
                                <div className='card m-1 p-1 d-flex flex-column'>
                                    <label htmlFor="walletPassword" >Spending password for {this.state.wallet.name}</label>
                                    <input type="password"
                                        id="spendingPassword"
                                        className="form-control "
                                        onChange={e => this.setPassword(e.target.value)}
                                        value={this.state.password}
                                    />
                                </div>
                                : null
                        }
                        <div className='d-flex flex-row justify-content-between'>
                            <div></div>

                            <button className="btn btn-outline-info"
                                onClick={this.signTx}>
                                Sign
                            </button>
                            <button className="btn btn-outline-info"
                                onClick={this.cancelSigning}>
                                Cancel
                            </button>
                            <div></div>
                        </div>
                    </Fragment>

                    <br />
                </div>
            </Fragment>
        )
    }
}