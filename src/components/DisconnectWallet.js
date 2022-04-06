import React, { Fragment } from 'react';
import ImageButton from './ImageButton';
import { LS } from '../utils/utils';

export default class DisconnectWallet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            connectedSites: {},
            walletList: [],
        };
        //this.updateWalletName = this.updateWalletName.bind(this);
    }

    async componentDidMount() {
        const walletList = (await LS.getItem('walletList')) ?? [];
        const walletNameList = walletList.map(wallet => wallet.name);
        const connectedSites = (await LS.getItem('connectedSites')) ?? {};
        // filter connected site list by the existing wallets... silent cleanup...
        var newConnectedSites = {};
        for (const wName of Object.keys(connectedSites)) {
            if (walletNameList.includes(wName)) {
                newConnectedSites[wName] = connectedSites[wName];
            }
        }
        LS.setItem('connectedSites', newConnectedSites)
        this.setState({
            connectedSites: connectedSites,
            walletList: walletList,
        });
        //console.log("componentDidMount", walletList,connectedSites);
    }

    disconnectWallet(walletName, site) {
        var newConnectedSites = {};
        for (const wName of Object.keys(this.state.connectedSites)) {
            if (wName === walletName) {
                var newUrlList = [];
                for (const cSite of this.state.connectedSites[wName]) {
                    if (cSite !== site) {
                        newUrlList.push(cSite);
                    }
                }
                if (newUrlList.length > 0) {
                    newConnectedSites[wName] = newUrlList;
                }
            } else {
                newConnectedSites[wName] = this.state.connectedSites[wName];
            }
        }
        LS.setItem('connectedSites', newConnectedSites)
        this.setState({connectedSites: newConnectedSites});
    }

    render() {
        // compute wallet colors
        var walletColors = {};
        for (const wallet of this.state.walletList) {
            walletColors[wallet.name] = wallet.color;
        }
        //console.log("render", this.state.walletList,this.state.connectedSites);

        return (
            <Fragment >
                <div className='d-flex flex-column justify-content-center align-items.center w-75'>
                    <h4>Wallet URL connections</h4>
                    {
                        Object.keys(this.state.connectedSites).length === 0 ? <div>No connection found</div>
                            :
                            Object.keys(this.state.connectedSites).map(walletName =>
                                <div key={"wallet_" + walletName} className='card m-1 p-1 d-flex flex-column' style={{ borderColor: walletColors[walletName] }}>
                                    <h5>{walletName}</h5>
                                    {
                                        this.state.connectedSites[walletName] && Array.isArray(this.state.connectedSites[walletName]) ?
                                            this.state.connectedSites[walletName].map(site =>
                                                <div key={"site_" + walletName + "_" + site}
                                                    className='card p-1 m-1'>
                                                    <div className='d-flex flex-row justify-content-between align-items-center'>
                                                        {site}
                                                        <ImageButton
                                                            id={"removeLink_"+walletName+"_"+site}
                                                            color={"red"}
                                                            icon={"link_off"}
                                                            tips={"Disconnect URL"}
                                                            onClick={() => this.disconnectWallet(walletName, site)}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                            : null
                                    }
                                </div>
                            )
                    }
                </div>
            </Fragment >
        )
    }
}
