import React, { Fragment } from 'react';
import { getAddress } from '../ergo-related/ergolibUtils';
import { decryptMnemonic, getAccountAddressList, getLastAccountId, lastAccountHasTransaction, updateWallet } from '../utils/walletUtils';
import AddressListContent from './AddressListContent';
import ImageButton from './ImageButton';
import Account from './Account';
import Address from './Address';
import { errorAlert, promptPassword } from '../utils/Alerts';
import { LS } from '../utils/utils';
import { getNewAccount } from '../ergo-related/ledger';
import { DeviceError } from 'ledger-ergo-js';

export default class Wallet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: props.id,
            wallet: props.wallet,
            setPage: props.setPage,
            addressContentList: props.addressContentList,
            showAccounts: false,
            updateWalletList: props.updateWalletList,
            expertMode: false,
            expertMode: (localStorage.getItem('expertMode') === 'true') ?? false,
            tokenRatesDict: props.tokenRatesDict,
        };
        //console.log("Wallet constructor", props.wallet, props.addressContentList, JSON.stringify(props.addressContentList));
        this.addNewAccount = this.addNewAccount.bind(this);
        this.toggleAccounts = this.toggleAccounts.bind(this);
    }

    async addNewAccount() {
        const txFound = await lastAccountHasTransaction(this.state.wallet);
        var newWallet = { ...this.state.wallet };
        if (txFound) {
            if (this.state.wallet.type === 'mnemonic') {
                const password = await promptPassword("Spending password for <br/>" + this.state.wallet.name, "", "Add account");
                const mnemonic = decryptMnemonic(this.state.wallet.mnemonic, password);
                if (mnemonic !== '') {
                    const lastAccountId = getLastAccountId(this.state.wallet);
                    const newAddr = await getAddress(mnemonic, lastAccountId + 1, 0);
                    newWallet.accounts = [...newWallet.accounts, {
                        id: lastAccountId + 1,
                        name: "Account_" + (lastAccountId + 1).toString(),
                        addresses: [{ id: 0, address: newAddr, used: false }]
                    }];
                    //console.log("addNewAccount", newWallet);
                    updateWallet(newWallet, this.state.id);
                    window.location.reload();
                    //this.setState({wallet: {...newWallet}});
                } else {
                    errorAlert("Failed to decrypt mnemonic for " + this.state.wallet.name, "Invalid password");
                    return;
                }
            }
            if (this.state.wallet.type === 'ledger') {
                try {
                    const newAccount = await getNewAccount(newWallet);
                    newWallet.accounts = [...newWallet.accounts, newAccount];
                    updateWallet(newWallet, this.state.id);
                    window.location.reload();
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
            errorAlert("Last account has no transaction.", "Cannot create new account (BIP-44)");
            return;
        }
    }

    toggleAccounts = () => {
        this.setState(prevState => ({
            showAccounts: !prevState.showAccounts,
        }))
    }

    componentDidUpdate(prevProps, prevState) {
        //console.log("Wallet did update ", prevProps, prevState, this.props.tokenRatesDict)
        if (prevState.wallet.name !== this.state.wallet.name) {
            this.setState({
                wallet: prevProps.wallet,
                addressContentList: this.props.addressContentList,
            });
        }
        if (prevState.addressContentList !== this.props.addressContentList) {
            this.setState({
                addressContentList: this.props.addressContentList,
            });
        }
        if (prevState.tokenRatesDict !== this.props.tokenRatesDict) {
            this.setState({
                tokenRatesDict: this.props.tokenRatesDict,
            });
        }
    }

    async componentDidMount() {
        const expertMode = (await LS.getItem('expertMode')) ?? false;
        this.setState({expertMode: expertMode});
    }

    render() {
        const walletAddressList = this.state.wallet.accounts.map(account => account.addresses).flat();
        const walletColor = this.state.wallet.color;
        return (
            <Fragment>
                <div key={this.state.wallet.name} className='card p-1 m-2 walletCard d-flex flex-column'
                    style={{
                        borderColor: `rgba(${walletColor.r},${walletColor.g},${walletColor.b}, 0.95)`,
                        backgroundColor: `rgba(${walletColor.r},${walletColor.g},${walletColor.b}, 0.10)`
                    }}>
                    <div className='d-flex flex-row justify-content-between align-items-start'>
                        <div className='d-flex flex-row align-items-baseline'>
                            <ImageButton
                                id={"walletDetails"}
                                color={"blue"}
                                icon={this.state.showAccounts ? "expand_more" : "expand_less"}
                                tips={"Wallet details"}
                                onClick={() => this.toggleAccounts()}
                            />
                            <ImageButton
                                id={"sendTransaction"}
                                color={"blue"}
                                icon={"send"}
                                tips={"Send assets"}
                                onClick={() => this.state.setPage('send', this.state.id)}
                            />
                            <ImageButton
                                id={"transactionList"}
                                color={"blue"}
                                icon={"receipt_long"}
                                tips={"Transactions list"}
                                onClick={() => this.state.setPage('transactions', this.state.id)}
                            />
                            <ImageButton
                                id={"editWallet"}
                                color={"orange"}
                                icon={"edit"}
                                tips={"Edit wallet"}
                                onClick={() => this.state.setPage('edit', this.state.id)}
                            />&nbsp;
                            <h5>{this.state.wallet.name}</h5>
                            {
                                this.state.wallet.type === "ergopay" ?
                                    <ImageButton
                                        id={"ergopayWallet"}
                                        color={"white"}
                                        icon={"phone_android"}
                                        tips={"ErgoPay wallet"} />
                                    : null
                            }
                            {
                                this.state.wallet.type === "ledger" ?
                                    <ImageButton
                                        id={"ledgerWallet"}
                                        color={"white"}
                                        icon={"vpn_key"}
                                        tips={"Ledger wallet"} />
                                    : null
                            }
                        </div>
                        {
                            !this.state.showAccounts ?
                                <div>
                                    <AddressListContent addressContentList={this.state.addressContentList} tokenRatesDict={this.state.tokenRatesDict}/>
                                </div>
                                : <div></div>
                        }
                    </div>
                    {
                        this.state.showAccounts ?

                            this.state.expertMode && this.state.wallet !== "ergopay" ?
                                <div>
                                    <div className='d-flex flex-row align-items-center'>
                                        <div className='d-flex flex-row'>&nbsp;Accounts</div>
                                        <ImageButton
                                            id={"newAccount"}
                                            color={"green"}
                                            icon={"add"}
                                            tips={"Add new account"}
                                            onClick={this.addNewAccount}
                                        />
                                    </div>
                                    {
                                        this.state.wallet.accounts.map((account, id) =>
                                            <Account key={id}
                                                walletId={this.state.id}
                                                account={account}
                                                color={walletColor}
                                                addressContentList={this.state.addressContentList.filter(addrContent =>
                                                    getAccountAddressList(account).includes(addrContent.address)
                                                )}
                                                tokenRatesDict={this.state.tokenRatesDict}
                                            />
                                        )
                                    }
                                </div>
                                :
                                <div>
                                    {
                                        walletAddressList.sort(function (a, b) { return b.used.toString().localeCompare(a.used.toString()); })
                                            .map((address, id) =>
                                                <Address
                                                    key={address.address}
                                                    address={address.address}
                                                    color={this.state.wallet.color}
                                                    addressContent={this.state.addressContentList.find(addrContent => addrContent.address === address.address)}
                                                    used={walletAddressList.find(addressW => addressW.address === address.address).used}
                                                    tokenRatesDict={this.state.tokenRatesDict}
                                                />
                                            )
                                    }
                                </div>
                            : null
                    }
                </div>
            </Fragment>
        )
    }
}