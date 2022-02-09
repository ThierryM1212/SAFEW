import React, { Fragment } from 'react';
import { getTokenBoxV1 } from '../ergo-related/explorer';
import { getActiveMixes, getMixURL, isMixerAvailable } from '../ergo-related/mixer';
import { copySuccess } from '../utils/Alerts';
import { DEFAULT_MIXER_ADDRESS, VERIFIED_TOKENS } from '../utils/constants';
import { formatERGAmount, formatLongString, formatTokenAmount } from '../utils/walletUtils';
import ImageButton from './ImageButton';
import Mix from './Mix';
import SelectWallet from './SelectWallet';
import VerifiedTokenImage from './VerifiedTokenImage';

export default class Mixer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mixerAvailable: false,
            mixerAddress: localStorage.getItem('mixerAddress') ?? DEFAULT_MIXER_ADDRESS,
            availableMixes: [],
            mixedTokenInfo: {},
            walletList: JSON.parse(localStorage.getItem('walletList')) ?? [],
            selectedWalletId: 0,
            setPage: props.setPage,
        };
        this.updateMixList = this.updateMixList.bind(this);
    }

    async componentDidMount() {
        await this.updateMixList();
    }

    async updateMixList() {
        const mixerAvailable = await isMixerAvailable();
        this.setState({
            mixerAvailable: mixerAvailable,
        })
        if (mixerAvailable) {
            const availableMixes = (await getActiveMixes()).sort(function (a, b) { return b.status.localeCompare(a.status); });
            const mixedTokenList = availableMixes.map(mix => mix.mixingTokenId).filter(tokenId => tokenId !== "");
            const mixedTokenInfoList = await Promise.all(mixedTokenList.map(async (tokenId) => {
                const tokenInfo = await getTokenBoxV1(tokenId);
                return tokenInfo;
            }));
            var mixedTokenInfo = {};
            mixedTokenInfoList.forEach(tokenInfo => mixedTokenInfo[tokenInfo.id] = tokenInfo);
            this.setState({
                availableMixes: availableMixes,
                mixedTokenInfo: mixedTokenInfo,
            })
        }
    }

    setWallet = (walletId) => {
        this.setState({
            selectedWalletId: walletId,
        });
    };

    render() {
        const selectedWallet = this.state.walletList[this.state.selectedWalletId];
        return (
            <Fragment >
                <div className='container card w-75 m-2 p-2 '>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <h4>ErgoMixer</h4>
                        <ImageButton
                            id={"refreshMixer"}
                            color={"blue"}
                            icon={"refresh"}
                            tips={"Update mix list"}
                            onClick={this.updateMixList}
                        />
                    </div>
                    {
                        this.state.mixerAvailable ?
                            <div className='d-flex flex-column'>
                                <div>ErgoMixer available at: <a href={this.state.mixerAddress} target='_blank'>
                                    {this.state.mixerAddress}</a>
                                </div>
                                <div className='d-flex flex-column'>
                                    <div className='d-flex flex-row justify-content-between align-items-center'>
                                        <h4>Available mixes</h4>
                                        <div className='d-flex flex-row '>
                                            <SelectWallet selectedWalletId={this.state.selectedWalletId} setWallet={this.setWallet} />
                                        </div>
                                    </div>

                                    {
                                        this.state.availableMixes.map(availableMix =>
                                            <Mix key={"mix_" + availableMix.id}
                                                mix={availableMix}
                                                walletId={this.state.selectedWalletId}
                                                setPage={this.state.setPage}
                                                mixedTokenInfo={this.state.mixedTokenInfo}
                                            />
                                        )
                                    }

                                </div>
                            </div>
                            :
                            <div className='d-flex flex-column'>
                                <div>Ergo mixer not found at: {this.state.mixerAddress}</div>
                                <div>
                                    It can be downloaded at:&nbsp;
                                    <a href='https://github.com/ergoMixer/ergoMixBack/releases' target='_blank'>
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