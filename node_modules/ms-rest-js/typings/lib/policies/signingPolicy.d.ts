import { ServiceClientCredentials } from "../credentials/serviceClientCredentials";
import { HttpOperationResponse } from "../httpOperationResponse";
import { WebResource } from "../webResource";
import { BaseRequestPolicy, RequestPolicyCreator, RequestPolicy, RequestPolicyOptions } from "./requestPolicy";
export declare function signingPolicy(authenticationProvider: ServiceClientCredentials): RequestPolicyCreator;
export declare class SigningPolicy extends BaseRequestPolicy {
    authenticationProvider: ServiceClientCredentials;
    constructor(nextPolicy: RequestPolicy, options: RequestPolicyOptions, authenticationProvider: ServiceClientCredentials);
    signRequest(request: WebResource): Promise<WebResource>;
    sendRequest(request: WebResource): Promise<HttpOperationResponse>;
}
