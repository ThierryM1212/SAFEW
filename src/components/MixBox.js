import React, { Fragment } from 'react';
import { isValidErgAddress } from '../ergo-related/ergolibUtils';
import { setBoxWithdrawAddress, withdrawBox } from '../ergo-related/mixer';
import { confirmAlert } from '../utils/Alerts';
import { formatERGAmount, formatTokenAmount } from '../utils/walletUtils';
import ImageButton from './ImageButton';
import ValidInput from './ValidInput';
import { LS } from '../utils/utils';
import { DEFAULT_EXPLORER_WEBUI_ADDRESS } from '../utils/constants';

export default class MixBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            box: props.box,
            address: props.box.withdraw,
            mixStatus: props.mixStatus,
            updateBoxes: props.updateBoxes,
            mixedTokenInfo: props.mixedTokenInfo,
            isValidAddress: false,
            setPage: props.setPage,
            explorerWebUIURL: DEFAULT_EXPLORER_WEBUI_ADDRESS,
        };
        this.setAddress = this.setAddress.bind(this);
        this.setWithdrawAddress = this.setWithdrawAddress.bind(this);
        this.withdraw = this.withdraw.bind(this);
    }

    setAddress = (address) => {
        this.setState({
            address: address
        });
        isValidErgAddress(address).then(isValidAddress => {
            this.setState({ isValidAddress });
        })
    };

    async componentDidMount() {
        this.setState({
            isValidAddress: await isValidErgAddress(this.state.address),
            explorerWebUIURL: (await LS.getItem('explorerWebUIAddress')) ?? DEFAULT_EXPLORER_WEBUI_ADDRESS,
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.box.status !== this.props.box.status
            || prevProps.box.withdrawStatus !== this.props.box.withdrawStatus
            || prevProps.box.withdrawTxId !== this.props.box.withdrawTxId
            || prevProps.box.lastMixTime !== this.props.box.lastMixTime
            || prevProps.box.rounds !== this.props.box.rounds)
            {
                this.setState({
                    box: this.props.box,
                });
            }
    }

    async setWithdrawAddress() {
        await setBoxWithdrawAddress(this.state.box.id, this.state.address);
        await this.state.updateBoxes();
    }

    async withdraw() {
        var amount = "";
        if (this.state.box.mixingTokenId === "") {
            amount = formatERGAmount(this.state.box.amount) + " ERG";
        } else {
            amount = formatTokenAmount(this.state.box.mixingTokenAmount, this.state.mixedTokenInfo[this.state.box.mixingTokenId].decimals)
                + " " + this.state.mixedTokenInfo[this.state.box.mixingTokenId].name
        }
        const res = await confirmAlert("Withdraw " + amount + " to " + this.state.address + "?",
            "The mix will be stopped",
            "Withdraw");
        if (res.isConfirmed) {
            await withdrawBox(this.state.box.id, this.state.address);
            await this.state.updateBoxes();
        }
    }

    render() {
        const mixedTokenInfo = this.state.mixedTokenInfo;
        return (
            <Fragment>
                <div className='d-flex flex-row justify-content-between align-items-center'>
                    <div className='d-flex flex-row align-items-center'>
                        <input type="text"
                            size="55"
                            id={"address" + this.state.box.id}
                            onChange={e => this.setAddress(e.target.value)}
                            value={this.state.address}
                            className={this.state.isValidAddress ? "form-control validInput m-1" : "form-control invalidInput m-1"}
                            disabled={this.state.box.withdrawStatus !== "nothing"}
                        />
                        <ValidInput id={"isValidAddress" + this.state.box.id}
                            isValid={this.state.isValidAddress}
                            validMessage="OK"
                            invalidMessage={this.state.invalidAddressMessage} />
                        <div className='d-flex flex-row'>
                            {
                                this.state.box.mixingTokenId === "" ?
                                    formatERGAmount(this.state.box.amount) + " ERG"
                                    : formatTokenAmount(this.state.box.mixingTokenAmount, mixedTokenInfo[this.state.box.mixingTokenId].decimals)
                                    + " " + mixedTokenInfo[this.state.box.mixingTokenId].name
                            }
                        </div>
                    </div>
                    <div className='d-flex flex-row align-items-center'>
                        {
                            this.state.isValidAddress ?
                                <Fragment>
                                    {
                                        this.props.box.withdraw !== this.state.address ?
                                            <ImageButton
                                                id={"editWithdrawAddress" + this.state.box.id}
                                                color={"blue"}
                                                icon={"edit"}
                                                tips={"Set withdraw address"}
                                                onClick={this.setWithdrawAddress}
                                            />
                                            : null
                                    }
                                    {
                                        this.state.mixStatus === "running" ?
                                            this.state.box.withdrawStatus === "nothing" ?
                                                <ImageButton
                                                    id={"withdraw" + this.state.box.id}
                                                    color={"orange"}
                                                    icon={"save_alt"}
                                                    tips={"Withdraw"}
                                                    onClick={this.withdraw}
                                                />
                                                : this.state.box.withdrawStatus === "withdrawing" ?
                                                    this.state.box.withdrawTxId === "" ?
                                                        <ImageButton
                                                            id={"withdrawing" + this.state.box.id}
                                                            color={"orange"}
                                                            icon={"autorenew"}
                                                            tips={"Withdrawing..."}

                                                        />
                                                        : <ImageButton
                                                            id={"done" + this.state.box.id}
                                                            color={"green"}
                                                            icon={"price_check"}
                                                            tips={"Withdrawn<br/>View transaction"}
                                                            onClick={() => {
                                                                const url = this.state.explorerWebUIURL + 'en/transactions/' + this.state.box.withdrawTxId;
                                                                window.open(url, '_blank').focus();
                                                            }}
                                                        />
                                                    :
                                                    <ImageButton
                                                        id={"done" + this.state.box.id}
                                                        color={"green"}
                                                        icon={"price_check"}
                                                        tips={"Withdrawn<br/>View transaction"}
                                                        onClick={() => {
                                                            const url = this.state.explorerWebUIURL + 'en/transactions/' + this.state.box.withdrawTxId;
                                                            window.open(url, '_blank').focus();
                                                        }}
                                                    />
                                            :
                                            null
                                    }
                                    {
                                        this.state.mixStatus === "starting" ?
                                            this.state.box.status
                                            : null
                                    }
                                </Fragment>
                                : null
                        }

                    </div>

                </div>
            </Fragment>
        )
    }
}