import React, { Fragment } from 'react';
import { getActiveMixes, isMixerAvailable } from '../ergo-related/mixer';
import { DEFAULT_MIXER_ADDRESS } from '../utils/constants';

export default class Mixer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            mixerAvailable: false,
            mixerAddress: localStorage.getItem('mixerAddress') ?? DEFAULT_MIXER_ADDRESS,
            availableMixes: [],
        };
        //this.updateWalletName = this.updateWalletName.bind(this);

    }

    async componentDidMount() {
        const mixerAvailable = await isMixerAvailable();
        const availableMixes = await getActiveMixes();
        this.setState({
            mixerAvailable: mixerAvailable,
            availableMixes: availableMixes,
        })
    }

    render() {
        console.log("Mixer render", this.state)

        return (
            <Fragment >
                <div className='container card w-75 m-2 p-2 '>
                    <h4>Ergo mixer</h4>
                    {
                        this.state.mixerAvailable ?
                            <div className='d-flex flex-column'>
                                <div>Ergo mixer available at: <a href={this.state.mixerAddress} target='_blank'>
                                    {this.state.mixerAddress}</a>
                                </div>
                                <div className='d-flex flex-column'>
                                    {
                                        this.state.availableMixes.map(availableMix =>
                                            <div key={availableMix.id} className='d-flex flex-row'>
                                                {availableMix.amount}
                                                {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' })
                                                    .format(new Date(availableMix.createdDate))}
                                            </div>
                                        )
                                    }

                                </div>
                            </div>
                            :
                            <div className='d-flex flex-column'>
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
                </div>
            </Fragment >
        )
    }
}            