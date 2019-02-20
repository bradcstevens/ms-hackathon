"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var utils = require("../util/utils");
var requestPolicy_1 = require("./requestPolicy");
function generateClientRequestIdPolicy(requestIdHeaderName) {
    if (requestIdHeaderName === void 0) { requestIdHeaderName = "x-ms-client-request-id"; }
    return function (nextPolicy, options) {
        return new GenerateClientRequestIdPolicy(nextPolicy, options, requestIdHeaderName);
    };
}
exports.generateClientRequestIdPolicy = generateClientRequestIdPolicy;
var GenerateClientRequestIdPolicy = /** @class */ (function (_super) {
    tslib_1.__extends(GenerateClientRequestIdPolicy, _super);
    function GenerateClientRequestIdPolicy(nextPolicy, options, _requestIdHeaderName) {
        var _this = _super.call(this, nextPolicy, options) || this;
        _this._requestIdHeaderName = _requestIdHeaderName;
        return _this;
    }
    GenerateClientRequestIdPolicy.prototype.sendRequest = function (request) {
        if (!request.headers.contains(this._requestIdHeaderName)) {
            request.headers.set(this._requestIdHeaderName, utils.generateUuid());
        }
        return this._nextPolicy.sendRequest(request);
    };
    return GenerateClientRequestIdPolicy;
}(requestPolicy_1.BaseRequestPolicy));
exports.GenerateClientRequestIdPolicy = GenerateClientRequestIdPolicy;
//# sourceMappingURL=generateClientRequestIdPolicy.js.map