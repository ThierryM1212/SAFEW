import React, { Fragment } from 'react';
import { addErgoPayWallet, getWalletNames } from '../utils/walletUtils';
import { INVALID_NAME_LENGTH_MSG }  from '../utils/walletUtils';
import { waitingAlert, displayMnemonic } from '../utils/Alerts';
import { SketchPicker } from 'react-color';
import ValidInput from './ValidInput';


export default class AddErgoPayWallet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletName: '',
            isValidWalletName: false,
            invalidWalletMessage: INVALID_NAME_LENGTH_MSG,
            color: "#8D8C8F",
            address: '',
        };
        this.setWalletName = this.setWalletName.bind(this);
        this.setAddress = this.setAddress.bind(this);
        this.saveWallet = this.saveWallet.bind(this);
    }

    setWalletName = (name) => {
        const minWalletNameChar = 2;
        const walletNameAlreadyExists = getWalletNames().includes(name);
        var invalidMessage = ' ';
        if (name.length <= minWalletNameChar) { invalidMessage += INVALID_NAME_LENGTH_MSG };
        if (walletNameAlreadyExists) invalidMessage += " Wallet name already exists !";
        const validWalletName = (name.length > minWalletNameChar) && !walletNameAlreadyExists;
        this.setState({
            walletName: name,
            isValidWalletName: validWalletName,
            invalidWalletMessage: invalidMessage,
        });
    };
    setAddress = (address) => {
        this.setState({
            address: address
        });
    };
    saveWallet = () => {
        addErgoPayWallet(this.state.walletName, this.state.address, this.state.color).then((numWal) => {
            console.log("saveWallet", this.state.address)
            this.props.setPage('home');
        });
    }

    onChangeColor = (color) => {
        this.setState({
            color: color.hex
        });
    };

    render() {
        console.log("this.state.invalidWalletMessage", this.state.invalidWalletMessage)
        return (
            <Fragment>
                <div className='container card m-1 p-1 d-flex flex-column w-75' style={{ borderColor: this.state.color }}>
                    <h4>Create or restore an Ergo wallet</h4>
                    <div className='d-flex flex-column m-1'>
                        <div className='d-flex flex-column'>
                            <label htmlFor="walletName" >Wallet name</label>
                            <div className='d-flex flex-row align-items-center col-sm-4'>
                                <input type="text"
                                    id="walletName"
                                    className="form-control"
                                    onChange={e => this.setWalletName(e.target.value)}
                                    value={this.state.walletName}
                                    className={this.state.isValidWalletName ? "validInput m-1" : "invalidInput m-1"}
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

                        <div className='d-flex flex-column'>
                            <label htmlFor="address" >Address</label>
                            <div className='d-flex flex-row align-items-center col-sm'>
                                <input type="text"
                                    id="address"
                                    className="form-control"
                                    onChange={e => this.setAddress(e.target.value)}
                                    value={this.state.address}
                                    className={"validInput m-1"}
                                    // className={this.state.isValidWalletName ? "validInput m-1" : "invalidInput m-1"}
                                />
                                {/* <ValidInput id="isValidWalletName" isValid={this.state.isValidWalletName} validMessage="OK" invalidMessage={this.state.invalidWalletMessage} /> */}
                            </div>
                        </div>



                        <div className='d-flex flex-row justify-content-center'>
                            <button className="btn btn-outline-info" onClick={this.saveWallet}
                                disabled={!(this.state.isValidWalletName)}>
                                Add wallet
                            </button>
                        </div>
                    </div>
                </div>
            </Fragment>
        )
    }
}