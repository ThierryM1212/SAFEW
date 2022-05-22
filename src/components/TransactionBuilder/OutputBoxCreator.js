import React from 'react';
import OutputEditable from './OutputEditable';
import ImageButton from '../ImageButton';
import { encodeStr, encodeAddress, encodeInt, encodeLong, encodeLongArray, encodeContract, ergoTreeToAddress, ergoTreeToTemplate } from '../../ergo-related/serializer';

export default class OutputBoxCreator extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            onEdit: props.onChange,
            reset: props.reset,
            json: props.json,
            add: props.add,
            fee: props.fee,
            balance: props.balance,
            collByte: '',
            collByteEncoded: '',
            sigmaProp: '',
            sigmaPropEncoded: '',
            int: '',
            intEncoded: '',
            long: '',
            longEncoded: '',
            longArray: ["1", "0"],
            longArrayEncoded: '',
            addressContract: '',
            addressContractEncoded: '',
            ergoTree: '',
            addressFromErgoTree: '',
            ergoTree2: '',
            templateFromErgoTree: '',
            showConverter: false,
        };


        this.setLongEncoded = this.setLongEncoded.bind(this);
        this.setLongArrayEncoded = this.setLongArrayEncoded.bind(this);
        this.setIntEncoded = this.setIntEncoded.bind(this);
        this.setSigmaPropEncoded = this.setSigmaPropEncoded.bind(this);
        this.setCollByteEncoded = this.setCollByteEncoded.bind(this);
        this.setNanoErg = this.setNanoErg.bind(this);
        this.setShowConverter = this.setShowConverter.bind(this);
        this.setAddressContractEncoded = this.setAddressContractEncoded.bind(this);
        this.setAddressFromErgoTree = this.setAddressFromErgoTree.bind(this);
        //this.reset = this.reset.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ json: nextProps.json });
    }

    setShowConverter = () => {
        this.setState(prevState => ({ showConverter: !prevState.showConverter }))
    }

    setLongArrayEncoded = (item) => {
        this.setState({
            longArray: item.target.value.split(","),
        })
        encodeLongArray(item.target.value.split(",")).then(encoded => {
            this.setState({
                longArrayEncoded: encoded.encode_to_base16(),
            })
        }).catch(e => {
            console.log(e);
            this.setState({
                longArrayEncoded: "Invalid long array",
            })
        })
    }

    setLongEncoded = (item) => {
        this.setState({
            long: parseInt(item.target.value),
        })
        encodeLong(item.target.value).then(encoded => {
            this.setState({
                longEncoded: encoded.encode_to_base16(),
            })
        }).catch(e => {
            console.log(e);
            this.setState({
                longEncoded: "Invalid long",
            })
        })
    }

    setIntEncoded = (item) => {
        this.setState({
            int: parseInt(item.target.value),
        })
        encodeInt(item.target.value).then(encoded => {
            console.log(encoded, item);
            this.setState({
                intEncoded: encoded.encode_to_base16(),
            })
        }).catch(e => {
            console.log("error", e);
            this.setState({
                intEncoded: "Invalid integer",
            })
        })
    }

    setSigmaPropEncoded = (item) => {
        this.setState({
            sigmaProp: item.target.value,
        })
        encodeAddress(item.target.value).then(encoded => {
            console.log(encoded, item);
            this.setState({
                sigmaPropEncoded: encoded.encode_to_base16(),
            })
        }).catch(e => {
            console.log(e);
            this.setState({
                sigmaPropEncoded: "Invalid address",
            })
        })
    }

    setAddressContractEncoded = (item) => {
        this.setState({
            addressContract: item.target.value,
        })
        encodeContract(item.target.value).then(encoded => {
            console.log(encoded, item);
            this.setState({
                addressContractEncoded: encoded,
            })
        }).catch(e => {
            console.log(e);
            this.setState({
                addressContractEncoded: "Invalid address",
            })
        })
    }

    setAddressFromErgoTree = (item) => {
        this.setState({
            ergoTree: item.target.value,
        })
        ergoTreeToAddress(item.target.value).then(encoded => {
            console.log(encoded, item);
            this.setState({
                addressFromErgoTree: encoded,
            })
        }).catch(e => {
            console.log(e);
            this.setState({
                addressFromErgoTree: "Invalid ErgoTree",
            })
        })
    }

    setTemplateFromErgoTree = (item) => {
        this.setState({
            ergoTree2: item.target.value,
        })
        ergoTreeToTemplate(item.target.value).then(encoded => {
            console.log(encoded, item);
            this.setState({
                templateFromErgoTree: encoded,
            })
        }).catch(e => {
            console.log(e);
            this.setState({
                templateFromErgoTree: "Invalid ErgoTree",
            })
        })
    }

    setCollByteEncoded = (item) => {
        this.setState({
            collByte: item.target.value,
        })
        encodeStr(item.target.value).then(encoded => {
            console.log(encoded, item);
            this.setState({
                collByteEncoded: encoded,
            })
        })
    }

    setNanoErg = (item) => {
        this.setState({
            erg: item.target.value,
        })
        encodeStr(item.target.value).then(encoded => {
            this.setState({
                nanoErg: parseInt(parseFloat(item.target.value) * 1000000000),
            })
        })
    }

    render() {
        return (
            <div >
                <div className="card p-1 m-1">
                    <div className='d-flex flex-row align-items-center'>
                    <ImageButton
                        id={"showConverter"}
                        color={"blue"}
                        icon={this.state.showConverter ? "expand_more" : "expand_less"}
                        tips={"Wallet details"}
                        onClick={() => this.setShowConverter()}
                    />
                    <h6>Converter</h6>
                    </div>

                    {
                        this.state.showConverter ?
                            <table >
                                <thead>
                                    <tr><th><h6>Converter</h6></th><th>Value</th><th>Converted</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>ERG &gt; NanoERG</td>
                                        <td>
                                            <input className="grey-input" value={this.state.erg}
                                                type="number"
                                                step="0.000000001" min="0" max="10000000"
                                                onChange={this.setNanoErg} />
                                        </td>
                                        <td>
                                            <input className="w-100 grey-input" defaultValue={this.state.nanoErg} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Coll[byte]</td>
                                        <td>
                                            <input className="grey-input" value={this.state.collByte}
                                                onChange={this.setCollByteEncoded} />
                                        </td>
                                        <td>
                                            <input className="w-100 grey-input" defaultValue={this.state.collByteEncoded} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>SigmaProp</td>
                                        <td>
                                            <input className="grey-input" value={this.state.sigmaProp}
                                                onChange={this.setSigmaPropEncoded} />
                                        </td>
                                        <td>
                                            <input className="w-100 grey-input" defaultValue={this.state.sigmaPropEncoded} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Int</td>
                                        <td>
                                            <input className="grey-input" value={this.state.int}
                                                type="number"
                                                step="1" min="0" max="100000000000000000"
                                                onChange={this.setIntEncoded} />
                                        </td>
                                        <td>
                                            <input className="w-100 grey-input" defaultValue={this.state.intEncoded} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Long</td>
                                        <td>
                                            <input className="grey-input" value={this.state.long}
                                                type="number"
                                                step="1" min="0" max="100000000000000000"
                                                onChange={this.setLongEncoded} />
                                        </td>
                                        <td>
                                            <input className="w-100 grey-input" defaultValue={this.state.longEncoded} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Coll[Long]</td>
                                        <td>
                                            <input className="grey-input" value={this.state.longArray}
                                                onChange={this.setLongArrayEncoded} />
                                        </td>
                                        <td>
                                            <input className="w-100 grey-input" defaultValue={this.state.longArrayEncoded} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Pay to address</td>
                                        <td>
                                            <input className="grey-input" value={this.state.addressContract}
                                                onChange={this.setAddressContractEncoded} />
                                        </td>
                                        <td>
                                            <input className="w-100 grey-input" defaultValue={this.state.addressContractEncoded} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>ErgoTree to address</td>
                                        <td>
                                            <input className="grey-input" value={this.state.ergoTree}
                                                onChange={this.setAddressFromErgoTree} />
                                        </td>
                                        <td>
                                            <input className="w-100 grey-input" defaultValue={this.state.addressFromErgoTree} readOnly />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>ErgoTree to template</td>
                                        <td>
                                            <input className="grey-input" value={this.state.ergoTree2}
                                                onChange={this.setTemplateFromErgoTree} />
                                        </td>
                                        <td>
                                            <input className="w-100 grey-input" defaultValue={this.state.templateFromErgoTree} readOnly />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            : null
                    }


                </div>

                <div className="card p-1 m-1">
                    <div className="d-flex ">
                        <h6>New OUTPUT box</h6>
                        &nbsp;
                        <div className="d-flex flex-row">
                            <ImageButton id="reset" color="red" onClick={this.state.reset} icon="restart_alt" tips="Reset" />
                            <ImageButton id="fee" color="blue" onClick={this.state.fee} icon="monetization_on" tips="Setup transaction fee output box<br/>(default 0.002 ERG)" />
                            <ImageButton id="balance" color="blue" onClick={this.state.balance} icon="balance" tips="Setup a change box to balance the transaction.<br/>Add not attribuated ERG and tokens in inputs to the box.<br/>Set the ergoTree to the configured wallet change address." />
                            <ImageButton id="add" color="green" onClick={this.state.add} icon="add_box" tips="Add to transaction output list" />
                        </div>
                    </div>
                    <OutputEditable json={this.state.json} onEdit={this.state.onEdit} />
                </div>
            </div>
        )
    }
}

