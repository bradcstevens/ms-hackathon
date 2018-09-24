import { HttpOperationResponse } from "../httpOperationResponse";
import { WebResource } from "../webResource";
import { BaseRequestPolicy, RequestPolicy, RequestPolicyCreator, RequestPolicyOptions } from "./requestPolicy";
export declare function msRestUserAgentPolicy(userAgentInfo: Array<string>): RequestPolicyCreator;
export declare class MsRestUserAgentPolicy extends BaseRequestPolicy {
    userAgentInfo: Array<string>;
    constructor(nextPolicy: RequestPolicy, options: RequestPolicyOptions, userAgentInfo: Array<string>);
    tagRequest(request: WebResource): void;
    addUserAgentHeader(request: WebResource): void;
    sendRequest(request: WebResource): Promise<HttpOperationResponse>;
}
