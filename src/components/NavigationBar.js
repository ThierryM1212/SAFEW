import ImageButton from "./ImageButton";
import logo from "../resources/safew_logo.svg";
import GitLogo from "../resources/GitHub.png";
import ReactTooltip from "react-tooltip";
import { Fragment } from "react";

export default function NavigationBar(props) {
    const debug = (localStorage.getItem('debug') === 'true') ?? false;
    return (
        <div className="container d-flex flex-row justify-content-between w-75 m-1 p-1 align-items-center" >
            <div className="d-flex flex-row align-items-center" >
                <img src={logo}
                    alt="SAFEW"
                    height='40'
                    onClick={() => { props.setPage('home') }}
                />&nbsp;&nbsp;
                <ImageButton
                    id={"home"}
                    color={"blue"}
                    icon={"home"}
                    tips={"Wallet list"}
                    onClick={() => { props.setPage('home') }}
                />
                <ImageButton
                    id={"config"}
                    color={"blue"}
                    icon={"settings"}
                    tips={"Settings"}
                    onClick={() => { props.setPage('config') }}
                />
                <ImageButton
                    id={"disconnectWallets"}
                    color={"blue"}
                    icon={"link_off"}
                    tips={"Disconnect wallets"}
                    onClick={() => { props.setPage('disconnect') }}
                />
                <ImageButton
                    id={"ergoMixer"}
                    color={"blue"}
                    icon={"blender"}
                    tips={"Ergo mixer"}
                    onClick={() => { props.setPage('mixer') }}
                />
                <ImageButton
                    id={"txbuilder"}
                    color={"blue"}
                    icon={"blender"}
                    tips={"Transaction builder"}
                    onClick={() => { props.setPage('txbuilder') }}
                />

                {
                    debug ?
                        <Fragment>
                            <ImageButton
                                id={"connectPopup"}
                                color={"blue"}
                                icon={"link"}
                                tips={"connect popup debug"}
                                onClick={() => { props.setPage('connectPopup') }}
                            />
                            <ImageButton
                                id={"signPopup"}
                                color={"blue"}
                                icon={"border_color"}
                                tips={"Sign popup debug"}
                                onClick={() => { props.setPage('signPopup') }}
                            />
                        </Fragment>
                        : null
                }
            </div>
            <div className="d-flex flex-row align-items-center" >
                <div className="m-1 d-flex flex-column">
                    <span
                        onClick={() => { window.open("https://github.com/ThierryM1212/SAFEW", '_blank').focus(); }}
                        data-tip
                        data-for="GitLinkId"
                    >
                        <a href="https://github.com/ThierryM1212/SAFEW" target="_blank" rel="noreferrer">
                            <img alt="GitLink" src={GitLogo} width={30} height={30} />
                        </a>
                    </span>
                    <ReactTooltip id="GitLinkId" html={true} delayShow={400}>
                        {"Review the code, report issues,<br/>contribute at<br/><b>https://github.com/ThierryM1212/SAFEW</b>"}
                    </ReactTooltip>
                </div>
            </div>
        </div>
    );
}