import React, { Fragment } from 'react';
import { updateCoverRingAmount } from '../ergo-related/mixer';
import { NANOERG_TO_ERG } from '../utils/constants';
import { formatERGAmount, formatTokenAmount, getWalletById } from '../utils/walletUtils';
import ImageButton from './ImageButton';

export default class CovertAsset extends React.Component {
    constructor(props) {
        super(props);
        var ringAmount = "0";
        if (props.asset.tokenId === "") {
            ringAmount = formatERGAmount(props.asset.ring);
        } else {
            ringAmount = formatTokenAmount(props.asset.ring, props.mixedTokenInfo[props.asset.tokenId].decimals);
        }

        this.state = {
            covert: props.covert,
            asset: props.asset,
            mixedTokenInfo: props.mixedTokenInfo,
            walletId: props.walletId,
            setPage: props.setPage,
            ringAmount: ringAmount,
            updateCovert: props.updateCovert,
            walletColor: { r: 141, g: 140, b: 143, a: 1 },
        };
        this.setRingAmount = this.setRingAmount.bind(this);
        this.getRingAmountNano = this.getRingAmountNano.bind(this);
        this.updateRingAmount = this.updateRingAmount.bind(this);
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.walletId !== this.props.walletId) {
            const wallet = await getWalletById(this.props.walletId);
            this.setState({ walletId: this.props.walletId, walletColor: wallet.color });
        }
        var ringAmount = "0";

        if (prevProps.asset.need !== this.props.asset.need
            || prevProps.asset.confirmedDeposit !== this.props.asset.confirmedDeposit
            || prevProps.asset.ring !== this.props.asset.ring
        ) {
            if (this.props.asset.tokenId === "") {
                ringAmount = formatERGAmount(this.props.asset.ring);
            } else {
                ringAmount = formatTokenAmount(this.props.asset.ring, this.props.mixedTokenInfo[this.props.asset.tokenId].decimals);
            }
            this.setState({
                asset: this.props.asset,
                ringAmount: ringAmount,
            });
        }
    }

    setRingAmount = (amountStr) => {
        this.setState({ ringAmount: amountStr });
    };

    getRingAmountNano = () => {
        var ringAmountNano = 0;
        if (this.state.asset.tokenId === "") {
            ringAmountNano = Math.round(parseFloat(this.state.ringAmount) * NANOERG_TO_ERG);
        } else {
            ringAmountNano = Math.round(parseFloat(this.state.ringAmount) * Math.pow(10, this.state.mixedTokenInfo[this.state.asset.tokenId].decimals));
        }
        return ringAmountNano;
    }

    async updateRingAmount() {
        await updateCoverRingAmount(this.state.covert.id, this.state.asset.tokenId, this.getRingAmountNano());
        await this.state.updateCovert();
    }

    async componentDidMount() {
        const wallet = await getWalletById(this.state.walletId);
        this.setState({ walletColor: wallet.color });
    }

    render() {
        const covert = this.state.covert.id;
        const asset = this.state.asset;
        const mixedTokenInfo = this.state.mixedTokenInfo;
        const walletColor = this.state.walletColor;
        const ringAmountNano = this.getRingAmountNano();
        console.log("render", asset, ringAmountNano);
        return (
            <Fragment>
                <div className='card m-1 p-1 d-flex flex-column '>
                    <div className='d-flex flex-row '>
                        Mixed token: {asset.tokenId === "" ? "ERG" : mixedTokenInfo[asset.tokenId].name}
                    </div>
                    <div className='d-flex flex-row align-items-center'>
                        Ring amount:
                        <div className='d-flex flex-row '>
                            <input type="text"
                                pattern="[0-9\.]+"
                                id={"ringAmount" + asset.tokenId + covert.id}
                                key={"ringAmount" + asset.tokenId + covert.id}
                                className="form-control"
                                onChange={e => this.setRingAmount(e.target.value)}
                                value={this.state.ringAmount}
                            />
                        </div>
                        {
                            asset.ring !== ringAmountNano ?
                                <ImageButton
                                    id={"updateRingAmont"}
                                    color={"blue"}
                                    icon={"save_alt"}
                                    tips={"Update ring amount"}
                                    onClick={this.updateRingAmount}
                                />
                                : null
                        }
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <div className='d-flex flex-row'>
                            Deposit amount: {asset.tokenId === "" ? formatERGAmount(asset.need) : formatTokenAmount(asset.need, mixedTokenInfo[asset.tokenId].decimals)}
                            &nbsp;(done {asset.tokenId === "" ? formatERGAmount(asset.confirmedDeposit) : formatTokenAmount(asset.confirmedDeposit, mixedTokenInfo[asset.tokenId].decimals)})
                        </div>
                        {
                            selectedWallet ?
                                <div className='card m-1 p-1 d-flex align-items_center'
                                    style={{
                                        borderColor: `rgba(${walletColor.r},${walletColor.g},${walletColor.b}, 0.95)`,
                                        backgroundColor: `rgba(${walletColor.r},${walletColor.g},${walletColor.b}, 0.10)`
                                    }}>
                                    <ImageButton
                                        id={"mixTransaction"}
                                        color={"white"}
                                        icon={"send"}
                                        tips={"Send to covert address"}
                                        onClick={() => this.state.setPage('send', this.state.walletId,
                                            {
                                                address: this.state.covert.deposit,
                                                amount: Math.max(0, asset.need - asset.confirmedDeposit),
                                                tokens: asset.tokenId
                                            }
                                        )}
                                    />
                                </div>
                                : null
                        }
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <div className='d-flex flex-row'>
                            Mixing amount: {asset.tokenId === "" ? formatERGAmount(asset.currentMixingAmount) : formatTokenAmount(asset.currentMixingAmount, mixedTokenInfo[asset.tokenId].decimals)}
                        </div>
                        <div className='d-flex flex-row'>

                        </div>
                    </div>

                </div>

            </Fragment>

        )
    }
}