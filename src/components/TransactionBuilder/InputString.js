import ImageButton from "../ImageButton"



export default function InputString(props) {
    return (
        <div className="flew-row d-flex align-content-center p-1">
            
            <label className="col-sm" htmlFor="ref" >{props.label}:&nbsp;</label>
            <div className="col-sm">
            <input className="form-control grey-input"
                id="ref"
                pattern="[a-zA-Z0-9]*"
                onChange={e => props.onChange(e.target.value)}
                value={props.value} 
                type={props.type} 
                />
                </div>
            &nbsp;
            { props.onClick ?
                <ImageButton color="blue" icon="download" tips="Fetch explorer" onClick={e => props.onClick()}/>
                : null
            }
        </div>
    )
}
