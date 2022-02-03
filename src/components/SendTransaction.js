import React, { Fragment } from 'react';
import Address from './Address';
import ValidInput from './ValidInput';
import ImageButton from './ImageButton';
import { NANOERG_TO_ERG, SUGGESTED_TRANSACTION_FEE, VERIFIED_TOKENS } from '../utils/constants';
import { copySuccess, errorAlert, promptPassword } from '../utils/Alerts';
import { getWalletById, getWalletAddressList, formatERGAmount, formatTokenAmount, getSummaryFromAddressListContent, getSummaryFromSelectedAddressListContent, getAddressListContent, decryptMnemonic, formatLongString, getWalletUsedAddressList } from '../utils/walletUtils';
import { createTxOutputs, createUnsignedTransaction, getUtxosForSelectedInputs, isValidErgAddress } from '../ergo-related/ergolibUtils';
import { getWalletForAddresses, signTransaction } from '../ergo-related/serializer';
import { sendTx } from '../ergo-related/node';
import { getUtxoBalanceForAddressList } from '../ergo-related/utxos';
import VerifiedTokenImage from './VerifiedTokenImage';

export default class SendTransaction extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            setPage: props.setPage,
            sendToAddress: '',
            isValidSendToAddress: false,
            tokens: [],
            nanoErgs: [],
            ergsToSend: 0,
            isValidErgToSend: false,
            tokenAmountToSend: [],
            isValidTokenAmountToSend: [],
            viewSelectAddress: false,
            walletAddressList: [],
            selectedAddresses: [],
            addressContentList: [],
            txFee: SUGGESTED_TRANSACTION_FEE / NANOERG_TO_ERG,
            isValidTxFee: true,
            isSendAll: false,
        };
        this.setSendToAddress = this.setSendToAddress.bind(this);
        this.sendTransaction = this.sendTransaction.bind(this);
        this.setErgsToSend = this.setErgsToSend.bind(this);
        this.setTokenToSend = this.setTokenToSend.bind(this);
        this.validateTokenAmount = this.validateTokenAmount.bind(this);
        this.setSendAll = this.setSendAll.bind(this);
        this.updateWalletContent = this.updateWalletContent.bind(this);
    }

    async setSendToAddress(address) {
        const isValid = await isValidErgAddress(address);
        console.log("setSendToAddress", address, isValid);
        this.setState({
            sendToAddress: address,
            isValidSendToAddress: isValid,
        })
    }

    toggleSelectedAddresses = () => {
        this.setState(prevState => ({ viewSelectAddress: !prevState.viewSelectAddress }))
    }

    selectUnselectAddresses = (id) => {
        const nextSelectedAddresses = [
            ...this.state.selectedAddresses.slice(0, id),
            !this.state.selectedAddresses[id],
            ...this.state.selectedAddresses.slice(id + 1)
        ]
        console.log("selectUnselectAddresses", this.state.addressContentList);
        const [nanoErgs, tokens] = getSummaryFromSelectedAddressListContent(this.state.walletAddressList, this.state.addressContentList, nextSelectedAddresses);
        this.setState({
            selectedAddresses: nextSelectedAddresses,
            tokens: tokens,
            nanoErgs: nanoErgs,
            tokenAmountToSend: new Array(tokens.length).fill(0.0),
            isValidTokenAmountToSend: new Array(tokens.length).fill(true),
        })
    }

    async updateWalletContent() {
        const wallet = getWalletById(this.state.walletId);
        var walletAddressList = getWalletUsedAddressList(wallet);
        var addressContentList = await getAddressListContent(walletAddressList);
        // remove 0 erg addresses
        var i = walletAddressList.length;
        while (i--) {
            if (addressContentList[i].content.nanoErgs === 0) {
                walletAddressList.splice(i, 1);
                addressContentList.splice(i, 1);
            }
        }
        const [nanoErgs, tokens] = getSummaryFromAddressListContent(addressContentList);
        this.setState({
            tokens: tokens,
            nanoErgs: nanoErgs,
            ergsToSend: 0,
            tokenAmountToSend: new Array(tokens.length).fill(0.0),
            isValidTokenAmountToSend: new Array(tokens.length).fill(true),
            selectedAddresses: new Array(walletAddressList.length).fill(true),
            addressContentList: addressContentList,
            walletAddressList: walletAddressList,
        });
    }

    async componentDidMount() {
        await this.updateWalletContent();
    }

    setErgsToSend = (ergAmount) => {
        this.setState({
            ergsToSend: ergAmount,
            isValidErgToSend: this.validateErgAmount(ergAmount),
        })
    }

    setTxFee = (txFee) => {
        this.setState({
            txFee: txFee,
            isValidTxFee: this.validateTxFee(txFee),
            isValidErgToSend: this.validateErgAmount(this.state.ergsToSend, txFee),
        })
    }

    setSendAll = () => {
        if (!this.state.isSendAll) {
            const ergAmmount = this.state.nanoErgs / NANOERG_TO_ERG - parseFloat(this.state.txFee);
            this.setState(prevState => ({
                isSendAll: !prevState.isSendAll,
                tokenAmountToSend: [...prevState.tokens.map(tok => tok.amount / Math.pow(10, tok.decimals))],
                ergsToSend: ergAmmount,
                isValidErgToSend: this.validateErgAmount(ergAmmount, prevState.txFee),
            }))
        } else {
            this.setState(prevState => ({
                isSendAll: !prevState.isSendAll,

            }))
        }


    }

    setTokenToSend = (index, tokAmount) => {
        console.log("setTokenToSend", tokAmount)
        var amount = tokAmount.toString().replaceAll(",", '.');
        if (tokAmount === '') { amount = '0'; }
        this.setState(prevState => ({
            tokenAmountToSend: [
                ...prevState.tokenAmountToSend.slice(0, index),
                amount,
                ...prevState.tokenAmountToSend.slice(index + 1)
            ],
            isValidTokenAmountToSend: [
                ...prevState.isValidTokenAmountToSend.slice(0, index),
                this.validateTokenAmount(index, amount),
                ...prevState.isValidTokenAmountToSend.slice(index + 1)
            ],
        }))
    }

    validateTxFee = (txFee) => {
        return (txFee >= SUGGESTED_TRANSACTION_FEE / NANOERG_TO_ERG && txFee <= 0.1);
    }

    validateErgAmount = (ergAmount, txFee = 0) => {
        const ergAmountFloat = parseFloat(ergAmount);
        if (txFee === 0) { txFee = this.state.txFee }
        console.log(ergAmountFloat, txFee, this.state.nanoErgs / NANOERG_TO_ERG, ergAmount + txFee)
        return (ergAmount >= 0.001 && (ergAmountFloat + parseFloat(txFee)) <= (this.state.nanoErgs / NANOERG_TO_ERG));
    }

    validateTokenAmount = (index, tokAmount) => {
        if (tokAmount === '' || tokAmount === undefined) { return true; };
        const token = this.state.tokens[index];
        const tokenDecimals = parseInt(token.decimals);
        console.log("validateTokenAmount", tokAmount)
        const tokAmountStr = tokAmount.toString();
        var tokenAmount = 0;
        if (tokAmountStr.indexOf('.') > -1) {
            var str = tokAmountStr.split(".");
            str[1] = str[1].replace(/0+$/g, ""); //remove trailing 0

            tokenAmount = parseInt(str[0]) * Math.pow(10, tokenDecimals) + parseInt(str[1] + '0'.repeat(tokenDecimals - str[1].length));
        } else {
            tokenAmount = parseInt(tokAmount.toString()) * Math.pow(10, tokenDecimals);
        }

        return (tokenAmount >= 0 && tokenAmount <= parseInt(token.amount));

    }

    async sendTransaction() {
        const amountToSendFloat = parseFloat(this.state.ergsToSend);
        const feeFloat = parseFloat(this.state.txFee);
        const totalAmountToSendFloat = amountToSendFloat + feeFloat;
        const wallet = getWalletById(this.state.walletId);
        const selectedAddresses = this.state.walletAddressList.filter((addr, id) => this.state.selectedAddresses[id]);
        const selectedUtxos = await getUtxosForSelectedInputs(selectedAddresses,
            totalAmountToSendFloat, this.state.tokens, this.state.tokenAmountToSend);
        console.log("this.state.tokenAmountToSend", this.state.tokenAmountToSend)
        const tokenAmountToSendInt = this.state.tokenAmountToSend.map((amountFloat, id) =>
            Math.round(parseFloat(amountFloat.toString()) * Math.pow(10, parseInt(this.state.tokens[id].decimals))));
        console.log("sendTransaction", amountToSendFloat, feeFloat, wallet);
        const outputCandidates = await createTxOutputs(selectedUtxos, this.state.sendToAddress, wallet.changeAddress,
            amountToSendFloat, feeFloat, this.state.tokens, tokenAmountToSendInt);

        const unsignedTransaction = await createUnsignedTransaction(selectedUtxos, outputCandidates);
        const jsonUnsignedTx = JSON.parse(unsignedTransaction.to_json());
        console.log("sendTransaction unsignedTransaction", jsonUnsignedTx);

        const txBalance = await getUtxoBalanceForAddressList(jsonUnsignedTx.inputs, jsonUnsignedTx.outputs, selectedAddresses);
        const txBalanceReceiver = await getUtxoBalanceForAddressList(jsonUnsignedTx.inputs, jsonUnsignedTx.outputs, [this.state.sendToAddress]);
        console.log("sendTransaction txBalance", txBalance, txBalanceReceiver);

        var txSummaryHtml = "<div class='card m-1 p-1'><table class='txSummarry'><tbody>";
        txSummaryHtml += "<thead><th colspan='2'>Sending to: &nbsp;" + formatLongString(this.state.sendToAddress, 10) + "</th></thead>";
        txSummaryHtml += "<tr><td class='textSmall'>Amount</td><td>" + formatERGAmount(txBalanceReceiver.value) + "&nbsp;ERG</td></tr>";
        txSummaryHtml += "<tr><td class='textSmall'>Fee</td><td>" + formatERGAmount(feeFloat * NANOERG_TO_ERG) + "&nbsp;ERG</td></tr>";
        txSummaryHtml += "<tr><td class='textSmall'><b>Total</b></td><td><b>" + formatERGAmount(-1 * txBalance.value) + "&nbsp;ERG</b></td></tr>";
        txSummaryHtml += "</tbody></table>";
        if (txBalance.tokens.length > 0) {
            txSummaryHtml += "<table class='txSummarry'><tbody>";
            txSummaryHtml += "<thead><th colspan='2'>Tokens</th></thead>";
            for (const token of txBalance.tokens) {
                txSummaryHtml += "<tr><td class='textSmall'>" + token.name + "</td><td class='textSmall'>" + formatTokenAmount((-1) * token.amount, token.decimals) + "</td></tr>";
            }
            txSummaryHtml += "</tbody></table></div>";
        }

        const password = await promptPassword("Sign transaction for<br/>" + wallet.name, txSummaryHtml, "Sign");
        //console.log("sendTransaction password", password);
        const mnemonic = decryptMnemonic(wallet.mnemonic, password);
        if (mnemonic === null) {
            return;
        }
        if (mnemonic === '' || mnemonic === undefined) {
            errorAlert("Failed to decrypt Mnemonic", "Wrong password ?");
            return;
        }
        const signingWallet = await getWalletForAddresses(mnemonic, selectedAddresses);
        console.log("signingWallet", signingWallet);
        var signedTx = {};

        try {
            signedTx = JSON.parse(await signTransaction(unsignedTransaction, selectedUtxos, [], signingWallet));
            console.log("signedTx", signedTx);
        } catch (e) {
            errorAlert("Failed to sign transaction", e);
            return;
        }
        const res = await sendTx(signedTx);
        //await delay(3000);
        this.state.setPage('transactions', this.state.walletId);
    }

    render() {
        const wallet = getWalletById(this.state.walletId);
        console.log("isSendAll", this.state.isSendAll)
        return (
            <Fragment>
                <div className='container card m-1 p-1 d-flex flex-column w-75' style={{ borderColor: wallet.color }}>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <h5>Send ERGs and tokens - Wallet {wallet.name}</h5>
                        <div className='d-flex flex-row '>
                            <ImageButton
                                id={"backToWalletList"}
                                color={"blue"}
                                icon={"arrow_back"}
                                tips={"Wallet list"}
                                onClick={() => this.state.setPage('home')}
                            />
                            <ImageButton
                                id={"refreshTransactionPage"}
                                color={"blue"}
                                icon={"refresh"}
                                tips={"Refresh wallet content"}
                                onClick={this.updateWalletContent}
                            />
                        </div>
                    </div>
                    <div className='d-flex flex-row justify-content-left align-items-center card m-1 p-1'>
                        <label htmlFor="sendToAddress" className='col-sm-2'>Send to</label> &nbsp;
                        <input type="text"
                            size="58"
                            id="sendToAddress"
                            onChange={e => this.setSendToAddress(e.target.value)}
                            value={this.state.sendToAddress}
                            className={this.state.isValidSendToAddress ? "validInput m-1 col-sm" : "invalidInput m-1 col-sm"}
                        />
                        <ValidInput
                            id="isValidSendToAddress"
                            isValid={this.state.isValidSendToAddress}
                            validMessage="OK"
                            invalidMessage={"Invalid ERG address"}
                        />
                    </div>

                    <div className='d-flex flex-column card m-1 p-1'>
                        <label htmlFor="toggleSelectAddresses" >Select assets</label>
                        <div >
                            <div className='d-flex flex-row'>
                                <ImageButton
                                    id={"toggleSelectAddresses"}
                                    color={"blue"}
                                    icon={this.state.viewSelectAddress ? "expand_more" : "expand_less"}
                                    tips={this.state.viewSelectAddress ? "Hide wallet addresses" : "Show wallet addresses"}
                                    onClick={this.toggleSelectedAddresses}
                                />
                                {this.state.viewSelectAddress ?
                                    <div>
                                        <h6>Wallet addresses</h6>
                                        <div className='d-flex flex-column'>
                                            {
                                                this.state.walletAddressList.map((addr, id) =>
                                                    <div key={"address_" + id} className='d-flex flex-row justify-content-left align-items-center input-group'>
                                                        <div>
                                                            <input type="checkbox"
                                                                className='form-group'
                                                                data-toggle="toggle" data-onstyle="info" data-offstyle="light"
                                                                id={"addrCheckbox" + id}
                                                                defaultChecked={this.state.selectedAddresses[id]}
                                                                onChange={() => this.selectUnselectAddresses(id)}
                                                            />
                                                        </div>
                                                        <Address addressContent={this.state.addressContentList[id]} used={true} />
                                                    </div>
                                                )

                                            }
                                            <br />
                                        </div>
                                    </div>
                                    : <h6>Show wallet addresses</h6>}

                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr ><th>Asset name</th><th>Available</th><th>Selected</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><h5>ERG</h5></td>
                                    <td>{formatERGAmount(this.state.nanoErgs)}</td>
                                    <td>
                                        <div className='d-flex flex-row justify-content-center  align-items-center'>
                                            <ImageButton
                                                id={"selectAllErgs"}
                                                color={"blue"}
                                                icon={"select_all"}
                                                tips={"Select all minus transaction fee"}
                                                onClick={() => this.setErgsToSend(this.state.nanoErgs / NANOERG_TO_ERG - parseFloat(this.state.txFee))}
                                            />
                                            <input type="number"
                                                min="0.001"
                                                step="0.001"
                                                lang="en-US"
                                                id="ergAmount"
                                                key="ergAmount"
                                                className="form-control"
                                                onChange={e => this.setErgsToSend(e.target.value)}
                                                value={this.state.ergsToSend}
                                                disabled={this.state.isSendAll}
                                            />
                                            <ValidInput id="OKerg"
                                                isValid={this.state.isValidErgToSend}
                                                validMessage='OK'
                                                invalidMessage='Invalid ERG amount' />
                                        </div>
                                    </td>
                                </tr>
                                {
                                    this.state.tokens.map((tok, index) =>
                                        <tr key={index}>
                                            <td>
                                                <div className='d-flex flex-row justify-content-between align-items-center'>
                                                    <div className='d-flex flex-row align-items-center'>
                                                        {tok.name}
                                                        {
                                                            Object.keys(VERIFIED_TOKENS).includes(tok.tokenId) ?
                                                                <div>&nbsp;<VerifiedTokenImage tokenId={tok.tokenId} /></div>
                                                                : null
                                                        }
                                                    </div>
                                                    <div className='d-flex flex-row row-reverse'>
                                                        <ImageButton
                                                            id={"tokId" + tok.tokenId}
                                                            color={"blue"}
                                                            icon={"content_copy"}
                                                            tips={"Copy tokenId - " + tok.tokenId}
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(tok.tokenId);
                                                                copySuccess();
                                                            }}
                                                        />
                                                        <ImageButton
                                                            id={"openAddressExplorer" + tok.tokenId}
                                                            color={"blue"}
                                                            icon={"open_in_new"}
                                                            tips={"Open in Explorer"}
                                                            onClick={() => {
                                                                const url = localStorage.getItem('explorerWebUIAddress') + 'en/token/' + tok.tokenId;
                                                                window.open(url, '_blank').focus();
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{formatTokenAmount(tok.amount, tok.decimals, false)}</td>
                                            <td>
                                                <div className='d-flex flex-row justify-content-center align-content-center'>
                                                    <ImageButton
                                                        id={"selectAlltokId" + tok.tokenId}
                                                        color={"blue"}
                                                        icon={"select_all"}
                                                        tips={"Select all"}
                                                        onClick={() => this.setTokenToSend(index, (tok.amount / Math.pow(10, tok.decimals)).toString())}
                                                    />
                                                    <input type="text"
                                                        pattern={parseInt(tok.decimals) > 0 ? "[0-9]+([\\.,][0-9]{0," + tok.decimals + "})?" : "[0-9]+"}
                                                        id={"tokAmount" + tok.tokenId}
                                                        key={"tokAmount" + tok.tokenId}
                                                        className="form-control"
                                                        onChange={e => this.setTokenToSend(index, e.target.value)}
                                                        value={this.state.tokenAmountToSend[index]}
                                                        disabled={this.state.isSendAll}
                                                    />
                                                    <ValidInput id={"isValidTokAmount" + tok.tokenId}
                                                        isValid={this.state.isValidTokenAmountToSend[index]}
                                                        validMessage='OK'
                                                        invalidMessage='Invalid ERG amount' />

                                                </div>
                                            </td>
                                        </tr>)
                                }
                            </tbody>
                        </table>
                        <br />

                        <div className='d-flex flex-row align-items-baseline justify-content-between'>
                            <div className='d-flex flex-row align-items-baseline justify-content-start'>
                                <label htmlFor="sendAll" >Send all</label>&nbsp;
                                <input type="checkbox"
                                    className='form-group'
                                    data-toggle="toggle" data-onstyle="info" data-offstyle="light"
                                    id={"sendAllChkBox"}
                                    defaultChecked={this.state.isSendAll}
                                    onChange={this.setSendAll}
                                />
                            </div>
                            <div className='d-flex flex-row align-items-baseline justify-content-end'>
                                <label htmlFor="txFee" >Transaction fee (ERG)</label>&nbsp;
                                <input type="text"
                                    pattern={"[0-1]([\\.,][0-9]{0,4})?"}
                                    id={"txFee"}
                                    className="form-control col-sm-3"
                                    onChange={e => this.setTxFee(e.target.value)}
                                    value={this.state.txFee}
                                />
                                <ValidInput
                                    id="isValidTxFee"
                                    isValid={this.state.isValidTxFee}
                                    validMessage="OK"
                                    invalidMessage={"Transaction fee (min 0.0011, max 0.1)"}
                                />
                            </div>
                        </div>
                        <br />

                        <div className='d-flex flex-row align-items-baseline justify-content-center'>
                            <button className="btn btn-outline-info"
                                onClick={this.sendTransaction}
                                disabled={!(this.state.isValidSendToAddress
                                    && this.state.isValidErgToSend
                                    && this.state.isValidTokenAmountToSend.every(Boolean)
                                    && this.state.isValidTxFee)}
                            >Send transaction</button>
                        </div>
                    </div>
                </div>
            </Fragment>
        )
    }
}
