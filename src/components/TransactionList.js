import React, { Fragment } from 'react';
import { waitingAlert } from '../utils/Alerts';
import { getAddressListContent, getTransactionsForAddressList, getUnconfirmedTransactionsForAddressList, getWalletAddressList, getWalletById } from '../utils/walletUtils';
import AddressListContent from './AddressListContent';
import DownloadTxListCSV from './DownloadTxListCSV';
import ImageButton from './ImageButton';
import Transaction from './Transaction';


export default class TransactionList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            setPage: props.setPage,
            color: props.color,
            addressContentList: [],
            transactionList: [],
            unconfirmedTransactionList: [],
            limit: 5,
            numberOfTransactions: 0,
            wallet: undefined,
        };
        this.updateTransactionList = this.updateTransactionList.bind(this);
        this.setLimit = this.setLimit.bind(this);
    }

    setLimit = (limit) => {
        this.setState({ limit: limit });
    }

    async updateTransactionList(showAlert = true) {
        var alert = "";
        if (showAlert) { alert = waitingAlert("Loading transations..."); };
        const wallet = await getWalletById(this.state.walletId);
        this.setState({ color: wallet.color });
        const walletAddressList = getWalletAddressList(wallet);
        const addressContentList = await getAddressListContent(walletAddressList);
        this.setState({ addressContentList: addressContentList, });
        const unConfirmedTxByAddressList = (await getUnconfirmedTransactionsForAddressList(walletAddressList))
            .map(txForAddr => txForAddr.transactions)
            .flat()
            .filter((t, index, self) => {
                return self.findIndex(tx => tx.id === t.id) === index;
            })
            .sort(function (a, b) {
                return parseInt(a.numConfirmations) - parseInt(b.numConfirmations);
            });
        this.setState({ unconfirmedTransactionList: unConfirmedTxByAddressList });
        const transactionByAddressList = await getTransactionsForAddressList(walletAddressList, this.state.limit);
        const numberOfTransactions = transactionByAddressList.map(item => item.total).reduce((prev, next) => prev + next)
        const transactionList = transactionByAddressList.map(txForAddr => txForAddr.transactions).flat();
        const transactionListFiltered = transactionList.filter((e, i) => transactionList.findIndex(a => a.id === e.id) === i)
            .sort(function (a, b) {
                return parseInt(a.numConfirmations) - parseInt(b.numConfirmations);
            })
            .slice(0, 2 * this.state.limit, Infinity);
        this.setState({ transactionList: transactionListFiltered, numberOfTransactions: parseInt(numberOfTransactions) });
        if (showAlert) { alert.close() };
    }

    async componentDidMount() {
        const wallet = await getWalletById(this.state.walletId);
        this.setState({ wallet: wallet });
        await this.updateTransactionList(true);
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    componentDidUpdate(prevProps, prevState) {
        //console.log("TransactionList componentDidUpdate", prevProps, prevState, this.state)
        if (prevState.limit !== this.state.limit) {
            this.updateTransactionList(false);
        }
        if (prevState.numberOfTransactions !== this.state.numberOfTransactions) {
            this.setState({
                numberOfTransactions: this.state.numberOfTransactions,
            });
        }
        if (prevState.transactionList.length > 0) {
            if (prevState.transactionList[0].numConfirmations !== this.state.transactionList[0].numConfirmations
                || prevState.transactionList.length !== this.state.transactionList.length) {
                this.updateTransactionList(false);
            }
        }
        if (prevState.unconfirmedTransactionList.length !== this.state.unconfirmedTransactionList.length) {
            this.updateTransactionList(false);
        }
    }

    render() {
        var walletColor = { r: 141, g: 140, b: 143, a: 1 };
        if (this.state.wallet) {
            walletColor = this.state.wallet.color;
        }

        return (
            <Fragment>
                <div className='container card m-1 p-1 d-flex flex-column w-75 '
                    style={{
                        borderColor: `rgba(${walletColor.r},${walletColor.g},${walletColor.b}, 0.95)`,
                    }}
                >
                    <div className='m-1 p-1 d-flex flex-row justify-content-between align-items-center'>
                        <div className='m-1 p-1 d-flex flex-column'>
                            <h4>Transactions list for {this.state.wallet ? this.state.wallet.name : null}</h4>
                            <div className='m-1 p-1 d-flex flex-row'>
                                Number of transactions:&nbsp;<h5>{this.state.numberOfTransactions}</h5>
                            </div>
                        </div>
                        <div className='m-1 p-1 d-flex flex-column align-items-end'>
                            <div className='d-flex flex-row'>
                                <ImageButton
                                    id={"backToWalletList"}
                                    color={"blue"}
                                    icon={"arrow_back"}
                                    tips={"Wallet list"}
                                    onClick={() => this.state.setPage('home')}
                                />
                                <DownloadTxListCSV
                                    walletId={this.state.walletId}
                                    numberOfTransactions={this.state.numberOfTransactions} />
                                <ImageButton
                                    id={"refreshTransactionPage"}
                                    color={"blue"}
                                    icon={"refresh"}
                                    tips={"Refresh transaction list"}
                                    onClick={this.updateTransactionList}
                                />
                            </div>
                            <AddressListContent addressContentList={this.state.addressContentList} />

                        </div>
                    </div>
                    {
                        this.state.wallet ?
                            this.state.unconfirmedTransactionList.map(tx =>
                                <Transaction key={tx.id} transaction={tx} wallet={this.state.wallet}
                                />)
                            :
                            null
                    }
                    {
                        this.state.wallet ?
                            this.state.transactionList.map(tx =>
                                <Transaction key={tx.id} transaction={tx} wallet={this.state.wallet}
                                />)
                            :
                            null
                    }
                    <br />

                    <div className='m-1 p-1 d-flex flex-row justify-content-center'>
                        <button className="btn btn-outline-info"
                            onClick={() => this.setLimit(this.state.limit + 10)}
                        >Load more transactions</button>
                        <button className="btn btn-outline-info"
                            onClick={() => this.setLimit(this.state.numberOfTransactions + 10)}
                        >Load all</button>
                    </div>
                </div>
            </Fragment>
        )
    }
}