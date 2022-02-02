import React, { Fragment } from 'react';
import { waitingAlert } from '../utils/Alerts';
import { getAddressListContent, getTransactionsForAddressList, getUnconfirmedTransactionsForAddressList, getWalletAddressList, getWalletById } from '../utils/walletUtils';
import AddressListContent from './AddressListContent';
import ImageButton from './ImageButton';
import Transaction from './Transaction';


export default class TransactionList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            setPage: props.setPage,
            color: props.color,
            addressContentList: props.addressContentList,
            transactionList: [],
            unconfirmedTransactionList: [],
            limit: 10,
            numberOfTransactions: 0,
        };
        this.updateTransactionList = this.updateTransactionList.bind(this);
        this.setLimit = this.setLimit.bind(this);
        this.timer = this.timer.bind(this);
    }

    setLimit = (limit) => {
        this.setState({ limit: limit });
    }

    async updateTransactionList() {
        var alert = waitingAlert("Loading transations...");
        const wallet = getWalletById(this.state.walletId);
        this.setState({ color: wallet.color });
        const walletAddressList = getWalletAddressList(wallet);
        const addressContentList = await getAddressListContent(walletAddressList);
        this.setState({ addressContentList: addressContentList, });

        const unConfirmedTxByAddressList = (await getUnconfirmedTransactionsForAddressList(walletAddressList))
            .map(txForAddr => txForAddr.transactions)
            .flat()
            .filter((t, index, self) => {
                return self.findIndex(tx => tx.id === t.id) === index;
            });
        console.log("unConfirmedTxByAddressList", unConfirmedTxByAddressList);
        this.setState({ unconfirmedTransactionList: unConfirmedTxByAddressList });

        const transactionByAddressList = await getTransactionsForAddressList(walletAddressList, this.state.limit);
        console.log("componentDidMount transactionList1", transactionByAddressList)
        const numberOfTransactions = transactionByAddressList.map(item => item.total).reduce((prev, next) => prev + next)
        const transactionList = transactionByAddressList.map(txForAddr => txForAddr.transactions).flat();
        const transactionListFiltered = transactionList.filter((e, i) => transactionList.findIndex(a => a.id === e.id) === i)
            .sort(function (a, b) {
                return a.numConfirmations - b.numConfirmations;
            })
            .slice(0, 2 * this.state.limit, Infinity);
        console.log("componentDidMount transactionList2", transactionListFiltered)
        this.setState({ transactionList: transactionListFiltered, numberOfTransactions: numberOfTransactions });
        alert.close();
    }

    async componentDidMount() {
        var intervalId = setInterval(this.timer, 30000);
        this.setState({ intervalId: intervalId });
        this.setLimit(10);
        await this.updateTransactionList();
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    timer() {
        this.updateWalletContent();
    }

    componentDidUpdate(prevProps, prevState) {
        console.log("TransactionList componentDidUpdate",prevProps,prevState, this.state)
        if (prevState.limit !== this.state.limit) {
            this.updateTransactionList();
        }
        if (prevState.transactionList.length > 0) {
            if (prevState.transactionList[0].numConfirmations !== this.state.transactionList[0].numConfirmations) {
                this.updateTransactionList();
            }
        }
    }

    render() {
        const wallet = getWalletById(this.state.walletId);

        return (
            <Fragment>
                <div className='container card m-1 p-1 d-flex flex-column w-75 ' style={{ borderColor: this.state.color }}>
                    <div className='m-1 p-1 d-flex flex-row justify-content-between align-items-center'>
                        <div className='m-1 p-1 d-flex flex-column'>
                            <h4>Transactions list for {wallet.name}</h4>
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
                    {this.state.unconfirmedTransactionList.map(tx => <Transaction key={tx.id} transaction={tx} wallet={wallet} />)}
                    {this.state.transactionList.map(tx => <Transaction key={tx.id} transaction={tx} wallet={wallet} />)}
                    <br />
                    <div className='m-1 p-1 d-flex flex-row justify-content-center'>
                        <button className="btn btn-outline-info"
                            onClick={() => this.setLimit(this.state.limit + 10)}
                        >Load more transactions</button>
                    </div>
                </div>
            </Fragment>
        )
    }
}