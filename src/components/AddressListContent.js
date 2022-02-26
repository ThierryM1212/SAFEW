import React, { Fragment, useState } from 'react';
import { readErgoPrice } from '../ergo-related/ergoprice';
import { getUtxoBalanceForAddressList2 } from '../ergo-related/utxos';
import { NANOERG_TO_ERG, VERIFIED_TOKENS } from '../utils/constants';
import { formatERGAmount, formatTokenAmount, getSummaryFromAddressListContent } from '../utils/walletUtils';
import ImageButton from './ImageButton';
import VerifiedTokenImage from './VerifiedTokenImage';

export default function AddressListContent(props) {
    const [details, toggleDetails] = useState(0);
    const ergoPrice = parseFloat(readErgoPrice());

    var nanoErgs = 0, tokens = [], addressList = [], unconfirmedBalance = { value: 0, tokens: [] };
    if (props.addressContentList !== undefined) {
        [nanoErgs, tokens] = getSummaryFromAddressListContent(props.addressContentList);
        addressList = props.addressContentList.map(addr => addr.address);
        if (Array.isArray(props.addressContentList[0].unconfirmedTx)) {
            const unconfirmedInputs = props.addressContentList[0].unconfirmedTx.map(tx => tx.inputs).flat();
            const unconfirmedOutputs = props.addressContentList[0].unconfirmedTx.map(tx => tx.outputs).flat();
            unconfirmedBalance = getUtxoBalanceForAddressList2(unconfirmedInputs, unconfirmedOutputs, addressList);
            //console.log("AddressListContent23", unconfirmedInputs, unconfirmedOutputs, addressList, JSON.stringify(unconfirmedBalance))
        }
    }
    //console.log("AddressListContent22", props.addressContentList, unconfirmedBalance)


    return (

        <Fragment>
            <div className='d-flex flex-column '>
                <div className='d-flex flex-row justify-content-end align-items-end'>
                    {
                        unconfirmedBalance.value !== 0 ?
                            <div className='card m-1 p-1 d-flex flex-column justify-content-between '>
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
                                onClick={() => toggleDetails(!details)}
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
                                                    <div className='d-flex flex-row align-items-center'>
                                                        {tok.name}
                                                        {
                                                            Object.keys(VERIFIED_TOKENS).includes(tok.tokenId) ?
                                                                <div>&nbsp;<VerifiedTokenImage tokenId={tok.tokenId} /></div>
                                                                : null
                                                        }
                                                    </div>
                                                    <ImageButton
                                                        id={"openAddressExplorer" + tok.tokenId}
                                                        color={"blue"}
                                                        icon={"open_in_new"}
                                                        tips={"Open in Explorer"}
                                                        onClick={() => {
                                                            const url = localStorage.getItem('explorerWebUIAddress') + 'en/token/' + tok.tokenId;
                                                            window.open(url, '_blank').focus();
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td>{formatTokenAmount(tok.amount, tok.decimals)}</td>
                                            <td>{parseFloat(tok.confirmed.valueInErgs || '0')?.toLocaleString('en-US', { maximumFractionDigits: 4})}</td>
                                            {/* <td>{tok.unconfirmed.valueInErgs}</td> */}
                                        </tr>)
                                }
                            </tbody></table>
                            : <div className='d-flex flex-row'>
                                Tokens: {tokens.length}
                            </div>
                    }

                </div>
            </div>
        </Fragment>
    )
}
