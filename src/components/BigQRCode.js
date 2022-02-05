import React, { Fragment } from 'react';
import QRCode from 'qrcode';

export default class BigQRCode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            QRCodeTx: props.QRCodeTx,
            size: "128",
        };
        this.zoomInOut = this.zoomInOut.bind(this);
    }

    async generateQR(text) {
        try {
          return await QRCode.toDataURL(text);
        } catch (err) {
          console.error("generateQR",err)
        }
      }

    async componentDidMount() {
        const QRCodeTx = await this.generateQR(this.state.QRCodeTx)        
        this.setState({
            QRCodeTx: QRCodeTx,
        })
    }

    zoomInOut = () => {
        var newSize = "128";
        if (this.state.size === "128") {
            newSize = "256";
        }
        if (this.state.size === "256") {
            newSize = "512";
        }
        if (this.state.size === "512") {
            newSize = "128";
        }
        this.setState({
            size: newSize,
        })
    }

    render() {
        return (
            <Fragment>
                <img src={this.state.QRCodeTx} width={this.state.size} height={this.state.size} onClick={this.zoomInOut}/>
            </Fragment>
        )
    }
}