import React, { Fragment } from 'react';
import { getMixBoxes, getMixURL } from '../ergo-related/mixer';
import { copySuccess } from '../utils/Alerts';
import { formatERGAmount, formatLongString, formatTokenAmount, getWalletById } from '../utils/walletUtils';
import ImageButton from './ImageButton';
import MixBox from './MixBox';
import VerifiedTokenImage from './VerifiedTokenImage';


export default class Mix extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mix: props.mix,
            walletId: props.walletId,
            setPage: props.setPage,
            mixedTokenInfo: props.mixedTokenInfo,
            mixBoxes: [],
        };
        this.updateBoxes = this.updateBoxes.bind(this);
        this.timer = this.timer.bind(this);
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    timer() {
        this.updateBoxes();
    }

    async updateBoxes() {
        const mixBoxes = await getMixBoxes(this.state.mix.id);
        this.setState({ mixBoxes: mixBoxes })
    }

    async componentDidMount() {
        var intervalId = setInterval(this.timer, 10000);
        this.setState({ intervalId: intervalId });
        await this.updateBoxes();
    }

    componentDidUpdate(prevProps, prevState) {
        //console.log("componentDidUpdate", prevProps, prevState, this.props, this.state);
        if (prevProps.walletId !== this.props.walletId) {
            this.setState({ walletId: this.props.walletId })
        }
        if (prevProps.mix.groupStat.doneMixRound !== this.props.mix.groupStat.doneMixRound
            || prevProps.mix.status !== this.props.mix.status
            || prevProps.mix.doneDeposit !== this.props.mix.doneDeposit
            || prevProps.mix.doneTokenDeposit !== this.props.mix.doneTokenDeposit) {
            this.setState({ mix: this.props.mix })
        }
    }

    render() {
        const selectedWallet = getWalletById(this.state.walletId);
        const mix = this.state.mix;
        const mixedTokenInfo = this.state.mixedTokenInfo;
        const mixBoxes = this.state.mixBoxes;
        var mixTokens = [];
        if (mix.mixingTokenId !== "") {
            mixTokens = [{
                tokenId: mix.mixingTokenId,
                amount: Math.max(0, mix.tokenAmount - mix.doneTokenDeposit),
                name: mixedTokenInfo[mix.mixingTokenId].name,
                decimals: mixedTokenInfo[mix.mixingTokenId].decimals,
            }];
        }

        console.log("Mix render", mix, mixedTokenInfo, mixBoxes)
        return (
            <Fragment>
                <div key={mix.id} className='card m-1 p-1 d-flex flex-column'>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <div className='d-flex flex-row align-items-center'>
                            Mix id: {mix.id}
                        </div>
                        <div>
                            <ImageButton
                                id={"mixstatus" + mix.id}
                                color={mix.status === "queued" ? "orange" : mix.status === "starting" ? "blue" : "green"}
                                icon={mix.status === "queued" ? "schedule" : mix.status === "compare_arrows" ? "blue" : "autorenew"}
                                tips={"Status: " + mix.status}
                                onClick={() => {
                                    const url = getMixURL(mix.id);
                                    window.open(url, '_blank').focus();
                                }}
                            />

                        </div>
                    </div>
                    <div className='d-flex flex-row textSmall'>
                        Creation date: {
                            new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' })
                                .format(new Date(mix.createdDate))
                        }
                    </div>
                    <div className='d-flex flex-row'>
                        <div className='d-flex flex-column col-sm'>Token to mix:</div>
                        <div className='d-flex flex-column col-sm'>
                            {
                                mix.mixingTokenId === "" ?
                                    formatERGAmount(mix.mixingAmount) + " ERG" :
                                    <div className='d-flex flex-row align-items-center'>
                                        {
                                            formatTokenAmount(mix.mixingTokenAmount, mixedTokenInfo[mix.mixingTokenId].decimals) +
                                            " " + mixedTokenInfo[mix.mixingTokenId].name
                                        }
                                        {
                                            <div>&nbsp;<VerifiedTokenImage tokenId={mix.mixingTokenId} /></div>
                                        }
                                    </div>
                            }
                        </div>
                    </div>
                    <div className='d-flex flex-row align-items-center'>
                        <div className='d-flex flex-column col-sm'>Deposit address:</div>
                        <div className='d-flex flex-column col-sm'>
                            <div className='d-flex flex-row align-items-center'>
                                {formatLongString(mix.deposit, 10)}
                                <ImageButton
                                    id={"copyAddress" + mix.deposit}
                                    color={"blue"}
                                    icon={"content_copy"}
                                    tips={"Copy to clipboard"}
                                    onClick={() => {
                                        navigator.clipboard.writeText(mix.deposit);
                                        copySuccess();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    {
                        mix.status === "queued" ?
                            <div className='d-flex flex-row '>
                                <div className='d-flex flex-row col-sm align-items-center'>Token to deposit:</div>
                                <div className='d-flex flex-row col-sm justify-content-between align-items-center'>
                                    <div className='d-flex flex-column'>
                                        {
                                            mix.mixingTokenId === "" ?
                                                formatERGAmount(mix.amount)
                                                + " ERG (done " + formatERGAmount(mix.doneDeposit) + " ERG)"
                                                :
                                                <Fragment>
                                                    <div className='d-flex flex-row'>
                                                        {
                                                            formatERGAmount(mix.amount)
                                                            + " ERG (done " + formatERGAmount(mix.doneDeposit) + ")"
                                                        }
                                                    </div>
                                                    <div className='d-flex flex-row'>
                                                        {
                                                            formatTokenAmount(mix.tokenAmount, mixedTokenInfo[mix.mixingTokenId].decimals) +
                                                            " " + mixedTokenInfo[mix.mixingTokenId].name +
                                                            " (done " + formatTokenAmount(mix.doneTokenDeposit, mixedTokenInfo[mix.mixingTokenId].decimals) +
                                                            ")"
                                                        }
                                                    </div>

                                                </Fragment>
                                        }
                                    </div>

                                    {
                                        selectedWallet ?
                                            <div className='card m-1 p-1 d-flex align-items_center'
                                                style={{
                                                    borderColor: `rgba(${selectedWallet.color.r},${selectedWallet.color.g},${selectedWallet.color.b}, 0.95)`,
                                                    backgroundColor: `rgba(${selectedWallet.color.r},${selectedWallet.color.g},${selectedWallet.color.b}, 0.10)`
                                                }}>
                                                <ImageButton
                                                    id={"mixTransaction"}
                                                    color={"white"}
                                                    icon={"send"}
                                                    tips={"Deposit - Start mix"}
                                                    onClick={() => this.state.setPage('send', this.state.walletId,
                                                        {
                                                            address: mix.deposit,
                                                            amount: Math.max(0, mix.amount - mix.doneDeposit),
                                                            tokens: mixTokens
                                                        }
                                                    )}
                                                />
                                            </div>
                                            : null
                                    }

                                </div>
                            </div>
                            :
                            <div className='d-flex flex-row '>
                                <div className='d-flex flex-row col-sm'>Mix progress:</div>
                                <div className='d-flex flex-row col-sm'>
                                    {
                                        mix.groupStat.doneMixRound
                                        + " / " + mix.groupStat.totalMixRound + " rounds"
                                    }
                                </div>
                            </div>
                    }
                    <div className='d-flex flex-column '>
                        <div className='d-flex flex-row '>
                            Withdraw Addresses
                        </div>
                        {
                            mixBoxes.map(box =>
                                <MixBox
                                    box={box}
                                    mixStatus={mix.status}
                                    setPage={this.state.setPage}
                                    updateBoxes={this.updateBoxes}
                                    mixedTokenInfo={mixedTokenInfo}
                                />
                            )
                        }

                    </div>
                </div>
            </Fragment>
        )
    }
}