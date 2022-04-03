import React from 'react';
import { TOKENID_COMET, TOKENID_ERDOGE, TOKENID_ERGOPAD, TOKENID_KUSHTI, TOKENID_LUNADOG, TOKENID_MI_GOREN, TOKENID_MI_GORENG, TOKENID_NETA, TOKENID_SIGRSV, TOKENID_SIGUSD, TOKEN_ERGOLD } from '../utils/constants';

import sigusdLogo from '../resources/tokens/token-sigusd.svg';
import sigrsvLogo from '../resources/tokens/token-sigrsv.svg';
import kushtiLogo from '../resources/tokens/token-kushti.svg';
import erdogeLogo from '../resources/tokens/token-erdoge.svg';
import ergopadLogo from '../resources/tokens/token-ergopad.svg';
import lunadogLogo from '../resources/tokens/token-lunadog.svg';
import netaLogo from '../resources/tokens/token-neta.svg';
import miGorengLogo from '../resources/tokens/token-mi-goreng.svg';
import cometLogo from '../resources/tokens/token-comet.svg';
import unknown from '../resources/tokens/token-unknown.png';
import ergoldLogo from '../resources/tokens/token-ergold.svg';


export default class VerifiedTokenImage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tokenId: props.tokenId,
        };
        //this.zoomInOut = this.zoomInOut.bind(this);
    }

    renderSwitch = (tokenId) => {
        //console.log("VerifiedTokenImage", tokenId)
        switch (tokenId) {
            case TOKENID_SIGUSD:
                return sigusdLogo;
            case TOKENID_SIGRSV:
                return sigrsvLogo;
            case TOKENID_KUSHTI:
                return kushtiLogo;
            case TOKENID_ERDOGE:
                return erdogeLogo;
            case TOKENID_ERGOPAD:
                return ergopadLogo;
            case TOKENID_LUNADOG:
                return lunadogLogo;
            case TOKENID_NETA:
                return netaLogo;
            case TOKENID_MI_GORENG:
                return miGorengLogo;
            case TOKENID_COMET:
                return cometLogo;
            case TOKENID_ERGOLD:
                return ergoldLogo;
            default:
                return unknown;
        }
    }

    render() {
        return (
            <img src={this.renderSwitch(this.state.tokenId)} alt={this.state.tokenId} />
        )
    }
}

