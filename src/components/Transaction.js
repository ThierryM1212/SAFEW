import React, { Fragment } from 'react';
import { getUtxoBalanceForAddressList } from '../ergo-related/utxos';
import { formatLongString, getWalletAddressList } from '../utils/walletUtils';
import { formatERGAmount, formatTokenAmount } from '../utils/walletUtils';
import ImageButton from './ImageButton';

export default class Transaction extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            transaction: props.transaction,
            wallet: props.wallet,
            balance: {value: 0,tokens:[]}
        };
    }

    async componentDidMount() {
        const walletAddressList = getWalletAddressList(this.state.wallet);
        const balance = await getUtxoBalanceForAddressList(this.state.transaction.inputs, this.state.transaction.outputs, walletAddressList);
        this.setState({ balance: balance })
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.transaction && prevProps.transaction.numConfirmations) {
            if (prevProps.transaction.numConfirmations !== this.props.transaction.numConfirmations) {
                this.setState({ transaction: this.props.transaction })
            }
        }
    }

    render() {
        const tx = this.state.transaction;
        const balance = this.state.balance;
        var txDate = new Intl.DateTimeFormat();
        if (Object.keys(tx).includes("timestamp")) {
            txDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(tx.timestamp));
        } else {
            txDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(tx.creationTimestamp));
        }
        
        return (
            <Fragment>
                <div className='card p-1'>
                    <div className='d-flex flew-row justify-content-between align-items-center'>
                        <div className='d-flex flex-column'>
                            <div className='d-flex flew-row'>

                                {window.innerWidth > 1300 ? tx.id : formatLongString(tx.id, 15)}
                                <ImageButton
                                    id={"openTRansactionExplorer" + tx.id}
                                    color={"blue"}
                                    icon={"open_in_new"}
                                    tips={"Open the transaction " + tx.id + " in Explorer"}
                                    onClick={() => {
                                        const url = localStorage.getItem('explorerWebUIAddress') + 'en/transactions/' + tx.id;
                                        window.open(url, '_blank').focus();
                                    }}
                                />
                            </div>
                            <div className='textSmall'>{txDate}</div>
                        </div>
                        <div className='d-flex flex-column col-sm-2'>
                            <ImageButton
                                id={"numConfirm" + tx.id}
                                color={tx.numConfirmations === undefined ? "grey" : tx.numConfirmations > 4 ? "green" : "orange"}
                                icon={tx.numConfirmations === undefined ? "hourglass_top" : tx.numConfirmations > 9 ? "done_all" : "done"}
                                tips={tx.numConfirmations === undefined ? "Unconfirmed" : "Number of confirmations: " + tx.numConfirmations}

                            />
                        </div>
                        <div className='d-flex flex-column col-sm'>
                            <div className='d-flex flew-row justify-content-end align-items-center'>
                                <h5 className={balance.value > 0 ? "greenAmount" : "redAmount"}>
                                    {balance.value > 0 ? "+" : null}
                                    {formatERGAmount(balance.value)}
                                </h5>
                                &nbsp;
                                <h5>ERG</h5>
                            </div>
                            <div >
                                {
                                    balance.tokens.map(tok =>
                                        <div key={tok.tokenId} className='d-flex flew-row justify-content-end align-items-center'>
                                            <div className={'d-flex flew-row justify-content-end align-items-center ' + (parseInt(tok.amount) > 0 ? "greenAmount" : "redAmount")}>
                                                {parseInt(tok.amount) > 0 ? "+" : null}
                                                {formatTokenAmount(tok.amount, tok.decimals)}
                                            </div>
                                            &nbsp;
                                            <div className='d-flex flew-row justify-content-end align-items-center'>
                                                {tok.name}
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </Fragment>
        )
    }
}