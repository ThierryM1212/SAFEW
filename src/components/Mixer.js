import React, { Fragment } from 'react';
import { isMixerAvailable } from '../ergo-related/mixer';

export default class Mixer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            mixerAvailable: false,
            mixerAddress: localStorage.getItem('mixerAddress')
        };
        //this.updateWalletName = this.updateWalletName.bind(this);

    }

    async componentDidMount() {
        const mixerAvailable = await isMixerAvailable();
        this.setState({
            mixerAvailable: mixerAvailable,
        })
    }

    render() {

        return (
            <Fragment >
                <h4>Ergo mixer</h4>
                {
                    this.state.mixerAvailable ?
                        <div>
                            <div>Ergo mixer available at: {this.state.mixerAddress}</div>
                        </div>
                        : <div>
                            <br/>
                            <div>Ergo mixer not found at: {this.state.mixerAddress}</div>
                            <div>
                                It can be downloaded at:&nbsp;
                                <a href='https://github.com/ergoMixer/ergoMixBack/releases' target='_blank'>
                                    https://github.com/ergoMixer/ergoMixBack/releases
                                </a>
                            </div>
                            <div>You need to run it on your computer to be able to use it from SAFEW.</div>
                        </div>
                }
            </Fragment >
        )
    }
}            