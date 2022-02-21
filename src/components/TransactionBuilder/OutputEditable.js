import React from 'react';
import ReactJson from 'react-json-view';
import ImageButton from '../ImageButton';


export default class OutputEditable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            onEdit: props.onEdit,
            json: props.json,
            delete: props.delete,
            key: props.key,
            id: props.id,
            moveUp: props.moveUp,
            moveDown: props.moveDown,
        };

    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            json: nextProps.json,
        });
    }


    render() {
        return (
            <div className="card m-1 p-1 row" key={this.state.key} id={this.state.id}>
                {this.state.delete ?
                    <div className="d-flex ">
                        <h6>OUTPUTS({this.state.id})</h6>
                        &nbsp;
                        <div className="p-1 d-flex flex-row">
                            <ImageButton id="move-up" color="green" onClick={() => { this.state.moveUp(this.state.id) }} icon="arrow_upward" tips="Move up"/>
                            <ImageButton id="move-down" color="green" onClick={() => { this.state.moveDown(this.state.id) }} icon="arrow_downward" tips="Move down"/>
                            <ImageButton id="delete" color="red" onClick={() => { this.state.delete(this.state.id) }} icon="clear" tips="Delete output box"/>
                        </div>
                    </div>
                    : null
                }
                <ReactJson src={this.state.json}
                    theme="monokai" 
                    collapsed={false} 
                    name={false}
                    collapseStringsAfterLength={25}
                    onEdit={(item) => {
                        this.state.onEdit(this.state.id, item.updated_src);
                        this.setState({ json: item.updated_src });
                    }}
                    onAdd={(item) => {
                        if (item.name === "assets") {
                            const defaultToken = { "tokenId": "", "amount": 0 };
                            this.setState(prevState => ({
                                json: {
                                    ...prevState.json,
                                    assets: [...prevState.json.assets, defaultToken]
                                }
                            }));
                        } else {
                            this.setState({ json: item.updated_src });
                        }
                    }}
                    onDelete={(item) => {
                        console.log("onDelete", item)
                        this.setState({ json: item.updated_src });
                    }}
                />

            </div>
        )
    }
}
