import React, { Fragment } from 'react';
import { getTokenBox } from '../ergo-related/node';
import { decodeString } from '../ergo-related/serializer';
import { displayNFT } from '../utils/Alerts';
import { NTF_TYPES } from '../utils/constants';
import { getKeyByValue } from '../utils/utils';
import ImageButton from './ImageButton';

export default class NFTImage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tokenId: props.tokenId,
            mediaURL: '',
            mediaType: '',
            mediaDesc: '',
            mediaAmount: 0,
            mediaName: '',
            mediaTokenId: '',

        };
    }

    async componentDidMount() {
        var tokenBox = {};
        try {
            tokenBox = await getTokenBox(this.state.tokenId);
            //console.log("tokenBox", tokenBox);
        } catch (e) {
            // console.log(e);
        }
        const ipfsPrefix = 'ipfs://';

        if (Object.keys(tokenBox).includes("additionalRegisters")) {
            if (Object.keys(tokenBox.additionalRegisters).includes("R7")) {
                if (Object.values(NTF_TYPES).includes(tokenBox.additionalRegisters.R7)) {
                    const type = getKeyByValue(NTF_TYPES, tokenBox.additionalRegisters.R7);
                    //console.log("NFTImage componentDidMount", type)
                    if (Object.keys(tokenBox.additionalRegisters).includes("R9")) {
                        var NFTURL = (await decodeString(tokenBox.additionalRegisters.R9)) ?? '';
                        if (NFTURL.startsWith(ipfsPrefix)) {
                            NFTURL = NFTURL.replace(ipfsPrefix, 'https://cloudflare-ipfs.com/ipfs/');
                        }
                        if (NFTURL.startsWith('https://')) {
                            this.setState({ mediaURL: NFTURL, mediaType: type });
                        }
                    }
                    if (Object.keys(tokenBox.additionalRegisters).includes("R5")) {
                        var NFTdesc = (await decodeString(tokenBox.additionalRegisters.R5)) ?? '';
                        this.setState({
                            mediaDesc: NFTdesc,
                            mediaAmount: tokenBox.assets[0].amount,
                            mediaName: tokenBox.assets[0].name,
                            mediaTokenId: tokenBox.assets[0].tokenId
                        });
                    }
                }
            }
        }
    }

    render() {
        return (
            <Fragment>
                {
                    this.state.mediaURL !== '' ?

                        <div onClick={() => {
                            //window.open(this.state.mediaURL, '_blank').focus();
                            displayNFT(this.state.mediaType, this.state.mediaName, this.state.mediaDesc, this.state.mediaURL, this.state.mediaAmount, this.state.mediaTokenId);
                        }} style={{ cursor: 'pointer' }}>
                            {this.state.mediaType === 'Picture' ? <img src={this.state.mediaURL} alt='NFT image' height={50} width={50} /> : null}
                            {this.state.mediaType === 'Video' ? <video src={this.state.mediaURL} alt='NFT video' height={70} width={130} /> : null}
                            {this.state.mediaType === 'Audio' ? 
                            <ImageButton id={"audioNFT" + this.state.mediaTokenId}
                                color={"blue"}
                                icon={"volume_up"}
                                tips={"Details"}
                            /> : null}
                        </div>
                        : null
                }
            </Fragment>
        )
    }
}