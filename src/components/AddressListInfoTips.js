import React, { Fragment } from 'react';
import { getTotalNumberOfBoxesByAddressList } from "../ergo-related/explorer";
import { getOldestBoxAgeByAddressList } from "../ergo-related/node";
import { msToTime } from "../utils/utils";
import ImageButton from './ImageButton';

export default class AddressListInfoTips extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            addressList: props.addressList ?? [],
            oldestBoxAge: 0,
            totalNumberOfBoxes: 0,
        };
        this.updateInfo = this.updateInfo.bind(this);
    }

    async updateInfo(addressList) {
        const oldestBoxAge = await getOldestBoxAgeByAddressList(addressList);
        const totalNumberOfBoxes = await getTotalNumberOfBoxesByAddressList(addressList);
        this.setState({
            oldestBoxAge: oldestBoxAge,
            totalNumberOfBoxes: totalNumberOfBoxes,
        })
    }

    async componentDidMount() {
        if (this.state.addressList.length > 0) {
            await this.updateInfo(this.state.addressList);
        }
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.addressList !== this.props.addressList) {
            await this.updateInfo(this.props.addressList);
        }
    }

    render() {
        const yearInMilli = 365 * 24 * 60 * 60 * 1000;
        const storageRentTime = Math.max(4 * yearInMilli - this.state.oldestBoxAge, 0);
        var color = "green", numBoxColor = "greenAmount", ageBoxColor = "greenAmount", tips = "All good";
        if (this.state.totalNumberOfBoxes >= 25 || storageRentTime < 2 * yearInMilli) {
            color = "orange";
            tips = "Condider consolidating your wallet (send all to yourself) for the performance of the wallet and to avoid the storage rent";
            if (this.state.totalNumberOfBoxes >= 25) {
                numBoxColor = "orangeAmount";
            }
            if (storageRentTime < 2 * yearInMilli) {
                ageBoxColor = "orangeAmount";
            }
        }

        if (this.state.totalNumberOfBoxes >= 50 || storageRentTime < yearInMilli) {
            color = "red";
            tips = "Consolidate your wallet (send all to yourself) for the performance of the wallet and to avoid the storage rent"
            if (this.state.totalNumberOfBoxes >= 50) {
                numBoxColor = "redAmount";
            }
            if (storageRentTime < yearInMilli) {
                ageBoxColor = "redAmount";
            }
        }

        return (
            <Fragment>
                {
                    this.state.oldestBoxAge > 0 ?
                        <ImageButton
                            id={"infoWalletTips" + this.state.addressList.toString()}
                            color={color}
                            icon={"info"}
                            tips={<table>
                                <tr>
                                    <td>Total number of boxes</td>
                                    <td><h6 className={numBoxColor}>{this.state.totalNumberOfBoxes}</h6></td>
                                </tr>
                                <tr>
                                    <td>Oldest box age</td>
                                    <td><h6 className={ageBoxColor}>{msToTime(this.state.oldestBoxAge)}</h6></td>
                                </tr>
                                <tr>
                                    <td>Storage rent in</td>
                                    <td><h6 className={ageBoxColor}>{msToTime(storageRentTime)}</h6></td>
                                </tr>
                                <tr>
                                    <td>Tips</td>
                                    <td><h6><b>{tips}</b></h6></td>
                                </tr>
                            </table>}
                        />
                        : null
                }
            </Fragment>
        )
    }
}