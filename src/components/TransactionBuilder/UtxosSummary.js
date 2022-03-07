import { getUtxosListValue, getTokenListFromUtxos, enrichTokenInfoFromUtxos } from '../../ergo-related/utxos';
import { formatTokenAmount } from '../../utils/walletUtils';
import TokenLabel from '../TokenLabel';

export default function UtxosSummary(props) {

    const ergAmount = parseFloat(parseInt(getUtxosListValue(props.list)) / 1000000000).toFixed(4);
    const tokenDict = getTokenListFromUtxos(props.list);
    const tokenInfo = enrichTokenInfoFromUtxos(props.list);
    return (
        <div className="card m-1 p-1" >
            <div className="d-flex flex-row">
                <h6>Total selected:&nbsp; {ergAmount} ERG</h6>
            </div>
            {Object.keys(tokenDict).length > 0 ?
                <table border="1" >
                    <thead>
                        <tr><td><h6>Tokens</h6></td>
                            <td><h6>Amount</h6></td></tr>
                    </thead>
                    <tbody>
                        {
                            Object.entries(tokenDict).map(([tokenId, amount]) => (
                                <tr key={tokenId}>
                                    <td><TokenLabel
                                        tokenId={tokenId}
                                        name={tokenInfo[tokenId] ? tokenInfo[tokenId][0] : false}
                                        decimals={tokenInfo[tokenId] ? tokenInfo[tokenId][2] : false}
                                    /></td>
                                    <td>{tokenInfo[tokenId] ? formatTokenAmount(amount, tokenInfo[tokenId][2]) : amount}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                : <h6>No token in selected {props.name} boxes</h6>
            }

        </div>
    )
}

