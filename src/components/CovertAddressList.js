import React, { Fragment } from 'react';
import { isValidErgAddress } from '../ergo-related/ergolibUtils';
import { getCovertWithdrawAddresses, setCovertWithdrawAddresses } from '../ergo-related/mixer';
import ImageButton from './ImageButton';
import ValidInput from './ValidInput';

export default class CovertAddressList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            covertId: props.covertId ?? '',
            covertAddressList: [],
            addressToAdd: '',
            isValidAddressToAdd: false,
            addressListModified: false,
        };
        this.setAddressToAdd = this.setAddressToAdd.bind(this);
        this.addAddress = this.addAddress.bind(this);
        this.deleteAddress = this.deleteAddress.bind(this);
        this.updateCovertAddressList = this.updateCovertAddressList.bind(this);
        this.updateCovertAddress = this.updateCovertAddress.bind(this);
    }

    async componentDidMount() {
        await this.updateCovertAddressList();
    }

    async updateCovertAddressList() {
        if (this.state.covertId !== '') {
            const covertAddressList = await getCovertWithdrawAddresses(this.state.covertId);
            this.setState({
                covertAddressList: covertAddressList,
                addressToAdd: '',
                isValidAddressToAdd: false,
                addressListModified: false,
            });
        }
    }

    setAddressToAdd = (addr) => {
        this.setState({ addressToAdd: addr, });
        if (this.state.covertAddressList.includes(addr)) {
            this.setState({ isValidAddressToAdd: false });
        } else {
            isValidErgAddress(addr).then(isValidAddressToAdd => {
                this.setState({ isValidAddressToAdd: isValidAddressToAdd });
            })
        }
    }
    addAddress = () => {
        if (this.state.isValidAddressToAdd) {
            this.setState({
                covertAddressList: [...this.state.covertAddressList, this.state.addressToAdd],
                addressToAdd: '',
                isValidAddressToAdd: false,
                addressListModified: true,
            });
        }
    }
    deleteAddress = (addrToDelete) => {
        const newAddressList = this.state.covertAddressList.filter(addr => addr !== addrToDelete);
        this.setState({
            covertAddressList: newAddressList,
            addressListModified: true,
        });
    }

    async updateCovertAddress() {
        await setCovertWithdrawAddresses(this.state.covertId, this.state.covertAddressList);
        await this.updateCovertAddressList();
    }

    render() {
        return (
            <Fragment>
                <div className='card m-1 p-1 d-flex flex-column'>
                    <div className='d-flex flex-row m-1 align-items-center'>
                        <div className='d-flex flex-row col-sm-6'>
                            < input type="text"
                                size="55"
                                id={"addressToAdd"}
                                onChange={e => this.setAddressToAdd(e.target.value)}
                                value={this.state.addressToAdd}
                                className={this.state.isValidAddressToAdd ? "form-control validInput m-1" : "form-control invalidInput m-1"}
                            />
                        </div>
                        <ValidInput id={"isValidAddressToAdd"}
                            isValid={this.state.isValidAddressToAdd}
                            validMessage="OK"
                            invalidMessage="Invalid address" />

                        {
                            this.state.isValidAddressToAdd ?
                                <ImageButton
                                    id={"addAddress"}
                                    color={"green"}
                                    icon={"add"}
                                    tips={"Add new address"}
                                    onClick={this.addAddress}
                                />
                                : null
                        }
                    </div>
                    {
                        this.state.covertAddressList.map(address =>
                            <div key={"address_" + address}
                                className='d-flex flex-row align-items-center'
                            >
                                {address}
                                <ImageButton
                                    id={"openAddressExplorer" + address}
                                    color={"blue"}
                                    icon={"open_in_new"}
                                    tips={"Open in Explorer"}
                                    onClick={() => {
                                        const url = localStorage.getItem('explorerWebUIAddress') + 'en/addresses/' + address;
                                        window.open(url, '_blank').focus();
                                    }}
                                />
                                <ImageButton
                                    id={"deleteAddress_" + address}
                                    color={"red"}
                                    icon={"delete"}
                                    tips={"Remove the address from the wallet"}
                                    onClick={() => this.deleteAddress(address)}
                                />
                            </div>
                        )
                    }
                    {
                        this.state.addressListModified ?
                            <div className='d-flex flex-row m-1 align-items-center'>
                                <button className="btn btn-outline-info" onClick={this.updateCovertAddress} >
                                    Update covert address list
                                </button>
                            </div>
                            : null
                    }

                </div>

            </Fragment>

        )
    }
}