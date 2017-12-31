/* eslint-env browser */

const PromisePolyfill = require('promise-polyfill');
const ReconnectingWebsocket = require('reconnecting-websocket');

let authOverride;

// To add to window
if (!window.Promise) {
  window.Promise = PromisePolyfill;
}

function fetchFromServer(server, method, path, data, authorization) {
  return new Promise((resolve, reject) => {
    const hasData = (data !== undefined);

    let url = `${server}${path}`;

    if (hasData && (method === 'GET')) {
      url += `?data=${encodeURIComponent(JSON.stringify(data))}`;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.withCredentials = true;

    if (hasData && (method === 'POST')) {
      xhr.setRequestHeader('Content-type', 'application/json');
    }

    if (authorization) {
      const basicAuth = btoa(`${authorization.username}:${authorization.password}`);
      xhr.setRequestHeader('Authorization', `Basic ${basicAuth}`);
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if ((xhr.status >= 200) && (xhr.status < 300)) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let errMsg;
          try {
            // Errors from huntjs-backend will be JSON
            errMsg = JSON.parse(xhr.responseText).error;
          } catch (e) {
            // Was probably an error from the routing layer, just return the
            // text
            errMsg = xhr.responseText;
          }
          reject(new Error(errMsg));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Could not make network request'));
    };

    if (hasData && (method === 'POST')) {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send(null);
    }
  });
}

function getAuth() {
  if (authOverride) {
    return Promise.resolve(authOverride);
  } else if ((document.location.protocol === 'file:') || (document.location.hostname === 's3.amazonaws.com')) {
    // dev credentials
    return Promise.resolve({
      username: 'test-team',
      password: 'dev',
    });
  }

  return fetchFromServer(document.location.origin, 'GET', `${document.location.pathname}/token`)
    .then(r => ({
      username: r.username,
      password: `jwt/${r.jwt}`,
    }));
}

function fetchFromServerWithAuth(server, method, path, data) {
  return getAuth().then(auth => fetchFromServer(server, method, path, data, auth));
}

function connectToServer(server) {
  return {
    get(path, data) {
      return fetchFromServerWithAuth(server, 'GET', path, data);
    },
    post(path, data) {
      return fetchFromServerWithAuth(server, 'POST', path, data);
    },
    subscribe(channel, onMessage) {
      return getAuth().then((auth) => {
        const serverUrl = server.replace(/^http/, 'ws');

        const channelArg = encodeURIComponent(channel);
        const usernameArg = encodeURIComponent(auth.username);
        const passwordArg = encodeURIComponent(auth.password);

        const url = `${serverUrl}/huntjs_subscribe?channel=${channelArg}&username=${usernameArg}&password=${passwordArg}`;

        const ws = new ReconnectingWebsocket(url);
        ws.addEventListener('message', evt => onMessage(evt.data));

        return ws;
      });
    },
  };
}

function connectInBrowser(appName) {
  const backend = window.__huntjs__[appName];

  return {
    get(path, data) {
      return backend.get(path, data);
    },
    post(path, data) {
      return backend.post(path, data);
    },
  };
}


const HuntJSClient = {
  connect(appName, server) {
    if (window.__huntjs__ && window.__huntjs__[appName]) {
      return connectInBrowser(appName);
    }

    return connectToServer(server);
  },

  overrideAuth(username, password) {
    if (!username) {
      authOverride = undefined;
    } else {
      authOverride = { username, password };
    }
  },
};

module.exports = HuntJSClient;
