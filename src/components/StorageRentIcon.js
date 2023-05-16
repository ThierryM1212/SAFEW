import React, { Fragment } from 'react';
import { msToTime } from "../utils/utils";
import ImageButton from "./ImageButton";

export default function StorageRentIcon(props) {
    const oldestBoxAge = props.oldestBoxAge;
    const yearInMilli = 365 * 24 * 60 * 60 * 1000;
    const storageRentTime = Math.max(4 * yearInMilli - oldestBoxAge, 0);
    var tipsText = "Storage rent will occurs in " + msToTime(storageRentTime) + "</br>";
    tipsText = tipsText + "Oldest box age " + msToTime(oldestBoxAge);
    var color = "green";
    if (oldestBoxAge > yearInMilli * 2) {
        var color = "orange";
    }
    if (oldestBoxAge > yearInMilli * 3) {
        var color = "red";
        tipsText = tipsText + "</br>" + "Consider consolidating your wallet ! (send all)";
    }
    return (
        <Fragment >

                    <ImageButton
                        id={"storageRent" + props.name}
                        color={color}
                        icon={"recycling"}
                        tips={tipsText}
                    />

        </Fragment>
    )

}

