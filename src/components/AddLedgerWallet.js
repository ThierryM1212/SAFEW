import { DeviceError } from 'ledgerjs-hw-app-ergo';
import React, { Fragment } from 'react';
import { SketchPicker } from 'react-color';
import { discoverLedgerAddresses } from '../ergo-related/ledger';
import { errorAlert } from '../utils/Alerts';
import { addLedgerWallet, getWalletNames, INVALID_NAME_LENGTH_MSG } from '../utils/walletUtils';
import ImageButton from './ImageButton';
import ValidInput from './ValidInput';


export default class AddLedgerWallet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletName: '',
            isValidWalletName: false,
            invalidWalletMessage: INVALID_NAME_LENGTH_MSG,
            color: { r: 141, g: 140, b: 143, a: 1 },
            setPage: props.setPage,
        };
        this.setWalletName = this.setWalletName.bind(this);
        this.saveWallet = this.saveWallet.bind(this);
    }

    setWalletName = (name) => {
        const [validWalletName, invalidMessage] = this.isValidName(name);
        this.setState({
            walletName: name,
            isValidWalletName: validWalletName,
            invalidWalletMessage: invalidMessage,
        });
    };

    isValidName = (name) => {
        const minWalletNameChar = 2;
        const walletNameAlreadyExists = getWalletNames().includes(name);
        var invalidMessage = ' ';
        if (name.length <= minWalletNameChar) { invalidMessage += INVALID_NAME_LENGTH_MSG };
        if (walletNameAlreadyExists) invalidMessage += " Wallet name already exists !";
        return [((name.length > minWalletNameChar) && !walletNameAlreadyExists), invalidMessage];
    };

    async saveWallet() {
        var accounts = {};
        try {
            accounts = await discoverLedgerAddresses();
            console.log("getLedgerAddresses", accounts);
            await addLedgerWallet(this.state.walletName, accounts, this.state.color)
            this.state.setPage('home');
        } catch (e) {
            console.log("getLedgerAddresses catch", e);
            if (e instanceof DeviceError) {
                errorAlert("Cannot connect Ledger ergo application, unlock the ledger and start the Ergo applicaiton on the ledger.")
            }
        }
    }

    onChangeColor = (color) => {
        this.setState({
            color: color.rgb
        });
    };

    render() {
        return (
            <Fragment>
                <div className='container card m-1 p-1 d-flex flex-column w-75'
                    style={{
                        borderColor: `rgba(${this.state.color.r},${this.state.color.g},${this.state.color.b}, 0.95)`,
                        backgroundColor: `rgba(${this.state.color.r},${this.state.color.g},${this.state.color.b},0.10)`
                    }}>
                    <div className='d-flex flex-row align-items-baseline'>
                        <h4>Create a Ledger wallet</h4>
                        <ImageButton
                            id={"ledgerWalletInfo"}
                            color={"white"}
                            icon={"info"}
                            tips={"Connect your ledger Nano S/X to SAFEW to sign transaction using it.<br />It requires to install the ergo ledger app"}
                            onClick={() => { window.open("https://github.com/tesseract-one/ledger-app-ergo/", '_blank').focus(); }}
                        />
                    </div>
                    <div className='d-flex flex-column m-1'>
                        <div className='d-flex flex-column'>
                            <label htmlFor="walletName" >Wallet name</label>
                            <div className='d-flex flex-row align-items-center col-sm-4'>
                                <input type="text"
                                    id="walletName"
                                    onChange={e => this.setWalletName(e.target.value)}
                                    value={this.state.walletName}
                                    className={this.state.isValidWalletName ? "form-control validInput m-1" : "form-control invalidInput m-1"}
                                />
                                <ValidInput id="isValidWalletName" isValid={this.state.isValidWalletName} validMessage="OK" invalidMessage={this.state.invalidWalletMessage} />
                            </div>

                            <label htmlFor="walletColor" style={{ color: this.state.color }}>Wallet color</label>
                            <div className='d-flex flex-row align-items-center col-sm-4'>
                                <div >
                                    <SketchPicker id="color" color={this.state.color} onChange={this.onChangeColor} />
                                </div>
                            </div>
                        </div>
                        <br />
                        <div className='d-flex flex-row justify-content-center'>
                            <button className="btn btn-outline-info" onClick={this.saveWallet}>
                                Add ledger wallet
                            </button>
                        </div>
                    </div>
                </div>
            </Fragment>
        )
    }
}