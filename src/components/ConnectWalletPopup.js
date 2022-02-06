import React, { Fragment } from 'react';

/* global chrome */

export default class ConnectWalletPopup extends React.Component {
    constructor(props) {
        super(props);
        var url = new URL(window.location.href.replace("#connect", '').replace("chrome-extension", "http"));
        //console.log("ConnectWalletPopup url", window.location, url);
        this.state = {
            selectedOption: "",
            walletList: JSON.parse(localStorage.getItem('walletList')) ?? [],
            url: url.searchParams.get("origin"),
            accepted: false,
        };
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleOptionChange = this.handleOptionChange.bind(this);
    }

    handleOptionChange = changeEvent => {
        this.setState({
            selectedOption: changeEvent.target.value
        });
    };

    handleFormSubmit = formSubmitEvent => {
        formSubmitEvent.preventDefault();
        chrome.runtime.sendMessage({
            channel: "safew_extension_background_channel",
            data: {
                result: true,
                type: "connect_response",
                url: this.state.url,
            }
        });
        this.setState({ accepted: true });
        var connectedSites = JSON.parse(localStorage.getItem('connectedSites')) ?? {};
        if (Object.keys(connectedSites).includes(this.state.selectedOption)) {
            if (!connectedSites[this.state.selectedOption].includes(this.state.url)) {
                connectedSites[this.state.selectedOption].push(this.state.url);
            }
        } else {
            connectedSites[this.state.selectedOption] = [this.state.url]
        }
        localStorage.setItem('connectedSites', JSON.stringify(connectedSites));
        window.close();
    };

    handleCancel = formSubmitEvent => {
        formSubmitEvent.preventDefault();
        chrome.runtime.sendMessage({
            channel: "safew_extension_background_channel",
            data: {
                result: false,
                url: this.state.url,
                type: "connect_response",
            }
        });
        window.close();
    }

    componentWillUnmount() {
        if (!this.state.accepted) {
            chrome.runtime.sendMessage({
                channel: "safew_extension_background_channel",
                data: {
                    result: false,
                    url: this.state.url,
                    type: "connect_response",
                }
            });
        }
    }

    render() {
        //console.log("ConnectWalletPopup walletList", this.state.walletList);
        return (
            <Fragment>
                <br/>
                <h5>
                    Connect Wallet to {this.state.url}
                </h5>
                <div className='card w-75 m-1 p-1 d-flex flex-column'>
                    <form onSubmit={this.handleFormSubmit}
                        className='m-2 p-2'>
                        {
                            this.state.walletList.map(wallet =>
                                <div key={wallet.name}
                                    className='card p-2 m-2 walletCard form-check'
                                    style={{ 
                                        borderColor: `rgba(${wallet.color.r},${wallet.color.g},${wallet.color.b}, 0.95)`,
                                    }}>
                                    <div>
                                        <label className='radioLabel'>
                                            <input
                                                type="radio"
                                                name="react-tips"
                                                value={wallet.name}
                                                checked={this.state.selectedOption === wallet.name}
                                                onChange={this.handleOptionChange}
                                                className="form-check-input"
                                            />
                                            {wallet.name}
                                        </label>
                                    </div>
                                </div>
                            )
                        }
                        <div className="form-group d-flex flex-row justify-content-between align-items-center">
                            <div></div><div></div>
                            <button className="btn btn-outline-info" type="submit" disabled={this.state.selectedOption === ""}>
                                Connect
                            </button>
                            <div></div>
                            <button className="btn btn-outline-info" onClick={this.handleCancel} >
                                Cancel
                            </button>
                            <div></div><div></div>
                        </div>
                    </form>
                </div>
            </Fragment>
        )
    }
}