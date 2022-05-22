function injectScript(script_file) {
    console.log("SAFEW injecting " + script_file);
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL(script_file);
    (document.head || document.documentElement).appendChild(script);
}


injectScript('inject1.js');
//injectScript('inject2.js');
var ergoApiInjected = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getChromeVersion () {     
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);

    return raw ? parseInt(raw[2], 10) : false;
}

// injected script listerner
window.addEventListener('safew_injected_script_message', (event) => {
    //console.log("contentScript addEventListener event", event);
    chrome.runtime.sendMessage(
        {
            channel: 'safew_contentscript_background_channel',
            data: event.detail,
        },
        async (response) => {
            // Can return null response if window is killed
            if (!response) {
                return;
            }
            console.log("contentScript response", response);
            var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            if (response.type && response.type === "connect_response" && response.result) {
                if (!ergoApiInjected) {
                    if (isFirefox || getChromeVersion() < 102) {
                        injectScript('inject2.js');
                        await sleep(100);
                    }
                    ergoApiInjected = true;
                }
            }
            var newresp = {};
            if (isFirefox) {
                
                newresp = cloneInto(response, window.document.defaultView);
                console.log("firefox response", response, newresp);
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
