var connectRequests = [], ergopayRequests = [], responseHandlers = new Map, requestId = 0;


class ErgoAPIini {
    connect() {
        return new Promise((function (e, t) {
            window.dispatchEvent(new CustomEvent("safew_injected_script_message", { detail: { type: "connect", url: window.location.origin } })), connectRequests.push({ resolve: e, reject: t })
        }))
    }
    isConnected() { try { ergoApiInjected } catch (e) { return false } }
    getContext() { return ergo ? Promise.resolve(ergo) : Promise.reject() }
}
if (void 0 !== ergoConnector)
    ergoConnector = {
        ...ergoConnector,
        safew: Object.freeze(new ErgoAPIini),
        nautilus: Object.freeze(new ErgoAPIini)
    };
else var ergoConnector = {
    safew: Object.freeze(new ErgoAPIini),
    nautilus: Object.freeze(new ErgoAPIini)
};
window.ergo_request_read_access = function () {
    return console.warn("deprecated auth method, use ergoConnector.safew.connect()"), ergoConnector.safew.connect()
},
    window.ergo_check_read_access = function () {
        return console.warn("deprecated auth method, use ergoConnector.safew.isConnected()"), ergoConnector.safew.isConnected()
    },
    window.ergopay_get_request = function (e) {
        return new Promise((function (t, n) {
            window.dispatchEvent(new CustomEvent("safew_injected_script_message", {
                detail: { type: "ergopay_request", url: window.location.origin, data: e }
            })),
                ergopayRequests.push({ resolve: t, reject: n })
        }))
    },
    window.addEventListener("safew_contentscript_message", (function (e) {
        if (console.log("injected script listener ", e), e.type && "safew_contentscript_message" == e.type) {
            if (e.detail && e.detail.type && "connect_response" === e.detail.type &&
                (void 0 !== e.detail.err ? connectRequests.forEach(
                    (t => t.reject(e.detail.err))) : (connectRequests.forEach((t => t.resolve(e.detail.result))),
                        connectRequests = [], isConnected = !0)), e.detail && e.detail.type && "ergo_api_response" === e.detail.type) {
                console.log("ergo_api", e.detail, responseHandlers); const t = responseHandlers.get(e.detail.requestId);
                responseHandlers.delete(e.detail.requestId), e.detail.result ? t.resolve(e.detail.data) : t.reject(e.detail.data)
            }
            return !0
        }
    }));