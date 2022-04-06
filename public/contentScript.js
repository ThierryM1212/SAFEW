function injectScript(script_file) {
    console.log("SAFEW injecting "+ script_file);
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL(script_file);
    (document.head || document.documentElement).appendChild(script);
}


injectScript('inject1.js');
//injectScript('inject2.js');
var ergoApiInjected = false;

// injected script listerner
window.addEventListener('safew_injected_script_message', (event) => {
    //console.log("contentScript addEventListener event", event);
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
            //console.log("contentScript response", response);
            if (response.type && response.type === "connect_response" && response.result) {
                if (!ergoApiInjected) {
                    //injectScript('inject2.js');
                    ergoApiInjected = true;
                }
            }
            var newresp = {};
            var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            if (isFirefox) {
                newresp = cloneInto(response, window.document.defaultView);
            } else {
                newresp = response;
            }
            //console.log("contentScript newresp", newresp);
            window.dispatchEvent(
                new CustomEvent('safew_contentscript_message', { detail: newresp }),
            );
        },
    );
    return true;
});
