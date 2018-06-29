module.exports = () => {
    const restify = require("restify");
    const botauth = require("botauth");
    const botbuilder_azure = require("botbuilder-azure");
    const teams = require("botbuilder-teams");
    const path = require('path');
    const expressSession = require('express-session');
    global.builder = require("botbuilder");
    global.serviceNow = require("./routes/serviceNow");
    require("./recognizers/luis/luisRecognizer")();
    require("./recognizers/qnaMaker/qnaRecognizer")();

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

    // Create your bot with a function to receive messages from the user
    global.bot = new builder.UniversalBot(connector).set('storage', tableStorage);

    ba = new botauth.BotAuthenticator(server, bot, {
        session: true,
        baseUrl: "https://localhost",
        secret: process.env.botAuthSecret,
        successRedirect: '/code'
    });

    global.intents = new builder.IntentDialog({
        recognizers: [luisRecognizer, qnaRecognizer],
        recognizeOrder: builder.RecognizeOrder.series
    });

    const stripBotAtMentions = new teams.StripBotAtMentions();

    bot.use(stripBotAtMentions);

    // Listen for messages from users 
    server.post('/api/messages', connector.listen());
    server.get('/code', restify.plugins.serveStatic({
        'directory': path.join(__dirname, 'public'),
        'file': 'code.html'
    }));
    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.bodyParser());

    //server.use(passport.initialize());



}