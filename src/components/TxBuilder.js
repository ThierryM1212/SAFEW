import React, { Fragment } from 'react';
import InputString from './TransactionBuilder/InputString';
import InputAddress from './TransactionBuilder/InputAddress';
import UtxosSummary from './TransactionBuilder/UtxosSummary';
import OutputBoxCreator from './TransactionBuilder/OutputBoxCreator';
import OutputEditable from './TransactionBuilder/OutputEditable';
import TransactionSummary from './TransactionBuilder/TransactionSummary';
import ImageButton from './ImageButton';
import ImageButtonLabeled from './TransactionBuilder/ImageButtonLabeled';
import ReactJson from 'react-json-view';
import { UtxoItem } from './TransactionBuilder/UtxoItem';
import { unspentBoxesFor, boxById, unspentBoxesForV1, boxByBoxId, currentHeight } from '../ergo-related/explorer';
import { parseUtxo, parseUtxos, generateSwaggerTx, enrichUtxos, buildBalanceBox, getUnspentBoxesForAddressList } from '../ergo-related/utxos';
import { getTxJsonFromTxReduced, signTransaction, signTxReduced, signTxWithMnemonic } from '../ergo-related/serializer';
import JSONBigInt from 'json-bigint';
import { displayTransaction, errorAlert, waitingAlert } from '../utils/Alerts';
import { sendTx } from '../ergo-related/node';
import { getTxReducedB64Safe } from '../ergo-related/ergolibUtils';
import BigQRCode from './BigQRCode';
import SelectWallet from './SelectWallet';
import { getWalletAddressList, getWalletById } from '../utils/walletUtils';
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
            selectedWalletId: 0,
            addressBoxList: [],
            searchAddress: '',
            searchBoxId: '',
            selectedBoxList: [],
            selectedDataBoxList: [],
            otherBoxList: [],
            outputList: [],
            outputCreateJson: initCreateBox,
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
    }
    setWallet = (walletId) => { this.setState({ selectedWalletId: walletId }); };
    setSearchAddress = (address) => { this.setState({ searchAddress: address }); };
    setSearchBoxId = (boxId) => { this.setState({ searchBoxId: boxId }); };

    async componentDidMount() {
        const currentHeigth = await currentHeight();
        initCreateBox.creationHeight = currentHeigth;
        feeBox.creationHeight = currentHeigth;
        this.setState({outputCreateJson: {...initCreateBox}})
    }

    async fetchWalletBoxes() {
        const wallet = getWalletById(this.state.selectedWalletId);
        const addressList = getWalletAddressList(wallet);
        var alert = waitingAlert("Fetching wallet unspent boxes...")
        const utxos = await getUnspentBoxesForAddressList(addressList);
        alert.close();
        this.setState({
            addressBoxList: parseUtxos(utxos)
        })
    }

    async fetchByAddress() {
        const boxes = await unspentBoxesForV1(this.state.searchAddress);
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

    render() {
        var appTips = "The application is intended to manipulate json of Ergo transaction to build smart contracts.<br />";
        appTips += "Features:<br />";
        appTips += " - View unspent boxes of wallets<br />";
        appTips += " - Get boxes by address or boxId to execute smart contracts<br />";
        appTips += " - Build output boxes with the editor<br />";
        appTips += " - Sign the transaction<br />";
        appTips += " - Send the transaction<br />";
        appTips += "IF YOU DON'T KNOW WHAT YOU ARE DOING YOU SHOULD PROBABLY NOT USE IT !";

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
                            <InputString label="Search by script address"
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
                            <UtxosSummary list={this.state.selectedBoxList} name="inputs" label="Selected inputs list" />
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
                            <UtxosSummary list={this.state.outputList} name="outputs" label="Outputs list" />
                        </div>
                    </div>

                    <br /><br /><br /><br />

                </div>
                <br />
            </Fragment>
        )
    }
}

