import React, { Fragment } from 'react';
import Wallet from './Wallet';
import ImageButton from './ImageButton';
import { getAddressListContent, getTokenValue, getUnconfirmedTransactionsForAddressList, getWalletListAddressList, updateUnusedAddresses } from '../utils/walletUtils';
import { errorAlert, waitingAlert } from '../utils/Alerts';
import { updateErgoPrice } from '../ergo-related/ergoprice';

export default class WalletList extends React.Component {
    constructor(props) {
        super(props);
        let walletList = localStorage.getItem('walletList');
        if (walletList === null) { /// move to app
            localStorage.setItem('walletList', JSON.stringify([]));
            walletList = localStorage.getItem('walletList');
        }
        walletList = JSON.parse(walletList);
        this.state = {
            walletList: walletList,
            addressContentList: [],
            setPage: props.setPage,
            tokenRatesDict: {},
        };
        this.updateWalletList = this.updateWalletList.bind(this);
        this.timer = this.timer.bind(this);
    }

    async componentDidMount() {
        var intervalId = setInterval(this.timer, 60000);
        this.setState({ intervalId: intervalId });
        updateUnusedAddresses();
        await this.updateWalletAddressListContent();
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    timer() {
        this.updateWalletAddressListContent(false);
    }

    async updateWalletList() {
        const walletList = JSON.parse(localStorage.getItem('walletList'));
        console.log("updateWalletList", walletList);
        this.setState({
            walletList: walletList,
        });
        await this.updateWalletAddressListContent();
    }

    async updateWalletAddressListContent(showAlert = true) {
        var alert = '';
        if (showAlert) { alert = waitingAlert("Loading wallet content..."); }
        var walletsAddressListContent = [];
        const addressList = getWalletListAddressList(this.state.walletList);

        var unconfirmedTransactions = [];
        try { // when the tx disappear from mempool we fail to fetch the box content
            const distinctWalletAddressList = [...new Set(addressList.flat())];
            unconfirmedTransactions = (await getUnconfirmedTransactionsForAddressList(distinctWalletAddressList))
                .map(txForAddr => txForAddr.transactions)
                .flat()
                .filter((t, index, self) => {
                    return self.findIndex(tx => tx.id === t.id) === index;
                });
        } catch (e) {
            console.log("Failed fetch Unconfirmed transactions", e)
        }

        try {
            for (const walletAddressList of addressList) {
                var addressContentList = await getAddressListContent(walletAddressList);
                for (const e of addressContentList) {
                    e["unconfirmedTx"] = unconfirmedTransactions;
                }
                walletsAddressListContent.push(addressContentList);
            }
            //console.log("walletsAddressListContent", walletsAddressListContent);
        } catch (e) {
            errorAlert("Failed to fetch wallet content from explorer API")
        }
        await updateErgoPrice();
        this.setState({
            addressContentList: walletsAddressListContent,
        });

        if (showAlert) { alert.close(); }

        getTokenValue().then(tokenRatesDict => {
            this.setState({
                tokenRatesDict: tokenRatesDict,
            });
        });
    }

    render() {
        //console.log("wallet list render", this.state.walletList, this.state.addressContentList)
        return (
            <Fragment>
                <div className='container card w-75 m-2 p-2 '>
                    <div className='d-flex flex-row align-items-center'>
                        <h4>Wallets</h4>&nbsp;
                        <div className='d-flex flex-row align-items-center'>
                            <ImageButton
                                id={"newWallet"}
                                color={"green"}
                                icon={"add_card"}
                                tips={"Add new wallet"}
                                onClick={() => this.state.setPage('add')}
                            />
                            <ImageButton
                                id={"newErgoPayWallet"}
                                color={"orange"}
                                icon={"add_card"}
                                tips={"Add new ErgoPay wallet<br/>Sign using iOS or Android wallet"}
                                onClick={() => this.state.setPage('addErgoPay')}
                            />
                            <ImageButton
                                id={"refreshWalletList"}
                                color={"blue"}
                                icon={"refresh"}
                                tips={"Update wallet list"}
                                onClick={this.updateWalletList}
                            />
                        </div>
                    </div>
                    <div className='d-flex flex-column justify-content-between'>
                        {this.state.walletList.map((item, id) => (
                            <Wallet
                                key={id}
                                id={id}
                                setPage={this.state.setPage}
                                wallet={this.state.walletList[id]}
                                addressContentList={this.state.addressContentList[id]}
                                updateWalletList={this.updateWalletList}
                                tokenRatesDict={this.state.tokenRatesDict}
                            />
                        ))}
                    </div>
                </div>
            </Fragment>
        )
    }
}
