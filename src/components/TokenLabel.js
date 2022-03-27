import { useEffect, useState } from "react";
import { copySuccess } from "../utils/Alerts";
import { DEFAULT_EXPLORER_WEBUI_ADDRESS, VERIFIED_TOKENS } from "../utils/constants";
import { formatLongString } from "../utils/walletUtils";
import ImageButton from "./ImageButton"
import NFTImage from "./NFTImage";
import VerifiedTokenImage from "./VerifiedTokenImage";


export default function TokenLabel(props) {
    const [explorerWebUIAddress, setExplorerWebUIAddress] = useState(DEFAULT_EXPLORER_WEBUI_ADDRESS);
    useEffect(() => {
        chrome.storage.local.get("explorerWebUIAddress", (result) => {
            setExplorerWebUIAddress(result);
        });
    }, []);

    //console.log("TokenLabel",props.name, props)
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
            <div className='d-flex flex-row align-items-center'>
                {
                    props.decimals === 0 ?
                        <div className='d-flex flex-row'>
                            &nbsp;
                            <NFTImage tokenId={props.tokenId} />
                        </div>
                        : null
                }
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
                        const url = explorerWebUIAddress + 'en/token/' + props.tokenId;
                        window.open(url, '_blank').focus();
                    }}
                />
            </div>
        </div>
    )
}
