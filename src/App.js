import React, { Fragment } from 'react';
import './App.css';
import WalletList from './components/WalletList';
import NavigationBar from './components/NavigationBar';
import AddWallet from './components/AddWallet';
import EditWallet from './components/EditWallet';
import Config from './components/Config';
import { DEFAULT_EXPLORER_API_ADDRESS, DEFAULT_EXPLORER_WEBUI_ADDRESS, DEFAULT_MIXER_ADDRESS, DEFAULT_NODE_ADDRESS } from './utils/constants';
import SendTransaction from './components/SendTransaction';
import TransactionList from './components/TransactionList';
import SignPopup from './components/SignPopup';
import { isMixerAvailable } from './ergo-related/mixer';
import ConnectWalletPopup from './components/ConnectWalletPopup';
import DisconnectWallet from './components/DisconnectWallet';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 'home',
      walletId: 0,
      mixerAvailable: false,
    };
    this.setPage = this.setPage.bind(this);

    // init the config
    localStorage.setItem('explorerAPIAddress', localStorage.getItem('explorerAPIAddress') ?? DEFAULT_EXPLORER_API_ADDRESS);
    localStorage.setItem('explorerWebUIAddress', localStorage.getItem('explorerWebUIAddress') ?? DEFAULT_EXPLORER_WEBUI_ADDRESS);
    localStorage.setItem('nodeAddress', localStorage.getItem('nodeAddress') ?? DEFAULT_NODE_ADDRESS);
    localStorage.setItem('mixerAddress', localStorage.getItem('mixerAddress') ?? DEFAULT_MIXER_ADDRESS);
    localStorage.setItem('connectedSites', localStorage.getItem('connectedSites') ?? JSON.stringify({}));
    localStorage.setItem('walletList', localStorage.getItem('walletList') ?? JSON.stringify([]));
    localStorage.setItem('expertMode', localStorage.getItem('expertMode') ?? false);
    localStorage.setItem('hideUsedEmptyAddress', localStorage.getItem('hideUsedEmptyAddress') ?? true);
    let walletList = localStorage.getItem('walletList');
    try {
      walletList = JSON.parse(walletList);
    } catch (e) {
      localStorage.setItem('walletList', JSON.stringify([]));
    }
  }

  setPage = (page, walletId = 0) => {
    console.log("setPage", page, walletId);
    this.setState({
      page: page,
      walletId: walletId,
    });
  };

  componentDidUpdate(prevProps, prevState) {
    console.log("App componentDidUpdate", prevProps, prevState, this.props, this.state);
  }

  //async componentDidMount() {
  //  const mixerAvailable = await isMixerAvailable();
  //  this.setState({
  //    mixerAvailable: mixerAvailable,
  //  })
  //}

  render() {

    const signPopup = window.location.hash.startsWith("#sign_tx");
    const connectPopup = window.location.hash.startsWith("#connect");
    const popup = signPopup || connectPopup;
    console.log("window.location", popup, signPopup, connectPopup);

    let page = null
    switch (this.state.page) {
      case 'home':
        page = <WalletList setPage={this.setPage} />
        break
      case 'add':
        page = <AddWallet setPage={this.setPage} />
        break
      case 'edit':
        page = <EditWallet setPage={this.setPage} walletId={this.state.walletId} />
        break
      case 'send':
        page = <SendTransaction setPage={this.setPage} walletId={this.state.walletId} />
        break
      case 'transactions':
        page = <TransactionList setPage={this.setPage} walletId={this.state.walletId} />
        break
      case 'config':
        page = <Config setPage={this.setPage} />
        break
      case 'disconnect':
          page = <DisconnectWallet  />
          break
      default:
        page = <WalletList />
        break
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

