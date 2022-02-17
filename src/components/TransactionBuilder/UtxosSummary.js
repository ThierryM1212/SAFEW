import { getUtxosListValue, getTokenListFromUtxos } from '../../ergo-related/utxos';

export default function UtxosSummary(props) {

    const ergAmount = parseFloat(parseInt(getUtxosListValue(props.list)) / 1000000000).toFixed(4);
    const tokenDict = getTokenListFromUtxos(props.list);
    return (
        <div className="card m-1 p-1" >
            <div className="d-flex flex-row">
            <h6>Total selected:&nbsp; {ergAmount} ERG</h6>
            </div>
            { Object.keys(tokenDict).length > 0 ?
            <table border="1" >
                <thead>
                    <tr><td><h6>Tokens</h6></td>
                        <td><h6>Amount</h6></td></tr>
                </thead>
                <tbody>
                    {
                        Object.entries(tokenDict).map(([key, value]) => (
                            <tr key={key}><td>{key}</td><td>{value}</td></tr>
                        ))
                    }
                </tbody>
            </table>
            : <h6>No token in selected {props.name} boxes</h6>
            }
            
        </div>
    )
}

