
import ReactJson from 'react-json-view';

export function UtxoList(props) {
    return (
        <div className="m-1 p-1 ">
            <ReactJson src={props.list} 
                theme="monokai" 
                collapsed={true}
                onEdit={props.onEdit}
                name={props.name}
                collapseStringsAfterLength={50}
                />
        </div>
    )
}