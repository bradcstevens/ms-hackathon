import { HttpOperationResponse } from "../httpOperationResponse";
import { WebResource } from "../webResource";
import { BaseRequestPolicy, RequestPolicy, RequestPolicyCreator, RequestPolicyOptions } from "./requestPolicy";
export declare function generateClientRequestIdPolicy(requestIdHeaderName?: string): RequestPolicyCreator;
export declare class GenerateClientRequestIdPolicy extends BaseRequestPolicy {
    private _requestIdHeaderName;
    constructor(nextPolicy: RequestPolicy, options: RequestPolicyOptions, _requestIdHeaderName: string);
    sendRequest(request: WebResource): Promise<HttpOperationResponse>;
}
