import React, { Fragment } from 'react';
import { updateCoverName } from '../ergo-related/mixer';
import { copySuccess } from '../utils/Alerts';
import { formatLongString } from '../utils/walletUtils';
import CovertAddressList from './CovertAddressList';
import CovertAsset from './CovertAsset';
import ImageButton from './ImageButton';

export default class CovertAddress extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            covert: props.covert,
            nameCovert: props.covert.nameCovert,
            mixedTokenInfo: props.mixedTokenInfo,
            walletId: props.walletId,
            setPage: props.setPage,
            updateCovert: props.updateCovert,
        };
        this.setCovertName = this.setCovertName.bind(this);
        this.updateCovertName = this.updateCovertName.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.walletId !== this.props.walletId) {
            this.setState({ walletId: this.props.walletId });
        }
        if (prevProps.covert.nameCovert !== this.props.covert.nameCovert
            || prevProps.covert.assets.length !== this.props.covert.assets.length) {
            this.setState({ covert: this.props.covert });
        }
        for (const i in prevProps.covert.assets) {
            if (prevProps.covert.assets[i].ring !== this.props.covert.assets[i].ring
                || prevProps.covert.assets[i].confirmedDeposit !== this.props.covert.assets[i].confirmedDeposit
                || prevProps.covert.assets[i].need !== this.props.covert.assets[i].need
                || prevProps.covert.assets[i].lastActivity !== this.props.covert.assets[i].lastActivity
            ) {
                this.setState({ covert: this.props.covert });
            }
        }
    }

    setCovertName = (name) => {
        this.setState({ nameCovert: name });
    };

    async updateCovertName() {
        await updateCoverName(this.state.covert.id, this.state.nameCovert);
        await this.state.updateCovert();
    }

    render() {
        const mixedTokenInfo = this.state.mixedTokenInfo;
        const covert = this.state.covert;
        return (
            <Fragment>
                <div key={covert.id} className='card m-1 p-1 d-flex flex-column'>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <div className='d-flex flex-row align-items-center'>
                            <h5><div className='d-flex flex-row align-items-center'>
                                <input type="text"
                                    id="nameCovert"
                                    onChange={e => this.setCovertName(e.target.value)}
                                    value={this.state.nameCovert}
                                    className="form-control"
                                />


                                {
                                    this.state.nameCovert !== covert.nameCovert ?
                                        <ImageButton
                                            id={"updateCovertName"}
                                            color={"blue"}
                                            icon={"save_alt"}
                                            tips={"Update covert name"}
                                            onClick={this.updateCovertName}
                                        />
                                        : null
                                }
                                <ImageButton
                                    id={"covert" + this.state.covert.id}
                                    color={"blue"}
                                    icon={"open_in_new"}
                                    tips={"Open in ErgoMixer"}
                                    onClick={() => {
                                        const url = localStorage.getItem('mixerAddress') + 'dashboard/covert/' + this.state.covert.id;
                                        window.open(url, '_blank').focus();
                                    }}
                                />
                            </div>

                            </h5>
                        </div>
                        <div className='d-flex flex-row align-items-center'>
                            id: {covert.id}
                        </div>
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <div className='d-flex flex-row align-items-center'>
                            Mixing rounds: {covert.numRounds}
                        </div>
                        <div className='d-flex flex-row align-items-center textSmall'>
                            Created: {
                                new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' })
                                    .format(new Date(covert.createdDate))
                            }
                        </div>
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-center'>
                        <div className='d-flex flex-column'>Deposit address:</div>
                        <div className='d-flex flex-column col-sm'>
                            <div className='d-flex flex-row align-items-center'>
                                {formatLongString(covert.deposit, 10)}
                                <ImageButton
                                    id={"copyAddress" + covert.deposit}
                                    color={"blue"}
                                    icon={"content_copy"}
                                    tips={"Copy to clipboard"}
                                    onClick={() => {
                                        navigator.clipboard.writeText(covert.deposit);
                                        copySuccess();
                                    }}
                                />

                            </div>
                        </div>
                    </div>
                    <div className='d-flex flex-column '>
                        <div className='d-flex flex-row align-items-center'>
                            Mixable assets:
                        </div>
                        {
                            covert.assets.map(asset =>
                                <CovertAsset covert={covert}
                                    asset={asset}
                                    mixedTokenInfo={mixedTokenInfo}
                                    walletId={this.state.walletId}
                                    setPage={this.state.setPage}
                                    updateCovert={this.state.updateCovert}
                                />
                            )
                        }
                    </div>
                    <div className='d-flex flex-column '>
                        <div className='d-flex flex-row align-items-center'>
                            Withdraw addresses:
                        </div>
                        {
                            <CovertAddressList covertId={covert.id} />
                        }
                    </div>

                </div>

            </Fragment>
        )
    }
}