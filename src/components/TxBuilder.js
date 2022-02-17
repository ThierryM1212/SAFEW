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
import { unspentBoxesFor, boxById } from '../ergo-related/explorer';
import { parseUtxo, parseUtxos, generateSwaggerTx, enrichUtxos, buildBalanceBox } from '../ergo-related/utxos';
import { getTxJsonFromTxReduced, signTransaction, signTxReduced, signTxWithMnemonic } from '../ergo-related/serializer';
import JSONBigInt from 'json-bigint';
import { displayTransaction, errorAlert, waitingAlert } from '../utils/Alerts';
import { sendTx } from '../ergo-related/node';
import { getTxReducedB64Safe } from '../ergo-related/ergolibUtils';
import BigQRCode from './BigQRCode';
import SelectWallet from './SelectWallet';
/* global BigInt */

const initCreateBox = {
    value: '0',
    ergoTree: '',
    assets: [],
    additionalRegisters: {},
    creationHeight: 600000,
    extension: {}
};

const feeBox = {
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
        };
        this.setWallet = this.setWallet.bind(this);
    }
    setWallet = (walletId) => { this.setState({ selectedWalletId: walletId }); };

    render() {
        var appTips = "The application is intended to manipulate json of Ergo transaction to build smart contracts.<br />";
        appTips += "Features:<br />";
        appTips += " - View unspent boxes of wallets<br />";
        appTips += " - Get boxes by address or boxId to execute smart contracts<br />";
        appTips += " - Build output boxes with the editor<br />";
        appTips += " - Sign the transaction<br />";
        appTips += " - Send transaction";

        return (

            <Fragment >
                <div className="w-100 container">
                    <div className="d-flex flex-row justify-content-center">
                        <h4>Transaction builder</h4>&nbsp;
                        <ImageButton id="help-tx-builder" icon="help_outline"
                            tips={appTips} />
                    </div>
                    <div className="w-100 container-xxl ">
                        <SelectWallet selectedWalletId={this.state.selectedWalletId}
                            setWallet={this.setWallet} />
                    </div>



                    <br /><br /><br /><br />

                </div>
                <br />
            </Fragment>
        )
    }
}

