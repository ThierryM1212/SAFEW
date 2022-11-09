import React, { Fragment } from 'react';
import QRCode from 'qrcode';
import ReactTooltip from 'react-tooltip';
import { errorAlert } from '../utils/Alerts';

export default class BigQRCode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            QRCodeTx: props.QRCodeTx,
            size: "256",
        };
        this.zoomInOut = this.zoomInOut.bind(this);
    }

    async componentDidMount() {
        try{
            const opts = {
                errorCorrectionLevel: 'H',
                margin: 2,
              }
            const QRCodeTx = await QRCode.toDataURL(this.state.QRCodeTx, opts)
            this.setState({
                QRCodeTx: QRCodeTx,
            })
        } catch(e) {
            console.error(e);
            errorAlert("Failed to generate QR code", e);
        }
        
    }

    zoomInOut = () => {
        var newSize = "256";
        if (this.state.size === "256") {
            newSize = "512";
        }
        if (this.state.size === "512") {
            newSize = "1024";
        }
        if (this.state.size === "1024") {
            newSize = "256";
        }
        this.setState({
            size: newSize,
        })
    }

    render() {
        return (
            <Fragment>
                <div className="m-1 d-flex flex-column">
                    <span
                        className='m-1 d-flex justify-content-center'
                        onClick={this.zoomInOut}
                        data-tip
                        data-for="BigQRCode"
                        style={{ cursor: 'pointer' }}
                    >
                        <img src={this.state.QRCodeTx}
                            width={this.state.size}
                            height={this.state.size}
                            alt="Ergopay reduced transaction"
                        />
                    </span>
                    <ReactTooltip id="BigQRCode" html={true} delayShow={400}>
                        Click to zoom
                    </ReactTooltip>
                    <div className="m-1 d-flex justify-content-center">
                        <a className=' btn btn-outline-info' href={this.props.QRCodeTx} target='_blank' rel='noreferrer' >Open wallet app</a>
                    </div>
                </div>
            </Fragment >
        )
    }
}
