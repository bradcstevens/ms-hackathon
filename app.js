var restify = require('restify');
var builder = require('botbuilder');
var cognitiveServices = require('botbuilder-cognitiveservices');
var https = require('https');
var serviceNow = require("./dialogs/serviceNow");
var axios = require("axios");
var dotenv = require("dotenv");
var uuid = require("uuid");
dotenv.load();

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector instance
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID, //process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD, //    process.env.MICROSOFT_APP_PASSWORD,
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Bot instance, pass in the connector to receive messages from the user
var bot = new builder.UniversalBot(connector, {
    storage: new builder.MemoryBotStorage()
});

//=========================================================
// Recognizers
//=========================================================

var qnarecognizer = new cognitiveServices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QNA_KNOWLEDGE_BASE_ID,
    subscriptionKey: process.env.QNA_SUBSCRIPTION_KEY
});

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/' + process.env.LUIS_ID + '?subscription-key=' + process.env.LUIS_KEY + '&verbose=true&timezoneOffset=-8.0&q=';

var recognizer = new builder.LuisRecognizer(model);

//=========================================================
// Register QnAMakerTools Library to enable the feedback dialog
//=========================================================

var qnaMakerTools = new cognitiveServices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());

//=========================================================
// Bot Dialogs
//=========================================================

var intents = new builder.IntentDialog({ recognizers: [recognizer, qnarecognizer] });
bot.dialog('/', intents);

intents.matches('Greeting', builder.DialogAction.beginDialog('/hello'));

intents.matches('CreateTicket', builder.DialogAction.beginDialog('/createTicket'));

intents.matches('UpdateTicket', builder.DialogAction.beginDialog('/updateTicket'));

intents.matches('SearchKb', builder.DialogAction.beginDialog('/SearchKb'));

intents.matches('ThankYou', builder.DialogAction.beginDialog('/thankYou'));

intents.matches('qna', builder.DialogAction.beginDialog('/QnA'));

intents.onDefault([
    function(session) {
        session.send("Oops! I didn't understand your question, " + session.message.user.name + ". I may not have the answer right now, but you could always try to rephrase your question and I'll try again to find you an answer!");
    }
]);

var basicQnAMakerDialog = new cognitiveServices.QnAMakerDialog({
    recognizers: [qnarecognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.4,
    feedbackLib: qnaMakerTools
});

// override
basicQnAMakerDialog.respondFromQnAMakerResult = function(session, qnaMakerResult) {
    // Save the question
    var question = session.message.text;
    session.conversationData.userQuestion = question;

    // boolean to check if the result is formatted for a card
    var isCardFormat = qnaMakerResult.answers[0].answer.includes(';');
    console.log(isCardFormat);
    if (!isCardFormat) {
        // Not semi colon delimited, send a normal text response 
        session.send(qnaMakerResult.answers[0].answer);
    } else if (qnaMakerResult.answers && qnaMakerResult.score >= 0.5) {

        var qnaAnswer = qnaMakerResult.answers[0].answer;

        var qnaAnswerData = qnaAnswer.split(';');
        var title = qnaAnswerData[0];
        var description = qnaAnswerData[1];
        var url = qnaAnswerData[2];
        var imageURL = qnaAnswerData[3];

        var msg = new builder.Message(session)
        msg.attachments([
            new builder.HeroCard(session)
            .title(title)
            .subtitle(description)
            .images([builder.CardImage.create(session, imageURL)])
            .buttons([
                builder.CardAction.openUrl(session, url, "Learn More")
            ])
        ]);
    }
    session.send(msg).endDialog();
}

basicQnAMakerDialog.defaultWaitNextMessage = function(session, qnaMakerResult) {
    // saves the user's question
    session.conversationData.userQuestion = session.message.text;

    if (!qnaMakerResult.answers) {
        let msg = new builder.Message(session)
            .addAttachment({
                contentType: "application/vnd.microsoft.card.adaptive",
                content: {
                    type: "AdaptiveCard",
                    body: [{
                            "type": "TextBlock",
                            "text": `${session.conversationData.userQuestion}`,
                            "size": "large",
                            "weight": "bolder",
                            "color": "accent",
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": `Sorry, no answer found in QnA service`,
                            "size": "large",
                            "weight": "regular",
                            "color": "dark",
                            "wrap": true
                        }
                    ]
                }
            });
        session.send(msg);
    }
    session.endDialog();
}

bot.dialog('/QnA', basicQnAMakerDialog);


bot.dialog('/hello', [
    (session, results, next) => {
        session.send("Hi! I'm Mr. Meeseeks! Look at me!")
        session.send("Mr. Meeseeks was not born into this world fumbling for meaning, " + session.message.user.name + "! I was created to serve a singular purpose for which I will go to any lengths to fufill!")
        session.send("Go ahead! Ask me a question!")
        session.replaceDialog('/')
    }
]).triggerAction({
    matches: "Greeting",
}).endConversationAction(
    "endHello", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^exit$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/thankYou', [
    (session, results, next) => {
        session.send("Of course," + session.message.user.name + "! I was created to serve a singular purpose for which I will go to any lengths to fufill!")
        session.send("Just holler if you need anything else!")
        session.replaceDialog('/')
    }
]).triggerAction({
    matches: "ThankYou",
});

bot.dialog('/specifyCredentials', [
    (session, results, next) => {
        builder.Prompts.text(session, "What is the first name you use to log in to Service Now?")
    },
    (session, results, next) => {
        session.dialogData.firstName = results.response;
        builder.Prompts.text(session, "Thanks! And your last name?")
    },
    (session, results, next) => {
        session.dialogData.lastName = results.response;
        serviceNow.getUserRecord(session.dialogData.firstName, session.dialogData.lastName)
            .then((res) => {
                session.userData.caller_id = res.data.result[0].sys_id;
                session.send(`Thanks, ${session.dialogData.firstName}`)
                session.endDialog();
            })
            .catch((err) => {
                session.send("Hmm, I can't find your user account with those credentials. Let's try again.")
                session.replaceDialog('/specifyCredentials')
            })
    }
])

bot.dialog('/login', [
    (session, args, next) => {
        if (session.message.address.channelId === "msteams") {
            //There are 2 steps to get the user info from a chat
            //1. Get an access token
            //2. Use the access token to pull the user
            let appId = process.env.MICROSOFT_APP_ID
            let appPassword = process.env.MICROSOFT_APP_PASSWORD
            var tokenUrl = `https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token`;
            var tokenBody = `grant_type=client_credentials&client_id=${appId}&client_secret=${appPassword}&scope=https://api.botframework.com/.default`
            var tokenConfig = {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Host": "login.microsoftonline.com"
                },
            };
            //This request will return the access token
            axios.post(tokenUrl, tokenBody, tokenConfig)
                .then((res) => {
                    let accessToken = res.data.access_token;
                    let root = session.message.address.serviceUrl;
                    let conversationID = session.message.address.conversation.id;
                    let route = root.concat(`/v3/conversations/${conversationID}/members`);
                    var authorizedConfig = {
                        headers: {
                            "Authorization": `Bearer ${accessToken}`
                        },
                    };
                    //This request will return the user
                    axios.get(route, authorizedConfig)
                        .then((res) => {
                            //RESULTANT PAYLOAD - 
                            // [{ id: '29:1GEnGoPgXQBlHio0KwoUwxhqLfMAvdLQXpFOn7PEIsBjrKBgnYmwJeepucBpCT6fSkCQF7LXW2IWqJgnT3lYiyw',
                            // objectId: 'c49fe892-7d11-4ef8-a551-a755a2471b4a',
                            // name: 'Lucas Huet-Hudson',
                            // givenName: 'Lucas',
                            // surname: 'Huet-Hudson',
                            // email: 'lucashh@microsoft.com',
                            // userPrincipalName: 'lucashh@microsoft.com' } ]
                            let firstName = res.data[0].givenName;
                            let lastName = res.data[0].surname;
                            serviceNow.getUserRecord(firstName, lastName)
                                .then((res) => {
                                    session.userData.caller_id = res.data.result[0].sys_id;
                                    session.endDialog();
                                })
                                .catch((err) => {
                                    session.send("Hmm, I can't find your user account with your teams credentials.")
                                    session.replaceDialog('/specifyCredentials')
                                })
                        })
                        .catch((err) => {
                            session.send("Hmm, I can't find your user account with your teams credentials.")
                            session.replaceDialog('/specifyCredentials')
                        })
                })
        } else {
            session.replaceDialog('/specifyCredentials')
        }
    },
]);

bot.dialog('/serviceNow', [
    (session, results, next) => {
        if (!session.userData.caller_id) {
            session.beginDialog('/login')
        } else {
            next()
        }
    },
    (session, results, next) => {
        builder.Prompts.choice(session, "Ok! Let's narrow things down. What would you like to do?", ["Create a new ServiceNow Ticket", "Update a ServiceNow Ticket", "Delete a ServiceNow Ticket", "List all of your ServiceNow Tickets"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        if (results.response.entity === "Create a new ServiceNow Ticket") {
            session.send("Create a new ServiceNow Ticket? Oooo yeah, caan doo!")
            session.replaceDialog('/createTicket')
        } else if (results.response.entity === "Update a ServiceNow Ticket") {
            session.send("Update a new ServiceNow Ticket? Oooo yeah, caan doo!")
            session.replaceDialog('/updateTicket')
        } else if (results.response.entity === "Delete a ServiceNow Ticket") {
            session.send("Delete a ServiceNow Ticket? Oooo yeah, caan doo!")
            session.replaceDialog('/deleteTicket')
        } else if (results.response.entity === "List all of your ServiceNow Tickets") {
            session.send("List all of your ServiceNow Tickets? Oooo yeah, caan doo!")
            session.replaceDialog('/listTickets')
        } else {
            session.endDialog();
        }
    },
]).triggerAction({
    matches: "Hello",
}).endConversationAction(
    "endHello", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^exit$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/createTicket', [
    (session, results, next) => {
        if (!session.userData.caller_id) {
            session.beginDialog('/login')
        } else {
            next()
        }
    },
    (session, results, next) => {
        builder.Prompts.text(session, "Can you give me a description of the problem?")
    },
    (session, results, next) => {
        session.dialogData.short_description = results.response;
        builder.Prompts.choice(session, "Got it! How urgent is this issue to you?", ["High", "Medium", "Low"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        session.dialogData.urgency = results.response.entity;
        builder.Prompts.choice(session, "Would you like to add any additional notes?", ["Yes", "No"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        if (results.response.entity === "Yes") {
            builder.Prompts.text(session, "What other notes should I add to the ticket?")
        } else {
            session.send("Thanks! I was successfully able to submit your issue as an incident in ServiceNow. Please check the incident portal https://dev37410.service-now.com/nav_to.do?uri=%2Fincident_list.do")
            serviceNow.createTicket(session.dialogData, session.userData.caller_id)
                .then((res) => {
                    session.endDialog();
                }).catch((err) => {
                    console.log("ERR", err)
                })
        }
    },
    (session, results, next) => {
        session.send("Thanks! I was successfully able to submit your issue as an incident in ServiceNow. Please check the incident portal https://dev37410.service-now.com/nav_to.do?uri=%2Fincident_list.do")
        session.dialogData.notes = results.response;
        serviceNow.createTicket(session.dialogData, session.userData.caller_id)
            .then((res) => {
                session.endDialog();
            })
    }
]).triggerAction({
    matches: "CreateTicket",
}).endConversationAction(
    "endTicketCreate", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^exit$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/SearchKb', [
    (session, results, next) => {
        if (!session.userData.caller_id) {
            session.beginDialog('/login')
        } else {
            next()
        }
    },
    (session, args, next) => {
        builder.Prompts.text(session, "What would you like to search for?")
    },
    (session, results, next) => {
        session.dialogData.searchQuery = results.response;
        serviceNow.searchKb(session.dialogData.searchQuery)
            .then((res) => {
                session.dialogData.searchResults = res.data.result
                session.send("Here's what I found:")
                let feed = session.dialogData.searchResults
                let msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel);
                feed.forEach(function(result, i) {
                    let url = `https://dev37410.service-now.com/kb_view.do?sysparm_article=${result.number}`
                    msg.addAttachment(
                        new builder.HeroCard(session)
                        .title(result.short_description)
                        .text(result.number)
                        .buttons([
                            builder.CardAction.openUrl(session, url, "Learn More")
                        ])
                    );
                })
                session.endDialog(msg);
            })
    }
]).triggerAction({
    matches: "SearchKb",
}).endConversationAction(
    "endSearchKb", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^exit$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/updateTicket', [
    (session, results, next) => {
        if (!session.userData.caller_id) {
            session.beginDialog('/login')
        } else {
            next()
        }
    },
    (session, args, next) => {
        builder.Prompts.text(session, "What is the number of the ticket you'd like to update?");
    },
    (session, results, next) => {
        session.dialogData.ticketNumber = results.response;
        session.send("Let me fetch that ticket for you.");
        serviceNow.getTicketByNumber(session.dialogData.ticketNumber)
            .then((res) => {
                session.dialogData.ticketID = res.data.result[0].sys_id;
                builder.Prompts.choice(session, "What field would you like to modify?", ["Work Notes", "State"], { listStyle: builder.ListStyle.button })
            })
    },
    (session, results, next) => {
        if (results.response.entity === "State") {
            builder.Prompts.choice(session, "What shall I change the state to?", ["New", "In Process", "On Hold", "Resolved", "Closed", "Canceled"], { listStyle: builder.ListStyle.button })
        } else {
            builder.Prompts.text(session, "Please enter the notes you wish to add")
        }
    },
    (session, results, next) => {
        session.dialogData.notes = results.response;
        serviceNow.updateTicket(session.dialogData.ticketID, session.dialogData.notes, session.userData.caller_id)
            .then((res) => {
                session.send("Success!")
                session.endDialog();
            })
    }

]).triggerAction({
    matches: "UpdateTicket",
}).endConversationAction(
    "endTicketUpdate", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^exit$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/listTickets', [
    (session, results, next) => {
        if (!session.userData.caller_id) {
            session.beginDialog('/login')
        } else {
            next()
        }
    },
    (session, args, next) => {
        session.send("Great, lets look at your open tickets.")
    },
]).triggerAction({
    matches: "ListTickets",
}).endConversationAction(
    "endTicketList", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^exit$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/reOpenTicket', [
    (session, results, next) => {
        if (!session.userData.caller_id) {
            session.beginDialog('/login')
        } else {
            next()
        }
    },
    (session, args, next) => {
        session.send("Great, I see that you want to re-open a ticket")
        builder.Prompts.text(session, "What ticket number would you like to re-open?")
    },
    (session, results, next) => {
        session.dialogData.number = results.response;
        builder.Prompts.choice(session, "Would you like to add any notes to the ticket?", ["Yes", "No"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        if (results.response.entity === "Yes") {
            builder.Prompts.text(session, "Go ahead")
        } else {
            serviceNow.reOpenTicket(session.dialogData)
                .then((res) => {
                    session.endDialog();
                }).catch((err) => {
                    console.log("ERR", err)
                })
        }
    },
    (session, results, next) => {
        session.dialogData.notes = results.response;
        session.dialogData.caller_id = session.userData.caller_id;
        serviceNow.reOpenTicket(session.dialogData)
            .then((res) => {
                console.log("Re-opened", res)
                session.endDialog();
            })
    }
]).triggerAction({
    matches: "ReOpenTicket",
}).endConversationAction(
    "endTicketReOpen", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^exit$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/closeTicket', [
    (session, results, next) => {
        if (!session.userData.caller_id) {
            session.beginDialog('/login')
        } else {
            next()
        }
    },
    (session, args, next) => {
        session.send("Awesome, I see that you want to close a ticket")
        builder.Prompts.text(session, "What ticket number would you like to close?")
    },
    (session, results, next) => {
        session.dialogData.number = results.response;
        builder.Prompts.choice(session, "Would you like to add any notes to the ticket?", ["Yes", "No"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        if (results.response.entity === "Yes") {
            builder.Prompts.text(session, "Go ahead")
        }
    },
    (session, results, next) => {
        session.dialogData.close_notes = results.response;
        // Change this to pull resolution codes from SN?
        builder.Prompts.choice(session, "What is the Resolution Code?", ["Solved (Work Around)", "Solved (Permanently)", "Solved Remotely (Work Around)", "Solved Remotely (Permanently)", "Not Solved (Not Reproducible)", "Not Solved (Too Costly)", "Closed/Resolved by Caller"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        session.dialogData.caller_id = session.userData.caller_id;
        session.dialogData.close_code = results.response.entity;
        serviceNow.closeTicket(session.dialogData)
            .then((res) => {
                console.log("Ticket closed", res)
                session.endDialog();
            })
    }
]).triggerAction({
    matches: "CloseTicket",
}).endConversationAction(
    "endTicketClose", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^exit$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/None', [
    (session, results, next) => {
        session.send("Uh oh! I'm not sure I understood what you said. I may not be able to respond to your input, but you could always try to re-phrase what you said!")
        session.beginDialog("/")
    }
]).triggerAction({
    matches: "None",
})