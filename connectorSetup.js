module.exports = () => {
    const restify = require("restify");
    const botbuilder_azure = require("botbuilder-azure");
    const teams = require("botbuilder-teams");
    const builder_cognitiveservices = require("botbuilder-cognitiveservices");
    global.builder = require("botbuilder");
    global.serviceNow = require("./routes/serviceNow");

    // Create chat connector for communicating with the Bot Framework Service
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

    // Recognizer and and Dialog for GA QnAMaker service
    qnaRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
        knowledgeBaseId: process.env.QnAKnowledgebaseId,
        authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey, // Backward compatibility with QnAMaker (Preview)
        endpointHostName: process.env.QnAEndpointHostName
    });

    const model =
        "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/" +
        process.env.LuisId +
        "?subscription-key=" +
        process.env.LuisKey +
        "&verbose=true&timezoneOffset=-8.0&q=";

    const luisRecognizer = new builder.LuisRecognizer(model);

    global.basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
        recognizers: [qnaRecognizer],
        defaultMessage: 'No match! Try changing the query terms!',
        qnaThreshold: 0.3
    });

    global.intents = new builder.IntentDialog({
        recognizers: [luisRecognizer, qnaRecognizer],
        recognizeOrder: builder.RecognizeOrder.series
    });

    const stripBotAtMentions = new teams.StripBotAtMentions();

    bot.use(stripBotAtMentions);

    // Listen for messages from users 
    server.post('/api/messages', connector.listen());
}