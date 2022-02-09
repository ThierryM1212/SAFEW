
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
export const TOKENID_COMET = '0cd8c9f416e5b1ca9f986a7f10a84191dfb85941619e49e53c0dc30ebf83324b';

// [token_name, token_icon, token_decimals]
export const VERIFIED_TOKENS = {
    ['']: ['', "token-unknown.svg", 0],
    [TOKENID_SIGUSD]: ['SigUSD', "token-sigusd.svg", 2],
    [TOKENID_SIGRSV]: ['SigRSV', "token-sigrsv.svg", 0],
    [TOKENID_KUSHTI]: ['kushti', "token-kushti.svg", 0],
    [TOKENID_ERDOGE]: ['Erdoge', "token-erdoge.svg", 0],
    [TOKENID_ERGOPAD]: ['ergopad', "token-ergopad.svg", 2],
    [TOKENID_LUNADOG]: ['LunaDog', "token-lunadog.svg", 8],
    [TOKENID_NETA]: ['NETA', "token-neta.svg", 6],
  }

// wallet version to handle upgrades (integer)
export const WALLET_VERSION = 1;

export const DISCLAIMER_TEXT = `
<div align="left">
This software is distributed for free with its source code.<br/>
https://github.com/ThierryM1212/SAFEW<br/>
<br/>
The security of each wallet is ensured by the encryption of the mnemonic using its spending password (AES-256).<br/>
The clear text mnemonic and the spending password are not stored by the application. <br/>
The privacy of the wallet content is ensured by the browser local storage that cannot be accessed by other sites or extensions.<br/>
Only the connected sites can read the available addresses and their content through the dApp connector.<br/>
<br/>
The current is not audited and tested only be me before release.<br/>
Use at your own riks.
Enjoy Ergo dApps carefully !<br/>
<br/>
<div/>
`


export const sampleTxErgodex = {
  "inputs": [
      {
          "boxId": "6a50a0d91e66263ee1be743a30956af4bc8e3f7b229b27b84ef646311d79bf20",
          "transactionId": "e68d0c75d01d47dde8e558c60a5d02e351b2c2c37297c11f5bc8cf7067ffd756",
          "blockId": "8c092e799071fcc3cbe50fcf362c8139319c43bf53a64e1937a14ffd564ea811",
          "value": "1071024",
          "index": 1,
          "globalIndex": 12802711,
          "creationHeight": 0,
          "settlementHeight": 678848,
          "ergoTree": "0008cd02c35a808c1c713fc1ae169e33da7492eee8f913a2045a7d56a3ca3103b5525ff3",
          "address": "9g16ZMPo22b3qaRL7HezyQt2HSW2ZBF6YR3WW9cYQjgQwYKxxoT",
          "assets": [
              {
                  "tokenId": "003bd19d0187117f130b62e1bcab0939929ff5c7709f843c5c4dd158949285d0",
                  "index": 0,
                  "amount": "131",
                  "name": "SigRSV",
                  "decimals": 0,
                  "type": "EIP-004"
              }
          ],
          "additionalRegisters": {},
          "spentTransactionId": null,
          "mainChain": true,
          "extension": {}
      },
      {
          "boxId": "057e3c0d880e95efb41ad15fb51d43065acc3b9ed3dad264045f6fea064a2d1a",
          "transactionId": "cc7382d10571c52a8ce7b7328931eb285dd52ef7b8f3230e758bd09725532bef",
          "blockId": "03cb799ba12ecd2dd955ae02897b534c8002d1af57b310ac41ade9cf55c7153c",
          "value": "1080002",
          "index": 1,
          "globalIndex": 12803530,
          "creationHeight": 0,
          "settlementHeight": 678868,
          "ergoTree": "0008cd02c35a808c1c713fc1ae169e33da7492eee8f913a2045a7d56a3ca3103b5525ff3",
          "address": "9g16ZMPo22b3qaRL7HezyQt2HSW2ZBF6YR3WW9cYQjgQwYKxxoT",
          "assets": [
              {
                  "tokenId": "472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8",
                  "index": 0,
                  "amount": "13363832",
                  "name": "NETA",
                  "decimals": 6,
                  "type": "EIP-004"
              }
          ],
          "additionalRegisters": {},
          "spentTransactionId": null,
          "mainChain": true,
          "extension": {}
      },
      {
          "boxId": "8ca4242ba64d8b5fb7d4007f9ce1b22e7e20adbc046cf0000d7185d307a01e27",
          "transactionId": "092b65d4488cf95fbf0a0a51d70117875a8509f08d8b1fbd0a97b471e99c2f09",
          "blockId": "4b89667a7c9c007462689bf0b0167b2fd9a443bd039e39314e82508dc4b86ade",
          "value": "2000000000",
          "index": 0,
          "globalIndex": 12803561,
          "creationHeight": 678847,
          "settlementHeight": 678869,
          "ergoTree": "0008cd02c35a808c1c713fc1ae169e33da7492eee8f913a2045a7d56a3ca3103b5525ff3",
          "address": "9g16ZMPo22b3qaRL7HezyQt2HSW2ZBF6YR3WW9cYQjgQwYKxxoT",
          "assets": [],
          "additionalRegisters": {},
          "spentTransactionId": null,
          "mainChain": true,
          "extension": {}
      }
  ],
  "dataInputs": [],
  "outputs": [
      {
          "value": "107260000",
          "ergoTree": "19f5031808cd03cf7be6fda7f58713fe0e1d60c8fbade1e38d727c0734b656d83477311724790f0400058084af5f040404060402040004000e209916d75132593c8b07fe18bd8d583bda1652eed7565cf41a4738ddd90fc992ec0e2003faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04054605ecb6fbe6ced5f33c0580a0b787e905040404c60f06010104d00f058084af5f04c60f0e691005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a5730405000500058092f4010100d803d6017300d602b2a4730100d6037302eb027201d195ed93b1a4730393b1db630872027304d804d604db63087202d605b2a5730500d606b2db63087205730600d6077e8c72060206edededededed938cb2720473070001730893c27205d07201938c72060173099272077e730a06927ec172050699997ec1a7069d9c72077e730b067e730c067e720306909c9c7e8cb27204730d0002067e7203067e730e069c9a7207730f9a9c7ec17202067e7310067e9c73117e7312050690b0ada5d90108639593c272087313c1720873147315d90108599a8c7208018c72080273167317",
          "creationHeight": 679611,
          "assets": [],
          "additionalRegisters": {}
      },
      {
          "value": "1892891026",
          "ergoTree": "0008cd03cf7be6fda7f58713fe0e1d60c8fbade1e38d727c0734b656d83477311724790f",
          "creationHeight": 679611,
          "assets": [
              {
                  "tokenId": "003bd19d0187117f130b62e1bcab0939929ff5c7709f843c5c4dd158949285d0",
                  "amount": "131"
              },
              {
                  "tokenId": "472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8",
                  "amount": "13363832"
              }
          ],
          "additionalRegisters": {}
      },
      {
          "value": "2000000",
          "ergoTree": "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
          "creationHeight": 679611,
          "assets": [],
          "additionalRegisters": {}
      }
  ]
};
