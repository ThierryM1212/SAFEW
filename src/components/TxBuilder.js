import React, { Fragment } from 'react';
import InputString from './TransactionBuilder/InputString';
import UtxosSummary from './TransactionBuilder/UtxosSummary';
import OutputBoxCreator from './TransactionBuilder/OutputBoxCreator';
import OutputEditable from './TransactionBuilder/OutputEditable';
import TransactionSummary from './TransactionBuilder/TransactionSummary';
import ImageButton from './ImageButton';
import ImageButtonLabeled from './TransactionBuilder/ImageButtonLabeled';
import ReactJson from 'react-json-view';
import { UtxoItem } from './TransactionBuilder/UtxoItem';
import { unspentBoxesForV1, boxByBoxId, currentHeight } from '../ergo-related/explorer';
import { parseUtxo, parseUtxos, enrichUtxos, buildBalanceBox, getUnspentBoxesForAddressList, parseSignedTx, enrichTokenInfoFromUtxos, getUtxoBalanceForAddressList } from '../ergo-related/utxos';
import { getWalletForAddresses, signTransaction } from '../ergo-related/serializer';
import JSONBigInt from 'json-bigint';
import { errorAlert, promptPassword, waitingAlert } from '../utils/Alerts';
import { sendTx } from '../ergo-related/node';
import { getTxReducedB64Safe } from '../ergo-related/ergolibUtils';
import BigQRCode from './BigQRCode';
import SelectWallet from './SelectWallet';
import { decryptMnemonic, formatERGAmount, formatTokenAmount, getUnconfirmedTransactionsForAddressList, getWalletAddressList, getWalletById } from '../utils/walletUtils';
import { VERIFIED_TOKENS } from '../utils/constants';
/* global BigInt */

var initCreateBox = {
    value: '0',
    ergoTree: '',
    assets: [],
    additionalRegisters: {},
    creationHeight: 600000,
    extension: {}
};

var feeBox = {
    value: "2000000",
    ergoTree: "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
    assets: [],
    additionalRegisters: {},
    creationHeight: 600000,
    extension: {}
}


export default class TxBuilder extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletList: JSON.parse(localStorage.getItem('walletList')) ?? [],
            setPage: props.setPage,
            initTx: props.iniTran,
            selectedWalletId: props.walletId,
            addressBoxList: [],
            searchAddress: '',
            searchBoxId: '',
            selectedBoxList: [],
            selectedDataBoxList: [],
            otherBoxList: [],
            outputList: [],
            outputCreateJson: initCreateBox,
            ergoPayTxId: '',
            ergoPayUnsignedTx: '',
            intervalId: 0,
            signedTransaction: '',
            txJsonRaw: '',
            tokenInfo: VERIFIED_TOKENS,
        };
        this.setWallet = this.setWallet.bind(this);
        this.setSearchAddress = this.setSearchAddress.bind(this);
        this.setSearchBoxId = this.setSearchBoxId.bind(this);
        this.selectInputBox = this.selectInputBox.bind(this);
        this.selectDataInputBox = this.selectDataInputBox.bind(this);
        this.unSelectDataInputBox = this.unSelectDataInputBox.bind(this);
        this.unSelectInputBox = this.unSelectInputBox.bind(this);
        this.moveInputBoxDown = this.moveInputBoxDown.bind(this);
        this.moveInputBoxUp = this.moveInputBoxUp.bind(this);
        this.fetchByBoxId = this.fetchByBoxId.bind(this);
        this.fetchByAddress = this.fetchByAddress.bind(this);
        this.fetchWalletBoxes = this.fetchWalletBoxes.bind(this);
        this.addOutputBox = this.addOutputBox.bind(this);
        this.moveOutputBoxDown = this.moveOutputBoxDown.bind(this);
        this.moveOutputBoxUp = this.moveOutputBoxUp.bind(this);
        this.unSelectOutoutBox = this.unSelectOutoutBox.bind(this);
        this.setBalanceBoxJson = this.setBalanceBoxJson.bind(this);
        this.signTx = this.signTx.bind(this);
        this.signAndSendTx = this.signAndSendTx.bind(this);
        this.sendSignedTx = this.sendSignedTx.bind(this);
        this.setErgoPayTx = this.setErgoPayTx.bind(this);
        this.resetTxReduced = this.resetTxReduced.bind(this);
        this.timer = this.timer.bind(this);
        this.setTxJsonRaw = this.setTxJsonRaw.bind(this);
        this.loadTxFromJsonRaw = this.loadTxFromJsonRaw.bind(this);
    }
    setWallet = (walletId) => { this.setState({ selectedWalletId: walletId }); };
    setSearchAddress = (address) => { this.setState({ searchAddress: address }); };
    setSearchBoxId = (boxId) => { this.setState({ searchBoxId: boxId }); };
    setTxJsonRaw = (textAreaInput) => { this.setState({ txJsonRaw: textAreaInput }); }

    async componentDidMount() {
        const currentHeigth = await currentHeight();
        initCreateBox.creationHeight = currentHeigth;
        feeBox.creationHeight = currentHeigth;
        this.setState({ outputCreateJson: { ...initCreateBox } });
        const initTx = this.state.initTx;
        if (initTx.inputs && initTx.outputs && initTx.dataInputs) {
            try {
                this.loadTxFromJson(initTx);
            } catch (e) {
                errorAlert("failed to load transaction: " + e.toString());
            }
        }
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    async timer() {
        const wallet = getWalletById(this.state.selectedWalletId);
        const walletAddressList = getWalletAddressList(wallet);
        const unconfirmedTransactions = await getUnconfirmedTransactionsForAddressList(walletAddressList, false);
        const unconfirmedTransactionsIdFiltered = unconfirmedTransactions.map(tx => tx.transactions).flat();
        const ourTx = unconfirmedTransactionsIdFiltered.filter(tx => tx !== undefined && tx.id === this.state.ergoPayTxId);
        if (ourTx.length > 0) {
            var fixedTx = parseSignedTx(ourTx[0]);
            fixedTx.id = this.state.txId;
            //console.log("fixedTx", fixedTx);
            clearInterval(this.state.intervalId);
            this.state.setPage('transactions', this.state.selectedWalletId);
        }
    }

    async fetchWalletBoxes() {
        const wallet = getWalletById(this.state.selectedWalletId);
        const addressList = getWalletAddressList(wallet);
        var alert = waitingAlert("Fetching wallet unspent boxes...")
        const utxos = await getUnspentBoxesForAddressList(addressList);
        const newTokenInfo = enrichTokenInfoFromUtxos(utxos, this.state.tokenInfo);
        alert.close();
        this.setState({
            addressBoxList: parseUtxos(utxos),
            tokenInfo: newTokenInfo,
        });
    }

    async fetchByAddress() {
        const boxes = await unspentBoxesForV1(this.state.searchAddress);
        const newTokenInfo = enrichTokenInfoFromUtxos(boxes, this.state.tokenInfo);
        this.setState({
            tokenInfo: newTokenInfo,
        });
        const otherBoxListFixed = parseUtxos(boxes, true);
        for (const box of otherBoxListFixed) {
            this.setState(prevState => ({
                otherBoxList: [...prevState.otherBoxList, box]
            }))
        }

    }

    async fetchByBoxId() {
        const box = await boxByBoxId(this.state.searchBoxId);
        const boxFixed = parseUtxo(box, true);
        this.setState(prevState => ({
            otherBoxList: [...prevState.otherBoxList, boxFixed]
        }))
    }

    selectInputBox = (box) => {
        if (!Array.isArray(box)) {
            var boxFound = false;
            for (const i in this.state.selectedBoxList) {
                if (this.state.selectedBoxList[i].boxId === box.boxId) {
                    boxFound = true;
                }
            }
            if (!boxFound) {
                this.setState(prevState => ({
                    selectedBoxList: [...prevState.selectedBoxList, box]
                }))
            }
        }
    }

    selectDataInputBox = (box) => {
        if (!Array.isArray(box)) {
            var boxFound = false;
            for (const i in this.state.selectedDataBoxList) {
                if (this.state.selectedDataBoxList[i].boxId === box.boxId) {
                    boxFound = true;
                }
            }
            if (!boxFound) {
                this.setState(prevState => ({
                    selectedDataBoxList: [...prevState.selectedDataBoxList, box]
                }))
            }
        }
    }

    unSelectInputBox(box) {
        if (!Array.isArray(box)) {
            this.setState(prevState => ({
                selectedBoxList: prevState.selectedBoxList.filter(boxinlist => boxinlist.boxId !== box.boxId)
            }));
        }
    }

    unSelectDataInputBox(box) {
        if (!Array.isArray(box)) {
            this.setState(prevState => ({
                selectedDataBoxList: prevState.selectedDataBoxList.filter(boxinlist => boxinlist.boxId !== box.boxId)
            }));
        }
    }

    unSelectOutoutBox(id) {
        console.log("unSelectOutoutBox", id, this.state.outputList);
        let outputListNew = [...this.state.outputList];
        outputListNew.splice(id, 1);
        this.setState({ outputList: outputListNew });
    }

    moveOutputBoxUp(id) {
        console.log("moveOutputBoxUp", id);
        if (id > 0) {
            let outputListNew = [...this.state.outputList];
            outputListNew[id] = this.state.outputList[id - 1]
            outputListNew[id - 1] = this.state.outputList[id]
            this.setState({ outputList: outputListNew });
        }
    }

    moveOutputBoxDown(id) {
        console.log("moveOutputBoxDown", id);
        if (id < this.state.outputList.length - 1) {
            let outputListNew = [...this.state.outputList];
            outputListNew[id] = this.state.outputList[id + 1]
            outputListNew[id + 1] = this.state.outputList[id]
            this.setState({ outputList: outputListNew });
        }
    }

    moveInputBoxUp(id) {
        if (id > 0) {
            let selectedBoxListNew = [...this.state.selectedBoxList];
            selectedBoxListNew[id] = this.state.selectedBoxList[id - 1]
            selectedBoxListNew[id - 1] = this.state.selectedBoxList[id]
            this.setState({ selectedBoxList: selectedBoxListNew });
        }
    }

    moveInputBoxDown(id) {
        if (id < this.state.selectedBoxList.length - 1) {
            let selectedBoxListNew = [...this.state.selectedBoxList];
            selectedBoxListNew[id] = this.state.selectedBoxList[id + 1]
            selectedBoxListNew[id + 1] = this.state.selectedBoxList[id]
            this.setState({ selectedBoxList: selectedBoxListNew });
        }
    }

    addOutputBox() {
        this.setState(prevState => ({
            outputList: [...prevState.outputList, prevState.outputCreateJson]
        }))
        this.resetCreateBoxJson();
    }
    setCreateBoxJson = (key, json) => {
        this.setState({ outputCreateJson: json });
    }
    setOutputItem = (key, json) => {
        console.log("setOutputItem", key, json);
        let outputListNew = [...this.state.outputList];
        outputListNew[key] = json;
        this.setState({ outputList: outputListNew });
    }
    resetCreateBoxJson = () => { this.setState({ outputCreateJson: initCreateBox }); }
    setFeeBoxJson = () => { this.setState({ outputCreateJson: feeBox }); }
    async setBalanceBoxJson() {
        const changeAddress = getWalletById(this.state.selectedWalletId).changeAddress;
        const balanceBox = await buildBalanceBox(this.state.selectedBoxList, this.state.outputList, changeAddress);
        if (BigInt(balanceBox.value) < 10000) {
            errorAlert("Not enough ERG in inputs");
        } else {
            this.setState({ outputCreateJson: balanceBox });
        }
    }

    getTransaction() {
        return {
            inputs: this.state.selectedBoxList,
            outputs: this.state.outputList,
            dataInputs: this.state.selectedDataBoxList,
        };
    }

    async signTx() {
        const wallet = getWalletById(this.state.selectedWalletId);
        const walletAddressList = getWalletAddressList(wallet);
        const jsonUnsignedTx = this.getTransaction();
        const txBalance = await getUtxoBalanceForAddressList(jsonUnsignedTx.inputs, jsonUnsignedTx.outputs, walletAddressList);
        var txSummaryHtml = "<div class='card m-1 p-1'><table class='txSummarry'><tbody>";
        txSummaryHtml += "<tr><td class='textSmall'><b>Total</b></td><td><b>" + formatERGAmount(txBalance.value) + "&nbsp;ERG</b></td></tr>";
        txSummaryHtml += "</tbody></table>";
        if (txBalance.tokens.length > 0) {
            txSummaryHtml += "<table class='txSummarry'><tbody>";
            txSummaryHtml += "<thead><th colspan='2'>Tokens</th></thead>";
            for (const token of txBalance.tokens) {
                txSummaryHtml += "<tr><td class='textSmall'>" + token.name + "</td><td class='textSmall'>" + formatTokenAmount(token.amount, token.decimals) + "</td></tr>";
            }
            txSummaryHtml += "</tbody></table></div>";
        }

        const password = await promptPassword("Sign transaction for<br/>" + wallet.name, txSummaryHtml, "Sign");
        //console.log("sendTransaction password", password);
        const mnemonic = decryptMnemonic(wallet.mnemonic, password);
        //console.log("mnemonic",mnemonic)
        if (mnemonic === null) {
            return;
        }
        if (mnemonic === '' || mnemonic === undefined) {
            errorAlert("Failed to decrypt Mnemonic", "Wrong password ?");
            return;
        }
        const signingWallet = await getWalletForAddresses(mnemonic, walletAddressList);
        //console.log("signingWallet", signingWallet);
        var signedTx = {};
        try {
            signedTx = JSON.parse(await signTransaction(jsonUnsignedTx, this.state.selectedBoxList, this.state.selectedDataBoxList, signingWallet));
            console.log("signedTx", signedTx);
            this.setState({ signedTransaction: signedTx })
        } catch (e) {
            errorAlert("Failed to sign transaction", e);
            return;
        }
        return signedTx;
    }

    async signAndSendTx() {
        const signedTx = await this.signTx();
        console.log("signAndSendTx signedTx", signedTx);
        if (signedTx && signedTx.inputs) {
            await sendTx(signedTx);
            //await delay(3000);
            this.state.setPage('transactions', this.state.selectedWalletId);
        }
    }

    async sendSignedTx() {
        await sendTx(this.state.signedTransaction);
        //await delay(3000);
        this.state.setPage('transactions', this.state.selectedWalletId);
    }

    async setErgoPayTx() {
        var txId = '', txReducedB64safe = '';
        try {
            [txId, txReducedB64safe] = await getTxReducedB64Safe(this.getTransaction(), this.state.selectedBoxList);
            var intervalId = setInterval(this.timer, 3000);
            this.setState({
                ergoPayTxId: txId,
                ergoPayUnsignedTx: txReducedB64safe,
                intervalId: intervalId,
            });
        } catch (e) {
            errorAlert(e.toString());
        }
    }
    resetTxReduced = () => {
        clearInterval(this.state.intervalId);
        this.setState({
            ergoPayTxId: '',
            ergoPayUnsignedTx: '',
            intervalId: 0,
        });
    }

    async loadTxFromJsonRaw() {
        try {
            const json = JSONBigInt.parse(this.state.txJsonRaw);
            console.log("loadTxFromJsonRaw", json);
            await this.loadTxFromJson(json);
        } catch (e) {
            console.log(e);
            errorAlert("Failed to parse transaction json", e)
        }
    }

    async loadTxFromJson(json) {
        var jsonFixed = json;
        if ("tx" in json) { jsonFixed = json.tx; }
        var alert = waitingAlert("Loading input boxes...")
        const inputs = await enrichUtxos(jsonFixed.inputs, true);
        const dataInputs = await enrichUtxos(jsonFixed.dataInputs, true);
        const newTokenInfo = enrichTokenInfoFromUtxos([inputs, dataInputs].flat(), this.state.tokenInfo);
        const outputs = parseUtxos(jsonFixed.outputs, true, 'output');
        alert.close();
        this.setState({
            selectedBoxList: inputs,
            selectedDataBoxList: dataInputs,
            outputList: outputs,
            tokenInfo: newTokenInfo,
        });
    }

    render() {
        const txJson = this.getTransaction();
        const selectedWallet = getWalletById(this.state.selectedWalletId);
        const tokenInfo = this.state.tokenInfo;

        var appTips = "The application is intended to manipulate json of Ergo transactions.<br />";
        appTips += "Features:<br />";
        appTips += " - View unspent boxes of wallets<br />";
        appTips += " - Get boxes by address or boxId to execute smart contracts<br />";
        appTips += " - Build output boxes with the editor<br />";
        appTips += " - Sign the transaction<br />";
        appTips += " - Send the transaction<br />";
        appTips += "IF YOU DON'T KNOW WHAT YOU ARE DOING YOU SHOULD PROBABLY NOT USE IT !";

        var swaggertips = "This transaction can be signed using your node wallet and swagger UI:<br />";
        swaggertips += "- Unlock the wallet using: $SWAGGER/wallet/unlock/<br />";
        swaggertips += "- Sign the transaction copying the Swagger json to $SWAGGER/wallet/transaction/sign<br />";
        swaggertips += "- Send the transaction copying the signed json to $SWAGGER/transactions<br />";
        swaggertips += "This should be used after having add the fee box.";

        return (

            <Fragment >
                <div className="w-100 container">
                    <div className="d-flex flex-row justify-content-center">
                        <h4>Transaction builder</h4>&nbsp;
                        <ImageButton id="help-tx-builder" icon="help_outline"
                            tips={appTips} />
                    </div>
                    <div className="w-100 container-xxl ">
                        <div className="card p-1 m-2 w-100">
                            <div className="d-flex flex-row align-items-center justify-content-between">
                                <h5>Unspent boxes</h5>
                                <div className="d-flex flex-row align-items-center">
                                    <SelectWallet selectedWalletId={this.state.selectedWalletId}
                                        setWallet={this.setWallet} />
                                    <ImageButton
                                        id={"fetchWalletBoxes"}
                                        color={"blue"}
                                        icon={"file_download"}
                                        tips={"Fetch wallet unspent boxes"}
                                        onClick={this.fetchWalletBoxes}
                                    />
                                </div>
                            </div>
                            <div className="d-flex flex-wrap">
                                {this.state.addressBoxList.map(item => (
                                    <div key={item.boxId} className="card m-2" >
                                        <UtxoItem
                                            boxId={item.boxId}
                                            json={item}
                                            action={this.selectInputBox}
                                            action2={this.selectDataInputBox}
                                            icon="add_box"
                                            tips="Add to selected inputs"
                                            color="green"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="container-xxl w-100">
                        <div className="card p-1 m-2 w-100">
                            <h5>Additional boxes</h5>
                            <InputString label="Search by boxId"
                                value={this.state.searchBoxId}
                                onChange={this.setSearchBoxId}
                                onClick={this.fetchByBoxId}
                            />
                            <InputString label="Search by address / script address"
                                value={this.state.searchAddress}
                                onChange={this.setSearchAddress}
                                onClick={this.fetchByAddress}
                            />
                            <div className="d-flex flex-wrap">
                                {this.state.otherBoxList.map(item => (
                                    <div key={item.boxId} className="card m-2" >
                                        <UtxoItem
                                            boxId={item.boxId}
                                            json={item}
                                            action={this.selectInputBox}
                                            action2={this.selectDataInputBox}
                                            icon="add_box"
                                            tips="Add to selected inputs"
                                            color="green"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="w-100 container-xxl ">
                        <div className="card p-1 m-2 w-100">
                            <h5>Selected data input boxes ({this.state.selectedDataBoxList.length})</h5>
                            <div className="d-flex flex-wrap">
                                {this.state.selectedDataBoxList.map(item => (
                                    <div key={item.boxId} className="card m-2 " >
                                        <UtxoItem
                                            boxId={item.boxId}
                                            json={item}
                                            action={this.unSelectDataInputBox}
                                            icon="clear"
                                            tips="Remove from selected data inputs"
                                            color="red"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="w-100 container-xxl ">
                        <div className="card p-1 m-2 w-100">
                            <h5>Selected input boxes ({this.state.selectedBoxList.length})</h5>
                            <div className="d-flex flex-wrap">
                                {this.state.selectedBoxList.map((item, index) => (
                                    <div key={index} className="card m-2 " >
                                        <UtxoItem
                                            boxId={item.boxId}
                                            json={item}
                                            action={this.unSelectInputBox}
                                            icon="clear"
                                            tips="Remove from selected inputs"
                                            id={index}
                                            moveUp={this.moveInputBoxUp}
                                            moveDown={this.moveInputBoxDown}
                                            color="red"
                                        />
                                    </div>
                                ))}
                            </div>
                            <UtxosSummary list={this.state.selectedBoxList}
                                name="inputs"
                                label="Selected inputs list"
                                tokenInfo={tokenInfo}
                            />
                        </div>
                    </div>

                    <div className="w-100 container-xxl ">
                        <div className="card p-1 m-2 w-100">
                            <h5>Output boxes editor</h5>
                            <OutputBoxCreator
                                json={this.state.outputCreateJson}
                                onChange={this.setCreateBoxJson}
                                reset={this.resetCreateBoxJson}
                                add={this.addOutputBox}
                                fee={this.setFeeBoxJson}
                                balance={this.setBalanceBoxJson}
                            />
                        </div>
                    </div>

                    <div className="w-100 container-xxl ">
                        <div className="card p-1 m-2 w-100">
                            <h5>Selected output boxes ({this.state.outputList.length})</h5>
                            <div className="d-flex flex-wrap">
                                {this.state.outputList.map((item, index, arr) => (
                                    <OutputEditable
                                        json={item}
                                        onEdit={this.setOutputItem}
                                        key={index}
                                        id={index}
                                        delete={this.unSelectOutoutBox}
                                        moveUp={this.moveOutputBoxUp}
                                        moveDown={this.moveOutputBoxDown}
                                    />
                                ))}
                            </div>
                            <UtxosSummary
                                list={this.state.outputList}
                                name="outputs"
                                label="Outputs list"
                                tokenInfo={tokenInfo}
                            />
                        </div>
                    </div>

                    <div className="w-100 container-xxl ">
                        <div className="card p-1 m-2 w-100">
                            <h5>Unsigned transaction</h5>
                            <TransactionSummary json={txJson} tokenInfo={tokenInfo} />
                            <div className="d-flex flex-row align-items-center justify-content-between">
                                <div className="d-flex flex-row align-items-center ">
                                    <h6>Sign transaction</h6>&nbsp;
                                    {
                                        selectedWallet.type === "ergopay" ? null :
                                            <Fragment>
                                                <div className='card m-1 p-1 d-flex align-items_center'
                                                    style={{
                                                        borderColor: `rgba(${selectedWallet.color.r},${selectedWallet.color.g},${selectedWallet.color.b}, 0.95)`,
                                                        backgroundColor: `rgba(${selectedWallet.color.r},${selectedWallet.color.g},${selectedWallet.color.b}, 0.10)`
                                                    }}>
                                                    <ImageButton id="sign-and-send" color="blue" icon="send" tips="Sign and send transaction"
                                                        onClick={() => { this.signAndSendTx(txJson); }} />
                                                </div>
                                                <div className='card m-1 p-1 d-flex align-items_center'
                                                    style={{
                                                        borderColor: `rgba(${selectedWallet.color.r},${selectedWallet.color.g},${selectedWallet.color.b}, 0.95)`,
                                                        backgroundColor: `rgba(${selectedWallet.color.r},${selectedWallet.color.g},${selectedWallet.color.b}, 0.10)`
                                                    }}>
                                                    <ImageButton id="sign" color="blue" icon="border_color" tips="Sign transaction"
                                                        onClick={() => { this.signTx(txJson); }} />
                                                </div>
                                            </Fragment>
                                    }
                                    <ImageButton id="help-swagger" icon="help_outline"
                                        tips={swaggertips} />
                                </div>
                            </div>
                            <ReactJson
                                id="unsigned-tx-json"
                                src={this.getTransaction()}
                                theme="monokai"
                                collapsed={true}
                                name={false}
                                collapseStringsAfterLength={60}
                            />
                            <div className="d-flex flex-column">
                                <div className="d-flex flex-row align-items-center">
                                    <h6>ErgoPay transaction</h6> &nbsp;
                                    <ImageButton id="get-reduced-tx" color="red" icon="restart_alt" tips="Reset ErgoPay transaction"
                                        onClick={this.resetTxReduced} />
                                    <ImageButton id="set-reduced-tx" color="blue" icon="calculate" tips="Get ErgoPay transaction"
                                        onClick={this.setErgoPayTx} />
                                </div>
                                {
                                    this.state.ergoPayTxId === '' ? null :
                                        <div className='d-flex flex-row justify-content-center'>
                                            <BigQRCode QRCodeTx={this.state.ergoPayUnsignedTx} />
                                        </div>
                                }
                            </div>
                        </div>
                    </div>

                    {
                        this.state.signedTransaction === '' ? null :
                            <div className="w-100 container-xxl ">
                                <div className="card p-1 m-2 w-100">
                                    <div className="d-flex flex-row">
                                        <h5>Signed transaction</h5>&nbsp;
                                        <ImageButton id="send-tx" color="blue" icon="send"
                                            tips="Send"
                                            onClick={this.sendSignedTx}
                                        />
                                    </div>
                                    <div>
                                        <ReactJson
                                            id="signed-tx-json"
                                            src={this.state.signedTransaction}
                                            theme="monokai"
                                            collapsed={true}
                                            name={false}
                                            collapseStringsAfterLength={60}
                                        />
                                    </div>
                                </div>
                            </div>
                    }

                    <div className="w-100 container-xxl ">
                        <div className="card p-1 m-2 w-100">

                            <h6>Transaction import/export</h6>
                            <div className="d-flex flex-row p-1">
                                <ImageButtonLabeled id="load-tx-json" color="blue" icon="upload"
                                    label="Load transaction json" onClick={this.loadTxFromJsonRaw}
                                />
                            </div>
                            <textarea value={this.state.txJsonRaw}
                                onChange={(evn) => this.setTxJsonRaw(evn.target.value)} rows="5" />

                        </div>
                    </div>



                    <br /><br /><br /><br />

                </div>
                <br />
            </Fragment>
        )
    }
}

