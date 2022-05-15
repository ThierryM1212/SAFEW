import React, { Fragment, useState, useEffect } from 'react';
import Select from 'react-select';

export default function SelectWallet(props) {
    const [walletList, setWalletList] = useState([]);
    useEffect(() => {
        chrome.storage.local.get("walletList", (result) => {
            setWalletList(result.walletList);
        });
    }, []);

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
    //console.log("SelectWallet walletList",walletList)
    const optionWalletList = walletList.map((wallet, id) => ({ value: id, label: wallet.name }));
    var selectedWallet = undefined;
    if (walletList.length>0) {
        selectedWallet = walletList[props.selectedWalletId]
    }
    
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