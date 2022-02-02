import React, { Fragment } from 'react';
import Wallet from './Wallet';

export default function WalletListItem(props) {
    return (
        <Fragment>
            <div className='card p-1 m-1'>
                <Wallet wallet={props.wallet}
                    id={props.id}
                    addressList={props.walletAddressList}
                    addressContentList={props.walletAddressContent}
                    updateWalletList={props.updateWalletList}
                />
            </div>
        </Fragment>
    )

}