import React, { Fragment, useState } from 'react';
import ImageButton from './ImageButton';
import AddressListContent from './AddressListContent';
import { copySuccess } from '../utils/Alerts';
import QR from './QRCode';
import { setAddressUsed } from '../utils/walletUtils';

export default function Address(props) {
    const [QRcode, toggleQR] = useState(0);

    var address = props.addressContent.address;
    const hideUsedEmptyAddress = (localStorage.getItem('hideUsedEmptyAddress') === 'true') ?? true;

    if (!props.used && (props.addressContent.content.nanoErgs > 0 || props.addressContent.unconfirmed.nanoErgs > 0)) {
        setAddressUsed(address);
    }

    console.log("Address props", props);
    return (
        <Fragment>
            {
                props.used && hideUsedEmptyAddress && props.addressContent.content.nanoErgs === 0 ? null
                    :
                    <div key={address} className='d-flex flex-column card m-1 p-1' style={{ borderColor: props.color }}>
                        <div className='d-flex flex-row align-items-center justify-content-start'>
                            <h6 className='address'>{address}</h6>&nbsp;
                            <ImageButton
                                id={"copyAddress" + address}
                                color={"blue"}
                                icon={"content_copy"}
                                tips={"Copy to clipboard"}
                                onClick={() => {
                                    navigator.clipboard.writeText(address);
                                    copySuccess();
                                }}
                            />
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
                                id={"qrCode" + address}
                                color={"blue"}
                                icon={"qr_code"}
                                tips={"Show/hide QR code"}
                                onClick={() => toggleQR(!QRcode)}
                            />
                        </div>
                        <div className='d-flex flex-row align-items-center justify-content-between'>
                            <div></div>
                            <div className='d-flex flex-row align-items-center justify-content-center'>
                                {
                                    QRcode ?
                                        <div className='d-flex flex-row '>
                                            <QR value={address}
                                                key={address}
                                                size={128}
                                            />
                                        </div>
                                        : <div></div>
                                }
                            </div>
                            {
                                props.used ? <AddressListContent addressContentList={[props.addressContent]} />
                                    : <div>Unused</div>
                            }

                        </div>
                    </div>
            }

        </Fragment>
    )
}
