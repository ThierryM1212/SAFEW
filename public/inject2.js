class SafewErgoApi {
    connect() {
        return new Promise(function (resolve, reject) {
            window.dispatchEvent(
                new CustomEvent('safew_injected_script_message', {
                    detail: {
                        type: "connect",
                        url: window.location.origin,
                    }
                }));
            connectRequests.push({ resolve: resolve, reject: reject });
        });
    }

    isConnected() {   
        return Promise.resolve(true);
    }

    getContext() {
        if (ergo) {
            return Promise.resolve(ergo);
        }
        return Promise.reject();
    }

    get_balance(token_id = 'ERG') {
        return this._ergo_rpc_call("get_balance", [token_id]);
    }

    get_utxos(amount = undefined, token_id = 'ERG', paginate = undefined) {
        return this._ergo_rpc_call("get_utxos", [amount, token_id, paginate]);
    }

    get_used_addresses(paginate = undefined) {
        return this._ergo_rpc_call("get_used_addresses", [paginate]);
    }

    get_unused_addresses() {
        return this._ergo_rpc_call("get_unused_addresses", []);
    }

    get_change_address() {
        return this._ergo_rpc_call("get_change_address", []);
    }

    sign_tx(tx) {
        return this._ergo_rpc_call("sign_tx", [tx]);
    }

    sign_tx_input(tx, index) {
        return this._ergo_rpc_call("sign_tx_input", [tx, index]);
    }

    submit_tx(tx) {
        return this._ergo_rpc_call("submit_tx", [tx]);
    }

    _ergo_rpc_call(func, params) {
        //console.log("_ergo_rpc_call", func, params);
        return new Promise(function (resolve, reject) {
            window.dispatchEvent(
                new CustomEvent('safew_injected_script_message', {
                    detail: {
                        type: "ergo_api",
                        func: func,
                        data: params,
                        requestId: requestId,
                        url: window.location.origin,
                    }
                }));
            responseHandlers.set(requestId, { resolve: resolve, reject: reject });
            requestId++;
        });
    }
}

const ergo = Object.freeze(new SafewErgoApi());
console.log("[SAFEW] SafewErgoApi injected");

