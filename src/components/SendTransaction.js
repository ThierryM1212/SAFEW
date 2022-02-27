import React, { Fragment } from 'react';
import Address from './Address';
import ValidInput from './ValidInput';
import ImageButton from './ImageButton';
import { NANOERG_TO_ERG, SUGGESTED_TRANSACTION_FEE } from '../utils/constants';
import { errorAlert, promptPassword, waitingAlert } from '../utils/Alerts';
import { getWalletById, getWalletAddressList, formatERGAmount, formatTokenAmount, getSummaryFromAddressListContent, getSummaryFromSelectedAddressListContent, getAddressListContent, decryptMnemonic, formatLongString, getWalletUsedAddressList, getUnconfirmedTransactionsForAddressList } from '../utils/walletUtils';
import { createTxOutputs, createUnsignedTransaction, getTxReducedB64Safe, getUtxosForSelectedInputs, isValidErgAddress } from '../ergo-related/ergolibUtils';
import { getWalletForAddresses, signTransaction, tokenFloatToAmount } from '../ergo-related/serializer';
import { sendTx } from '../ergo-related/node';
import { getUtxoBalanceForAddressList, parseSignedTx } from '../ergo-related/utxos';
import BigQRCode from './BigQRCode';
import TokenLabel from './TokenLabel';
import JSONBigInt from 'json-bigint';

/* global BigInt */

export default class SendTransaction extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            walletId: props.walletId,
            setPage: props.setPage,
            iniTran: props.iniTran,
            sendToAddress: props.iniTran.address,
            isValidSendToAddress: false,
            tokens: [],
            nanoErgs: [],
            ergsToSend: props.iniTran.amount / NANOERG_TO_ERG,
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
            ergoPayTxId: "",
            ergoPayUnsignedTx: "",
        };
        this.setSendToAddress = this.setSendToAddress.bind(this);
        this.sendTransaction = this.sendTransaction.bind(this);
        this.setErgsToSend = this.setErgsToSend.bind(this);
        this.setTokenToSend = this.setTokenToSend.bind(this);
        this.validateTokenAmount = this.validateTokenAmount.bind(this);
        this.setSendAll = this.setSendAll.bind(this);
        this.getTransactionJson = this.getTransactionJson.bind(this);
        this.openInTxBuilder = this.openInTxBuilder.bind(this);
        this.timer = this.timer.bind(this);
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

    async selectUnselectAddresses(id) {
        const nextSelectedAddresses = [
            ...this.state.selectedAddresses.slice(0, id),
            !this.state.selectedAddresses[id],
            ...this.state.selectedAddresses.slice(id + 1)
        ]
        const [nanoErgs, tokens] = getSummaryFromSelectedAddressListContent(this.state.walletAddressList, this.state.addressContentList, nextSelectedAddresses);
        this.setState({
            selectedAddresses: nextSelectedAddresses,
            tokens: tokens,
            nanoErgs: nanoErgs,
            ergsToSend: this.state.ergsToSend,
            isValidErgToSend: this.validateErgAmount(this.state.ergsToSend, this.state.txFee, nanoErgs),
        })
    }

    async componentDidMount() {
        const wallet = getWalletById(this.state.walletId);
        var walletAddressList = getWalletAddressList(wallet);
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
            tokenAmountToSend: new Array(tokens.length).fill('0.0'),
            isValidTokenAmountToSend: new Array(tokens.length).fill(true),
            selectedAddresses: new Array(walletAddressList.length).fill(true),
            addressContentList: addressContentList,
            walletAddressList: walletAddressList,
        });

        // init the transaction from iniTran param
        this.setErgsToSend(this.state.ergsToSend);
        this.setSendToAddress(this.state.sendToAddress);
        if (Object.keys(this.state.iniTran).includes("tokens")) {
            //console.log("componentDidMount", this.state.addressContentList, this.state.walletAddressList);
            // add the tokens requested by the transaction with 0 amount if missing
            var newTokens = [...this.state.tokens], newTokenAmountToSend = [...this.state.tokenAmountToSend];
            for (const requestedToken of this.state.iniTran.tokens) {
                const tokIndex = newTokens.findIndex(tok => tok.tokenId === requestedToken.tokenId);
                const tokDisplayAmount = requestedToken.amount / Math.pow(10, requestedToken.decimals);
                //console.log("componentDidMount2", tokIndex, tokDisplayAmount, newTokens);
                if (tokIndex < 0) {
                    newTokens.push({
                        tokenId: requestedToken.tokenId,
                        amount: 0,
                        name: requestedToken.name,
                        decimals: requestedToken.decimals,
                    })
                    newTokenAmountToSend.push(tokDisplayAmount);
                } else {
                    newTokenAmountToSend[tokIndex] = tokDisplayAmount;
                }
            }
            this.setState({
                tokens: newTokens,
                tokenAmountToSend: newTokenAmountToSend,
            });
            this.setState({
                isValidTokenAmountToSend: newTokenAmountToSend.map((amount, index) => this.validateTokenAmount(index, amount)),
            });
        }
    }

    setErgsToSend = (ergAmount) => {
        this.setState({
            ergsToSend: ergAmount,
            isValidErgToSend: this.validateErgAmount(ergAmount, this.state.txFee),
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

    validateErgAmount = (ergAmount, txFee = 0, nanoErgs = this.state.nanoErgs) => {
        const ergAmountFloat = parseFloat(ergAmount);
        if (txFee === 0) { txFee = parseFloat(this.state.txFee) }
        //console.log("validateErgAmount", ergAmountFloat, txFee, this.state.nanoErgs / NANOERG_TO_ERG, ergAmount + txFee)
        //console.log("validateErgAmount2", ergAmountFloat >= 0.001, txFee, ergAmountFloat + parseFloat(txFee), this.state.nanoErgs / NANOERG_TO_ERG)
        return (ergAmountFloat >= 0.001 && (ergAmountFloat + parseFloat(txFee)) <= (nanoErgs / NANOERG_TO_ERG));
    }

    validateTokenAmount = (index, tokAmount) => {
        if (tokAmount === '' || tokAmount === undefined) { return true; };
        const token = this.state.tokens[index];
        const tokenDecimals = parseInt(token.decimals);
        console.log("validateTokenAmount", token, tokenDecimals, tokAmount)
        const tokAmountStr = tokAmount.toString();
        var tokenAmount = BigInt(0);
        if (tokAmountStr.indexOf('.') > -1) {
            var str = tokAmountStr.split(".");
            str[1] = str[1].replace(/0+$/g, ""); //remove trailing 0
            console.log("validateTokenAmount2", str[1].length)
            if (str[1].length > tokenDecimals) {
                return false;
            } else {
                tokenAmount = BigInt(str[0]) * BigInt(Math.pow(10, tokenDecimals)) + BigInt(str[1] + '0'.repeat(tokenDecimals - str[1].length));
            }
        } else {
            tokenAmount = BigInt(tokAmount.toString()) * BigInt(Math.pow(10, tokenDecimals));
        }
        return (tokenAmount >= 0 && tokenAmount <= BigInt(token.amount));
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    async timer() {
        const wallet = getWalletById(this.state.walletId);
        const walletAddressList = getWalletAddressList(wallet);
        const unconfirmedTransactions = await getUnconfirmedTransactionsForAddressList(walletAddressList, false);
        const unconfirmedTransactionsIdFiltered = unconfirmedTransactions.map(tx => tx.transactions).flat();
        const ourTx = unconfirmedTransactionsIdFiltered.filter(tx => tx !== undefined && tx.id === this.state.ergoPayTxId);
        if (ourTx.length > 0) {
            var fixedTx = parseSignedTx(ourTx[0]);
            fixedTx.id = this.state.txId;
            //console.log("fixedTx", fixedTx);
            clearInterval(this.state.intervalId);
            this.state.setPage('transactions', this.state.walletId);
        }
    }

    async getTransactionJson() {
        const amountToSendFloat = parseFloat(this.state.ergsToSend);
        const feeFloat = parseFloat(this.state.txFee);
        const totalAmountToSendFloat = amountToSendFloat + feeFloat;
        const wallet = getWalletById(this.state.walletId);
        const selectedAddresses = this.state.walletAddressList.filter((addr, id) => this.state.selectedAddresses[id]);
        const selectedUtxos = await getUtxosForSelectedInputs(selectedAddresses,
            totalAmountToSendFloat, this.state.tokens, this.state.tokenAmountToSend);
        //console.log("this.state.tokenAmountToSend", this.state.tokenAmountToSend)
        const tokenAmountToSendInt = this.state.tokenAmountToSend.map((amountFloat, id) => 
            //Math.round(parseFloat(amountFloat.toString()) * Math.pow(10, parseInt(this.state.tokens[id].decimals)))
            
            tokenFloatToAmount(amountFloat.toString(), this.state.tokens[id].decimals)
        );

        console.log("getTransactionJson", tokenAmountToSendInt)

        //console.log("sendTransaction", amountToSendFloat, feeFloat, wallet);
        const outputCandidates = await createTxOutputs(selectedUtxos, this.state.sendToAddress, wallet.changeAddress,
            amountToSendFloat, feeFloat, this.state.tokens, tokenAmountToSendInt);

        const unsignedTransaction = await createUnsignedTransaction(selectedUtxos, outputCandidates);
        const jsonUnsignedTx = JSONBigInt.parse(unsignedTransaction.to_json());
        //console.log("sendTransaction unsignedTransaction", jsonUnsignedTx);
        return [jsonUnsignedTx, selectedUtxos];
    }

    async sendTransaction() {
        var alert = waitingAlert("Preparing the transaction...");
        const wallet = getWalletById(this.state.walletId);
        const feeFloat = parseFloat(this.state.txFee);
        const selectedAddresses = this.state.walletAddressList.filter((addr, id) => this.state.selectedAddresses[id]);
        const [jsonUnsignedTx, selectedUtxos] = await this.getTransactionJson();
        alert.close();

        if (wallet.ergoPayOnly) {
            const [txId, txReducedB64safe] = await getTxReducedB64Safe(jsonUnsignedTx, selectedUtxos);
            var intervalId = setInterval(this.timer, 3000);
            this.setState({
                ergoPayTxId: txId,
                ergoPayUnsignedTx: txReducedB64safe,
                intervalId: intervalId,
            })
        } else {
            const txBalance = await getUtxoBalanceForAddressList(jsonUnsignedTx.inputs, jsonUnsignedTx.outputs, getWalletAddressList(wallet));
            const txBalanceReceiver = await getUtxoBalanceForAddressList(jsonUnsignedTx.inputs, jsonUnsignedTx.outputs, [this.state.sendToAddress]);
            console.log("sendTransaction txBalance", txBalance, txBalanceReceiver);

            var txSummaryHtml = "<div class='card m-1 p-1'><table class='txSummarry'><tbody>";
            txSummaryHtml += "<thead><th colspan='2'>Sending to: &nbsp;" + formatLongString(this.state.sendToAddress, 10) + "</th></thead>";
            txSummaryHtml += "<tr><td class='textSmall'>Amount</td><td>" + formatERGAmount(txBalanceReceiver.value) + "&nbsp;ERG</td></tr>";
            txSummaryHtml += "<tr><td class='textSmall'>Fee</td><td>" + formatERGAmount(feeFloat * NANOERG_TO_ERG) + "&nbsp;ERG</td></tr>";
            txSummaryHtml += "<tr><td class='textSmall'><b>Total</b></td><td><b>" + formatERGAmount(BigInt(-1) * txBalance.value) + "&nbsp;ERG</b></td></tr>";
            txSummaryHtml += "</tbody></table>";
            if (txBalance.tokens.length > 0) {
                txSummaryHtml += "<table class='txSummarry'><tbody>";
                txSummaryHtml += "<thead><th colspan='2'>Tokens</th></thead>";
                for (const token of txBalance.tokens) {
                    console.log("sendTransaction token.amount", token.name, token.amount)
                    txSummaryHtml += "<tr><td class='textSmall'>" + token.name + "</td><td class='textSmall'>" + formatTokenAmount(BigInt(-1) * token.amount, token.decimals) + "</td></tr>";
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
            //console.log("signingWallet", signingWallet);
            var signedTx = {};

            try {
                signedTx = JSONBigInt.parse(await signTransaction(jsonUnsignedTx, selectedUtxos, [], signingWallet));
                console.log("signedTx", signedTx);
            } catch (e) {
                errorAlert("Failed to sign transaction", e);
                return;
            }
            await sendTx(signedTx);
            //await delay(3000);
            this.state.setPage('transactions', this.state.walletId);
        }
    }

    async openInTxBuilder() {
        const jsonUnsignedTx = (await this.getTransactionJson())[0];
        this.state.setPage('txbuilder', this.state.walletId, jsonUnsignedTx);
    }

    render() {
        const wallet = getWalletById(this.state.walletId);
        const expertMode = (localStorage.getItem('expertMode') === 'true') ?? false;
        return (
            <Fragment>
                <div className='container card m-1 p-1 d-flex flex-column w-75'
                    style={{ borderColor: `rgba(${wallet.color.r},${wallet.color.g},${wallet.color.b}, 0.95)`, }}
                >
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <h5>Send ERGs and tokens - Wallet {wallet.name}</h5>
                        <div className='d-flex flex-row '>
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
                                                <TokenLabel name={tok.name} tokenId={tok.tokenId} />
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

                        {
                            this.state.ergoPayTxId === "" ? null :
                                <div className='d-flex flex-column'>
                                    <div className='d-flex flex-row '>
                                        Ergopay transaction
                                        <ImageButton
                                            id={"ergoTxInfo"}
                                            color={"white"}
                                            icon={"info"}
                                            tips={"Ergopay transaction (EIP-19)"}
                                        />
                                    </div>
                                    <div className='d-flex flex-row justify-content-center'>
                                        <BigQRCode QRCodeTx={this.state.ergoPayUnsignedTx} />
                                    </div>
                                </div>
                        }

                        {this.state.ergoPayTxId === "" ?
                            <div className='d-flex flex-row align-items-baseline justify-content-center'>
                                <button className="btn btn-outline-info"
                                    onClick={this.sendTransaction}
                                    disabled={!(this.state.isValidSendToAddress
                                        && this.state.isValidErgToSend
                                        && this.state.isValidTokenAmountToSend.every(Boolean)
                                        && this.state.isValidTxFee)}
                                >{wallet.ergoPayOnly ? "Ergopay" : "Send transaction"}</button>&nbsp;
                                {
                                    expertMode ?

                                        <button className="btn btn-outline-info"
                                            onClick={this.openInTxBuilder}
                                            disabled={!(this.state.isValidSendToAddress
                                                && this.state.isValidErgToSend
                                                && this.state.isValidTokenAmountToSend.every(Boolean)
                                                && this.state.isValidTxFee)}
                                        >Open in transaction builder</button>
                                        : null
                                }
                            </div>
                            : null
                        }

                    </div>
                </div>
            </Fragment>
        )
    }
}
