/* eslint-env browser */

const PromisePolyfill = require('promise-polyfill');

// To add to window
if (!window.Promise) {
  window.Promise = PromisePolyfill;
}

function fetchFromServer(server, method, path, data) {
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

function connectToServer(server) {
  return {
    get(path, data) {
      return fetchFromServer(server, 'GET', path, data);
    },
    post(path, data) {
      return fetchFromServer(server, 'POST', path, data);
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
};

module.exports = HuntJSClient;
