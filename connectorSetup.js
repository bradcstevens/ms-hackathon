module.exports = () => {
    const path = require('path');
    const botauth = require("botauth");
    const restify = require("restify");
    const teams = require("botbuilder-teams");
    const botbuilder_azure = require("botbuilder-azure");
    global.builder = require("botbuilder");
    global.serviceNow = require("./routes/serviceNow");
    const expressSession = require('express-session');
    const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
    require("./recognizers/luis/luisRecognizer")();
    require("./recognizers/qnaMaker/qnaRecognizer")();
    const botAuthSecret = process.env.botAuthSecret;
    const tableName = 'MrMeeseeksData';
    const azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env.StorageAccountConnectionString);
    const tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

    // Setup Restify Server
    const server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, () => {
        console.log("%s listening to %s", server.name, server.url);
    });



    // Create chat connector for communicating with the Bot Framework Service
    const connector = new builder.ChatConnector({
        appId: process.env.MicrosoftAppId,
        appPassword: process.env.MicrosoftAppPassword,
        openIdMetadata: process.env.BotOpenIdMetadata
    });

    const teamsConnector = new teams.TeamsChatConnector({
        appId: process.env.MicrosoftAppId,
        appPassword: process.env.MicrosoftAppPassword,
    });

    // Create your bot with a function to receive messages from the user
    global.bot = new builder.UniversalBot(connector).set('storage', tableStorage);



    global.intents = new builder.IntentDialog({
        recognizers: [luisRecognizer, qnaRecognizer],
        recognizeOrder: builder.RecognizeOrder.series
    });

    const stripBotAtMentions = new teams.StripBotAtMentions();

    bot.use(stripBotAtMentions);

    bot.on('conversationUpdate', (message) => {
        if (message.membersAdded && message.membersAdded.length > 0) {
            
            let membersAdded = message.membersAdded
                .map( (m) =>{
                    let isSelf = m.id === message.address.bot.id;
                    return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
                })
                .join(',');
            let user = {
                id: message.address.user.id,
                name: message.address.user.name
            }
            console.log(user);
            let mention = new teams.UserMention(user);
            bot.send(new teams.TeamsMessage()
                .addEntity(mention)
                .text(mention.text + 'Welcome ' + teams.TeamsMessage.getTenantId(message))
                .address(message.address)
                );
            }
            
            if (message.membersRemoved && message.membersRemoved.length > 0) {
                var membersRemoved = message.membersRemoved
                    .map(function (m) {
                        var isSelf = m.id === message.address.bot.id;
                        return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
                    })
                    .join(', ');
        
                bot.send(new builder.Message()
                    .address(message.address)
                    .text('The following members ' + membersRemoved + ' were removed or left the conversation :('));
            }
    });

    // Listen for messages from users 
    server.post('/api/messages', connector.listen());
    server.get('/code', restify.plugins.serveStatic({
        'directory': path.join(__dirname, 'public'),
        'file': 'code.html'
    }));
    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.bodyParser());
    server.use(expressSession({ secret: botAuthSecret, resave: true, saveUninitialized: false }));
    //server.use(passport.initialize());

    ba = new botauth.BotAuthenticator(server, bot, {
        session: true,
        baseUrl: process.env.botBaseUrl,
        secret: process.env.botAuthSecret,
        successRedirect: '/code'
    });

    ba.provider("aadv2", (options) => {
        // Use the v2 endpoint (applications configured by apps.dev.microsoft.com)
        // For passport-azure-ad v2.0.0, had to set realm = 'common' to ensure authbot works on azure app service
        let oidStrategyv2 = {
            redirectUrl: options.callbackURL, //  redirect: /botauth/aadv2/callback
            realm: process.env.realm,
            clientID: process.env.AadClientId,
            clientSecret: process.env.AadClientSecret,
            identityMetadata: 'https://login.microsoftonline.com/' + process.env.realm + '/v2.0/.well-known/openid-configuration',
            skipUserProfile: false,
            validateIssuer: false,
            //allowHttpForRedirectUrl: true,
            responseType: 'code',
            responseMode: 'query',
            scope: ['email', 'profile', 'offline_access', 'https://outlook.office.com/mail.read'],
            passReqToCallback: true
        };

        let strategy = oidStrategyv2;

        return new OIDCStrategy(strategy,
            (req, iss, sub, profile, accessToken, refreshToken, done) => {
                if (!profile.displayName) {
                    return done(new Error("No oid found"), null);
                }
                profile.accessToken = accessToken;
                profile.refreshToken = refreshToken;
                done(null, profile);
            });
    });


}