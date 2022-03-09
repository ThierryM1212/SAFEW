import React, { Fragment } from 'react';
import { getWalletById } from '../utils/walletUtils';
import BigQRCode from './BigQRCode';
import ImageButton from './ImageButton';


export default class SignTransaction extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            isValidTx: props.isValidTx,
            unsignedTxJson: props.unsignedTxJson,
            selectedUtxos: props.selectedUtxos,
            setPage: props.setPage,
            txFee: props.txFee,
            ergoPayTxId: "",
            ergoPayUnsignedTx: "",
        };
        this.setUnsignedTxJson = this.setUnsignedTxJson.bind(this);
        this.setIsValidTx = this.setIsValidTx.bind(this);
        this.setWalletId = this.setWalletId.bind(this);
    }
    setUnsignedTxJson = (tx) => { this.setState({unsignedTxJson: tx});};
    setIsValidTx = (isValid) => { this.setState({isValidTx: isValid});};
    setWalletId = (walletId) => { this.setState({walletId: walletId});};

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.unsignedTxJson !== this.props.unsignedTxJson) { this.setUnsignedTxJson(this.props.unsignedTxJson); }
        if (prevProps.walletId !== this.props.walletId) { this.setWalletId(this.props.walletId); }
        if (prevProps.isValidTx !== this.props.isValidTx) { this.setIsValidTx(this.props.isValidTx); }
    }

    async sendTransaction() {
        const wallet = getWalletById(this.state.walletId);
        const feeFloat = parseFloat(this.state.txFee);
        const selectedAddresses = this.state.walletAddressList.filter((addr, id) => this.state.selectedAddresses[id]);
        const jsonUnsignedTx = this.state.unsignedTxJson;
        const selectedUtxos = this.state.selectedUtxos;

        if (wallet.ergoPayOnly) {
            const [txId, txReducedB64safe] = await getTxReducedB64Saf(jsonUnsignedTx, selectedUtxos);
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

            var txSummaryHtml = "<div class='SAFEWcard m-1 p-1'><table class='txSummarry'><tbody>";
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

    render() {
        const wallet = getWalletById(this.state.walletId);
        const expertMode = (localStorage.getItem('expertMode') === 'true') ?? false;
        return (
            <Fragment>
                {
                    this.state.ergoPayTxId === "" ?
                        <div className='d-flex flex-row align-items-baseline justify-content-center'>
                            <button className="btn btn-outline-info"
                                onClick={this.sendTransaction}
                                disabled={!(this.state.isValidTx)}
                            >{wallet.ergoPayOnly ? "Ergopay" : "Send transaction"}</button>&nbsp;
                            {
                                expertMode ?

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
                        </div>
                }

            </Fragment>
        )
    }
}
