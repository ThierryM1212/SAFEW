import React, { Fragment } from 'react';
import ImageButton from './ImageButton';
import { asyncCallWithTimeout, ensureSingleEndSlash, LS } from '../utils/utils';
import { TOKENJAY_PEER_LIST_URL, VERIFIED_NODE_ADDRESSES } from '../utils/constants';
import { get } from '../ergo-related/rest';
import { Table } from 'react-bootstrap';
import ls from 'localstorage-slim';
import { getCurrentHeights, getNodeInfo } from '../ergo-related/node';
import { waitingAlert } from '../utils/Alerts';


export default class ConfigNodeURL extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            localstorageName: props.localstorageName,
            label: props.label,
            defaultURL: props.defaultURL,
            URL: props.defaultURL,
            nodeList: [],
            modifiedNodeURL: false,
        };
        this.setURL = this.setURL.bind(this);
    }

    setURL = (address) => {
        this.setState({
            URL: ensureSingleEndSlash(address),
            modifiedNodeURL: true,
        });
        LS.setItem(this.state.localstorageName, address);
    };

    refreshPage() {
        ls.clear();
        window.location.reload();
    }

    async ping(url) {
        const startTime = new Date();
        const res = await get(url)
        const endTime = new Date();
        return endTime.valueOf() - startTime.valueOf();
    }

    async componentDidMount() {
        const alert = waitingAlert("Checking the state of the nodes...");
        const url = (await LS.getItem(this.state.localstorageName)) ?? this.state.defaultURL;
        this.setState({ URL: ensureSingleEndSlash(url) })
        var nodeList = VERIFIED_NODE_ADDRESSES;
        const fetchedNodeList = await get(TOKENJAY_PEER_LIST_URL);
        //console.log("fetchedNodeList", fetchedNodeList);
        const validNodeList = fetchedNodeList.filter(n => n.openRestApi && n.blockchainApi).map(n => { return { "url": ensureSingleEndSlash(n.url), "name": n.name } });

        //console.log("validNodeList", validNodeList);
        var allNodeList = nodeList.concat(validNodeList.filter(n => !nodeList.map(n2 => n2.url).includes(n.url)));

        // add current configured node
        allNodeList.unshift({
            name: "* Current node",
            url: url,
        });

        allNodeList = allNodeList.map(n => {
            return {
                ...n,
                ping: "...",
                indexedHeight: "...",
                fullHeight: "...",
                version: "...",
            }
        });
        this.setState({ nodeList: allNodeList })

        allNodeList = await Promise.all(allNodeList.map(async n => {
            try {
                var nodeEnriched = {
                    ...n,
                    ping: await asyncCallWithTimeout(this.ping(n.url + "info"), 2000),
                    indexedHeight: '0',
                    fullHeight: '0',
                    version: '0.0',
                }
                const currentHeights = await asyncCallWithTimeout(getCurrentHeights(n.url), 2000);
                if (currentHeights.indexedHeight) {
                    nodeEnriched['indexedHeight'] = currentHeights.indexedHeight;
                    nodeEnriched['fullHeight'] = currentHeights.fullHeight;
                }
                const nodeInfo = await asyncCallWithTimeout(getNodeInfo(n.url), 2000);
                if (nodeInfo.appVersion) {
                    nodeEnriched['version'] = nodeInfo.appVersion;
                }
                return nodeEnriched;
            } catch (e) {
                console.log("ping error", n.url, e);
                return {
                    ...n,
                    ping: "error",
                    indexedHeight: '0',
                    fullHeight: '0',
                    version: '0.0',
                }
            }
        }
        ))
        //
        //console.log("allNodeList", allNodeList);
        this.setState({ nodeList: allNodeList })
        alert.close()
    }

    render() {
        return (
            <Fragment>
                <div>
                    <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                        <label htmlFor={this.state.localstorageName} className='col-sm-3'>{this.state.label}</label>
                        <input type="text"
                            id={this.state.localstorageName}
                            className="form-control  col-sm"
                            onChange={e => this.setURL(e.target.value)}
                            value={this.state.URL}
                        />&nbsp;
                        <ImageButton
                            id={"resetAddresses"}
                            color={"orange"}
                            icon={"restart_alt"}
                            tips={"Reset to default"}
                            onClick={() => { this.setURL(this.state.defaultURL); }}
                        />
                    </div>
                    <div className='card m-2 p-2 d-flex'>
                        <h5>Current and community public nodes</h5>
                        <Table striped hover className='node-list-table'>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>URL</th>
                                    <th>Ping (ms)</th>
                                    <th>Current height</th>
                                    <th>Indexed height</th>
                                    <th>Node version</th>
                                    <th>Set</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.nodeList.map(n =>
                                        <tr key={n.url}>
                                            <td>{n.name}</td>
                                            <td>{n.url}</td>
                                            <td className='align-center'>{n.ping}</td>
                                            <td className='align-center'>{n.fullHeight}</td>
                                            <td className='align-center'>{n.indexedHeight}</td>
                                            <td className='align-center'>{n.version}</td>
                                            <td className='align-center'>
                                                <ImageButton
                                                    id={n.url + "setAddresses"}
                                                    color={"orange"}
                                                    icon={"arrow_forward"}
                                                    tips={"Use node " + n.url}
                                                    onClick={() => this.setURL(n.url)}
                                                />
                                            </td>
                                        </tr>)
                                }
                            </tbody>
                        </Table>
                    </div>
                    {
                        this.state.modifiedNodeURL ?
                            <div className='w-100 d-flex justify-content-center'>
                                <button className='btn btn-outline-info' type="submit" onClick={() => this.refreshPage()}>Reload</button>
                            </div>
                            : null
                    }

                </div>
            </Fragment>
        )
    }
}
