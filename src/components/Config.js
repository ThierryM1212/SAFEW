import React, { Fragment } from 'react';
import Switch from "react-switch";
import Dropzone from './Dropzone';
import { DEFAULT_EXPLORER_API_ADDRESS, DEFAULT_EXPLORER_WEBUI_ADDRESS, DEFAULT_MIXER_ADDRESS, DEFAULT_NODE_ADDRESS } from '../utils/constants';
import ConfigURL from './ConfigURL';
import ImageButton from './ImageButton';
import { LS } from '../utils/utils';
import ConfigNodeURL from './ConfigNodeURL';


export default class Config extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            setPage: props.setPage,
            expertMode: false,
            hideUsedEmptyAddress: false,
        };
        this.setExpertMode = this.setExpertMode.bind(this);
        this.setHideUsedEmptyAddress = this.setHideUsedEmptyAddress.bind(this);
        this.backupSAFEW = this.backupSAFEW.bind(this);
    }

    async componentDidMount() {
        const expertMode = (await LS.getItem('expertMode')) ?? false;
        const hideUsedEmptyAddress = (await LS.getItem('hideUsedEmptyAddress')) ?? false;
        this.setState({ expertMode: expertMode, hideUsedEmptyAddress: hideUsedEmptyAddress });
    }

    async setExpertMode() {
        const oldState = await LS.getItem('expertMode');
        this.setState({ expertMode: !oldState });
        LS.setItem('expertMode', !oldState);
    };

    async setHideUsedEmptyAddress() {
        const oldState = await LS.getItem('hideUsedEmptyAddress');
        this.setState({ hideUsedEmptyAddress: !oldState });
        LS.setItem('hideUsedEmptyAddress', !oldState);
    };

    async backupSAFEW() {
        var _myArray = JSON.stringify((await LS.getAllItems()), null, 4);
        var vLink = document.createElement('a'),
            vBlob = new Blob([_myArray], { type: "octet/stream" }),
            vName = 'backup_SAFEW_wallets.json',
            vUrl = window.URL.createObjectURL(vBlob);
        vLink.setAttribute('href', vUrl);
        vLink.setAttribute('download', vName);
        vLink.click();
        this.state.setPage('home');
    }

    render() {
        return (
            <Fragment>
                <div className='d-flex flex-column card w-75 m-1 p-1'>
                    <div className='d-flex flex-row m-1 p-1 align-items-baseline'>
                        <h5>Node server</h5>
                        <ImageButton
                            id={"urlInfoNode"}
                            color={"white"}
                            icon={"info"}
                            tips={"Main server to get UTXOs and send the transactions. Reload the extension to take effect."}
                        />
                    </div>
                    <ConfigNodeURL
                        localstorageName="nodeAddress"
                        label="Node address"
                        defaultURL={DEFAULT_NODE_ADDRESS}
                    />
                    <div className='d-flex flex-row m-1 p-1 align-items-baseline'>
                        <h5>Other servers</h5>
                        <ImageButton
                            id={"urlInfoOthers"}
                            color={"white"}
                            icon={"info"}
                            tips={"Reload the extension to take effect"}
                        />
                    </div>
                    <ConfigURL
                        localstorageName="mixerAddress"
                        label="Mixer address"
                        defaultURL={DEFAULT_MIXER_ADDRESS}
                    />
                    <ConfigURL
                        localstorageName="explorerWebUIAddress"
                        label="Explorer Web UI address"
                        defaultURL={DEFAULT_EXPLORER_WEBUI_ADDRESS}
                    />
                    <ConfigURL
                        localstorageName="explorerAPIAddress"
                        label="Explorer API address"
                        defaultURL={DEFAULT_EXPLORER_API_ADDRESS}
                    />



                    <br />
                    <div className='d-flex flex-column'>
                        <div className='d-flex flex-row align-items-center '>
                            <div className='d-flex flex-row align-items-baseline col-sm'>
                                <h5>Enable expert mode</h5>
                                <ImageButton
                                    id={"expertInfo"}
                                    color={"white"}
                                    icon={"info"}
                                    tips={"Allow to review transaction json and extended features"}
                                />
                            </div>
                            <Switch
                                checked={this.state.expertMode}
                                onChange={this.setExpertMode}
                                onColor="#216A94"
                                onHandleColor="#2693e6"
                                handleDiameter={30}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                                height={20}
                                width={48}
                                className="react-switch col-sm"
                                id="switch"
                            />
                        </div>
                    </div>
                    <br />

                    <div className='d-flex flex-column'>
                        <div className='d-flex flex-row align-items-center '>
                            <div className='d-flex flex-row align-items-baseline  col-sm'>
                                <h5>Hide used empty addresses</h5>
                                <ImageButton
                                    id={"hideEmptyAddrInfo"}
                                    color={"white"}
                                    icon={"info"}
                                    tips={"If enabled, does not display used addresses with empty balance"}
                                />
                            </div>
                            <Switch
                                checked={this.state.hideUsedEmptyAddress}
                                onChange={this.setHideUsedEmptyAddress}
                                onColor="#216A94"
                                onHandleColor="#2693e6"
                                handleDiameter={30}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                                height={20}
                                width={48}
                                className="react-switch col-sm"
                                id="switch2"
                            />
                        </div>
                    </div>
                    <br />

                    <div className='d-flex flex-column m-1 p-1'>
                        <h5>Import / Export</h5>
                        <div className='d-flex flex-row justify-content-left align-items-center'
                            id="importExport"
                        >
                            <div >
                                <button className="btn btn-outline-info"
                                    onClick={this.backupSAFEW}>
                                    Backup SAFEW
                                </button>
                            </div>
                            <div className='d-flex flex-row col-sm-5'>
                                <Dropzone setPage={this.state.setPage} />
                            </div>
                        </div>
                    </div>
                </div>
            </Fragment>
        )
    }
}
