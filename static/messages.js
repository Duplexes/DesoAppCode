function postMessage(req) {
    if (initialized) {
        iframe.contentWindow.postMessage(req, "*");
    } else {
        pendingRequests.push(req);
    }
}

function respond(window, id, payload) {
    window.postMessage({ id, service: "identity", payload }, "*");
}

function handleRequest(event) {
    const { data: { method, payload } } = event;
    if (method === "initialize") {
        handleInitialize(event);
    } else if (method === "login") {
        handleLogin(payload);
    }
}

function handleInitialize(event) {
    if (!initialized) {
        initialized = true;
        iframe = document.getElementById("identity");
        for (const request of pendingRequests) {
            postMessage(request);
        }
        pendingRequests = [];
    }
    respond(event.source, event.data.id, {});
}

function handleLogin(payload) {
    identityWindow.close();
    identityWindow = null;

    const publicKey = payload.publicKeyAdded;
    const seedHex = payload.users[payload.publicKeyAdded].encryptedSeedHex;
    const accessLevel = payload.users[payload.publicKeyAdded].accessLevel;
    const accessLevelHmac = payload.users[payload.publicKeyAdded].accessLevelHmac;

    localStorage.setItem('public_key', publicKey);
    localStorage.setItem('seed_hex', seedHex);
    localStorage.setItem('access_level', accessLevel);
    localStorage.setItem('access_level_hmac', accessLevelHmac);

    const fetchOptions = {
        method: 'POST',
        body: JSON.stringify({
            public_key: publicKey,
            seed_hex: seedHex,
            access_level: accessLevel,
            access_level_hmac: accessLevelHmac
        }),
        headers: { 'Content-Type': 'application/json' }
    };
    fetch('/api/auth', fetchOptions).then(() => {
        window.location.reload();
    });
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

var initialized = false;
var iframe = null;
var pendingRequests = [];
var identityWindow = null;

window.addEventListener("message", (event) => handleRequest(event));
