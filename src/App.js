import React, { Fragment } from 'react';
import './App.css';
import WalletList from './components/WalletList';
import NavigationBar from './components/NavigationBar';
import AddWallet from './components/AddWallet';
import EditWallet from './components/EditWallet';
import Config from './components/Config';
import { DEFAULT_EXPLORER_API_ADDRESS, DEFAULT_EXPLORER_WEBUI_ADDRESS, DEFAULT_MIXER_ADDRESS, DEFAULT_NODE_ADDRESS, DISCLAIMER_TEXT } from './utils/constants';
import SendTransaction from './components/SendTransaction';
import TransactionList from './components/TransactionList';
import SignPopup from './components/SignPopup';
import ConnectWalletPopup from './components/ConnectWalletPopup';
import DisconnectWallet from './components/DisconnectWallet';
import Mixer from './components/Mixer';
import { confirmAlert } from './utils/Alerts';
import { isUpgradeWalletRequired, upgradeWallets } from './utils/walletUtils';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        var iniPage = 'empty';
        const disclaimerAccepted = (localStorage.getItem('disclaimerAccepted') === "true") ?? false;
        if (disclaimerAccepted) iniPage = 'home';
        console.log("App ini",disclaimerAccepted,iniPage);
        this.state = {
            page: iniPage,
            walletId: 0,
            mixerAvailable: false,
            disclaimerAccepted: disclaimerAccepted,
            setPageParam: {
                address: '',
                amount: 0,
                tokens: [],
            },
        };
        this.setPage = this.setPage.bind(this);

        // init the config
        localStorage.setItem('explorerAPIAddress', localStorage.getItem('explorerAPIAddress') ?? DEFAULT_EXPLORER_API_ADDRESS);
        localStorage.setItem('explorerWebUIAddress', localStorage.getItem('explorerWebUIAddress') ?? DEFAULT_EXPLORER_WEBUI_ADDRESS);
        localStorage.setItem('nodeAddress', localStorage.getItem('nodeAddress') ?? DEFAULT_NODE_ADDRESS);
        localStorage.setItem('mixerAddress', localStorage.getItem('mixerAddress') ?? DEFAULT_MIXER_ADDRESS);
        localStorage.setItem('connectedSites', localStorage.getItem('connectedSites') ?? JSON.stringify({}));
        localStorage.setItem('walletList', localStorage.getItem('walletList') ?? JSON.stringify([]));
        localStorage.setItem('expertMode', localStorage.getItem('expertMode') ?? "false");
        localStorage.setItem('hideUsedEmptyAddress', localStorage.getItem('hideUsedEmptyAddress') ?? "true");
        // handle wallet version and upgrade
        if (isUpgradeWalletRequired()) {
            upgradeWallets();
        }
    }

    setPage = (page, walletId = 0, setPageParam = {
        address: '',
        amount: 0,
        tokens: [],
    }) => {
        console.log("setPage", page, walletId, setPageParam);
        this.setState({
            page: page,
            walletId: walletId,
            setPageParam: setPageParam,
        });
    };

    componentDidMount() {
        if (!this.state.disclaimerAccepted) {
            confirmAlert("Disclaimer", DISCLAIMER_TEXT, "Use SAFEW", "Refuse").then(res => {
                if (res.isConfirmed) {
                    localStorage.setItem('disclaimerAccepted', "true");
                    this.setState({disclaimerAccepted: true});
                    this.setPage('home');
                } else {
                    window.close();
                }
            })
        }
    }

    render() {
        const signPopup = window.location.hash.startsWith("#sign_tx");
        const connectPopup = window.location.hash.startsWith("#connect");
        const popup = signPopup || connectPopup;
        console.log("window.location", popup, signPopup, connectPopup, this.state.page);

        let page = null
        switch (this.state.page) {
            case 'home':
                page = <WalletList setPage={this.setPage} />
                break;
            case 'add':
                page = <AddWallet ergoPayOnly={false} setPage={this.setPage} />
                break;
            case 'addErgoPay':
                page = <AddWallet ergoPayOnly={true} setPage={this.setPage} />
                break;
            case 'edit':
                page = <EditWallet setPage={this.setPage} walletId={this.state.walletId} />
                break;
            case 'send':
                page = <SendTransaction setPage={this.setPage} walletId={this.state.walletId} iniTran={this.state.setPageParam}/>
                break;
            case 'transactions':
                page = <TransactionList setPage={this.setPage} walletId={this.state.walletId} />
                break;
            case 'config':
                page = <Config setPage={this.setPage} />
                break;
            case 'disconnect':
                page = <DisconnectWallet />
                break;
            case 'mixer':
                page = <Mixer setPage={this.setPage} />
                break;
            case 'connectPopup':
                page = <ConnectWalletPopup />
                break;
            case 'signPopup':
                page = <SignPopup />
                break;
            case 'empty':
                page = null;
                break;
            default:
                page = null;
                break;
        }

        return (
            <Fragment>
                {
                    signPopup ?
                        <div className='App container-xxl w-100'>
                            <SignPopup />
                        </div>
                        : null
                }
                {
                    connectPopup ?
                        <div className='App container-xxl w-100'>
                            <ConnectWalletPopup />
                        </div>
                        : null
                }

                {popup ? null :
                    <div className='App container-xxl w-100'>
                        <NavigationBar setPage={this.setPage} mixerAvailable={this.state.mixerAvailable} />
                        {page}
                    </div>
                }
            </Fragment>
        );
    }
}

