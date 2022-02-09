import React, { Fragment } from 'react';
import { getMixBoxes, getMixURL } from '../ergo-related/mixer';
import { copySuccess } from '../utils/Alerts';
import { formatERGAmount, formatLongString, formatTokenAmount, getWalletById } from '../utils/walletUtils';
import ImageButton from './ImageButton';
import VerifiedTokenImage from './VerifiedTokenImage';


export default class Mix extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mix: props.mix,
            walletId: props.walletId,
            setPage: props.setPage,
            mixedTokenInfo: props.mixedTokenInfo,
            mixBoxes : [],
        };
        //this.setURL = this.setURL.bind(this);
    }

    async componentDidMount() {
        const mixBoxes = await getMixBoxes(this.state.mix.id);
        this.setState({mixBoxes: mixBoxes})
    }

    componentDidUpdate(prevProps, prevState) {
        //console.log("componentDidUpdate", prevProps, prevState, this.props, this.state);
        if (prevProps.walletId !== this.props.walletId) {
            this.setState({walletId: this.props.walletId})
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
                                            onClick={() => this.state.setPage('send', this.state.selectedWalletId,
                                                {
                                                    address: mix.deposit,
                                                    amount: Math.max(0, mix.amount - mix.doneDeposit),
                                                    tokens: mixTokens
                                                }
                                            )}
                                        />
                                    </div>
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
                </div>
            </Fragment>
        )
    }
}