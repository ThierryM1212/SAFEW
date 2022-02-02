import ImageButton from "./ImageButton";
import logo from "../resources/safew_logo.svg";

export default function NavigationBar(props) {
    return (
        <div className="container d-flex flex-row flex-start w-75 m-1 p-1 align-items-center" >
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
            {
                props.mixerAvailable ?
                    <ImageButton
                        id={"ergoMixer"}
                        color={"blue"}
                        icon={"blender"}
                        tips={"Ergo mixer"}
                        onClick={() => {
                            const url = localStorage.getItem('mixerAddress');
                            window.open(url, '_blank').focus();
                        }}

                    /> : null
            }

            <ImageButton
                id={"config"}
                color={"blue"}
                icon={"settings"}
                tips={"Settings"}
                onClick={() => { props.setPage('config') }}
            />

            <ImageButton
                id={"config"}
                color={"blue"}
                icon={"link_off"}
                tips={"Disconnect wallets"}
                onClick={() => { props.setPage('disconnect') }}
            />
        </div>
    );
}