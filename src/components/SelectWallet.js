import React, { Fragment } from 'react';
import Select from 'react-select';

export default function SelectWallet(props) {


    const customStyles = (wallet) => {
        return {
            control: (base, state) => ({
                ...base,
                borderColor: `rgba(${wallet.color.r},${wallet.color.g},${wallet.color.b}, 1)`,
                borderWidth: "4px",
                boxShadow: state.isFocused ? null : null,
                "&:hover": {
                    borderColor: `rgba(${wallet.color.r},${wallet.color.g},${wallet.color.b}, 1)`,
                }
            }),
        }
    };

    const walletList = JSON.parse(localStorage.getItem('walletList')) ?? [];
    const optionWalletList = walletList.map((wallet, id) => ({ value: id, label: wallet.name }));
    const selectedWallet = walletList[props.selectedWalletId];

    return (
        <Fragment>
            <div>
                {
                    selectedWallet ?
                        <div className='d-flex flex-row '>
                            <Select className='selectReact'
                                value={{
                                    value: props.selectedWalletId,
                                    label: selectedWallet.name
                                }}
                                onChange={(wallet) => props.setWallet(wallet.value)}
                                options={optionWalletList}
                                isSearchable={false}
                                isMulti={false}
                                styles={customStyles(selectedWallet)}
                            />
                        </div>
                        : null
                }
            </div>
        </Fragment>
    )

}