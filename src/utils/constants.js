
export const NANOERG_TO_ERG = 1000000000;
export const SUGGESTED_TRANSACTION_FEE = 1100000;

export const DEFAULT_EXPLORER_API_ADDRESS = "https://api.ergoplatform.com/";
export const DEFAULT_EXPLORER_WEBUI_ADDRESS = "https://explorer.ergoplatform.com/";
export const DEFAULT_NODE_ADDRESS = "http://213.239.193.208:9053/";
export const DEFAULT_MIXER_ADDRESS = "http://localhost:9000/";

export const PASSWORD_SALT = "vtvfAKubpNuc6Vn648TTUjh3KmuC8u";

// address discovery
export const MAX_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT = 3;

// ergo
export const TX_FEE_ERGO_TREE = "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304";

// tokens
export const TOKENID_SIGUSD = '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04';
export const TOKENID_SIGRSV = '003bd19d0187117f130b62e1bcab0939929ff5c7709f843c5c4dd158949285d0';
export const TOKENID_KUSHTI = 'fbbaac7337d051c10fc3da0ccb864f4d32d40027551e1c3ea3ce361f39b91e40';
export const TOKENID_ERDOGE = '36aba4b4a97b65be491cf9f5ca57b5408b0da8d0194f30ec8330d1e8946161c1';
export const TOKENID_ERGOPAD = 'd71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413';
export const TOKENID_LUNADOG = '5a34d53ca483924b9a6aa0c771f11888881b516a8d1a9cdc535d063fe26d065e';
export const TOKENID_NETA = '472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8';

export const VERIFIED_TOKENS = {
    [TOKENID_SIGUSD]: ['SigUSD', "token-sigusd.svg"],
    [TOKENID_SIGRSV]: ['SigRSV', "token-sigrsv.svg"],
    [TOKENID_KUSHTI]: ['kushti', "token-kushti.svg"],
    [TOKENID_ERDOGE]: ['Erdoge', "token-erdoge.svg"],
    [TOKENID_ERGOPAD]: ['ergopad', "token-ergopad.svg"],
    [TOKENID_LUNADOG]: ['LunaDog', "token-lunadog.svg"],
    [TOKENID_NETA]: ['NETA', "token-neta.svg"],
  }
  