var connectRequests = [];
var ergopayRequests = [];
var responseHandlers = new Map();
var requestId = 0;

// EIP-12 initial inject
class ErgoAPIini {
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

    disconnect() {
        if (ergo) {
            return new Promise(function (resolve, reject) {
                window.dispatchEvent(
                    new CustomEvent('safew_injected_script_message', {
                        detail: {
                            type: "disconnect",
                            url: window.location.origin,
                        }
                    }));
                connectRequests.push({ resolve: resolve, reject: reject });
            });
        } else {
            return Promise.reject();
        }
    }

    isConnected() {
        if (typeof ergo !== "undefined") {
            try {
                return (typeof ergo.get_balance !== "undefined");
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    }

    getContext() {
        if (ergo) {
            return Promise.resolve(ergo);
        }
        return Promise.reject();
    }
}
if (ergoConnector !== undefined) {
    ergoConnector = {
        ...ergoConnector,
        safew: Object.freeze(new ErgoAPIini())
    };
} else {
    var ergoConnector = {
        safew: Object.freeze(new ErgoAPIini()),
        nautilus: Object.freeze(new ErgoAPIini())
    };
}

// for compatibility with existing dApp
window.ergo_request_read_access = function () {
    console.warn("deprecated auth method, use ergoConnector.safew.connect()")
    return ergoConnector.safew.connect();
}

window.ergo_check_read_access = function () {
    console.warn("deprecated auth method, use ergoConnector.safew.isConnected()")
    return ergoConnector.safew.isConnected();
}

window.ergopay_get_request = function (url) {
    return new Promise(function (resolve, reject) {
        window.dispatchEvent(
            new CustomEvent('safew_injected_script_message', {
                detail: {
                    type: "ergopay_request",
                    url: window.location.origin,
                    data: url,
                }
            }));
        ergopayRequests.push({ resolve: resolve, reject: reject });
    });
}

window.addEventListener("safew_contentscript_message", function (event) {
    //console.log("injected script listener ", event);
    if (event.type && event.type == "safew_contentscript_message") {
        if (event.detail && event.detail.type
            && (event.detail.type === "connect_response" || event.detail.type === "disconnect_response")) {
            if (event.detail.err !== undefined) {
                connectRequests.forEach(promise => promise.reject(event.detail.err));
            } else {
                connectRequests.forEach(promise => promise.resolve(event.detail.result));
                connectRequests = [];
                if(event.detail.type === "disconnect_response" && ergo) {
                    ergo = undefined;
                }
            }
        }
        if (event.detail && event.detail.type && event.detail.type === "ergo_api_response") {
            //console.log("ergo_api", event.detail, responseHandlers)
            const responseHandler = responseHandlers.get(event.detail.requestId);
            responseHandlers.delete(event.detail.requestId);
            if (event.detail.result) {
                responseHandler.resolve(event.detail.data);
            } else {
                responseHandler.reject(event.detail.data);
            }
        }
        return true;
    }
});

console.log("[SAFEW] ErgoAPIini injected");