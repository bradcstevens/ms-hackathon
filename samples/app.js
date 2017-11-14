let restify = require('restify');
let builder = require('botbuilder');
var teams = require("botbuilder-teams");
var serviceNow = require("./serviceNow");

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

//Setup Bot
let connector = new builder.ChatConnector({
    appId: null,
    appPassword: null
});

let bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

let model = null;
bot.recognizer(new builder.LuisRecognizer(model));

//Dialogs
bot.dialog('/', [
    (session, args, next) => {
        session.send("working")
    },
])

bot.dialog('/createTicket', [
    (session, args, next) => {
        session.send("you said hello!")
    },
]).triggerAction({
    matches: "CreateTicket",
});