import React, { Fragment } from 'react';
import { getTxReducedB64Safe } from '../ergo-related/ergolibUtils';
import { sendTx } from '../ergo-related/node';
import { getWalletForAddresses, signTransaction } from '../ergo-related/serializer';
import { getUtxoBalanceForAddressList } from '../ergo-related/utxos';
import { errorAlert, promptPassword } from '../utils/Alerts';
import { NANOERG_TO_ERG } from '../utils/constants';
import { decryptMnemonic, formatERGAmount, formatLongString, formatTokenAmount, getUnconfirmedTransactionsForAddressList, getWalletAddressList, getWalletById } from '../utils/walletUtils';
import BigQRCode from './BigQRCode';
import ImageButton from './ImageButton';
import JSONBigInt from 'json-bigint';
import { postTxMempool } from '../ergo-related/explorer';
import { LS } from '../utils/utils';
import { signTxLedger } from '../ergo-related/ledger';
import { DeviceError } from 'ledgerjs-hw-app-ergo';


export default class SignTransaction extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            isValidTx: props.isValidTx,
            sendToAddress: props.sendToAddress,
            signAddressList: props.signAddressList,
            txFee: props.txFee,
            setPage: props.setPage,
            getTransactionJson: props.getTransactionJson,
            ergoPayTxId: "",
            ergoPayUnsignedTx: "",
            ergoPayOnly: false,
            expertMode: false,
        };
        this.setWalletId = this.setWalletId.bind(this);
        this.setIsValidTx = this.setIsValidTx.bind(this);
        this.setSendToAddress = this.setSendToAddress.bind(this);
        this.setSignAddressList = this.setSignAddressList.bind(this);
        this.setTxFee = this.setTxFee.bind(this);
        this.openInTxBuilder = this.openInTxBuilder.bind(this);
        this.sendTransaction = this.sendTransaction.bind(this);
        this.timer = this.timer.bind(this);
    }
    async setWalletId(walletId) {
        const wallet = await getWalletById(walletId);
        this.setState({
            walletId: walletId,
            walletType: wallet.type,
        });
    };
    setIsValidTx = (isValid) => { this.setState({ isValidTx: isValid }); };
    setSendToAddress = (addr) => { this.setState({ sendToAddress: addr }); };
    setSignAddressList = (addrList) => { this.setState({ signAddressList: addrList }); };
    setTxFee = (txFee) => { this.setState({ txFee: txFee }); };

    async componentDidUpdate(prevProps, prevState) {
        //console.log("SignTransaction componentDidUpdate", prevProps, this.props)
        if (prevProps.walletId !== this.props.walletId) { await this.setWalletId(this.props.walletId); }
        if (prevProps.isValidTx !== this.props.isValidTx) { this.setIsValidTx(this.props.isValidTx); }
        if (prevProps.sendToAddress !== this.props.sendToAddress) { this.setSendToAddress(this.props.sendToAddress); }
        if (prevProps.signAddressList !== this.props.signAddressList) { this.setSignAddressList(this.props.signAddressList); }
        if (prevProps.txFee !== this.props.txFee) { this.setTxFee(this.props.txFee); }
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    async timer() {
        const wallet = await getWalletById(this.state.walletId);
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

    async componentDidMount() {
        const wallet = await getWalletById(this.state.walletId);
        const expertMode = (await LS.getItem('expertMode')) ?? false;
        this.setState({
            walletType: wallet.type,
            expertMode: expertMode,
        })
    }

    async sendTransaction() {
        const wallet = await getWalletById(this.state.walletId);
        const feeFloat = parseFloat(this.state.txFee);
        const selectedAddresses = this.state.signAddressList;
        const [jsonUnsignedTx, selectedUtxos, memPoolTransaction] = await this.state.getTransactionJson();
        const walletAddressList = getWalletAddressList(wallet);

        if (wallet.type === 'ergopay') {
            const [txId, txReducedB64safe] = await getTxReducedB64Safe(jsonUnsignedTx, selectedUtxos);
            var intervalId = setInterval(this.timer, 3000);
            this.setState({
                ergoPayTxId: txId,
                ergoPayUnsignedTx: txReducedB64safe,
                intervalId: intervalId,
            })
        } else {
            const txBalance = await getUtxoBalanceForAddressList(jsonUnsignedTx.inputs, jsonUnsignedTx.outputs, walletAddressList);
            var txBalanceReceiver = {};
            if (!walletAddressList.includes(this.state.sendToAddress)) {
                txBalanceReceiver = await getUtxoBalanceForAddressList(jsonUnsignedTx.inputs, jsonUnsignedTx.outputs, [this.state.sendToAddress]);
            }
            //console.log("sendTransaction txBalance", txBalance, txBalanceReceiver);

            var txSummaryHtml = "<div class='card m-1 p-1'><table class='txSummarry'><tbody>";
            if (!walletAddressList.includes(this.state.sendToAddress)) {
                txSummaryHtml += "<thead><th colspan='2'>Sending to: &nbsp;" + formatLongString(this.state.sendToAddress, 10) + "</th></thead>";
                txSummaryHtml += "<tr><td class='textSmall'>Amount sent</td><td>" + formatERGAmount(txBalanceReceiver.value) + "&nbsp;ERG</td></tr>";
            } else {
                txSummaryHtml += "<thead><th colspan='2'>Intra wallet transaction</th></thead>";
            }
            txSummaryHtml += "<tr><td class='textSmall'>Erg balance for wallet</td><td>" + formatERGAmount(txBalance.value) + "&nbsp;ERG</td></tr>";
            txSummaryHtml += "<tr><td class='textSmall'>Fee</td><td>" + formatERGAmount(feeFloat * NANOERG_TO_ERG) + "&nbsp;ERG</td></tr>";
            txSummaryHtml += "<tr><td class='textSmall'><b>Total</b></td><td><b>" + formatERGAmount(BigInt(-1) * txBalance.value) + "&nbsp;ERG</b></td></tr>";
            txSummaryHtml += "</tbody></table>";
            if (txBalance.tokens.length > 0) {
                txSummaryHtml += "<table class='txSummarry'><tbody>";
                txSummaryHtml += "<thead><th colspan='2'>Token balance for wallet</th></thead>";
                for (const token of txBalance.tokens) {
                    //console.log("sendTransaction token.amount", token.name, token.amount)
                    txSummaryHtml += "<tr><td class='textSmall'>" + token.name + "</td><td class='textSmall'>" + formatTokenAmount(token.amount, token.decimals) + "</td></tr>";
                }
                txSummaryHtml += "</tbody></table></div>";
            }

            var signedTx = {};
            if (wallet.type === "mnemonic") {
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
                try {
                    signedTx = JSONBigInt.parse(await signTransaction(jsonUnsignedTx, selectedUtxos, [], signingWallet));
                    console.log("signedTx", signedTx);
                } catch (e) {
                    errorAlert("Failed to sign transaction", e);
                    return;
                }
                if (true) {
                    await postTxMempool(signedTx);
                    console.log("Transaction sent to mempool", signedTx);
                } else {
                    await sendTx(signedTx);
                    console.log("Transaction sent to node", signedTx);
                }

                //await delay(3000);
                this.state.setPage('transactions', this.state.walletId);
            }
            if (wallet.type === "ledger") {
                try {
                    signedTx = JSONBigInt.parse(await signTxLedger(wallet, jsonUnsignedTx, selectedUtxos, txSummaryHtml));
                    console.log("signedTx", signedTx)
                    if (false) {
                        await postTxMempool(signedTx);
                        console.log("Transaction sent to mempool", signedTx);
                    } else {
                        await sendTx(signedTx);
                        console.log("Transaction sent to node", signedTx);
                    }
                    this.state.setPage('transactions', this.state.walletId);
                } catch (e) {
                    console.log("getLedgerAddresses catch", e.toString());
                    if (e instanceof DeviceError) {
                        if (e.toString().includes("denied by user")) {
                            errorAlert(e.toString())
                        } else {
                            errorAlert("Cannot connect Ledger ergo application, unlock the ledger and start the Ergo applicaiton on the ledger.")
                        }
                    }
                }
            }
        }
    }

    async openInTxBuilder() {
        const txJson = (await this.state.getTransactionJson())[0];
        // console.log("openInTxBuilder txJson", txJson);
        this.state.setPage('txbuilder', this.state.walletId, txJson);
    }

    render() {
        //console.log("render SignTransaction", this.state);
        return (
            <Fragment>
                {
                    this.state.ergoPayTxId === "" ?
                        <div className='d-flex flex-row align-items-baseline justify-content-center'>
                            <button className="btn btn-outline-info"
                                onClick={this.sendTransaction}
                                disabled={!(this.state.isValidTx)}
                            >{this.state.ergoPayOnly ? "Ergopay" : "Send transaction"}</button>&nbsp;
                            {
                                this.state.expertMode ?
                                    <button className="btn btn-outline-info"
                                        onClick={this.openInTxBuilder}
                                        disabled={!(this.state.isValidTx)}
                                    >Open in transaction builder</button>
                                    : null
                            }
                        </div>
                        :
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
                            {
                                this.state.expertMode ?
                                    <div className='d-flex flex-row justify-content-center'>
                                        <button className="btn btn-outline-info"
                                            onClick={this.openInTxBuilder}
                                            disabled={!(this.state.isValidTx)}
                                        >Open in transaction builder</button>
                                    </div>
                                    : null
                            }
                        </div>
                }
            </Fragment>
        )
    }
}
