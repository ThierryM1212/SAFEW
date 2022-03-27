import React, { Fragment } from 'react';
import { getTokenBoxV1 } from '../ergo-related/explorer';
import { getActiveMixes, getCovertAddresses, isMixerAvailable } from '../ergo-related/mixer';
import { DEFAULT_MIXER_ADDRESS } from '../utils/constants';
import AddCovertAddress from './AddCovertAddress';
import CovertAddress from './CovertAddress';
import ImageButton from './ImageButton';
import Mix from './Mix';
import SelectWallet from './SelectWallet';
import { LS } from '../utils/utils';

export default class Mixer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mixerAvailable: false,
            mixerAddress: DEFAULT_MIXER_ADDRESS,
            availableMixes: [],
            showAvailableMixes: false,
            availableCoverts: [],
            showAvailableCovert: false,
            mixedTokenInfo: {},
            walletList: [],
            selectedWalletId: 0,
            setPage: props.setPage,
        };
        this.updateMixList = this.updateMixList.bind(this);
        this.timer = this.timer.bind(this);
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    timer() {
        this.updateMixList(false);
    }

    async componentDidMount() {
        var intervalId = setInterval(this.timer, 10000);
        this.setState({ intervalId: intervalId });
        await this.updateMixList();
    }

    async updateMixList() {
        const mixerAddress = (await LS.getItem('mixerAddress')) ?? DEFAULT_MIXER_ADDRESS;
        const walletList = (await LS.getItem('walletList')) ?? [];
        const mixerAvailable = await isMixerAvailable();
        this.setState({
            mixerAvailable: mixerAvailable,
            mixerAddress: mixerAddress,
            walletList: walletList,
        })
        if (mixerAvailable) {
            const availableMixes = (await getActiveMixes()).sort(function (a, b) { return b.status.localeCompare(a.status); });
            const availableCoverts = await getCovertAddresses();
            var tokenList = availableMixes.map(mix => mix.mixingTokenId).filter(tokenId => tokenId !== "");
            const covertTokenList = availableCoverts.map(covert => covert.assets.map(tok => tok.tokenId)).flat();
            for (const tokenId of covertTokenList) {
                if (!tokenList.includes(tokenId)) {
                    tokenList.push(tokenId);
                }
            }
            const mixedTokenInfoList = await Promise.all(tokenList.map(async (tokenId) => {
                const tokenInfo = await getTokenBoxV1(tokenId);
                return tokenInfo;
            }));
            var mixedTokenInfo = {};
            mixedTokenInfoList.forEach(tokenInfo => mixedTokenInfo[tokenInfo.id] = tokenInfo);
            this.setState({
                availableMixes: availableMixes,
                availableCoverts: availableCoverts,
                mixedTokenInfo: mixedTokenInfo,
            })
        }
    }

    setWallet = (walletId) => {
        this.setState({
            selectedWalletId: walletId,
        });
    };

    toggleAvailableMixes = () => {
        this.setState(prevState => ({
            showAvailableMixes: !prevState.showAvailableMixes,
        }))
    }
    toggleAvailableCoverts = () => {
        this.setState(prevState => ({
            showAvailableCovert: !prevState.showAvailableCovert,
        }))
    }

    render() {
        return (
            <Fragment >
                <div className='container card w-75 m-2 p-2 '>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <h4>ErgoMixer</h4>
                        <div className='d-flex flex-row align-items-center'>
                            <SelectWallet selectedWalletId={this.state.selectedWalletId}
                                setWallet={this.setWallet} />

                            <ImageButton
                                id={"refreshMixer"}
                                color={"blue"}
                                icon={"refresh"}
                                tips={"Update mix list"}
                                onClick={this.updateMixList}
                            />
                        </div>
                    </div>
                    {
                        this.state.mixerAvailable ?
                            <div className='d-flex flex-column'>
                                <div>ErgoMixer available at: <a href={this.state.mixerAddress} target='_blank' rel="noreferrer" >
                                    {this.state.mixerAddress}</a>
                                </div>
                                <br />
                                <h4>Mixes</h4>
                                <div className='d-flex flex-column'>
                                    <div className='d-flex flex-row justify-content-between align-items-center'>
                                        <div className='d-flex flex-row'>
                                            <ImageButton
                                                id={"availableMixesToggle"}
                                                color={"blue"}
                                                icon={this.state.showAvailableMixes ? "expand_more" : "expand_less"}
                                                tips={"Show available mixes"}
                                                onClick={() => this.toggleAvailableMixes()}
                                            />
                                            <h5>Available mixes</h5>
                                            <ImageButton
                                                id={"addMix"}
                                                color={"green"}
                                                icon={"add"}
                                                tips={"Create a new mix"}
                                                onClick={() => {
                                                    const url = this.state.mixerAddress + 'dashboard/mix/active/new';
                                                    window.open(url, '_blank').focus();
                                                }}
                                            />
                                        </div>

                                    </div>

                                    {
                                        this.state.showAvailableMixes ?
                                            this.state.availableMixes.map(availableMix =>
                                                <Mix key={"mix_" + availableMix.id}
                                                    mix={availableMix}
                                                    walletId={this.state.selectedWalletId}
                                                    setPage={this.state.setPage}
                                                    mixedTokenInfo={this.state.mixedTokenInfo}
                                                    mixerAddress={this.state.mixerAddress}
                                                />
                                            )
                                            : null
                                    }
                                    <br />

                                    <h4>Covert addresses</h4>
                                    <div className='d-flex flex-row'>
                                        <ImageButton
                                            id={"availableCovertAddressesToggle"}
                                            color={"blue"}
                                            icon={this.state.showAvailableCovert ? "expand_more" : "expand_less"}
                                            tips={"Show available covert addresses"}
                                            onClick={() => this.toggleAvailableCoverts()}
                                        />
                                        <h5>Covert addresses</h5>
                                        <ImageButton
                                            id={"covertList"}
                                            color={"blue"}
                                            icon={"open_in_new"}
                                            tips={"Open in ErgoMixer"}
                                            onClick={() => {
                                                const url = this.state.mixerAddress + 'dashboard/covert/';
                                                window.open(url, '_blank').focus();
                                            }}
                                        />
                                    </div>
                                    {
                                        this.state.showAvailableCovert ?
                                            this.state.availableCoverts.map(availableCovert =>
                                                <CovertAddress key={"covert_" + availableCovert.id}
                                                    covert={availableCovert}
                                                    walletId={this.state.selectedWalletId}
                                                    setPage={this.state.setPage}
                                                    mixedTokenInfo={this.state.mixedTokenInfo}
                                                    updateCovert={this.updateMixList}
                                                    mixerAddress={this.state.mixerAddress}
                                                />
                                            )
                                            : null
                                    }
                                    <h5>Create new covert address</h5>
                                    <AddCovertAddress updateCoverList={this.updateMixList} />
                                </div>
                            </div>
                            :
                            <div className='d-flex flex-column'>
                                <div>Ergo mixer not found at: {this.state.mixerAddress}</div>
                                <div>
                                    It can be downloaded at:&nbsp;
                                    <a href='https://github.com/ergoMixer/ergoMixBack/releases' target='_blank' rel="noreferrer">
                                        https://github.com/ergoMixer/ergoMixBack/releases
                                    </a>
                                </div>
                                <div>You need to run it on your computer to be able to use it from SAFEW.</div>
                            </div>
                    }
                </div>
            </Fragment >
        )
    }
}            