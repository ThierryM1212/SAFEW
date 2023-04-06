
import { useState } from 'react';
import ReactJson from 'react-json-view';
import { formatERGAmount, formatLongString, formatTokenAmount } from '../../utils/walletUtils';
import ImageButton from '../ImageButton';
import TokenLabel from '../TokenLabel';

export function UtxoItem(props) {
    const [details, toggleDetails] = useState(0);
    return (
        <div className="d-flex flex-column m-1 p-1">
            {props.id !== undefined ? <h6>INPUTS({props.id})</h6> : null}
            <div className="d-flex flex-row">
                <div className="monospace">Box id: {formatLongString(props.boxId, 15)}&nbsp;</div>
                {
                    props.moveUp ? <ImageButton id="move-up" color="green"
                        onClick={() => props.moveUp(props.id)}
                        icon="arrow_upward"
                        tips="Move up"
                    />
                        : null
                }
                {
                    props.moveDown ? <ImageButton id="move-up" color="green"
                        onClick={() => props.moveDown(props.id)}
                        icon="arrow_downward"
                        tips="Move down"
                    />
                        : null
                }
                <ImageButton id="add" color={props.color}
                    onClick={() => props.action(props.json)}
                    icon={props.icon}
                    tips={props.tips} />
                {
                    props.action2 ? <ImageButton id="add2" color={props.color}
                        onClick={() => props.action2(props.json)}
                        icon="post_add"
                        tips="Add to data inputs"
                    />
                        : null
                }

            </div>
            <ReactJson
                src={props.json}
                theme="monokai"
                collapsed={true}
                name="box"
                collapseStringsAfterLength={25}
            />
            <div className="d-flex justify-content-between ">
                <span>{formatERGAmount(props.json.value)} ERG </span>
                <div className='d-flex flex-row'>
                    {
                        props.json.assets.length > 0 ?
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
                                </tr></thead>
                                <tbody>
                                    {
                                        props.json.assets.map((tok, index) =>
                                            <tr key={index}>
                                                <td>
                                                    <TokenLabel tokenId={tok.tokenId}
                                                        name={props.tokenInfo[tok.tokenId][0] ?? ''}
                                                        decimals={props.tokenInfo[tok.tokenId][2] ?? ''}
                                                    />
                                                </td>
                                                <td>{formatTokenAmount(tok.amount, tok.decimals)}</td>
                                            </tr>)
                                    }
                                </tbody></table>
                            : <div className='d-flex flex-row'>
                                Tokens: {props.json.assets.length}
                            </div>
                    }
                </div>
            </div>
        </div>
    )
}
