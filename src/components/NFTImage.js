import React, { Fragment } from 'react';
import { getTokenBox } from '../ergo-related/explorer';
import { decodeString } from '../ergo-related/serializer';

export default class NFTImage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tokenId: props.tokenId,
            imageURL: '',
        };
        //this.setRingAmount = this.setRingAmount.bind(this);
    }

    async componentDidMount() {
        var tokenBox = {};
        try {
            tokenBox = await getTokenBox(this.state.tokenId);
        } catch(e){
            // console.log(e);
        }
        
        if (Object.keys(tokenBox).includes("additionalRegisters")) {
            if (Object.keys(tokenBox.additionalRegisters).includes("R7")) {
                if (tokenBox.additionalRegisters.R7 === "0e020101") { // NFT Image
                    if (Object.keys(tokenBox.additionalRegisters).includes("R9")) {
                        console.log("NFTImage componentDidMount", tokenBox);
                        console.log("NFTImage R9", await decodeString(tokenBox.additionalRegisters.R9))
                        var NFTImageURL = (await decodeString(tokenBox.additionalRegisters.R9)) ?? '';
                        const ipfsPrefix = 'ipfs://';
                        if (NFTImageURL.startsWith(ipfsPrefix)) {
                            NFTImageURL = NFTImageURL.replace(ipfsPrefix, 'https://cloudflare-ipfs.com/ipfs/');
                        }
                        if (NFTImageURL.startsWith('https://')) {
                            this.setState({ imageURL: NFTImageURL });
                        }
                    }
                }
            }
        }
    }

    render() {
        return (
            <Fragment>
                {
                    this.state.imageURL !== '' ?
                        <div onClick={() => {
                            window.open(this.state.imageURL, '_blank').focus();
                        }} style={{cursor: 'pointer'}}>
                            <img src={this.state.imageURL} alt='NFT image' height={50} width={50} />
                        </div>
                        : null
                }
            </Fragment>
        )
    }
}