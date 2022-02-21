
import ReactJson from 'react-json-view';
import { formatLongString } from '../../utils/walletUtils';
import ImageButton from '../ImageButton';

export function UtxoItem(props) {
    return (
        <div className="d-flex flex-column m-1 p-1">
            { props.id !== undefined ? <h6>INPUTS({props.id})</h6> : null }
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
                <span>{parseFloat(parseInt(props.json.value) / 1000000000).toFixed(4)} ERG </span>
                <span>{props.json.assets.length} tokens</span>
            </div>
        </div>
    )
}
