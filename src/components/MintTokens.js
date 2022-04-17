import React, { Fragment } from 'react';
import { getWalletAddressList, getWalletById } from '../utils/walletUtils';
import ImageButton from './ImageButton';
import SelectWallet from './SelectWallet';
import Select from 'react-select';
import { ImageUpload } from './ImageUpload';
import { FileUpload } from './FileUpload';
import SignTransaction from './SignTransaction';
import JSONBigInt from 'json-bigint';
import { createTxOutputs, createUnsignedTransaction, getUtxosForSelectedInputs } from '../ergo-related/ergolibUtils';
import { downloadAndSetSHA256, isValidHttpUrl } from '../utils/utils';
import { NTF_TYPES } from '../utils/constants';
import { encodeStr } from '../ergo-related/serializer';
import { waitingAlert } from '../utils/Alerts';
import { LS } from '../utils/utils';

const MAX_SIGNIFICANT_NUMBER_TOKEN = 19;
const AMOUNT_SENT = "0.002";
const TX_FEE = "0.002";

const optionsType = [
    { value: 'Standard', label: 'Standard' },
    { value: 'Picture', label: 'Picture' },
    { value: 'Audio', label: 'Audio' },
    { value: 'Video', label: 'Video' },
]

export default class MintTokens extends React.Component {
    constructor(props) {
        super(props);
        var optionsDecimals = [];
        for (var i = 0; i < 10; i++) {
            optionsDecimals.push({ value: i.toString(), label: i.toString() })
        }
        this.state = {
            walletList: [],
            setPage: props.setPage,
            tokenName: '',
            tokenAmount: '1',
            tokenDescription: '',
            tokenDecimals: '0',
            tokenType: 'Standard',
            tokenMediaHash: '',
            tokenMediaAddress: '',
            tokenMediaAddressUploaded: '',
            selectedWalletId: 0,
            selectedWallet: undefined,
            optionsDecimals: optionsDecimals,
            isValidTokenUrl: false,
        };
        this.setWallet = this.setWallet.bind(this);
        this.setTokenName = this.setTokenName.bind(this);
        this.setTokenDescription = this.setTokenDescription.bind(this);
        this.setTokenAmount = this.setTokenAmount.bind(this);
        this.setTokenDecimals = this.setTokenDecimals.bind(this);
        this.setTokenType = this.setTokenType.bind(this);
        this.setTokenMediaHash = this.setTokenMediaHash.bind(this);
        this.setTokenMediaAddress = this.setTokenMediaAddress.bind(this);
        this.isValidTokenAmount = this.isValidTokenAmount.bind(this);
        this.validateAmountStrInt = this.validateAmountStrInt.bind(this);
        this.setIsValidTokenUrl = this.setIsValidTokenUrl.bind(this);
        this.isValidTransaction = this.isValidTransaction.bind(this);
        this.getTransactionJson = this.getTransactionJson.bind(this);
    }
    async setWallet(walletId) { 
        const wallet = (await getWalletById(walletId));
        this.setState({ selectedWalletId: walletId, selectedWallet: wallet }); 
    };
    setTokenName = (name) => { this.setState({ tokenName: name }); };
    setTokenDescription = (desc) => { this.setState({ tokenDescription: desc }); };
    setIsValidTokenUrl = (isValid) => { this.setState({ isValidTokenUrl: isValid }); };
    setTokenAmount = (amount) => {
        if (this.isValidTokenAmount(amount)) {
            this.setState({
                tokenAmount: amount,
            });
        }
    };
    setTokenDecimals = (dec) => {
        this.setState({
            tokenDecimals: dec,
            tokenMediaAddress: '',
            tokenMediaAddressUploaded: '',
            tokenMediaHash: '',
        });
        if (dec === '0') {
            this.setTokenAmount(this.state.tokenAmount.split('.')[0]);
        } else {
            const splittedAmount = this.state.tokenAmount.split('.');
            var newAmount = splittedAmount[0];
            console.log(splittedAmount);
            if (splittedAmount.length > 1 && typeof splittedAmount[1] === 'string' && splittedAmount[1].length > 0) {
                newAmount = newAmount + '.' + splittedAmount[1].substring(0, dec);
            }
            this.setTokenAmount(newAmount);
        }
    };
    setTokenType = (type) => {
        var decimals = this.state.tokenDecimals;
        if (type !== 'Standard') {
            decimals = '0';
        }
        this.setState({
            tokenType: type,
        });
        this.setTokenDecimals(decimals);
    };
    setTokenMediaHash = (hash) => { this.setState({ tokenMediaHash: hash }); };
    setTokenMediaAddress = (addr) => { this.setState({ tokenMediaAddress: addr }); };
    setTokenMediaAddressUploaded = (addr) => { this.setState({ tokenMediaAddress: addr, tokenMediaAddressUploaded: addr }); };
    isValidTokenAmount = (amount) => {
        var validAmount = false;
        if (amount.match("^[0-9\.]+$") != null) {
            if (this.state.tokenDecimals === '0') { // No decimals
                if (amount.match("^[0-9]+$") != null) {
                    validAmount = this.validateAmountStrInt(amount);
                }
            } else { // Token decimals allowed
                var splited = amount.split('.');
                if (splited.length === 1) { // no decimals
                    validAmount = this.validateAmountStrInt(amount);
                }
                if (splited.length === 2) {
                    if (amount.length - 1 < MAX_SIGNIFICANT_NUMBER_TOKEN) {
                        if (splited[1].length <= parseInt(this.state.tokenDecimals)) {
                            validAmount = this.validateAmountStrInt(splited[0] + splited[1]);
                        }
                    }
                }
            }
        }
        return validAmount;
    }
    validateAmountStrInt = (amountStrInt) => {
        if (amountStrInt.length <= MAX_SIGNIFICANT_NUMBER_TOKEN) {
            try {
                const a = BigInt(amountStrInt);
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    }
    isValidTransaction = () => {
        var isValid = true;
        if (this.state.tokenName.length < 1) {
            isValid = false;
        }
        if (this.state.tokenType !== 'Standard') {
            if (!isValidHttpUrl(this.state.tokenMediaAddress)) {
                isValid = false;
            }
        }
        return isValid;
    }

    async componentDidMount() {
        const walletList = (await LS.getItem('walletList')) ?? [];
        const selectedWallet = (await getWalletById(this.state.selectedWalletId))
        this.setState({ walletList: walletList, selectedWallet: selectedWallet })
    }

    async getTransactionJson() {
        const alert = waitingAlert("Preparing the transaction...");
        const amountToSendFloat = parseFloat(AMOUNT_SENT);
        const feeFloat = parseFloat(TX_FEE);
        const totalAmountToSendFloat = amountToSendFloat + feeFloat;
        const wallet = this.state.selectedWallet;
        const selectedAddresses = getWalletAddressList(wallet);
        const [selectedUtxos, memPoolTransaction] = await getUtxosForSelectedInputs(selectedAddresses,
            totalAmountToSendFloat, [], []);

        //console.log("sendTransaction", amountToSendFloat, feeFloat, wallet);
        var outputCandidates = await createTxOutputs(selectedUtxos, wallet.changeAddress, wallet.changeAddress,
            amountToSendFloat, feeFloat, [], [], {
            amount: this.state.tokenAmount,
            name: this.state.tokenName,
            description: this.state.tokenDescription,
            decimals: parseInt(this.state.tokenDecimals)
        });

        const unsignedTransaction = await createUnsignedTransaction(selectedUtxos, outputCandidates);
        var jsonUnsignedTx = JSONBigInt.parse(unsignedTransaction.to_json());
        const tokenType = this.state.tokenType;
        console.log("getTransactionJson", this.state, tokenType);
        if (tokenType !== 'Standard') { // add NFT type, hash, and url
            const input0BoxId = jsonUnsignedTx.inputs[0].boxId ?? "";
            for (const i in jsonUnsignedTx.outputs) {
                console.log("output", output);
                var output = jsonUnsignedTx.outputs[i];
                if (Object.keys(output).includes("assets")
                    && Array.isArray(output.assets)
                    && Object.keys(output).includes("additionalRegisters")) {
                    const outputTokenList = output.assets.map(tok => tok.tokenId);
                    if (outputTokenList.includes(input0BoxId)) {
                        var register = output.additionalRegisters;
                        register["R7"] = NTF_TYPES[tokenType];
                        if (this.state.tokenMediaHash !== "") {
                            register["R8"] = await encodeStr(this.state.tokenMediaHash);
                        } else {
                            const hash = await downloadAndSetSHA256(this.state.tokenMediaAddress);
                            register["R8"] = await encodeStr(hash);
                        }

                        register["R9"] = await encodeStr(this.state.tokenMediaAddress);
                        output.additionalRegisters = register;
                        jsonUnsignedTx.outputs[i] = output;
                    }
                }
            }
        }
        alert.close();
        console.log("getTransactionJson unsignedTransaction", jsonUnsignedTx);
        return [jsonUnsignedTx, selectedUtxos, memPoolTransaction];
    }

    render() {
        const selectedWallet = this.state.selectedWallet;
        var walletAddressList = [];
        if (selectedWallet) {
            walletAddressList = getWalletAddressList(selectedWallet);
        }
        console.log("selectedWallet", selectedWallet)
        var appTips = "The application is intended mint tokens followin EIP-004 format.<br />";
        appTips += "Images, sounds and videos tokens needs to have 0 decimals.<br />";

        return (
            <Fragment >
                {
                    selectedWallet ?
                        <Fragment >
                            <div className="w-100 container">
                                <div className="d-flex flex-row justify-content-center align-items-center m-1 p-1">
                                    <h4>Mint tokens</h4>&nbsp;
                                    <ImageButton id="help-tx-builder" icon="help_outline"
                                        tips={appTips} />
                                </div>
                                <div className="w-100 container-xxl ">
                                    <div className="card p-1 m-2 w-100">
                                        <div className="d-flex flex-row align-items-center justify-content-center">
                                            <div className="d-flex flex-row align-items-center ">
                                                <h5>Wallet</h5>&nbsp;
                                                <div className="d-flex flex-row align-items-center">
                                                    <SelectWallet selectedWalletId={this.state.selectedWalletId}
                                                        setWallet={this.setWallet} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-100 container">
                                <div className="card p-1 m-2 w-100">
                                    <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                                        <label htmlFor="tokenName" className='col-sm-3'>Token name</label>
                                        <input type="text"
                                            id="tokenName"
                                            className="form-control col-sm"
                                            onChange={e => this.setTokenName(e.target.value)}
                                            value={this.state.tokenName}
                                        />
                                    </div>
                                    <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                                        <label htmlFor="tokenDescription" className='col-sm-3'>Token description</label>
                                        <textarea id="tokenDescription"
                                            className="form-control col-sm"
                                            onChange={e => this.setTokenDescription(e.target.value)}
                                            value={this.state.tokenDescription}
                                            rows="4"
                                        />
                                    </div>
                                    <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                                        <label htmlFor="tokenAmount" className='col-sm-3'>Token amount</label>
                                        <input type="text"
                                            id="tokenAmount"
                                            className="form-control col-sm"
                                            onChange={e => this.setTokenAmount(e.target.value)}
                                            value={this.state.tokenAmount}
                                        />
                                    </div>
                                    <div className='d-flex flex-row align-items-center m-1 p-1'>
                                        <label htmlFor="tokenDecimals" className='col-sm-3'>Token decimals</label>
                                        <Select id="tokenDecimals"
                                            className='selectReact'
                                            value={{
                                                value: this.state.tokenDecimals,
                                                label: this.state.tokenDecimals
                                            }}
                                            onChange={(dec) => this.setTokenDecimals(dec.value)}
                                            options={this.state.optionsDecimals}
                                            isSearchable={false}
                                            isMulti={false}
                                            isDisabled={this.state.tokenType !== 'Standard'}
                                        />
                                    </div>
                                    <div className='d-flex flex-row align-items-center m-1 p-1'>
                                        <label htmlFor="tokenType" className='col-sm-3'>Token type</label>
                                        <Select id="tokenType"
                                            className='selectReact'
                                            value={{
                                                value: this.state.tokenType,
                                                label: this.state.tokenType
                                            }}
                                            onChange={(type) => this.setTokenType(type.value)}
                                            options={optionsType}
                                            isSearchable={false}
                                            isMulti={false}
                                        />
                                    </div>
                                    {
                                        this.state.tokenType === "Standard" ? null
                                            :
                                            <Fragment>
                                                <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                                                    <label htmlFor="tokenMediaAddr" className='col-sm-3'>{this.state.tokenType} URL</label>
                                                    <input type="text"
                                                        id="tokenMediaAddr"
                                                        className="form-control col-sm"
                                                        onChange={e => this.setTokenMediaAddress(e.target.value)}
                                                        value={this.state.tokenMediaAddress}
                                                        disabled={this.state.tokenMediaHash !== '' || this.state.tokenMediaAddressUploaded !== ''}
                                                    />
                                                </div>
                                                <div className='d-flex flex-row align-items-center m-1 p-1'>
                                                    <label htmlFor="tokenMediaUpload" className='col-sm-3'>Upload {this.state.tokenType}</label>
                                                    <div className='d-flex flex-col align-items-center m-1 p-1' id="tokenMediaUpload">
                                                        {
                                                            this.state.tokenMediaAddressUploaded === '' ?
                                                                this.state.tokenType === "Picture" ?
                                                                    <ImageUpload setUrl={this.setTokenMediaAddressUploaded} setHash={this.setTokenMediaHash} />
                                                                    :
                                                                    <FileUpload setUrl={this.setTokenMediaAddressUploaded} setHash={this.setTokenMediaHash} />
                                                                : null
                                                        }
                                                        <a href={this.state.tokenMediaAddressUploaded} target='_blank' rel='noopener noreferrer'>
                                                            {this.state.tokenMediaAddressUploaded}
                                                        </a>
                                                    </div>
                                                </div>
                                            </Fragment>
                                    }

                                </div>
                            </div>
                            <div className="w-100 container">
                                <div className="card p-1 m-2 w-100">
                                    <SignTransaction walletId={this.state.selectedWalletId}
                                        isValidTx={this.isValidTransaction()}
                                        sendToAddress={selectedWallet.changeAddress}
                                        signAddressList={walletAddressList}
                                        txFee={"0.0011"}
                                        setPage={this.state.setPage}
                                        getTransactionJson={this.getTransactionJson}
                                    />
                                </div>
                            </div>
                        </Fragment>
                        :
                        <div className="w-100 container">
                            <div className="d-flex flex-row justify-content-center align-items-center m-1 p-1">
                                <h4>Mint tokens</h4>&nbsp;
                                <ImageButton id="help-tx-builder" icon="help_outline"
                                    tips={appTips} />
                            </div>
                            <div className="w-100 container-xxl ">
                                <div className="card p-2 m-2 w-100 d-flex flex-row justify-content-between align-items-center">
                                    <h5>Create a wallet with at least 0.005 ERG to mint tokens</h5>
                                </div>
                            </div>
                        </div>
                }
            </Fragment>
        )
    }
}
