function injectScript(script) {
    console.log("SAFEW injectScript");
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('async', 'false');
    scriptTag.textContent = script;
    container.insertBefore(scriptTag, container.children[0]);
    container.removeChild(scriptTag);
}

const ergoInitialAPIFunctions = `
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
      if (typeof ergo !== "undefined") {
          try {
              return (typeof ergo.get_balance !== "undefined");
          } catch(e) {
              return false;
          }
      } else {
          return false;
      }
  }
`;

const injected_script_1 = `
  var connectRequests = [];
  var responseHandlers = new Map();
  var requestId = 0;

  // EIP-12 initial inject
  class ErgoAPIini {
    ${ergoInitialAPIFunctions}
  }
  if (ergoConnector !== undefined) {
    ergoConnector = {
      ...ergoConnector,
      safew: Object.freeze(new ErgoAPIini()),
      nautilus: Object.freeze(new ErgoAPIini())
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
  
  window.addEventListener("safew_contentscript_message", function (event) {
      console.log("injected script listener ", event);
      if (event.type && event.type == "safew_contentscript_message") {
          if (event.detail && event.detail.type && event.detail.type === "connect_response") {
              //console.log("response connect listener", event, connectRequests);
              if (event.detail.err !== undefined) {
                  connectRequests.forEach(promise => promise.reject(event.detail.err));
              } else {
                  connectRequests.forEach(promise => promise.resolve(event.detail.result));
                  connectRequests=[];
              }
          }
          if (event.detail && event.detail.type && event.detail.type === "ergo_api_response") {
              console.log("ergo_api",event.detail, responseHandlers)
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
  
  `

const injected_script_2 = `
  
  class NautilusErgoApi {
      ${ergoInitialAPIFunctions}

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
          console.log("_ergo_rpc_call", func, params);
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
  const ergo = Object.freeze(new NautilusErgoApi());
  `

injectScript(injected_script_1);
var ergoApiInjected = false;

// injected script listerner
window.addEventListener('safew_injected_script_message', (event) => {
    console.log("contentScript addEventListener event", event);
    chrome.runtime.sendMessage(
        {
            channel: 'safew_contentscript_background_channel',
            data: event.detail,
        },
        (response) => {
            // Can return null response if window is killed
            if (!response) {
                return;
            }
            console.log("contentScript response", response);
            if (response.type && response.type === "connect_response" && response.result) {
                if (!ergoApiInjected) {
                    injectScript(injected_script_2);
                    ergoApiInjected = true;
                }
            }
            window.dispatchEvent(
                new CustomEvent('safew_contentscript_message', { detail: response }),
            );
        },
    );
    return true;
});
