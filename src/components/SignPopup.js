import React, { Fragment } from 'react';
import ReactJson from 'react-json-view';
import { getTxReducedB64Safe } from '../ergo-related/ergolibUtils';
import { boxByBoxId } from '../ergo-related/explorer';
import { getWalletForAddresses, signTransaction } from '../ergo-related/serializer';
import { getUtxoBalanceForAddressList, parseSignedTx, parseUnsignedTx, parseUtxos } from '../ergo-related/utxos';
import { errorAlert, waitingAlert } from '../utils/Alerts';
import { TX_FEE_ERGO_TREE } from '../utils/constants';
import { decryptMnemonic, formatERGAmount, formatTokenAmount, getConnectedWalletByURL, getUnconfirmedTransactionsForAddressList, getWalletAddressList, getWalletUsedAddressList } from '../utils/walletUtils';
import BigQRCode from './BigQRCode';

/* global chrome */

export default class SignPopup extends React.Component {
    constructor(props) {
        super(props);
        const urlFixed = new URL(window.location.href.replace("#sign_tx", '').replace("chrome-extension", "http"));
        const urlOrgigin = urlFixed.searchParams.get("origin");
        const connectedWallet = getConnectedWalletByURL(urlOrgigin);
        const background = chrome.extension.getBackgroundPage();
        const requestId = parseInt(urlFixed.searchParams.get("requestId"));
        const tx = background.transactionsToSign.get(requestId);
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
        this.getReducedTxState = this.getReducedTxState.bind(this);
        this.timer = this.timer.bind(this);
        if (connectedWallet.ergoPayOnly) {
            this.showTxReduced();
        }

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
        var intervalId = setInterval(this.timer, 5000);
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
        console.log("timer1", unconfirmedTransactions2);
        const ourTx = unconfirmedTransactions2.filter(tx => tx !== undefined && tx.id === this.state.txId);
        console.log("timer2", ourTx, this.state.txId);
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
        this.setState({
            txBalance: txBalance,
        });
        console.log("sendTransaction txBalance", txBalance);
    }

    async signTx() {
        console.log("signTx", this.state)
        const walletAddressList = getWalletUsedAddressList(this.state.wallet);
        const mnemonic = decryptMnemonic(this.state.wallet.mnemonic, this.state.password);
        if (mnemonic === null) {
            return;
        }
        if (mnemonic === '' || mnemonic === undefined) {
            errorAlert("Failed to decrypt Mnemonic", "Wrong password ?");
            return;
        }
        try {
            const signingWallet = await getWalletForAddresses(mnemonic, walletAddressList);
            const inputsDetails = parseUtxos(await Promise.all(this.state.unSignedTx.inputs.map(async (box) => {
                return await boxByBoxId(box.boxId);
            })));
            const dataInputsDetails = parseUtxos(await Promise.all(this.state.unSignedTx.dataInputs.map(async (box) => {
                return await boxByBoxId(box.boxId);
            })));
            var signedTx = {};
            signedTx = await signTransaction(this.state.unSignedTx, inputsDetails, dataInputsDetails, signingWallet);
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
                <div className='card w-75 m-1 p-1 d-flex flex-column' style={{ borderColor: this.state.wallet.color }}>
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
                        this.state.txId === "" ?
                            null
                            :
                            <div className='card m-1 p-1'>
                                <h6>Ergopay transaction</h6>
                                <BigQRCode QRCodeTx={this.state.txReducedB64safe} />
                                <br />
                            </div>
                    }
                    { this.state.wallet.ergoPayOnly ? (<Fragment></Fragment>) : (<Fragment>
                    <button className="btn btn-outline-info"
                        onClick={this.showTxReduced}>
                        Show Ergopay transaction
                    </button>
                    <div className='card m-1 p-1 d-flex flex-column'>
                        <label htmlFor="walletPassword" >Spending password for {this.state.wallet.name}</label>
                        <input type="password"
                            id="spendingPassword"
                            className="form-control "
                            onChange={e => this.setPassword(e.target.value)}
                            value={this.state.password}
                        />
                    </div></Fragment>)}
                    <div className='d-flex flex-row justify-content-between'>
                        <div></div>
                        { this.state.wallet.ergoPayOnly ? (<Fragment></Fragment>) : (<Fragment>
                        <button className="btn btn-outline-info"
                            onClick={this.signTx}>
                            Sign
                        </button></Fragment>)}
                        <button className="btn btn-outline-info"
                            onClick={this.cancelSigning}>
                            Cancel
                        </button>
                        <div></div>
                    </div>
                    <br />
                </div>
            </Fragment>
        )
    }
}