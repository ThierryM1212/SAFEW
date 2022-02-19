import ImageButtonLabeled from './ImageButtonLabeled';
import { getUtxosListValue, getTokenListFromUtxos } from '../../ergo-related/utxos';

export default function TransactionSummary(props) {
    const inputNanoErgAmount = parseInt(getUtxosListValue(props.json.inputs));
    const outputsNanoErgAmount = parseInt(getUtxosListValue(props.json.outputs));
    const inputTokens = getTokenListFromUtxos(props.json.inputs);
    const outputTokens = getTokenListFromUtxos(props.json.outputs);

    var tokenDiffArray = {};
    for (const [key, value] of Object.entries(inputTokens)) {
        tokenDiffArray[key] = [parseInt(value), 0];
    }
    for (const [key, value] of Object.entries(outputTokens)) {
        if (key in tokenDiffArray) {
            tokenDiffArray[key] = [tokenDiffArray[key][0], parseInt(value)];
        } else {
            tokenDiffArray[key] = [0, parseInt(value)];
        }
    }

    return (
        <div className="card m-1 p-1" >
            <h6>Transaction summary</h6>

            <table border="1" >
                <thead>
                    <tr><td><h6>Asset</h6></td>
                        <td><h6>Inputs</h6></td>
                        <td><h6>Outputs</h6></td>
                        <td><h6>Check</h6></td>
                    </tr>
                </thead>
                <tbody>
                    <tr key="tx-sum-2">
                        <td>ERGs</td><td>{parseFloat(inputNanoErgAmount / 1000000000).toFixed(9).replace(/(\.0+|0+)$/, '')}</td><td>{parseFloat(outputsNanoErgAmount / 1000000000).toFixed(9).replace(/(\.0+|0+)$/, '')}</td>
                        <td>
                            {(inputNanoErgAmount === outputsNanoErgAmount) ?
                                <ImageButtonLabeled id="nanoerg-diff" color="green" icon="price_check" label="OK" />
                                : <ImageButtonLabeled id="nanoerg-diff" color="red" icon="error_outline" label="Wrong erg balance" />
                            }
                        </td>
                    </tr>
                    {
                        Object.entries(tokenDiffArray).map(([key, value]) => (
                            <tr key={key}><td>{key}</td><td>{value[0]}</td><td>{value[1]}</td><td>
                                {
                                    (value[0] === value[1]) ?
                                    <ImageButtonLabeled id="token-diff" color="green" icon="verified" label="OK" />
                                        : (value[0] > value[1]) ?
                                            <ImageButtonLabeled id="token-diff" color="orange" icon="warning_amber" label="Tokens burned in output" />
                                            : <ImageButtonLabeled id="token-diff" color="orange" icon="error_outline" label="Not enough token in input" />
                                }
                            </td>
                            </tr>
                        ))
                    }

                </tbody>

            </table>


        </div>
    )
}

