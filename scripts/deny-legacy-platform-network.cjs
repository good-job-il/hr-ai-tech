const http = require('node:http');
const https = require('node:https');
const net = require('node:net');

const isBlocked = value => {
  try {
    const host = typeof value === 'string'
      ? (value.includes('://') ? new URL(value).hostname : value)
      : value?.hostname || value?.host || '';
    return /(^|\.)base44\.com$/i.test(String(host).split(':')[0]);
  } catch {
    return false;
  }
};
const denied = host => Object.assign(new Error(`Base44 network access denied: ${host}`), { code: 'EBASE44DENIED' });

for (const client of [http, https]) {
  const originalRequest = client.request;
  client.request = function guardedRequest(input, options, callback) {
    if (isBlocked(input) || isBlocked(options)) throw denied(typeof input === 'string' ? input : input?.hostname);
    return originalRequest.call(this, input, options, callback);
  };
  client.get = function guardedGet(input, options, callback) {
    const request = client.request(input, options, callback);
    request.end();
    return request;
  };
}

const originalConnect = net.connect;
net.connect = function guardedConnect(...args) {
  const target = typeof args[0] === 'object' ? args[0] : { port: args[0], host: args[1] };
  if (isBlocked(target)) throw denied(target.host || target.hostname);
  return originalConnect.apply(this, args);
};
net.createConnection = net.connect;

if (globalThis.fetch) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = function guardedFetch(input, init) {
    if (isBlocked(typeof input === 'string' ? input : input?.url)) {
      return Promise.reject(denied(typeof input === 'string' ? input : input?.url));
    }
    return originalFetch(input, init);
  };
}
