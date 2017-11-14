require('dotenv').config()
var builder = require('botbuilder');
var restify = require('restify');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

console.log(process.env)

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, '/');

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/' + process.env.LUIS_ID + '?subscription-key=' + process.env.LUIS_KEY + '&verbose=true&timezoneOffset=0&q='
var recognizer = new builder.LuisRecognizer(model)
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

myObj = { 'username': 'null', 'createTicket': 'null', 'updateTicket': 'null', 'reopenTicket': 'null', 'listTickets': 'null', 'closeTicket': 'null' };
var isDone = false;

bot.dialog('/', dialog)

    //========================
    //LUIS Dialog
    //========================

    //==========
    //Help!
    //==========
    .matches('help', helpResponse)
    .matches('greeting', helpResponse)

    //==========
    //Create Tickets
    //==========
    .matches('create', createTicket)
    .matches('new', createTicket)
    .matches('issue', createTicket)


    //==========
    //reset in event of wrong answers
    //==========
    .matches('restart', restartResponse)
    .onDefault((session, results) => {
        session.send("Sorry, I didn't understand");
    })

    //==========
    //Help!
    //==========
    function helpResponse(session)
    {
        session.send("I'm your Library Digital Assistant to help you get your issue to someone who can help. What appears to be the problem?")
    }

    //==========
    //Base issue
    //==========
    function createTicket(session)
    {
        session.send("First things first, what seems to be the problem?");
    }

    //==========
    //reset in event of wrong answers
    //==========
    function restartResponse(session)
    {
        for (x in myObj)
            {
                myObj[x] = "null";
            }
        session.send("Sorry for the mistake. We've cleared all our data again, please describe your issue again.")
    }

server.post('/api/messages', connector.listen());