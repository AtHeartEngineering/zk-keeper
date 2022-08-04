/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/contentscripts/injected.ts":
/*!****************************************!*\
  !*** ./src/contentscripts/injected.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/* eslint-disable @typescript-eslint/no-use-before-define */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const constants_1 = __importDefault(__webpack_require__(/*! @src/util/constants */ "./src/util/constants.ts"));
const promises = {};
let nonce = 0;
async function getIdentityCommitments() {
    return post({
        method: constants_1.default.GET_COMMITMENTS
    });
}
async function getActiveIdentity() {
    return post({
        method: constants_1.default.GET_ACTIVE_IDENTITY
    });
}
async function getHostPermissions(host) {
    return post({
        method: constants_1.default.GET_HOST_PERMISSIONS,
        payload: host
    });
}
async function setHostPermissions(host, permissions) {
    return post({
        method: constants_1.default.SET_HOST_PERMISSIONS,
        payload: {
            host,
            ...permissions
        }
    });
}
async function createIdentity() {
    try {
        const res = await post({
            method: constants_1.default.CREATE_IDENTITY_REQ
        });
        await post({ method: constants_1.default.CLOSE_POPUP });
        return res;
    }
    catch (e) {
        await post({ method: constants_1.default.CLOSE_POPUP });
        throw e;
    }
}
async function createDummyRequest() {
    try {
        const res = await post({
            method: constants_1.default.DUMMY_REQUEST
        });
        await post({ method: constants_1.default.CLOSE_POPUP });
        return res;
    }
    catch (e) {
        await post({ method: constants_1.default.CLOSE_POPUP });
        throw e;
    }
}
async function semaphoreProof(externalNullifier, signal, circuitFilePath, zkeyFilePath, merkleProofArtifactsOrStorageAddress, merkleProof) {
    const merkleProofArtifacts = typeof merkleProofArtifactsOrStorageAddress === 'string' ? undefined : merkleProofArtifactsOrStorageAddress;
    const merkleStorageAddress = typeof merkleProofArtifactsOrStorageAddress === 'string' ? merkleProofArtifactsOrStorageAddress : undefined;
    return post({
        method: constants_1.default.SEMAPHORE_PROOF,
        payload: {
            externalNullifier,
            signal,
            merkleStorageAddress,
            circuitFilePath,
            zkeyFilePath,
            merkleProofArtifacts,
            merkleProof
        }
    });
}
async function rlnProof(externalNullifier, signal, circuitFilePath, zkeyFilePath, merkleProofArtifactsOrStorageAddress, rlnIdentifier) {
    const merkleProofArtifacts = typeof merkleProofArtifactsOrStorageAddress === 'string' ? undefined : merkleProofArtifactsOrStorageAddress;
    const merkleStorageAddress = typeof merkleProofArtifactsOrStorageAddress === 'string' ? merkleProofArtifactsOrStorageAddress : undefined;
    return post({
        method: constants_1.default.RLN_PROOF,
        payload: {
            externalNullifier,
            signal,
            merkleStorageAddress,
            circuitFilePath,
            zkeyFilePath,
            merkleProofArtifacts,
            rlnIdentifier
        }
    });
}
// dev-only
async function clearApproved() {
    return post({
        method: constants_1.default.CLEAR_APPROVED_HOSTS
    });
}
/**
 * Open Popup
 */
async function openPopup() {
    return post({
        method: 'OPEN_POPUP'
    });
}
async function tryInject(origin) {
    return post({
        method: constants_1.default.TRY_INJECT,
        payload: { origin }
    });
}
async function addHost(host) {
    return post({
        method: constants_1.default.APPROVE_HOST,
        payload: { host }
    });
}
const EVENTS = {};
const on = (eventName, cb) => {
    const bucket = EVENTS[eventName] || [];
    bucket.push(cb);
    EVENTS[eventName] = bucket;
};
const off = (eventName, cb) => {
    const bucket = EVENTS[eventName] || [];
    EVENTS[eventName] = bucket.filter((callback) => callback === cb);
};
const emit = (eventName, payload) => {
    const bucket = EVENTS[eventName] || [];
    for (const cb of bucket) {
        cb(payload);
    }
};
/**
 * Injected Client
 */
const client = {
    openPopup,
    getIdentityCommitments,
    getActiveIdentity,
    createIdentity,
    getHostPermissions,
    setHostPermissions,
    semaphoreProof,
    rlnProof,
    on,
    off,
    // dev-only
    clearApproved,
    createDummyRequest
};
/**
 * Connect to Extension
 * @returns injected client
 */
// eslint-disable-next-line consistent-return
async function connect() {
    let result;
    try {
        const approved = await tryInject(window.location.origin);
        if (approved) {
            await addHost(window.location.origin);
            result = client;
        }
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log('Err: ', err);
        result = null;
    }
    await post({ method: constants_1.default.CLOSE_POPUP });
    return result;
}
window.zkpr = {
    connect
};
// Connect injected script messages with content script messages
async function post(message) {
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line no-plusplus
        const messageNonce = nonce++;
        window.postMessage({
            target: 'injected-contentscript',
            message: {
                ...message,
                meta: {
                    ...message.meta,
                    origin: window.location.origin
                },
                type: message.method
            },
            nonce: messageNonce
        }, '*');
        promises[messageNonce] = { resolve, reject };
    });
}
window.addEventListener('message', (event) => {
    const { data } = event;
    if (data && data.target === 'injected-injectedscript') {
        if (data.nonce === 'identityChanged') {
            const [err, res] = data.payload;
            emit('identityChanged', res);
            return;
        }
        if (data.nonce === 'logout') {
            const [err, res] = data.payload;
            emit('logout', res);
            return;
        }
        if (data.nonce === 'login') {
            const [err, res] = data.payload;
            emit('login', res);
            return;
        }
        if (!promises[data.nonce])
            return;
        const [err, res] = data.payload;
        const { resolve, reject } = promises[data.nonce];
        if (err) {
            // eslint-disable-next-line consistent-return
            return reject(new Error(err));
        }
        resolve(res);
        delete promises[data.nonce];
    }
});


/***/ }),

/***/ "./src/util/constants.ts":
/*!*******************************!*\
  !*** ./src/util/constants.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var RPCAction;
(function (RPCAction) {
    RPCAction["UNLOCK"] = "rpc/unlock";
    RPCAction["LOCK"] = "rpc/lock";
    RPCAction["GET_STATUS"] = "rpc/getStatus";
    RPCAction["TRY_INJECT"] = "rpc/inject";
    RPCAction["SETUP_PASSWORD"] = "rpc/lock/setupPassword";
    RPCAction["CONNECT_METAMASK"] = "rpc/metamask/connectMetamask";
    RPCAction["GET_WALLET_INFO"] = "rpc/metamask/getWalletInfo";
    RPCAction["CREATE_IDENTITY"] = "rpc/identity/createIdentity";
    RPCAction["CREATE_IDENTITY_REQ"] = "rpc/identity/createIdentityRequest";
    RPCAction["SET_ACTIVE_IDENTITY"] = "rpc/identity/setActiveIdentity";
    RPCAction["GET_ACTIVE_IDENTITY"] = "rpc/identity/getActiveidentity";
    RPCAction["GET_COMMITMENTS"] = "rpc/identity/getIdentityCommitments";
    RPCAction["GET_IDENTITIES"] = "rpc/identity/getIdentities";
    RPCAction["GET_REQUEST_PENDING_STATUS"] = "rpc/identity/getRequestPendingStatus";
    RPCAction["FINALIZE_REQUEST"] = "rpc/requests/finalize";
    RPCAction["GET_PENDING_REQUESTS"] = "rpc/requests/get";
    RPCAction["SEMAPHORE_PROOF"] = "rpc/protocols/semaphore/genProof";
    RPCAction["RLN_PROOF"] = "rpc/protocols/rln/genProof";
    RPCAction["NRLN_PROOF"] = "rpc/protocols/nrln/genProof";
    RPCAction["DUMMY_REQUEST"] = "rpc/protocols/semaphore/dummyReuqest";
    RPCAction["REQUEST_ADD_REMOVE_APPROVAL"] = "rpc/hosts/request";
    RPCAction["APPROVE_HOST"] = "rpc/hosts/approve";
    RPCAction["IS_HOST_APPROVED"] = "rpc/hosts/isHostApprove";
    RPCAction["GET_HOST_PERMISSIONS"] = "rpc/hosts/getHostPermissions";
    RPCAction["SET_HOST_PERMISSIONS"] = "rpc/hosts/setHostPermissions";
    RPCAction["REMOVE_HOST"] = "rpc/hosts/remove";
    RPCAction["CLOSE_POPUP"] = "rpc/popup/close";
    // DEV RPCS
    RPCAction["CLEAR_APPROVED_HOSTS"] = "rpc/hosts/clear";
})(RPCAction || (RPCAction = {}));
exports["default"] = RPCAction;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/contentscripts/injected.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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K0M7SUFDL0MsdUVBQTBEO0lBQzFELG1FQUFzRDtJQUN0RCxtRUFBc0Q7SUFDdEQsb0VBQXVEO0lBQ3ZELDBEQUE2QztJQUM3QyxnRkFBbUU7SUFDbkUsdURBQTBDO0lBQzFDLHNEQUF5QztJQUN6QyxpRUFBb0Q7SUFDcEQscURBQXdDO0lBQ3hDLHVEQUEwQztJQUMxQyxtRUFBc0Q7SUFDdEQsOERBQWlEO0lBQ2pELCtDQUFrQztJQUNsQyx5REFBNEM7SUFDNUMsa0VBQXFEO0lBQ3JELGtFQUFxRDtJQUNyRCw2Q0FBZ0M7SUFDaEMsNENBQStCO0lBQy9CLFdBQVc7SUFDWCxxREFBd0M7QUFDNUMsQ0FBQyxFQTlCSSxTQUFTLEtBQVQsU0FBUyxRQThCYjtBQUNELHFCQUFlLFNBQVM7Ozs7Ozs7VUMvQnhCO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly96ay1rZWVwZXIvLi9zcmMvY29udGVudHNjcmlwdHMvaW5qZWN0ZWQudHMiLCJ3ZWJwYWNrOi8vemsta2VlcGVyLy4vc3JjL3V0aWwvY29uc3RhbnRzLnRzIiwid2VicGFjazovL3prLWtlZXBlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly96ay1rZWVwZXIvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly96ay1rZWVwZXIvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL3prLWtlZXBlci93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lICovXG5cbmltcG9ydCB7IE1lcmtsZVByb29mQXJ0aWZhY3RzIH0gZnJvbSAnQHNyYy90eXBlcydcbmltcG9ydCBSUENBY3Rpb24gZnJvbSAnQHNyYy91dGlsL2NvbnN0YW50cydcbmltcG9ydCB7IE1lcmtsZVByb29mIH0gZnJvbSAnQHprLWtpdC9wcm90b2NvbHMnXG5cbmV4cG9ydCB0eXBlIElSZXF1ZXN0ID0ge1xuICAgIG1ldGhvZDogc3RyaW5nXG4gICAgcGF5bG9hZD86IGFueVxuICAgIGVycm9yPzogYm9vbGVhblxuICAgIG1ldGE/OiBhbnlcbn1cblxuY29uc3QgcHJvbWlzZXM6IHtcbiAgICBbazogc3RyaW5nXToge1xuICAgICAgICByZXNvbHZlOiBGdW5jdGlvblxuICAgICAgICByZWplY3Q6IEZ1bmN0aW9uXG4gICAgfVxufSA9IHt9XG5cbmxldCBub25jZSA9IDBcblxuYXN5bmMgZnVuY3Rpb24gZ2V0SWRlbnRpdHlDb21taXRtZW50cygpIHtcbiAgICByZXR1cm4gcG9zdCh7XG4gICAgICAgIG1ldGhvZDogUlBDQWN0aW9uLkdFVF9DT01NSVRNRU5UU1xuICAgIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjdGl2ZUlkZW50aXR5KCkge1xuICAgIHJldHVybiBwb3N0KHtcbiAgICAgICAgbWV0aG9kOiBSUENBY3Rpb24uR0VUX0FDVElWRV9JREVOVElUWVxuICAgIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEhvc3RQZXJtaXNzaW9ucyhob3N0OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gcG9zdCh7XG4gICAgICAgIG1ldGhvZDogUlBDQWN0aW9uLkdFVF9IT1NUX1BFUk1JU1NJT05TLFxuICAgICAgICBwYXlsb2FkOiBob3N0XG4gICAgfSlcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2V0SG9zdFBlcm1pc3Npb25zKFxuICAgIGhvc3Q6IHN0cmluZyxcbiAgICBwZXJtaXNzaW9ucz86IHtcbiAgICAgICAgbm9BcHByb3ZhbD86IGJvb2xlYW5cbiAgICB9XG4pIHtcbiAgICByZXR1cm4gcG9zdCh7XG4gICAgICAgIG1ldGhvZDogUlBDQWN0aW9uLlNFVF9IT1NUX1BFUk1JU1NJT05TLFxuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgICBob3N0LFxuICAgICAgICAgICAgLi4ucGVybWlzc2lvbnNcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUlkZW50aXR5KCkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBvc3Qoe1xuICAgICAgICAgICAgbWV0aG9kOiBSUENBY3Rpb24uQ1JFQVRFX0lERU5USVRZX1JFUVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IHBvc3QoeyBtZXRob2Q6IFJQQ0FjdGlvbi5DTE9TRV9QT1BVUCB9KVxuICAgICAgICByZXR1cm4gcmVzXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBhd2FpdCBwb3N0KHsgbWV0aG9kOiBSUENBY3Rpb24uQ0xPU0VfUE9QVVAgfSlcbiAgICAgICAgdGhyb3cgZVxuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlRHVtbXlSZXF1ZXN0KCkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBvc3Qoe1xuICAgICAgICAgICAgbWV0aG9kOiBSUENBY3Rpb24uRFVNTVlfUkVRVUVTVFxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IHBvc3QoeyBtZXRob2Q6IFJQQ0FjdGlvbi5DTE9TRV9QT1BVUCB9KVxuICAgICAgICByZXR1cm4gcmVzXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBhd2FpdCBwb3N0KHsgbWV0aG9kOiBSUENBY3Rpb24uQ0xPU0VfUE9QVVAgfSlcbiAgICAgICAgdGhyb3cgZVxuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2VtYXBob3JlUHJvb2YoXG4gICAgZXh0ZXJuYWxOdWxsaWZpZXI6IHN0cmluZyxcbiAgICBzaWduYWw6IHN0cmluZyxcbiAgICBjaXJjdWl0RmlsZVBhdGg6IHN0cmluZyxcbiAgICB6a2V5RmlsZVBhdGg6IHN0cmluZyxcbiAgICBtZXJrbGVQcm9vZkFydGlmYWN0c09yU3RvcmFnZUFkZHJlc3M6IHN0cmluZyB8IE1lcmtsZVByb29mQXJ0aWZhY3RzLFxuICAgIG1lcmtsZVByb29mPzogTWVya2xlUHJvb2Zcbikge1xuICAgIGNvbnN0IG1lcmtsZVByb29mQXJ0aWZhY3RzID1cbiAgICAgICAgdHlwZW9mIG1lcmtsZVByb29mQXJ0aWZhY3RzT3JTdG9yYWdlQWRkcmVzcyA9PT0gJ3N0cmluZycgPyB1bmRlZmluZWQgOiBtZXJrbGVQcm9vZkFydGlmYWN0c09yU3RvcmFnZUFkZHJlc3NcbiAgICBjb25zdCBtZXJrbGVTdG9yYWdlQWRkcmVzcyA9XG4gICAgICAgIHR5cGVvZiBtZXJrbGVQcm9vZkFydGlmYWN0c09yU3RvcmFnZUFkZHJlc3MgPT09ICdzdHJpbmcnID8gbWVya2xlUHJvb2ZBcnRpZmFjdHNPclN0b3JhZ2VBZGRyZXNzIDogdW5kZWZpbmVkXG5cbiAgICByZXR1cm4gcG9zdCh7XG4gICAgICAgIG1ldGhvZDogUlBDQWN0aW9uLlNFTUFQSE9SRV9QUk9PRixcbiAgICAgICAgcGF5bG9hZDoge1xuICAgICAgICAgICAgZXh0ZXJuYWxOdWxsaWZpZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgICBtZXJrbGVTdG9yYWdlQWRkcmVzcyxcbiAgICAgICAgICAgIGNpcmN1aXRGaWxlUGF0aCxcbiAgICAgICAgICAgIHprZXlGaWxlUGF0aCxcbiAgICAgICAgICAgIG1lcmtsZVByb29mQXJ0aWZhY3RzLFxuICAgICAgICAgICAgbWVya2xlUHJvb2ZcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJsblByb29mKFxuICAgIGV4dGVybmFsTnVsbGlmaWVyOiBzdHJpbmcsXG4gICAgc2lnbmFsOiBzdHJpbmcsXG4gICAgY2lyY3VpdEZpbGVQYXRoOiBzdHJpbmcsXG4gICAgemtleUZpbGVQYXRoOiBzdHJpbmcsXG4gICAgbWVya2xlUHJvb2ZBcnRpZmFjdHNPclN0b3JhZ2VBZGRyZXNzOiBzdHJpbmcgfCBNZXJrbGVQcm9vZkFydGlmYWN0cyxcbiAgICBybG5JZGVudGlmaWVyOiBzdHJpbmdcbikge1xuICAgIGNvbnN0IG1lcmtsZVByb29mQXJ0aWZhY3RzID1cbiAgICAgICAgdHlwZW9mIG1lcmtsZVByb29mQXJ0aWZhY3RzT3JTdG9yYWdlQWRkcmVzcyA9PT0gJ3N0cmluZycgPyB1bmRlZmluZWQgOiBtZXJrbGVQcm9vZkFydGlmYWN0c09yU3RvcmFnZUFkZHJlc3NcbiAgICBjb25zdCBtZXJrbGVTdG9yYWdlQWRkcmVzcyA9XG4gICAgICAgIHR5cGVvZiBtZXJrbGVQcm9vZkFydGlmYWN0c09yU3RvcmFnZUFkZHJlc3MgPT09ICdzdHJpbmcnID8gbWVya2xlUHJvb2ZBcnRpZmFjdHNPclN0b3JhZ2VBZGRyZXNzIDogdW5kZWZpbmVkXG4gICAgcmV0dXJuIHBvc3Qoe1xuICAgICAgICBtZXRob2Q6IFJQQ0FjdGlvbi5STE5fUFJPT0YsXG4gICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICAgIGV4dGVybmFsTnVsbGlmaWVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICAgICAgbWVya2xlU3RvcmFnZUFkZHJlc3MsXG4gICAgICAgICAgICBjaXJjdWl0RmlsZVBhdGgsXG4gICAgICAgICAgICB6a2V5RmlsZVBhdGgsXG4gICAgICAgICAgICBtZXJrbGVQcm9vZkFydGlmYWN0cyxcbiAgICAgICAgICAgIHJsbklkZW50aWZpZXJcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbi8vIGRldi1vbmx5XG5hc3luYyBmdW5jdGlvbiBjbGVhckFwcHJvdmVkKCkge1xuICAgIHJldHVybiBwb3N0KHtcbiAgICAgICAgbWV0aG9kOiBSUENBY3Rpb24uQ0xFQVJfQVBQUk9WRURfSE9TVFNcbiAgICB9KVxufVxuXG4vKipcbiAqIE9wZW4gUG9wdXBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gb3BlblBvcHVwKCkge1xuICAgIHJldHVybiBwb3N0KHtcbiAgICAgICAgbWV0aG9kOiAnT1BFTl9QT1BVUCdcbiAgICB9KVxufVxuXG5hc3luYyBmdW5jdGlvbiB0cnlJbmplY3Qob3JpZ2luOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gcG9zdCh7XG4gICAgICAgIG1ldGhvZDogUlBDQWN0aW9uLlRSWV9JTkpFQ1QsXG4gICAgICAgIHBheWxvYWQ6IHsgb3JpZ2luIH1cbiAgICB9KVxufVxuXG5hc3luYyBmdW5jdGlvbiBhZGRIb3N0KGhvc3Q6IHN0cmluZykge1xuICAgIHJldHVybiBwb3N0KHtcbiAgICAgICAgbWV0aG9kOiBSUENBY3Rpb24uQVBQUk9WRV9IT1NULFxuICAgICAgICBwYXlsb2FkOiB7IGhvc3QgfVxuICAgIH0pXG59XG5cbmNvbnN0IEVWRU5UUzoge1xuICAgIFtldmVudE5hbWU6IHN0cmluZ106ICgoZGF0YTogdW5rbm93bikgPT4gdm9pZClbXVxufSA9IHt9XG5cbmNvbnN0IG9uID0gKGV2ZW50TmFtZTogc3RyaW5nLCBjYjogKGRhdGE6IHVua25vd24pID0+IHZvaWQpID0+IHtcbiAgICBjb25zdCBidWNrZXQgPSBFVkVOVFNbZXZlbnROYW1lXSB8fCBbXVxuICAgIGJ1Y2tldC5wdXNoKGNiKVxuICAgIEVWRU5UU1tldmVudE5hbWVdID0gYnVja2V0XG59XG5cbmNvbnN0IG9mZiA9IChldmVudE5hbWU6IHN0cmluZywgY2I6IChkYXRhOiB1bmtub3duKSA9PiB2b2lkKSA9PiB7XG4gICAgY29uc3QgYnVja2V0ID0gRVZFTlRTW2V2ZW50TmFtZV0gfHwgW11cbiAgICBFVkVOVFNbZXZlbnROYW1lXSA9IGJ1Y2tldC5maWx0ZXIoKGNhbGxiYWNrKSA9PiBjYWxsYmFjayA9PT0gY2IpXG59XG5cbmNvbnN0IGVtaXQgPSAoZXZlbnROYW1lOiBzdHJpbmcsIHBheWxvYWQ/OiBhbnkpID0+IHtcbiAgICBjb25zdCBidWNrZXQgPSBFVkVOVFNbZXZlbnROYW1lXSB8fCBbXVxuXG4gICAgZm9yIChjb25zdCBjYiBvZiBidWNrZXQpIHtcbiAgICAgICAgY2IocGF5bG9hZClcbiAgICB9XG59XG5cbi8qKlxuICogSW5qZWN0ZWQgQ2xpZW50XG4gKi9cbmNvbnN0IGNsaWVudCA9IHtcbiAgICBvcGVuUG9wdXAsXG4gICAgZ2V0SWRlbnRpdHlDb21taXRtZW50cyxcbiAgICBnZXRBY3RpdmVJZGVudGl0eSxcbiAgICBjcmVhdGVJZGVudGl0eSxcbiAgICBnZXRIb3N0UGVybWlzc2lvbnMsXG4gICAgc2V0SG9zdFBlcm1pc3Npb25zLFxuICAgIHNlbWFwaG9yZVByb29mLFxuICAgIHJsblByb29mLFxuICAgIG9uLFxuICAgIG9mZixcbiAgICAvLyBkZXYtb25seVxuICAgIGNsZWFyQXBwcm92ZWQsXG4gICAgY3JlYXRlRHVtbXlSZXF1ZXN0XG59XG5cbi8qKlxuICogQ29ubmVjdCB0byBFeHRlbnNpb25cbiAqIEByZXR1cm5zIGluamVjdGVkIGNsaWVudFxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29uc2lzdGVudC1yZXR1cm5cbmFzeW5jIGZ1bmN0aW9uIGNvbm5lY3QoKSB7XG4gICAgbGV0IHJlc3VsdFxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGFwcHJvdmVkID0gYXdhaXQgdHJ5SW5qZWN0KHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pXG5cbiAgICAgICAgaWYgKGFwcHJvdmVkKSB7XG4gICAgICAgICAgICBhd2FpdCBhZGRIb3N0KHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pXG4gICAgICAgICAgICByZXN1bHQgPSBjbGllbnRcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmxvZygnRXJyOiAnLCBlcnIpXG4gICAgICAgIHJlc3VsdCA9IG51bGxcbiAgICB9XG5cbiAgICBhd2FpdCBwb3N0KHsgbWV0aG9kOiBSUENBY3Rpb24uQ0xPU0VfUE9QVVAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbn1cblxuZGVjbGFyZSBnbG9iYWwge1xuICAgIGludGVyZmFjZSBXaW5kb3cge1xuICAgICAgICB6a3ByOiB7XG4gICAgICAgICAgICBjb25uZWN0OiAoKSA9PiBhbnlcbiAgICAgICAgfVxuICAgIH1cbn1cblxud2luZG93LnprcHIgPSB7XG4gICAgY29ubmVjdFxufVxuXG4vLyBDb25uZWN0IGluamVjdGVkIHNjcmlwdCBtZXNzYWdlcyB3aXRoIGNvbnRlbnQgc2NyaXB0IG1lc3NhZ2VzXG5hc3luYyBmdW5jdGlvbiBwb3N0KG1lc3NhZ2U6IElSZXF1ZXN0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBsdXNwbHVzXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VOb25jZSA9IG5vbmNlKytcbiAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRhcmdldDogJ2luamVjdGVkLWNvbnRlbnRzY3JpcHQnLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgICAgICAgICAgICAgLi4ubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgbWV0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4ubWVzc2FnZS5tZXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luOiB3aW5kb3cubG9jYXRpb24ub3JpZ2luXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG1lc3NhZ2UubWV0aG9kXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBub25jZTogbWVzc2FnZU5vbmNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJyonXG4gICAgICAgIClcblxuICAgICAgICBwcm9taXNlc1ttZXNzYWdlTm9uY2VdID0geyByZXNvbHZlLCByZWplY3QgfVxuICAgIH0pXG59XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSBldmVudFxuXG4gICAgaWYgKGRhdGEgJiYgZGF0YS50YXJnZXQgPT09ICdpbmplY3RlZC1pbmplY3RlZHNjcmlwdCcpIHtcbiAgICAgICAgaWYgKGRhdGEubm9uY2UgPT09ICdpZGVudGl0eUNoYW5nZWQnKSB7XG4gICAgICAgICAgICBjb25zdCBbZXJyLCByZXNdID0gZGF0YS5wYXlsb2FkXG4gICAgICAgICAgICBlbWl0KCdpZGVudGl0eUNoYW5nZWQnLCByZXMpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS5ub25jZSA9PT0gJ2xvZ291dCcpIHtcbiAgICAgICAgICAgIGNvbnN0IFtlcnIsIHJlc10gPSBkYXRhLnBheWxvYWRcbiAgICAgICAgICAgIGVtaXQoJ2xvZ291dCcsIHJlcylcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEubm9uY2UgPT09ICdsb2dpbicpIHtcbiAgICAgICAgICAgIGNvbnN0IFtlcnIsIHJlc10gPSBkYXRhLnBheWxvYWRcbiAgICAgICAgICAgIGVtaXQoJ2xvZ2luJywgcmVzKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXByb21pc2VzW2RhdGEubm9uY2VdKSByZXR1cm5cblxuICAgICAgICBjb25zdCBbZXJyLCByZXNdID0gZGF0YS5wYXlsb2FkXG4gICAgICAgIGNvbnN0IHsgcmVzb2x2ZSwgcmVqZWN0IH0gPSBwcm9taXNlc1tkYXRhLm5vbmNlXVxuXG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXJldHVyblxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoZXJyKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmUocmVzKVxuXG4gICAgICAgIGRlbGV0ZSBwcm9taXNlc1tkYXRhLm5vbmNlXVxuICAgIH1cbn0pXG4iLCJlbnVtIFJQQ0FjdGlvbiB7XG4gICAgVU5MT0NLID0gJ3JwYy91bmxvY2snLFxuICAgIExPQ0sgPSAncnBjL2xvY2snLFxuICAgIEdFVF9TVEFUVVMgPSAncnBjL2dldFN0YXR1cycsXG4gICAgVFJZX0lOSkVDVCA9ICdycGMvaW5qZWN0JyxcbiAgICBTRVRVUF9QQVNTV09SRCA9ICdycGMvbG9jay9zZXR1cFBhc3N3b3JkJyxcbiAgICBDT05ORUNUX01FVEFNQVNLID0gJ3JwYy9tZXRhbWFzay9jb25uZWN0TWV0YW1hc2snLFxuICAgIEdFVF9XQUxMRVRfSU5GTyA9ICdycGMvbWV0YW1hc2svZ2V0V2FsbGV0SW5mbycsXG4gICAgQ1JFQVRFX0lERU5USVRZID0gJ3JwYy9pZGVudGl0eS9jcmVhdGVJZGVudGl0eScsXG4gICAgQ1JFQVRFX0lERU5USVRZX1JFUSA9ICdycGMvaWRlbnRpdHkvY3JlYXRlSWRlbnRpdHlSZXF1ZXN0JyxcbiAgICBTRVRfQUNUSVZFX0lERU5USVRZID0gJ3JwYy9pZGVudGl0eS9zZXRBY3RpdmVJZGVudGl0eScsXG4gICAgR0VUX0FDVElWRV9JREVOVElUWSA9ICdycGMvaWRlbnRpdHkvZ2V0QWN0aXZlaWRlbnRpdHknLFxuICAgIEdFVF9DT01NSVRNRU5UUyA9ICdycGMvaWRlbnRpdHkvZ2V0SWRlbnRpdHlDb21taXRtZW50cycsXG4gICAgR0VUX0lERU5USVRJRVMgPSAncnBjL2lkZW50aXR5L2dldElkZW50aXRpZXMnLFxuICAgIEdFVF9SRVFVRVNUX1BFTkRJTkdfU1RBVFVTID0gJ3JwYy9pZGVudGl0eS9nZXRSZXF1ZXN0UGVuZGluZ1N0YXR1cycsXG4gICAgRklOQUxJWkVfUkVRVUVTVCA9ICdycGMvcmVxdWVzdHMvZmluYWxpemUnLFxuICAgIEdFVF9QRU5ESU5HX1JFUVVFU1RTID0gJ3JwYy9yZXF1ZXN0cy9nZXQnLFxuICAgIFNFTUFQSE9SRV9QUk9PRiA9ICdycGMvcHJvdG9jb2xzL3NlbWFwaG9yZS9nZW5Qcm9vZicsXG4gICAgUkxOX1BST09GID0gJ3JwYy9wcm90b2NvbHMvcmxuL2dlblByb29mJyxcbiAgICBOUkxOX1BST09GID0gJ3JwYy9wcm90b2NvbHMvbnJsbi9nZW5Qcm9vZicsXG4gICAgRFVNTVlfUkVRVUVTVCA9ICdycGMvcHJvdG9jb2xzL3NlbWFwaG9yZS9kdW1teVJldXFlc3QnLFxuICAgIFJFUVVFU1RfQUREX1JFTU9WRV9BUFBST1ZBTCA9ICdycGMvaG9zdHMvcmVxdWVzdCcsXG4gICAgQVBQUk9WRV9IT1NUID0gJ3JwYy9ob3N0cy9hcHByb3ZlJyxcbiAgICBJU19IT1NUX0FQUFJPVkVEID0gJ3JwYy9ob3N0cy9pc0hvc3RBcHByb3ZlJyxcbiAgICBHRVRfSE9TVF9QRVJNSVNTSU9OUyA9ICdycGMvaG9zdHMvZ2V0SG9zdFBlcm1pc3Npb25zJyxcbiAgICBTRVRfSE9TVF9QRVJNSVNTSU9OUyA9ICdycGMvaG9zdHMvc2V0SG9zdFBlcm1pc3Npb25zJyxcbiAgICBSRU1PVkVfSE9TVCA9ICdycGMvaG9zdHMvcmVtb3ZlJyxcbiAgICBDTE9TRV9QT1BVUCA9ICdycGMvcG9wdXAvY2xvc2UnLFxuICAgIC8vIERFViBSUENTXG4gICAgQ0xFQVJfQVBQUk9WRURfSE9TVFMgPSAncnBjL2hvc3RzL2NsZWFyJ1xufVxuZXhwb3J0IGRlZmF1bHQgUlBDQWN0aW9uXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvY29udGVudHNjcmlwdHMvaW5qZWN0ZWQudHNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=