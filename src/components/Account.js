import React, { Fragment } from 'react';
import ContentEditable from 'react-contenteditable';
import { decryptMnemonic, getWalletById, setAccountName, updateWallet } from '../utils/walletUtils';
import AddressListContent from './AddressListContent';
import ImageButton from './ImageButton';
import Address from './Address';
import { MAX_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT } from '../utils/constants';
import { errorAlert, promptPassword, successAlert } from '../utils/Alerts';
import { getAddress } from '../ergo-related/ergolibUtils';
import { LS } from '../utils/utils';
import { getNewAddress } from '../ergo-related/ledger';
import { DeviceError } from 'ledger-ergo-js';
import { addressHasTransactions } from '../ergo-related/node';

export default class Account extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            account: props.account,
            name: props.account.name,
            showAddresses: false,
            color: props.color,
            addressContentList: props.addressContentList,
            tokenRatesDict: props.tokenRatesDict,
            walletAddressList: [],
        };
        this.addNewAddress = this.addNewAddress.bind(this);
        this.setAccountName = this.setAccountName.bind(this);
        this.toggleAddresses = this.toggleAddresses.bind(this);
        this.contentEditable = React.createRef();
    }

    async addNewAddress() {
        //const address = await addNewAddress(this.state.walletId, this.state.account.id);
        const accountId = this.state.account.id;
        var wallet = await getWalletById(this.state.walletId);
        const account = wallet.accounts[accountId];
        var unusedAddresses = 0, maxAddrIndex = 0, usedAddresses = 0;
        for (const address of account.addresses) {
            if (!await addressHasTransactions(address.address)) {
                unusedAddresses++;
            } else {
                usedAddresses++;
            }
            maxAddrIndex = Math.max(maxAddrIndex, address.id)
        }
        //console.log("addNewAddress",unusedAddresses,maxAddrIndex)
        if (unusedAddresses < MAX_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT) {
            if (usedAddresses > 0) {
                if (wallet.type === 'mnemonic') {
                    const password = await promptPassword("Spending password for<br/>" + wallet.name, "", "Search");
                    const mnemonic = decryptMnemonic(wallet.mnemonic, password);
                    if (mnemonic !== '') {
                        const newAddr = await getAddress(mnemonic, accountId, maxAddrIndex + 1);
                        //console.log("newAddr", newAddr);
                        wallet.accounts[accountId].addresses = [...wallet.accounts[accountId].addresses, { id: maxAddrIndex + 1, address: newAddr, used: false }];
                        updateWallet(wallet, this.state.walletId);
                        successAlert("Address " + newAddr + " added")
                        .then(res=>{
                            window.location.reload();
                        });
                    } else {
                        errorAlert("Failed to decrypt Mnemonic", "incorrect password");
                        return -1;
                    }
                }
                if (wallet.type === 'ledger') {
                    try {
                        const newAddress = await getNewAddress(wallet, accountId);
                        //console.log('ledger',wallet.accounts[accountId]);
                        wallet.accounts[accountId].addresses = [...wallet.accounts[accountId].addresses, newAddress];
                        updateWallet(wallet, this.state.walletId);
                        successAlert("Address " + newAddress.address + " added")
                        .then(res=>{
                            window.location.reload();
                        });
                    } catch (e) {
                        console.log("getLedgerAddresses catch", e);
                        if (e instanceof DeviceError) {
                            errorAlert("Cannot connect Ledger ergo application, unlock the ledger and start the Ergo applicaiton on the ledger.");
                        } else {
                            if (e instanceof Error) {
                                errorAlert(e.message);
                            }
                        }
                    }
                }
                
            } else {
                errorAlert("Failed to create new address", "No used address in the account")
                return -1;
            }
        } else {
            errorAlert("Failed to create new address", "More than " + MAX_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT + " are unused")
            return -1;
        }
    }

    async setAccountName(newName) {
        if (newName) {
            await setAccountName(this.state.walletId, this.state.account.id, newName);
            const walletList = (await LS.getItem("walletList"));
            this.setState({ account: walletList[this.state.walletId].accounts[this.state.account.id] })
        }
    }

    toggleAddresses = () => {
        this.setState(prevState => ({
            showAddresses: !prevState.showAddresses,
        }));
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.addressContentList !== this.props.addressContentList) {
            this.setState({
                addressContentList: this.props.addressContentList,
            });
        }
        if (prevProps.tokenRatesDict !== this.props.tokenRatesDict) {
            this.setState({
                tokenRatesDict: this.props.tokenRatesDict,
            });
        }
    }

    async componentDidMount() {
        const wallet = await getWalletById(this.state.walletId);
        const walletAddressList = wallet.accounts.map(account => account.addresses).flat();
        this.setState({ walletAddressList: walletAddressList });
    }

    render() {

        //console.log("Account", this.state.account);
        //console.log("Account this.state.tokenRatesDict", this.state.tokenRatesDict);
        return (
            <Fragment>
                <div className='card m-1 p-1 ' style={{ borderColor: this.state.color }}>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <h6><ContentEditable className={this.state.account.name ? null : "addborder col-sm-3"}
                            innerRef={this.contentEditable}
                            html={this.state.account.name}
                            disabled={false}
                            onChange={e => this.setAccountName(e.target.value)}
                        /></h6>
                        <div>Account {this.state.account.id}</div>
                    </div>
                    <AddressListContent addressContentList={this.state.addressContentList} tokenRatesDict={this.state.tokenRatesDict} />
                    <div className='d-flex flex-row align-items-center'>
                        <ImageButton
                            id={"toggleAddresses"}
                            color={"blue"}
                            icon={this.state.showAddresses ? "expand_more" : "expand_less"}
                            tips={"Show / hide account's address(es)"}
                            onClick={this.toggleAddresses}
                        />
                        <div>Addresses</div>
                        <ImageButton
                            id={"addAddress"}
                            color={"green"}
                            icon={"add"}
                            tips={"Add unused address"}
                            onClick={this.addNewAddress}
                        />
                    </div>
                    <div className='d-flex flex-column'>
                        {this.state.showAddresses ?
                            this.state.account.addresses.map((address, id) =>
                                <Address
                                    key={address.address}
                                    address={address.address}
                                    color={this.state.color}
                                    addressContent={this.state.addressContentList.find(addrContent => addrContent.address === address.address)}
                                    used={this.state.walletAddressList.find(addressW => addressW.address === address.address).used}
                                    tokenRatesDict={this.state.tokenRatesDict}
                                />
                            )
                            : null
                        }
                    </div>
                </div>
            </Fragment>
        )
    }
}