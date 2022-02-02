import React, { Fragment } from 'react';
import ImageButton from './ImageButton';


export default class ConfigURL extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            localstorageName: props.localstorageName,
            label: props.label,
            defaultURL: props.defaultURL,
            URL: localStorage.getItem(props.localstorageName),
        };
        this.setURL = this.setURL.bind(this);
    }

    setURL = (address) => {
        this.setState({
            URL: address
        });
        localStorage.setItem(this.state.localstorageName, address);
    };
    
    componentDidMount = () => {
        if (this.state.URL === '') {
            this.setURL(this.state.defaultURL);
        }
    }

    render() {
        return (
            <Fragment>
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
                            onClick={() => {this.setURL(this.state.defaultURL);}} 
                            />
                    </div>
            </Fragment>
        )
    }
}
