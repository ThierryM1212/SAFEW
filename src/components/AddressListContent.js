import React, { Fragment } from 'react';
import { readErgoPrice } from '../ergo-related/ergoprice';
import { getUtxoBalanceForAddressList } from '../ergo-related/utxos';
import { NANOERG_TO_ERG } from '../utils/constants';
import { formatERGAmount, formatTokenAmount, getSummaryFromAddressListContent } from '../utils/walletUtils';
import ImageButton from './ImageButton';
import TokenLabel from './TokenLabel';

/* global BigInt */


export default class AddressListContent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tokenRatesDict: props.tokenRatesDict ?? {},
            addressContentList: props.addressContentList,
            details: false,
            unconfirmedBalance: { value: BigInt(0), tokens: [] },
            nanoErgs: 0,
            tokens: [],
        };
        this.toggleDetails = this.toggleDetails.bind(this);
        this.computeUncomfirmedBalance = this.computeUncomfirmedBalance.bind(this);
    }
    toggleDetails = (newState) => { this.setState({ details: newState }) }

    async computeUncomfirmedBalance(addressContentList) {
        var nanoErgs = 0, tokens = [], addressList = [], unconfirmedBalance = { value: BigInt(0), tokens: [] };
        if (addressContentList !== undefined) {
            [nanoErgs, tokens] = getSummaryFromAddressListContent(addressContentList);
            addressList = addressContentList.map(addr => addr.address);
            if (Array.isArray(addressContentList[0].unconfirmedTx)) {
                const unconfirmedInputs = addressContentList[0].unconfirmedTx.map(tx => tx.inputs).flat();
                const unconfirmedOutputs = addressContentList[0].unconfirmedTx.map(tx => tx.outputs).flat();
                unconfirmedBalance = await getUtxoBalanceForAddressList(unconfirmedInputs, unconfirmedOutputs, addressList);
                //console.log("AddressListContent23", unconfirmedInputs, unconfirmedOutputs, addressList, JSON.stringify(unconfirmedBalance))
            }
        }
        this.setState({
            unconfirmedBalance: unconfirmedBalance,
            nanoErgs: nanoErgs,
            tokens: tokens,
        });
    }

    async componentDidMount() {
        await this.computeUncomfirmedBalance(this.state.addressContentList);
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.tokenRatesDict !== this.props.tokenRatesDict) {
            this.setState({
                tokenRatesDict: this.props.tokenRatesDict,
            });
        }
        if (prevProps.addressContentList !== this.props.addressContentList) {
            this.setState({
                addressContentList: this.props.addressContentList,
            });
            await this.computeUncomfirmedBalance(this.props.addressContentList)
        }
    }

    render() {
        const details = this.state.details;
        const ergoPrice = parseFloat(readErgoPrice());
        const tokenRatesDict = this.state.tokenRatesDict;
        const unconfirmedBalance = this.state.unconfirmedBalance;
        const nanoErgs = this.state.nanoErgs;
        const tokens = this.state.tokens;

        return (
            <Fragment>
                <div className='d-flex flex-column '>
                    <div className='d-flex flex-row justify-content-end align-items-end'>
                        {
                            unconfirmedBalance.value !== BigInt(0) ?
                                <div className='card m-1 p-1 d-flex flex-column justify-content-between '>
                                    Pending
                                    <h5 className={'textSmall ' + (unconfirmedBalance.value > BigInt(0) ? "greenAmount" : "redAmount")}>
                                        {unconfirmedBalance.value > BigInt(0) ? "+" : null}{formatERGAmount(unconfirmedBalance.value)} ERG
                                    </h5>
                                    {
                                        unconfirmedBalance.tokens.map((tok, index) =>
                                            <div key={index} className='d-flex flex-row align-items-end justify-content-between'>
                                                <div className={'textSmall d-flex flex-row ' + (tok.amount > BigInt(0) ? "greenAmount" : "redAmount")}>
                                                    {tok.amount > BigInt(0) ? "+" : null}{formatTokenAmount(tok.amount, tok.decimals)}
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
                        <div className='d-flex flex-row align-items-baseline'>
                            <h6 className='textSmall'>({(nanoErgs / NANOERG_TO_ERG * ergoPrice).toFixed(2)} USD)</h6>
                            &nbsp;
                            <h5>{formatERGAmount(nanoErgs)} ERG</h5>
                        </div>
                    </div>
                    <div className='d-flex flex-row justify-content-end'>
                        {
                            tokens.length > 0 ?
                                <ImageButton
                                    id={"tokenDetails"}
                                    color={"blue"}
                                    icon={details ? "zoom_out" : "zoom_in"}
                                    tips={"Token list"}
                                    onClick={() => this.toggleDetails(!details)}
                                />
                                : null
                        }
                        {
                            details ?
                                <table className='tokentable'>
                                    <thead><tr>
                                        <td>Token</td>
                                        <td>Amount</td>
                                        <td>Value in Σ</td>
                                    </tr></thead>
                                    <tbody>
                                        {
                                            tokens.map((tok, index) =>
                                                <tr key={index}>
                                                    <td>
                                                        <div className='d-flex flex-row justify-content-between align-items-center'>
                                                            <TokenLabel name={tok.name} tokenId={tok.tokenId} decimals={tok.decimals} />
                                                        </div>
                                                    </td>
                                                    <td>{formatTokenAmount(tok.amount, tok.decimals)}</td>
                                                    <td>
                                                        {
                                                            tokenRatesDict && Object.keys(tokenRatesDict).includes(tok.tokenId) ?
                                                                formatERGAmount(tokenRatesDict[tok.tokenId].ergPerToken * tok.amount * NANOERG_TO_ERG / Math.pow(10, tok.decimals))
                                                                : '0'
                                                        }
                                                    </td>
                                                </tr>)
                                        }
                                    </tbody></table>
                                :
                                <div className='d-flex flex-row'>
                                    Tokens: {tokens.length}
                                </div>
                        }
                    </div>
                </div>
            </Fragment>
        )
    }
}
