import ImageButton from '../ImageButton';

export default function ImageButtonLabeled(props) {
    return (
        <div className="d-flex flew-row">
            &nbsp;
            <ImageButton
                id={props.id}
                color={props.color}
                icon={props.icon}
                tips={props.label}
                onClick={props.onClick}
            />
            &nbsp;{props.label}
        </div>
    )

}
