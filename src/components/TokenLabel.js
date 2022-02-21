import { copySuccess } from "../utils/Alerts";
import { VERIFIED_TOKENS } from "../utils/constants";
import { formatLongString } from "../utils/walletUtils";
import ImageButton from "./ImageButton"
import VerifiedTokenImage from "./VerifiedTokenImage";


export default function TokenLabel(props) {
    return (
        <div className='d-flex flex-row justify-content-between align-items-center'>
            <div className='d-flex flex-row align-items-center'>
                {props.name ? props.name : formatLongString(props.tokenId, 10)}
                {
                    Object.keys(VERIFIED_TOKENS).includes(props.tokenId) ?
                        <div>&nbsp;<VerifiedTokenImage tokenId={props.tokenId} /></div>
                        : null
                }
            </div>
            <div className='d-flex flex-row row-reverse'>
                <ImageButton
                    id={"tokId" + props.tokenId}
                    color={"blue"}
                    icon={"content_copy"}
                    tips={"Copy tokenId - " + props.tokenId}
                    onClick={() => {
                        navigator.clipboard.writeText(props.tokenId);
                        copySuccess();
                    }}
                />
                <ImageButton
                    id={"openAddressExplorer" + props.tokenId}
                    color={"blue"}
                    icon={"open_in_new"}
                    tips={"Open in Explorer"}
                    onClick={() => {
                        const url = localStorage.getItem('explorerWebUIAddress') + 'en/token/' + props.tokenId;
                        window.open(url, '_blank').focus();
                    }}
                />
            </div>
        </div>
    )
}
