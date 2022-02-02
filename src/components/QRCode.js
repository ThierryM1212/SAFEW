import React from 'react';
import QRCode from 'qrcode.react';

export default class QR extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value,
            key: props.key,
            size: props.size,
            iniSize: props.size,
        };
        this.zoomInOut = this.zoomInOut.bind(this);
    }

    zoomInOut() {
        if (this.state.size === this.state.iniSize) {
            this.setState({size: 2 * this.state.iniSize});
        } else {
            this.setState({size: this.state.iniSize});
        }
    }

    render() {
        return (
            <div className="m-1 p-1 ">
            {
               this.state.value !== '' ? 
               <QRCode value={this.state.value} 
               size={this.state.size} 
               includeMargin={true} onClick={this.zoomInOut}/> : null
            }
        </div>
        )
    }
}

