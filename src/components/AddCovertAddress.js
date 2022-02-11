import React, { Fragment } from 'react';
import Select from 'react-select';
import { isValidErgAddress } from '../ergo-related/ergolibUtils';
import { addCovertAddress } from '../ergo-related/mixer';
import ImageButton from './ImageButton';
import ValidInput from './ValidInput';

export default class AddCovertAddress extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            covertName: '',
            covertAddressList: [],
            covertRounds: 30,
            addressToAdd: '',
            isValidAddressToAdd: false,
            updateCoverList: props.updateCoverList,
        };
        this.setCovertName = this.setCovertName.bind(this);
        this.setMixingRounds = this.setMixingRounds.bind(this);
        this.setAddressToAdd = this.setAddressToAdd.bind(this);
        this.addAddress = this.addAddress.bind(this);
        this.deleteAddress = this.deleteAddress.bind(this);
        this.addCovertAddress = this.addCovertAddress.bind(this);
    }

    setCovertName = (name) => {
        this.setState({ covertName: name });
    };
    setMixingRounds = (nbRounds) => {
        this.setState({
            covertRounds: nbRounds.value
        });
    };
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
            });
        }
    }
    deleteAddress = (addrToDelete) => {
        const newAddressList = this.state.covertAddressList.filter(addr => addr !== addrToDelete);
        this.setState({
            covertAddressList: newAddressList,
        });
    }

    async addCovertAddress() {
        await addCovertAddress(this.state.covertName, this.state.covertRounds, this.state.covertAddressList);
        await this.state.updateCoverList();
        this.setState({
            covertName: '',
            covertAddressList: [],
            covertRounds: 30,
            addressToAdd: '',
            isValidAddressToAdd: false,
        });
    }

    render() {
        var optionsMixingRounds = [30, 60, 90, 180].map(nb => ({ value: nb, label: nb.toString() }));
        return (
            <Fragment>
                <div className='card m-1 p-1 d-flex flex-column'>
                    <div className='d-flex flex-row m-1 align-items-center'>
                        Covert name: <input type="text"
                            id="covertName"
                            onChange={e => this.setCovertName(e.target.value)}
                            value={this.state.covertName}
                            className="form-controlm-1"
                        />
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-center m-1'>
                        <div className='d-flex flex-row align-items-center'>
                            Mixing rounds:
                            <Select className='selectReact'
                                value={{ value: this.state.covertRounds, label: this.state.covertRounds }}
                                onChange={this.setMixingRounds}
                                options={optionsMixingRounds}
                                isSearchable={false}
                                isMulti={false}
                            />
                        </div>
                        <div className='d-flex flex-row'>
                            Cost per box: {(this.state.covertRounds * 0.004).toFixed(4) + " ERG"}
                        </div>
                    </div>

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
                    <div className='d-flex flex-row m-1 align-items-center'>
                        <button className="btn btn-outline-info" onClick={this.addCovertAddress} >
                            Create covert address
                        </button>
                    </div>
                </div>

            </Fragment>

        )
    }
}