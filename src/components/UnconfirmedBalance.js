import React, { Fragment } from 'react';
import { getUtxoBalanceForAddressList } from '../ergo-related/utxos';
import { formatERGAmount, formatTokenAmount } from '../utils/walletUtils';


export default class UnconfirmedBalance extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            unconfirmedTx: props.unconfirmedTx,
            addressList: props.addressList,
        };
        // this.addNewAddress = this.addNewAddress.bind(this);

    }

    async componentDidMount() {
        const unconfirmedInputs = this.state.unconfirmedTx.map(tx => tx.inputs).flat();
        const unconfirmedOutputs = this.state.unconfirmedTx.map(tx => tx.outputs).flat();
        const unconfirmedBalance = await getUtxoBalanceForAddressList(unconfirmedInputs, unconfirmedOutputs, this.state.addressList);
        console.log("AddressListContent23", unconfirmedInputs, unconfirmedOutputs, this.state.addressList, JSONBigInt.stringify(unconfirmedBalance))
        this.setState({
            unconfirmedBalance: unconfirmedBalance,
        })
    }

    async componentDidUpdate(prevProps, prevState) {
        console.log("componentDidUpdate", prevProps, this.props, prevState, this.state)
        if (this.props.unconfirmedTx.length != prevProps.unconfirmedTx.length) {
            const unconfirmedInputs = this.state.unconfirmedTx.map(tx => tx.inputs).flat();
            const unconfirmedOutputs = this.state.unconfirmedTx.map(tx => tx.outputs).flat();
            const unconfirmedBalance = await getUtxoBalanceForAddressList(unconfirmedInputs, unconfirmedOutputs, this.state.addressList);
            console.log("AddressListContent23", unconfirmedInputs, unconfirmedOutputs, this.state.addressList, JSONBigInt.stringify(unconfirmedBalance))
            this.setState({
                unconfirmedBalance: unconfirmedBalance,
            })
        }
    }

    render() {
        var unconfirmedBalance = { value: 0, tokens: [] };
        if (this.state.unconfirmedBalance !== undefined) {
            unconfirmedBalance = this.state.unconfirmedBalance;
        }
        console.log("UnconfirmedBalance render", unconfirmedBalance,this.state.unconfirmedBalance);
        return (
            <Fragment>
                {
                    unconfirmedBalance.value !== 0 ?
                        <div className='card m-1 p-1 d-flex flex-column justify-content-between'>
                            Pending
                            <h5 className={'textSmall ' + (unconfirmedBalance.value > 0 ? "greenAmount" : "redAmount")}>
                                {unconfirmedBalance.value > 0 ? "+" : null}{formatERGAmount(unconfirmedBalance.value)} ERG
                            </h5>
                            {
                                unconfirmedBalance.tokens.map((tok, index) =>
                                    <div key={index} className='d-flex flex-row align-items-end justify-content-between'>
                                        <div className={'textSmall d-flex flex-row ' + (tok.amount > 0 ? "greenAmount" : "redAmount")}>
                                            {tok.amount > 0 ? "+" : null}{formatTokenAmount(tok.amount, tok.decimals)}
                                        </div>&nbsp;
                                        <div className='textSmall'>
                                            {tok.name}
                                        </div>

                                    </div>
                                )
                            }

                        </div>
                        : <div></div>
                }
            </Fragment>
        )
    }
}