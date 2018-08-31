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
    const tableName = 'msteamsdemobotdata';
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

    bot.set('persistUserData', false);

    const RedisStore = require('connect-redis')(session);
    const redisClient = require('redis').createClient(6380, process.env.REDISCACHEHOSTNAME,
    {auth_pass: process.env.REDISCACHEKEY, tls: {servername: process.env.REDISCACHEHOSTNAME}});

    const redisOptions = { 
        client: redisClient, 
        no_ready_check: true,
        ttl: 600,
        logErrors: true
};

    const redisSessionStore = new RedisStore(redisOptions);
    // Listen for messages from users 
    server.post('/api/messages', connector.listen());
    server.get('/code', restify.plugins.serveStatic({
        'directory': path.join(__dirname, 'public'),
        'file': 'code.html'
    }));

    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.bodyParser());
    server.use(expressSession({ 
        secret: botAuthSecret, 
        resave: true, 
        store: redisSessionStore, 
        saveUninitialized: true 
    }));
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