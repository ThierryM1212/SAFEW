import React, { Fragment } from 'react';
import { getActiveMixes, getMixURL, isMixerAvailable } from '../ergo-related/mixer';
import { copySuccess } from '../utils/Alerts';
import { DEFAULT_MIXER_ADDRESS, MAX_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT, VERIFIED_TOKENS } from '../utils/constants';
import { rgbToHex } from '../utils/utils';
import { formatERGAmount, formatLongString, formatTokenAmount } from '../utils/walletUtils';
import ImageButton from './ImageButton';
import SelectWallet from './SelectWallet';

export default class Mixer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mixerAvailable: false,
            mixerAddress: localStorage.getItem('mixerAddress') ?? DEFAULT_MIXER_ADDRESS,
            availableMixes: [],
            walletList: JSON.parse(localStorage.getItem('walletList')) ?? [],
            selectedWalletId: 0,
            setPage: props.setPage,
        };
        //this.updateWalletName = this.updateWalletName.bind(this);
    }

    async componentDidMount() {
        const mixerAvailable = await isMixerAvailable();
        const availableMixes = await getActiveMixes();
        this.setState({
            mixerAvailable: mixerAvailable,
            availableMixes: availableMixes,
        })
    }

    setWallet = (walletId) => {
        this.setState({
            selectedWalletId: walletId,
        });
    };

    render() {

        const selectedWallet = this.state.walletList[this.state.selectedWalletId];
        console.log("Mixer render", this.state, rgbToHex(selectedWallet.color.r, selectedWallet.color.g, selectedWallet.color.b))


        return (
            <Fragment >
                <div className='container card w-75 m-2 p-2 '>
                    <h4>ErgoMixer</h4>
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
                                            <div key={availableMix.id} className='card m-1 p-1 d-flex flex-column'>
                                                <div className='d-flex flex-row justify-content-between align-items-center'>
                                                    <div className='d-flex flex-row align-items-center'>
                                                        Mix id: {availableMix.id}
                                                        <ImageButton
                                                            id={"openMix" + availableMix.id}
                                                            color={"blue"}
                                                            icon={"open_in_new"}
                                                            tips={"Open in ErgoMixer"}
                                                            onClick={() => {
                                                                const url = getMixURL(availableMix.id);
                                                                window.open(url, '_blank').focus();
                                                            }}
                                                        />
                                                    </div>
                                                    <div>Status: {availableMix.status}</div>
                                                </div>
                                                <div className='d-flex flex-row textSmall'>
                                                    Creation date: {
                                                        new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' })
                                                            .format(new Date(availableMix.createdDate))
                                                    }
                                                </div>
                                                <div className='d-flex flex-row'>
                                                    <div className='d-flex flex-column col-sm'>Token to mix:</div>
                                                    <div className='d-flex flex-column col-sm'>
                                                        {
                                                            availableMix.mixingTokenId === "" ?
                                                                formatERGAmount(availableMix.mixingAmount) + " ERG" :
                                                                formatTokenAmount(availableMix.mixingTokenAmount, VERIFIED_TOKENS[availableMix.mixingTokenId][2]) +
                                                                " " + VERIFIED_TOKENS[availableMix.mixingTokenId][0]
                                                        }
                                                    </div>
                                                </div>
                                                <div className='d-flex flex-row align-items-center'>
                                                    <div className='d-flex flex-column col-sm'>Deposit address:</div>
                                                    <div className='d-flex flex-column col-sm'>
                                                        <div className='d-flex flex-row align-items-center'>
                                                            {formatLongString(availableMix.deposit, 10)}
                                                            <ImageButton
                                                                id={"copyAddress" + availableMix.deposit}
                                                                color={"blue"}
                                                                icon={"content_copy"}
                                                                tips={"Copy to clipboard"}
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(availableMix.deposit);
                                                                    copySuccess();
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='d-flex flex-row '>
                                                    <div className='d-flex flex-row col-sm align-items-center'>Token to deposit:</div>
                                                    <div className='d-flex flex-row col-sm justify-content-between align-items-center'>
                                                        <div className='d-flex flex-column'>
                                                            {
                                                                availableMix.mixingTokenId === "" ?
                                                                    formatERGAmount(availableMix.amount)
                                                                    + " ERG (done " + formatERGAmount(availableMix.doneDeposit) + " ERG)"
                                                                    :
                                                                    <Fragment>
                                                                        <div className='d-flex flex-row'>
                                                                            {
                                                                                formatERGAmount(availableMix.amount)
                                                                                + " ERG (done " + formatERGAmount(availableMix.doneDeposit) + ")"
                                                                            }
                                                                        </div>
                                                                        <div className='d-flex flex-row'>
                                                                            {
                                                                                formatTokenAmount(availableMix.tokenAmount, VERIFIED_TOKENS[availableMix.mixingTokenId][2]) +
                                                                                " " + VERIFIED_TOKENS[availableMix.mixingTokenId][0] +
                                                                                " (done " + formatTokenAmount(availableMix.doneTokenDeposit, VERIFIED_TOKENS[availableMix.mixingTokenId][2]) +
                                                                                ")"
                                                                            }
                                                                        </div>

                                                                    </Fragment>
                                                            }
                                                        </div>
                                                        <div className='card m-1 p-1 d-flex align-items_center'
                                                            style={{
                                                                borderColor: `rgba(${selectedWallet.color.r},${selectedWallet.color.g},${selectedWallet.color.b}, 0.95)`,
                                                                backgroundColor: `rgba(${selectedWallet.color.r},${selectedWallet.color.g},${selectedWallet.color.b}, 0.10)`
                                                            }}>
                                                            <ImageButton
                                                                id={"mixTransaction"}
                                                                color={"white"}
                                                                icon={"send"}
                                                                tips={"Mix assets"}
                                                                onClick={() => this.state.setPage('send', this.state.selectedWalletId,
                                                                    {
                                                                        address: availableMix.deposit,
                                                                        amount: Math.max(0, availableMix.amount - availableMix.doneDeposit),
                                                                        tokens: [{
                                                                            tokenId: availableMix.mixingTokenId,
                                                                            amount: Math.max(0, availableMix.tokenAmount - availableMix.doneTokenDeposit),
                                                                            name: VERIFIED_TOKENS[availableMix.mixingTokenId][0],
                                                                            decimals: VERIFIED_TOKENS[availableMix.mixingTokenId][2],
                                                                        }]
                                                                    }
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
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