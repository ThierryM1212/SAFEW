import ReactTooltip from "react-tooltip";

export default function ImageButton(props) {
    return (
        <div className="m-1 d-flex flex-column">
            <span
                className={"material-icons " + props.color}
                onClick={props.onClick}
                data-tip
                data-for={props.id}
                style={{ cursor: 'pointer' }}
            >
                {props.icon}
            </span>
            <ReactTooltip id={props.id} delayShow={400} data-html={true} insecure={true} multiline={true}>
                <div className="d-flex flex-column align-items-start">
                    {props.tips}
                </div>
            </ReactTooltip>

        </div>
    )

}