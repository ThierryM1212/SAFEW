import React, { Fragment } from 'react';
import Address from './Address';
import ValidInput from './ValidInput';
import ImageButton from './ImageButton';
import { NANOERG_TO_ERG, SUGGESTED_TRANSACTION_FEE, VERIFIED_TOKENS } from '../utils/constants';
import { waitingAlert } from '../utils/Alerts';
import { getWalletById, getWalletAddressList, formatERGAmount, formatTokenAmount, getSummaryFromAddressListContent, getSummaryFromSelectedAddressListContent, getAddressListContent, decryptMnemonic, formatLongString, getWalletUsedAddressList, getUnconfirmedTransactionsForAddressList } from '../utils/walletUtils';
import { createTxOutputs, createUnsignedTransaction, getUtxosForSelectedInputs, isValidErgAddress } from '../ergo-related/ergolibUtils';
import { tokenFloatToAmount } from '../ergo-related/serializer';
import TokenLabel from './TokenLabel';
import JSONBigInt from 'json-bigint';
import SignTransaction from './SignTransaction';
import Switch from "react-switch";

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
            wallet: undefined,
            selectedAddresses: [],
            addressContentList: [],
            txFee: SUGGESTED_TRANSACTION_FEE / NANOERG_TO_ERG,
            isValidTxFee: true,
            isSendAll: false,
            burnMode: false,
        };
        this.setSendToAddress = this.setSendToAddress.bind(this);
        this.setErgsToSend = this.setErgsToSend.bind(this);
        this.setTokenToSend = this.setTokenToSend.bind(this);
        this.validateTokenAmount = this.validateTokenAmount.bind(this);
        this.setSendAll = this.setSendAll.bind(this);
        this.toggleBurnMode = this.toggleBurnMode.bind(this);
        this.getTransactionJson = this.getTransactionJson.bind(this);
    }
    async setSendToAddress(address) {
        const isValid = await isValidErgAddress(address);
        this.setState({
            sendToAddress: address,
            isValidSendToAddress: isValid,
        })
    }
    toggleSelectedAddresses = () => { this.setState(prevState => ({ viewSelectAddress: !prevState.viewSelectAddress })) }
    async toggleBurnMode () {
        const wallet = await getWalletById(this.state.walletId);
        const walletAddressList = getWalletAddressList(wallet);
        if (!this.state.burnMode) {
            this.setState(prevState => ({
                burnMode: !prevState.burnMode,
                tokenAmountToSend: new Array(this.state.tokens.length).fill('0'),
                isValidTokenAmountToSend: new Array(this.state.tokens.length).fill(true),
                selectedAddresses: new Array(walletAddressList.length).fill(true),
                sendToAddress: wallet.changeAddress,
                isValidSendToAddress: true,
                ergsToSend: "0.002",
                isValidErgToSend: this.validateErgAmount("0.002", this.state.txFee),
                isSendAll: false,
            }));
        } else {
            this.setState(prevState => ({
                burnMode: !prevState.burnMode,
                tokenAmountToSend: new Array(this.state.tokens.length).fill('0'),
                isValidTokenAmountToSend: new Array(this.state.tokens.length).fill(true),
                selectedAddresses: new Array(walletAddressList.length).fill(true),
                sendToAddress: '',
                isValidSendToAddress: false,
                ergsToSend: "0",
                isValidErgToSend: false,
            }));
        }
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
        const alert = waitingAlert("Loading wallet content...");
        const wallet = await getWalletById(this.state.walletId);
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
            tokenAmountToSend: new Array(tokens.length).fill('0'),
            isValidTokenAmountToSend: new Array(tokens.length).fill(true),
            selectedAddresses: new Array(walletAddressList.length).fill(true),
            addressContentList: addressContentList,
            walletAddressList: walletAddressList,
            wallet: wallet,
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
        alert.close();
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
        //console.log("validateTokenAmount", token, tokenDecimals, tokAmount)
        const tokAmountStr = tokAmount.toString();
        var tokenAmount = BigInt(0);
        if (tokAmountStr.indexOf('.') > -1) {
            var str = tokAmountStr.split(".");
            str[1] = str[1].replace(/0+$/g, ""); //remove trailing 0
            //console.log("validateTokenAmount2", str[1].length)
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

    async getTransactionJson() {
        const alert = waitingAlert("Preparing the transactions...");
        const amountToSendFloat = parseFloat(this.state.ergsToSend);
        const feeFloat = parseFloat(this.state.txFee);
        const totalAmountToSendFloat = amountToSendFloat + feeFloat;
        const wallet = await getWalletById(this.state.walletId);
        const selectedAddresses = this.state.walletAddressList.filter((addr, id) => this.state.selectedAddresses[id]);
        const [selectedUtxos, memPoolTransaction] = await getUtxosForSelectedInputs(selectedAddresses,
            totalAmountToSendFloat, this.state.tokens, this.state.tokenAmountToSend);
        //console.log("this.state.tokenAmountToSend", this.state.tokens, this.state.tokenAmountToSend)
        const tokenAmountToSendInt = this.state.tokenAmountToSend.map((amountFloat, id) =>
            tokenFloatToAmount(amountFloat.toString(), this.state.tokens[id].decimals)
        );
        //console.log("getTransactionJson", tokenAmountToSendInt)
        //console.log("sendTransaction", amountToSendFloat, feeFloat, wallet);
        const outputCandidates = await createTxOutputs(selectedUtxos, this.state.sendToAddress, wallet.changeAddress,
            amountToSendFloat, feeFloat, this.state.tokens, tokenAmountToSendInt, {}, this.state.burnMode);
        const unsignedTransaction = await createUnsignedTransaction(selectedUtxos, outputCandidates);
        var jsonUnsignedTx = JSONBigInt.parse(unsignedTransaction.to_json());
        //for (const i in jsonUnsignedTx.inputs) {
        //    for (const j in selectedUtxos) {
        //        if (selectedUtxos[j].boxId === jsonUnsignedTx.inputs[i].boxId) {
        //            jsonUnsignedTx.inputs[i] = selectedUtxos[j];
        //        }
        //    }
        //}
        console.log("sendTransaction unsignedTransaction", jsonUnsignedTx);
        alert.close();
        return [jsonUnsignedTx, selectedUtxos, memPoolTransaction];
    }

    render() {
        var walletColor = { r: 141, g: 140, b: 143, a: 1 };
        if(this.state.wallet){
            walletColor = this.state.wallet.color;
        }
        return (
            <Fragment>
                <div className='container card m-1 p-1 d-flex flex-column w-75'
                    style={{ borderColor: `rgba(${walletColor.r},${walletColor.g},${walletColor.b}, 0.95)`, }}
                >
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <h5>Send ERGs and tokens - Wallet {this.state.wallet ? this.state.wallet.name : null }</h5>
                        <div className='d-flex flex-row align-items-center '>
                            <div className='d-flex flex-row align-items-baseline'>
                                <h5>Burn mode</h5>
                                <ImageButton
                                    id={"burnModeInfo"}
                                    color={"white"}
                                    icon={"info"}
                                    tips={"Create a transaction to burn tokens.<br/>Certified tokens like SigUSD or SigRSV cannot be added to the burn transaction."}
                                />
                            </div>
                            <Switch
                                checked={this.state.burnMode}
                                onChange={this.toggleBurnMode}
                                onColor="#216A94"
                                onHandleColor="#2693e6"
                                handleDiameter={30}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                                height={20}
                                width={48}
                                className="react-switch col-sm"
                                id="switch"
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
                            disabled={this.state.burnMode}
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
                                                disabled={this.state.isSendAll || this.state.burnMode}
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
                                                <TokenLabel name={tok.name} tokenId={tok.tokenId} decimals={tok.decimals} />
                                            </td>
                                            <td>{formatTokenAmount(tok.amount, tok.decimals, false)}</td>
                                            <td>
                                                <div className='d-flex flex-row justify-content-center align-content-center'>
                                                    <ImageButton
                                                        id={"selectAlltokId" + tok.tokenId}
                                                        color={"blue"}
                                                        icon={"select_all"}
                                                        tips={"Select all"}
                                                        onClick={() => {
                                                            if (!(this.state.burnMode && Object.keys(VERIFIED_TOKENS).includes(tok.tokenId))) {
                                                                this.setTokenToSend(index, (tok.amount / Math.pow(10, tok.decimals)).toString())
                                                            }
                                                        }
                                                    }
                                                    />
                                                    <input type="text"
                                                        pattern={parseInt(tok.decimals) > 0 ? "[0-9]+([\\.,][0-9]{0," + tok.decimals + "})?" : "[0-9]+"}
                                                        id={"tokAmount" + tok.tokenId}
                                                        key={"tokAmount" + tok.tokenId}
                                                        className="form-control"
                                                        onChange={e => this.setTokenToSend(index, e.target.value)}
                                                        value={this.state.tokenAmountToSend[index]}
                                                        disabled={this.state.isSendAll || (this.state.burnMode && Object.keys(VERIFIED_TOKENS).includes(tok.tokenId))}
                                                    />
                                                    <ValidInput id={"isValidTokAmount" + tok.tokenId}
                                                        isValid={this.state.isValidTokenAmountToSend[index]}
                                                        validMessage='OK'
                                                        invalidMessage='Invalid ERG amount' />
                                                </div>
                                            </td>
                                        </tr>
                                    )
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
                                    disabled={this.state.burnMode}
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

                        <SignTransaction walletId={this.state.walletId}
                            isValidTx={(this.state.isValidSendToAddress
                                && this.state.isValidErgToSend
                                && this.state.isValidTokenAmountToSend.every(Boolean)
                                && this.state.isValidTxFee)}
                            sendToAddress={this.state.sendToAddress}
                            signAddressList={this.state.walletAddressList.filter((addr, id) => this.state.selectedAddresses[id])}
                            txFee={this.state.txFee}
                            setPage={this.state.setPage}
                            getTransactionJson={this.getTransactionJson}
                        />

                    </div>
                </div>
            </Fragment>
        )
    }
}
