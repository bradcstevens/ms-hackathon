module.exports = () => {
    const restify = require("restify");
    const botbuilder_azure = require("botbuilder-azure");
    const teams = require("botbuilder-teams");
    global.builder = require("botbuilder");
    global.serviceNow = require("./routes/serviceNow");
    require("./recognizers/luis/luisRecognizer")();
    require("./recognizers/qnaMaker/qnaRecognizer")();

    global.adalConfig = {
        'clientId' : process.env.AadClientId, // The client Id retrieved from the Azure AD App
        'clientSecret' : process.env.AadClientSecret, // The client secret retrieved from the Azure AD App
        'authorityHostUrl' : 'https://login.microsoftonline.com/', // The host URL for the Microsoft authorization server
        'tenant' : process.env.Tenant, // The tenant Id or domain name (e.g mydomain.onmicrosoft.com)
        'redirectUri' : process.env.redirectUri, // This URL will be used for the Azure AD Application to send the authorization code.
        'resource' : process.env.Resource, // The resource endpoint we want to give access to (in this case, SharePoint Online)
    }
    
    adalConfig.authorityUrl = adalConfig.authorityHostUrl + adalConfig.tenant;
    adalConfig.templateAuthzUrl =  adalConfig.authorityUrl +
    '/oauth2/authorize?response_type=code&client_id=' + // Optionally, we can get an Open Id Connect id_token to get more info on the user (some additional parameters are required if so https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-protocols-openid-connect-code)
    adalConfig.clientId + 
    '&state=<state>&resource=' + 
    adalConfig.resource + 
    '&response_mode=post_form' + //We want response as POST http request (see callback to see why)
    '&redirect_uri=' + adalConfig.redirectUri  // If not specified, the adalConfigured reply URL of the Azure AD App will be used tor for communicating with the Bot Framework Service
    const connector = new builder.ChatConnector({
        appId: process.env.MicrosoftAppId,
        appPassword: process.env.MicrosoftAppPassword,
        openIdMetadata: process.env.BotOpenIdMetadata
    });

    const tableName = 'MrMeeseeksData';
    const azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env.StorageAccountConnectionString);
    const tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

    // Setup Restify Server
    const server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, () => {
        console.log("%s listening to %s", server.name, server.url);
    });

    // Create your bot with a function to receive messages from the user
    global.bot = new builder.UniversalBot(connector).set('storage', tableStorage);

    global.intents = new builder.IntentDialog({
        recognizers: [luisRecognizer, qnaRecognizer],
        recognizeOrder: builder.RecognizeOrder.series
    });

    const stripBotAtMentions = new teams.StripBotAtMentions();

    bot.use(stripBotAtMentions);

    // Listen for messages from users 
    server.post('/api/messages', connector.listen());

    server.post('/api/oauthcallback', (req, res, next) => {

        // Get the authorization code from the Azure AD application
        let authorizationCode = req.params.code;
        if(authorizationCode) {
    
            acquireTokenWithAuthorizationCode(authorizationCode).then((response) => {
    
                // Add the state to the response to validate the CSRF scenario
                // The state has two utilities here:
                // - Reconnect with the bot to continue dialog
                // - Avoid CRSF attacks
                let state = req.params.state;
                if (state) {
                    
                    var address = JSON.parse(state);
                    response.state = state;
    
                    // Continue the dialog with the bot. Be careful, beginDialog" starts a new conversation.
                    // We use the state parameter to save the address and be able to reconnect with the bot after authentication
                    // Special thanks to this blog post https://dev-hope.blogspot.ca/2016/09/google-oauth-using-nodejs-and-microsoft.html
                    // https://docs.botframework.com/en-us/node/builder/chat/UniversalBot/#navtitle ==> See paragraph "Saving Users Address"
                    bot.beginDialog(address, "/oauth-success", response);
                }
            
                let body = '<html><body>Authentication succeeded! You can now close this tab</body></html>';
                res.send(200, body, { 'Content-Length': Buffer.byteLength(body), 'Content-Type': 'text/html' });
                res.end();
    
            }).catch((errorMessage) => {
                
                let body = '<html><body>' + errorMessage + '</body></html>';
                res.send(200, body, { 'Content-Length': Buffer.byteLength(body), 'Content-Type': 'text/html' });
                res.end();
            });
            
        } else {
    
            let body = '<html><body>Something went wrong, we didn\'t get an authorization code</body></html>';
            res.send(200, body, { 'Content-Length': Buffer.byteLength(body), 'Content-Type': 'text/html' });
            res.end();
        }
    });
    


   



    
}