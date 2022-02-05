import ReactTooltip from "react-tooltip";

export default function ImageButton(props) {
    return (
        <div className="m-1 d-flex flex-column">
            <span
                className={"material-icons " + props.color}
                onClick={props.onClick}
                data-tip
                data-for={props.id}
            >
                {props.icon}
            </span>
            <ReactTooltip id={props.id} html={true} delayShow={400}>
                {props.tips}
            </ReactTooltip>
            
        </div>
    )

}