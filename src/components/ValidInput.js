import { Fragment } from "react";
import ImageButton from "./ImageButton";

export default function ValidInput(props) {

    return (
        <Fragment>
            {
                props.isValid ?
                    <ImageButton
                        id={props.id}
                        color={"green"}
                        icon={"done"}
                        tips={props.validMessage}
                    />
                    : <ImageButton
                        id={props.id}
                        color={"red"}
                        icon={"clear"}
                        tips={props.invalidMessage} />
            }
        </Fragment>
    )
}