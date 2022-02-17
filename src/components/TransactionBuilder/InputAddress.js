
import ImageButtonLabeled from "./ImageButtonLabeled"


export default function InputAddress(props) {
    
    return (
        <div className="flew-row d-flex align-items-center">
            <label htmlFor="input-address" >{props.label}:&nbsp;</label>
            <div className="col-sm">
            <input className="form-control grey-input"
                id="input-address"
                pattern="[a-zA-Z0-9]*"
                onChange={e => props.onChange(e.target.value)}
                value={props.value} />
            </div>
            &nbsp;
            <div className="d-flex flex-row align-items-center">

                <ImageButtonLabeled id="fetch-explorer" color="blue" icon="download" label="Fetch explorer" onClick={e => props.onClick()}/>
                <ImageButtonLabeled id="fetch-yoroi" color="blue" icon="download" label="Fetch Yoroi" onClick={e => props.fetchYoroi()}/>


            </div>
        </div>
    )
}
