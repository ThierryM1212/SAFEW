import React, { Fragment } from 'react';
import { decryptMnemonic, getWalletById, getWalletNames, isValidPassword, passwordIsValid, updateWallet, changePassword, setChangeAddress, getWalletAddressList, deleteWallet, convertToErgoPay, deleteWalletAddress, addWalletAddress } from "../utils/walletUtils";
import { INVALID_PASSWORD_LENGTH_MSG, INVALID_NAME_LENGTH_MSG } from '../utils/walletUtils';
import { confirmAlert, displayMnemonic, errorAlert, promptPassword, successAlert, waitingAlert } from '../utils/Alerts';
import { discoverAddresses, isValidErgAddress } from '../ergo-related/ergolibUtils';
import { SketchPicker } from 'react-color';
import Select from 'react-select';
import ValidInput from './ValidInput';
import ImageButton from './ImageButton';
import { DEFAULT_EXPLORER_WEBUI_ADDRESS } from '../utils/constants';
import { LS } from '../utils/utils';
import { DEFAULT_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT } from '../utils/constants';

export default class EditWallet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            setPage: props.setPage,
            walletName: '',
            walletAddressList: [],
            isValidWalletName: false,
            invalidWalletMessage: 'Not changed',
            mnemonic: '',
            passwordOld: '',
            isValidPasswordOld: false,
            invalidPasswordOldMessage: 'Incorrect password',
            password1: '',
            isValidPassword1: false,
            invalidPassword1Message: INVALID_PASSWORD_LENGTH_MSG,
            password2: '',
            isValidPassword2: false,
            invalidPassword2Message: INVALID_PASSWORD_LENGTH_MSG,
            walletColor: { r: 141, g: 140, b: 143, a: 1 },
            color: { r: 141, g: 140, b: 143, a: 1 },
            selectedChangeAddress: '',
            isValidAddressToAdd: false,
            addressToAdd: '',
            explorerWebUIURL: DEFAULT_EXPLORER_WEBUI_ADDRESS,
        };
        this.updateWalletName = this.updateWalletName.bind(this);
        this.updateWalletColor = this.updateWalletColor.bind(this);
        this.updateWalletPassword = this.updateWalletPassword.bind(this);
        this.isValidColor = this.isValidColor.bind(this);
        this.onChangeColor = this.onChangeColor.bind(this);
        this.setPasswordOld = this.setPasswordOld.bind(this);
        this.setPassword1 = this.setPassword1.bind(this);
        this.setPassword2 = this.setPassword2.bind(this);
        this.searchAddresses = this.searchAddresses.bind(this);
        this.showMnemonic = this.showMnemonic.bind(this);
        this.deleteWallet = this.deleteWallet.bind(this);
        this.deleteMnemonic = this.deleteMnemonic.bind(this);
        this.addAddress = this.addAddress.bind(this);
    }

    async setWalletName(name) {
        const minWalletNameChar = 2;
        const walletNameAlreadyExists = (await getWalletNames()).includes(name);
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

    async updateWalletName() {
        var wallet = await getWalletById(this.state.walletId);
        const oldWalletName = wallet.name;
        wallet.name = this.state.walletName;
        await updateWallet(wallet, this.state.walletId);
        // update wallet name in connected site list
        var connectedSites = await LS.getItem('connectedSites');
        for (const key of Object.keys(connectedSites)) {
            if (key === oldWalletName) {
                connectedSites[this.state.walletName] = [...connectedSites[oldWalletName]];
                delete connectedSites[oldWalletName];
            }
        }
        LS.setItem('connectedSites', connectedSites);

        await this.setWalletName(this.state.walletName);
        successAlert(this.state.walletName, "Wallet name updated");
    }

    async updateWalletColor() {
        var wallet = await getWalletById(this.state.walletId);
        wallet.color = this.state.color;
        await updateWallet(wallet, this.state.walletId);
        await this.setWalletName(this.state.walletName);
        this.setState({
            color: this.state.color,
            wallerColor: this.state.color,
        });
        successAlert(this.state.walletName, "Wallet color updated");
    }

    async updateWalletPassword() {
        var wallet = await getWalletById(this.state.walletId);
        const oldEncryptedMnemonic = wallet.mnemonic;
        const newEncryptedMnemonic = changePassword(oldEncryptedMnemonic, this.state.passwordOld, this.state.password1);
        wallet.mnemonic = newEncryptedMnemonic;
        await updateWallet(wallet, this.state.walletId);
        this.setPasswordOld('');
        this.setPassword1('');
        this.setPassword2('');
        successAlert(this.state.walletName, "Wallet password updated");
    }

    onChangeColor = (color) => {
        this.setState({
            color: color.rgb
        });
    };

    setChangeAddress = (addr) => {
        console.log("edit wallet setChangeAddress", addr)
        this.setState({
            selectedChangeAddress: addr.value
        });
        setChangeAddress(this.state.walletId, addr.value);
    };

    async setPasswordOld (password) {
        this.setState({
            passwordOld: password,
            isValidPasswordOld: passwordIsValid((await getWalletById(this.state.walletId)).mnemonic, password),
        });
    }
    setPassword1 = (password) => {
        const isValid = isValidPassword(password);
        var validPasswordMessage = ''
        if (!isValid) { validPasswordMessage += INVALID_PASSWORD_LENGTH_MSG; }
        this.setState({
            password1: password,
            isValidPassword1: isValidPassword(password),
            invalidPassword1Message: validPasswordMessage,
        });
        this.setPassword2(this.state.password2);
    };
    setPassword2 = (password) => {
        const isValid = isValidPassword(password);
        var validPasswordMessage = ''
        if (!isValid) { validPasswordMessage += INVALID_PASSWORD_LENGTH_MSG; }
        if (this.state.password1 !== password) { validPasswordMessage += " Password does not match !"; };
        this.setState((prevState) => ({
            password2: password,
            isValidPassword2: (isValidPassword(password) && prevState.password1 === password),
            invalidPassword2Message: validPasswordMessage,
        }));
    };
    async setAddressToAdd(address) {
        this.setState({
            addressToAdd: address
        });
        const wallet = await getWalletById(this.state.walletId);
        const walletAddressList = getWalletAddressList(wallet);
        if (walletAddressList.includes(address)) {
            this.setState({ isValidAddressToAdd: false });
        } else {
            isValidErgAddress(address).then(isValidAddressToAdd => {
                this.setState({ isValidAddressToAdd: isValidAddressToAdd });
            })
        }
    };

    isValidColor = () => {
        console.log("isValidColor", this.state.color, this.state.walletColor)
        return (this.state.color !== this.state.walletColor);
    }

    async componentDidMount() {
        const wallet = await getWalletById(this.state.walletId);
        const walletAddressList = getWalletAddressList(wallet);
        const explorerUIaddr = (await LS.getItem('explorerWebUIAddress')) ?? DEFAULT_EXPLORER_WEBUI_ADDRESS;
        this.setState({
            walletName: wallet.name,
            walletColor: wallet.color,
            color: wallet.color,
            selectedChangeAddress: wallet.changeAddress,
            walletAddressList: walletAddressList,
            explorerUIaddr: explorerUIaddr,
            walletType: wallet.type,
        })
    }

    async searchAddresses() {
        var wallet = await getWalletById(this.state.walletId);
        const password = await promptPassword("Spending password for<br/>" + wallet.name, "", "Search");
        const mnemonic = decryptMnemonic(wallet.mnemonic, password);
        if (mnemonic === null) { return; }
        if (mnemonic !== '') {
            const swal = waitingAlert("Searching addresses");
            wallet.accounts = await discoverAddresses(mnemonic);
            await updateWallet(wallet, this.state.walletId);
            swal.close();
            this.state.setPage('home');
        } else {
            errorAlert("Incorrect password");
        }
    }

    async showMnemonic() {
        const wallet = getWalletById(this.state.walletId);
        const password = await promptPassword("Display mnemonic for<br/>" + wallet.name, "", "Display");
        const mnemonic = decryptMnemonic(wallet.mnemonic, password);
        if (mnemonic !== '') {
            displayMnemonic(mnemonic);
        } else {
            errorAlert("Incorrect password");
        }
    }

    async deleteMnemonic() {
        var message = "You will still be able to sign the transactions using ErgoPay.<br/>";
        message += "Using the same wallet from the iOS or Android wallet v1.6+.<br/>";
        message += "You won't be able to sign transactions in SAFEW anymore.";
        confirmAlert("Delete the mnemonic for " + this.state.walletName + "?",
            message,
            "Delete")
            .then(async res => {
                if (res.isConfirmed) {
                    await convertToErgoPay(this.state.walletId);
                    this.state.setPage('home');
                }
            })
    }

    async deleteWallet() {
        confirmAlert("Delete the wallet " + this.state.walletName + "?",
            "The wallet will be deleted from the application but will stay in the Ergo blockchain.<br/>It can be restored at any time with the mnemonic.",
            "Delete")
            .then(async res => {
                if (res.isConfirmed) {
                    // remove wallet from connected site list
                    LS.getItem('connectedSites').then(async connectedSites => {
                        delete connectedSites[this.state.walletName];
                        LS.setItem('connectedSites', JSON.stringify(connectedSites))
                        await deleteWallet(this.state.walletId);
                        this.state.setPage('home');
                    })
                }
            })
    }

    async deleteAddress(address) {
        await deleteWalletAddress(this.state.walletId, address);
        const wallet = await getWalletById(this.state.walletId);
        this.setState({
            walletAddressList: getWalletAddressList(wallet),
        });
    }

    async addAddress() {
        if (this.state.isValidAddressToAdd) {
            await addWalletAddress(this.state.walletId, this.state.addressToAdd);
            const wallet = await getWalletById(this.state.walletId);
            this.setState({
                walletAddressList: getWalletAddressList(wallet),
                addressToAdd: '',
                isValidAddressToAdd: false,
            });
        }
    }

    async backupWallet() {
        const wallet = await getWalletById(this.state.walletId);
        var _myArray = JSON.stringify(wallet, null, 4);
        var vLink = document.createElement('a'),
            vBlob = new Blob([_myArray], { type: "octet/stream" }),
            vName = this.state.walletName + '_SAFEW.json',
            vUrl = window.URL.createObjectURL(vBlob);
        vLink.setAttribute('href', vUrl);
        vLink.setAttribute('download', vName);
        vLink.click();
    }

    render() {
        const walletAddressList = this.state.walletAddressList;
        var optionsChangeAdresses = walletAddressList.map(address => ({ value: address, label: address }));

        return (
            <Fragment >
                <div className='container card m-1 p-1 d-flex flex-column w-75 '
                    style={{
                        borderColor: `rgba(${this.state.color.r},${this.state.color.g},${this.state.color.b}, 0.95)`,
                    }}>
                    <div className='d-flex flex-row justify-content-between editWalletCard'>
                        <h4>Update an Ergo{this.state.walletType === "ergopay" ? 'Pay' : null} wallet - {this.state.walletName}</h4>

                        <ImageButton
                            id={"backToWalletList"}
                            color={"blue"}
                            icon={"arrow_back"}
                            tips={"Wallet list"}
                            onClick={() => this.state.setPage('home')}
                        />
                    </div>
                    <div className='d-flex flex-column m-1'>
                        <h5 >Name</h5>
                        <div className='d-flex flex-row align-items-center col-sm'>
                            <input type="text"
                                id="walletName"
                                onChange={e => this.setWalletName(e.target.value)}
                                value={this.state.walletName}
                                className={this.state.isValidWalletName ? "form-control validInput m-1" : "form-control invalidInput m-1"}
                            />
                            <ValidInput id="isValidWalletName" isValid={this.state.isValidWalletName} validMessage="OK" invalidMessage={this.state.invalidWalletMessage} />
                            &nbsp;
                            <div >
                                <button className="btn btn-outline-info"
                                    onClick={this.updateWalletName}
                                    disabled={!this.state.isValidWalletName}
                                >Update wallet name</button>
                            </div>
                        </div>
                        <br />

                        <h5 style={{ color: this.state.color }}>Color</h5>
                        <div className='d-flex flex-row align-items-center col-sm'>
                            <div className='d-flex flex-row'>
                                <div >
                                    <SketchPicker id="color" color={this.state.color} onChange={this.onChangeColor} />
                                </div>
                                &nbsp;
                                <div className='d-flex flex-column justify-content-end'>

                                    <button className="btn btn-outline-info"
                                        disabled={!this.isValidColor()}
                                        onClick={this.updateWalletColor}
                                    >Update wallet color</button>
                                </div>
                            </div>
                        </div>
                        <br />

                        <h5 >Select change address</h5>
                        <div className='d-flex flex-row'>
                            <Select className='selectReact'
                                value={{ value: this.state.selectedChangeAddress, label: this.state.selectedChangeAddress }}
                                onChange={this.setChangeAddress}
                                options={optionsChangeAdresses}
                                isSearchable={false}
                                isMulti={false}
                            />
                        </div>
                        <br />
                        {
                            this.state.walletType === "ergopay" ?
                                <Fragment >
                                    <h5 >Wallet addresses</h5>
                                    <div className='d-flex flex-column'>
                                        {
                                            walletAddressList.map(address =>
                                                <div key={"address_" + address}
                                                    className='d-flex flex-row align-items-center'
                                                >
                                                    {address}
                                                    <ImageButton
                                                        id={"openAddressExplorer" + address}
                                                        color={"blue"}
                                                        icon={"open_in_new"}
                                                        tips={"Open in Explorer"}
                                                        onClick={() => {
                                                            const url = this.state.explorerWebUIURL + 'en/addresses/' + address;
                                                            window.open(url, '_blank').focus();
                                                        }}
                                                    />
                                                    <ImageButton
                                                        id={"deleteAddress_" + address}
                                                        color={"red"}
                                                        icon={"delete"}
                                                        tips={"Remove the address from the wallet"}
                                                        onClick={() => this.deleteAddress(address)}
                                                    />
                                                </div>
                                            )
                                        }
                                        <div className='d-flex flex-row'>
                                            < input type="text"
                                                size="55"
                                                id={"addressToAdd"}
                                                onChange={e => this.setAddressToAdd(e.target.value)}
                                                value={this.state.addressToAdd}
                                                className={this.state.isValidAddressToAdd ? "form-control validInput m-1" : "form-control invalidInput m-1"}
                                            />
                                            <ValidInput id={"isValidAddressToAdd"}
                                                isValid={this.state.isValidAddressToAdd}
                                                validMessage="OK"
                                                invalidMessage="Invalid address" />

                                            {
                                                this.state.isValidAddressToAdd ?
                                                    <ImageButton
                                                        id={"addAddress"}
                                                        color={"green"}
                                                        icon={"add"}
                                                        tips={"Add new address"}
                                                        onClick={this.addAddress}
                                                    />
                                                    : null
                                            }

                                        </div>
                                    </div>
                                    <br />
                                </Fragment >
                                :
                                wallet.type === "mnemonic" ?
                                    <Fragment >
                                        <h5 >Spending password</h5>
                                        <div className='d-flex flex-column'>
                                            <label htmlFor="walletPassword" >Password</label>
                                            <div className='d-flex flex-row align-items-center col-sm'>
                                                <div className='d-flex flex-row'>
                                                    <input type="password"
                                                        id="passwordOld"
                                                        onChange={e => this.setPasswordOld(e.target.value)}
                                                        value={this.state.passwordOld}
                                                        className={this.state.isValidPasswordOld ? "form-control validInput m-1" : "form-control invalidInput m-1"}
                                                    />
                                                    <ValidInput
                                                        id="isValidPasswordOld"
                                                        isValid={this.state.isValidPasswordOld}
                                                        validMessage="OK"
                                                        invalidMessage={this.state.invalidPasswordOldMessage}
                                                    />
                                                </div>
                                            </div>

                                            <div className='d-flex flex-column'>
                                                <label htmlFor="password1" >New password</label>
                                                <div className='d-flex flex-column col-sm'>
                                                    <div className='d-flex flex-row align-items-center'>
                                                        <input type="password"
                                                            id="password1"
                                                            onChange={e => this.setPassword1(e.target.value)}
                                                            value={this.state.password1}
                                                            className={this.state.isValidPassword1 ? "form-control validInput m-1" : "form-control invalidInput m-1"}
                                                        />
                                                        <ValidInput id="isValidPassword1" isValid={this.state.isValidPassword1} validMessage="OK" invalidMessage={this.state.invalidPassword1Message} />
                                                    </div>
                                                    <div className='d-flex flex-row align-items-center'>
                                                        <input type="password"
                                                            id="password2"
                                                            onChange={e => this.setPassword2(e.target.value)}
                                                            value={this.state.password2}
                                                            className={this.state.isValidPassword2 ? "form-control validInput m-1" : "form-control invalidInput m-1"}
                                                        />
                                                        <ValidInput id="isValidPassword2" isValid={this.state.isValidPassword2} validMessage="OK" invalidMessage={this.state.invalidPassword2Message} />
                                                        <button className="btn btn-outline-info"
                                                            onClick={this.updateWalletPassword}
                                                            disabled={!(this.state.isValidPasswordOld && this.state.isValidPassword1 && this.state.isValidPassword2)}
                                                        >Update password</button>
                                                    </div>
                                                    <div >
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <br />
                                        <div className='d-flex flex-row align-items-baseline'>
                                            <h5 >Addresses</h5>
                                            <ImageButton
                                                id={"searchAddressesInfo"}
                                                color={"white"}
                                                icon={"info"}
                                                tips={"Refresh wallet addresses, add up to " + DEFAULT_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT + " unused addresses to active accounts"}
                                            />
                                        </div>
                                        <div className='d-flex flex-column'>
                                            <div>
                                                <button className="btn btn-outline-info"
                                                    onClick={this.searchAddresses}
                                                >Search used addresses</button>
                                            </div>
                                        </div>
                                        <br />

                                        <h5 >Mnemonic</h5>
                                        <div className='d-flex flex-column'>
                                            <div>
                                                <button className="btn btn-outline-info"
                                                    onClick={this.showMnemonic}
                                                >Show Mnemonic</button>
                                            </div>
                                        </div>
                                        <br />

                                        <h5 >Convert to Ergopay (delete mnemonic)</h5>
                                        <div className='d-flex flex-column'>
                                            <div>
                                                <button className="btn btn-outline-info"
                                                    onClick={this.deleteMnemonic}
                                                >Convert to Ergopay wallet</button>
                                            </div>
                                        </div>
                                        <br />
                                    </Fragment>
                                    : null
                        }
                        <h5 >Backup {this.state.walletName}</h5>
                        <div className='d-flex flex-column'>
                            <div>
                                <button className="btn btn-outline-info"
                                    onClick={this.backupWallet}
                                >Backup</button>
                            </div>
                        </div>
                        <br />

                        <h5 >Delete Wallet</h5>
                        <div className='d-flex flex-column'>
                            <div>
                                <button className="btn btn-outline-info"
                                    onClick={this.deleteWallet}
                                >Delete</button>
                            </div>
                        </div>
                        <br />

                    </div>

                </div>
                <br />
            </Fragment >
        )
    }
}