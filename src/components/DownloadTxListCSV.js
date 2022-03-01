import React from 'react';
import { CSVLink } from "react-csv";
import { getUtxoBalanceForAddressList } from '../ergo-related/utxos';
import { waitingAlert } from '../utils/Alerts';
import { formatERGAmount, formatTokenAmount, getTransactionsForAddressList, getWalletAddressList, getWalletById } from "../utils/walletUtils";
import ImageButton from './ImageButton';

export default class DownloadTxListCSV extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletId: props.walletId,
            numberOfTransactions: props.numberOfTransactions,
            data: [],
            headers: [
                { label: "transactionId", key: "transactionId" },
                { label: "Date", key: "date" },
                { label: "Asset Name", key: "assetName" },
                { label: "Balance", key: "balance" },
                { label: "tokenId", key: "tokenId" },
            ],
            loading: false,
        };
        this.getData = this.getData.bind(this);
        this.csvLinkEl = React.createRef();
    }

    downloadReport = async () => {
        const data = await this.getData();
        this.setState({ data: data }, () => {
            setTimeout(() => {
                this.csvLinkEl.current.link.click();
                this.setState({ data: [], loading: false });
            });
        });

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

    getData = async () => {
        if (!this.state.loading) {
            this.setState({
                loading: true
            });
            try {
                const alert = waitingAlert("Loading transactions...");
                const wallet = getWalletById(this.state.walletId);
                const walletAddressList = getWalletAddressList(wallet);
                const allTxList = (await getTransactionsForAddressList(walletAddressList, this.state.numberOfTransactions + 10))
                    .map(res => res.transactions)
                    .flat()
                    .sort(function (a, b) {
                        return a.numConfirmations - b.numConfirmations;
                    });
                const transactionBalances = await Promise.all(allTxList.map(async (transaction) => {
                    const balance = await getUtxoBalanceForAddressList(transaction.inputs, transaction.outputs, walletAddressList);
                    return balance;
                }));
                alert.close();
                console.log("exportCSVTransactionList", allTxList, transactionBalances);
                var csvList = [];
                for (const i in allTxList) {
                    const tx = allTxList[i];
                    const bal = transactionBalances[i];
                    var line = {};
                    var txDate = new Intl.DateTimeFormat();
                    if ("timestamp" in tx) {
                        txDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(tx.timestamp));
                    } else {
                        txDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(tx.creationTimestamp));
                    }
                    line["transactionId"] = tx.id;
                    line["date"] = txDate;
                    line["assetName"] = "ERG";
                    line["balance"] = formatERGAmount(bal.value);
                    line["tokenId"] = "";
                    csvList.push(line);
                    for (const tok of bal.tokens) {
                        line = {};
                        line["transactionId"] = tx.id;
                        line["date"] = txDate;
                        line["assetName"] = tok.name;
                        line["balance"] = formatTokenAmount(tok.amount, tok.decimals);
                        line["tokenId"] = tok.tokenId;
                        csvList.push(line);
                    }
                }
                return csvList;
            } catch (e) {
                console.log(e);
                return [];
            }
        }
    }

    render() {
        const csvDelimiter = this.getListSeparator();
        const wallet = getWalletById(this.state.walletId);
        return (
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
                    filename={"export_transactions_" + wallet.name + ".csv"}
                    data={this.state.data}
                    ref={this.csvLinkEl}
                    enclosingCharacter={`"`}
                    separator={csvDelimiter}
                />
            </div>
        );
    }

}