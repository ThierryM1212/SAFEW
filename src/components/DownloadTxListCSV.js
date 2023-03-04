import React, { Fragment } from 'react';
import { CSVLink } from "react-csv";
import { getTransactionsForAddress } from '../ergo-related/node';
import { getUtxoBalanceForAddressList } from '../ergo-related/utxos';
import { errorAlert, promptNumTx, waitingAlert } from '../utils/Alerts';
import { NANOERG_TO_ERG } from '../utils/constants';
import { ISODateFromTimestamp, split } from '../utils/utils';
import { formatTokenAmount, getTransactionsForAddressList, getWalletAddressList, getWalletById } from "../utils/walletUtils";
import ImageButton from './ImageButton';

export default class DownloadTxListCSV extends React.Component {
    constructor(props) {
        console.log("DownloadTxListCSV constructor")
        super(props);
        this.state = {
            walletId: props.walletId,
            address: props.address,
            numberOfTransactions: props.numberOfTransactions,
            data: [],
            headers: [
                { label: "Date", key: "date" },
                { label: "Asset Name", key: "assetName" },
                { label: "Balance", key: "balance" },
                { label: "Fee amount", key: "feeAmount" },
                { label: "Fee currency", key: "feeCurrency" },
                { label: "tokenId", key: "tokenId" },
                { label: "transactionId", key: "transactionId" },
            ],
            loading: false,
            wallet: undefined,
        };
        this.getData = this.getData.bind(this);
        this.csvLinkEl = React.createRef();
    }

    downloadReport = async () => {
        const numberOfTx = await promptNumTx();
        if (numberOfTx) {
            const data = await this.getData(numberOfTx);
            this.setState({ data: data }, () => {
                setTimeout(() => {
                    this.csvLinkEl.current.link.click();
                    this.setState({ data: [], loading: false });
                });
            });
        }
    }

    async componentDidMount() {
        console.log("DownloadTxListCSV componentDidMount")
        const wallet = await getWalletById(this.state.walletId);
        this.setState({ wallet: wallet })
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.numberOfTransactions !== this.props.numberOfTransactions) {
            this.setState({
                numberOfTransactions: this.props.numberOfTransactions,
            });
        }
        if (prevProps.address !== this.props.address) {
            this.setState({
                address: this.props.address,
            });
        }
    }

    getListSeparator() {
        var list = ['a', 'b'], str;
        if (list.toLocaleString) {
            str = list.toLocaleString();
            if (str.indexOf(';') > 0 && str.indexOf(',') == -1) {
                return ';';
            }
        }
        return ',';
    }

    getData = async (numberOfTx) => {
        if (!this.state.loading) {
            this.setState({
                loading: true
            });
            try {
                const alert = waitingAlert("Loading transactions...");
                const wallet = await getWalletById(this.state.walletId);
                const walletAddressList = getWalletAddressList(wallet);
                var allTxList = [], allTxList2 = [];
                if (this.state.address === 'All') {
                    allTxList2 = (await getTransactionsForAddressList(walletAddressList, numberOfTx))
                    .map(res => res.transactions)
                    .flat()
                    .filter((t, index, self) => {
                        return self.findIndex(tx => tx.id === t.id) === index;
                    })
                    .sort(function (a, b) {
                        return a.numConfirmations - b.numConfirmations;
                    })
                    .slice(0, numberOfTx);
                } else {
                    allTxList = (await getTransactionsForAddress(this.state.address, numberOfTx));
                    allTxList2 = allTxList.items
                        .filter((t, index, self) => {
                            return self.findIndex(tx => tx.id === t.id) === index;
                        })
                        .sort(function (a, b) {
                            return a.numConfirmations - b.numConfirmations;
                        });
                    console.log("exportCSVTransactionList0", allTxList2);
                }
                
                const transactionBalances = await Promise.all(allTxList2.map(async (transaction) => {
                    if (!(transaction && transaction.inputs && transaction.outputs)) {
                        throw "Fail to get transactions for " + this.state.address;
                    }
                    const balance = await getUtxoBalanceForAddressList(transaction.inputs, transaction.outputs, walletAddressList);
                    return balance;
                }));
                alert.close();
                console.log("exportCSVTransactionList", allTxList2, transactionBalances);
                var csvList = [];
                for (const i in allTxList2) {
                    const tx = allTxList2[i];
                    const bal = transactionBalances[i];
                    var line = {};
                    var txDate = new Intl.DateTimeFormat();
                    if ("timestamp" in tx) {
                        console.log("timestamp", tx.timestamp);
                        txDate = ISODateFromTimestamp(tx.timestamp);
                    } else {
                        txDate = ISODateFromTimestamp(tx.creationTimestamp);
                    }
                    line["date"] = txDate;
                    line["assetName"] = "ERG";
                    line["balance"] = parseFloat(parseInt(bal.value) / NANOERG_TO_ERG).toString();
                    line["feeAmount"] = parseFloat(parseInt(bal.fee) / NANOERG_TO_ERG).toString();
                    line["feeCurrency"] = "ERG";
                    line["tokenId"] = "";
                    line["transactionId"] = tx.id;
                    csvList.push(line);
                    for (const tok of bal.tokens) {
                        line = {};
                        line["date"] = txDate;
                        line["assetName"] = tok.name;
                        line["balance"] = formatTokenAmount(tok.amount, tok.decimals).replaceAll(',','');
                        line["feeAmount"] = "";
                        line["feeCurrency"] = "";
                        line["tokenId"] = tok.tokenId;
                        line["transactionId"] = tx.id;
                        csvList.push(line);
                    }
                }
                return csvList;
            } catch (e) {
                errorAlert("Failed to export transactions", e.toString());
                return [];
            }
        }
    }

    render() {
        const csvDelimiter = this.getListSeparator();
        var fileLabel = this.state.address;
        if (fileLabel === "All" && this.state.wallet) {
            fileLabel = this.state.wallet.name;
        }
        return (
            <Fragment>
                {
                    this.state.address ?
                        <div>
                            <ImageButton
                                id={"exportCSVTransactionList"}
                                color={"blue"}
                                icon={"file_upload"}
                                tips={"Export transaction list as CSV"}
                                onClick={this.downloadReport}
                            />
                            <CSVLink
                                headers={this.state.headers}
                                filename={"export_transactions_" + fileLabel + "_" + ISODateFromTimestamp(Date.now()).replaceAll(' ','_') +".csv"}
                                data={this.state.data}
                                ref={this.csvLinkEl}
                                enclosingCharacter={`"`}
                                separator={csvDelimiter}
                            />
                        </div>
                        : null
                }
            </Fragment>
        );
    }

}