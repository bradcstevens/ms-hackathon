"use strict";

var restify = require("restify");
var builder = require("botbuilder");
var cognitiveServices = require("botbuilder-cognitiveservices");
var https = require("https");
var serviceNow = require("./dialogs/serviceNow");
var axios = require("axios");
var dotenv = require("dotenv");
var uuid = require("uuid");
dotenv.load();

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log("%s listening to %s", server.name, server.url);
});

// Create chat connector instance
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID, //process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD //    process.env.MICROSOFT_APP_PASSWORD,
});

// Listen for messages from users
server.post("/api/messages", connector.listen());

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

var model =
    "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/" +
    process.env.LUIS_ID +
    "?subscription-key=" +
    process.env.LUIS_KEY +
    "&verbose=true&timezoneOffset=-8.0&q=";

var recognizer = new builder.LuisRecognizer(model);

//=========================================================
// Register QnAMakerTools Library to enable the feedback dialog
//=========================================================

var qnaMakerTools = new cognitiveServices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());

//=========================================================
// Bot Dialogs
//=========================================================

var intents = new builder.IntentDialog({
    recognizers: [recognizer, qnarecognizer]
});
bot.dialog("/", intents);

intents.matches("greeting", builder.DialogAction.beginDialog("/greeting"));

intents.matches(
    "getIncident",
    builder.DialogAction.beginDialog("/getIncident")
);

intents.matches(
    "createIncident",
    builder.DialogAction.beginDialog("/createIncident")
);

intents.matches(
    "updateIncident",
    builder.DialogAction.beginDialog("/updateIncident")
);

intents.matches(
    "resolveIncident",
    builder.DialogAction.beginDialog("/resolveIncident")
);

intents.matches(
    "reopenIncident",
    builder.DialogAction.beginDialog("/reopenIncident")
);

intents.matches(
    "searchKnowledgeBase",
    builder.DialogAction.beginDialog("/searchKnowledgeBase")
);

intents.matches(
    "serviceNowMenu",
    builder.DialogAction.beginDialog("/serviceNowMenu")
);

intents.matches("ThankYou", builder.DialogAction.beginDialog("/thankYou"));

intents.matches("qna", builder.DialogAction.beginDialog("/QnA"));

/* intents.onDefault([
    function(session) {
        session.send("Oops! I didn't understand your question, " + session.message.user.name + ". I may not have the answer right now, but you could always try to rephrase your question and I'll try again to find you an answer!");
    }
]); */

var basicQnAMakerDialog = new cognitiveServices.QnAMakerDialog({
    recognizers: [qnarecognizer],
    defaultMessage: "No match! Try changing the query terms!",
    qnaThreshold: 0.4,
    feedbackLib: qnaMakerTools
});

// override
basicQnAMakerDialog.respondFromQnAMakerResult = function(
    session,
    qnaMakerResult
) {
    // Save the question
    var question = session.message.text;
    session.conversationData.userQuestion = question;

    // boolean to check if the result is formatted for a card
    var isCardFormat = qnaMakerResult.answers[0].answer.includes(";");
    console.log(isCardFormat);
    if (!isCardFormat) {
        // Not semi colon delimited, send a normal text response
        session.send(qnaMakerResult.answers[0].answer);
    } else if (qnaMakerResult.answers && qnaMakerResult.score >= 0.5) {
        var qnaAnswer = qnaMakerResult.answers[0].answer;

        var qnaAnswerData = qnaAnswer.split(";");
        var title = qnaAnswerData[0];
        var description = qnaAnswerData[1];
        var url = qnaAnswerData[2];
        var imageURL = qnaAnswerData[3];

        var msg = new builder.Message(session);
        msg.attachments([
            new builder.HeroCard(session)
            .title(title)
            .subtitle(description)
            .images([builder.CardImage.create(session, imageURL)])
            .buttons([builder.CardAction.openUrl(session, url, "Learn More")])
        ]);
    }
    session.send(msg).endDialog();
};

basicQnAMakerDialog.defaultWaitNextMessage = function(session, qnaMakerResult) {
    // saves the user's question
    session.conversationData.userQuestion = session.message.text;

    if (!qnaMakerResult.answers) {
        var msg = new builder.Message(session).addAttachment({
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
                type: "AdaptiveCard",
                body: [{
                        type: "TextBlock",
                        text: "" + session.conversationData.userQuestion,
                        size: "large",
                        weight: "bolder",
                        color: "accent",
                        wrap: true
                    },
                    {
                        type: "TextBlock",
                        text: "Sorry, no answer found in QnA service",
                        size: "large",
                        weight: "regular",
                        color: "dark",
                        wrap: true
                    }
                ]
            }
        });
        session.send(msg);
    }
    session.endDialog();
};

bot.dialog("/QnA", basicQnAMakerDialog);

bot
    .dialog("/greeting", [
        function(session, results, next) {
            session.send("Hi! I'm Mr. Meeseeks! Look at me!");
            session.send(
                "I'm a bot that can help you manage incidents in ServiceNow!"
            );
            session.send(
                "Go ahead! Ask me a question! Try saying something like: 'What can you do?'"
            );
            session.replaceDialog("/");
        }
    ])
    .triggerAction({
        matches: "greeting"
    })
    .endConversationAction("endHello", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/thankYou", [
        function(session, results, next) {
            session.send("Of course, " + session.message.user.name + "!");
            session.replaceDialog("/");
        }
    ])
    .triggerAction({
        matches: "ThankYou"
    });

bot.dialog("/specifyCredentials", [
    function(session, results, next) {
        builder.Prompts.text(
            session,
            "What is the first name you use to log in to Service Now?"
        );
    },
    function(session, results, next) {
        session.dialogData.firstName = results.response;
        builder.Prompts.text(session, "Thanks! And your last name?");
    },
    function(session, results, next) {
        session.dialogData.lastName = results.response;
        serviceNow
            .getUserRecord(session.dialogData.firstName, session.dialogData.lastName)
            .then(function(res) {
                session.userData.caller_id = res.data.result[0].sys_id;
                session.send("Thanks, " + session.dialogData.firstName + "!");
                session.endDialog();
            })
            .catch(function(err) {
                session.send(
                    "Hmm, I can't find your user account with those credentials. Let's try again."
                );
                session.replaceDialog("/specifyCredentials");
            });
    }
]);

bot.dialog("/login", [
    function(session, args, next) {
        if (session.message.address.channelId === "msteams") {
            //There are 2 steps to get the user info from a chat
            //1. Get an access token
            //2. Use the access token to pull the user
            var appId = process.env.MICROSOFT_APP_ID;
            var appPassword = process.env.MICROSOFT_APP_PASSWORD;
            var tokenUrl =
                "https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token";
            var tokenBody =
                "grant_type=client_credentials&client_id=" +
                appId +
                "&client_secret=" +
                appPassword +
                "&scope=https://api.botframework.com/.default";
            var tokenConfig = {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Host: "login.microsoftonline.com"
                }
            };
            //This request will return the access token
            axios.post(tokenUrl, tokenBody, tokenConfig).then(function(res) {
                var accessToken = res.data.access_token;
                var root = session.message.address.serviceUrl;
                var conversationID = session.message.address.conversation.id;
                var route = root.concat(
                    "/v3/conversations/" + conversationID + "/members"
                );
                var authorizedConfig = {
                    headers: {
                        Authorization: "Bearer " + accessToken
                    }
                };
                //This request will return the user
                axios
                    .get(route, authorizedConfig)
                    .then(function(res) {
                        //RESULTANT PAYLOAD -
                        // [{ id: '29:1GEnGoPgXQBlHio0KwoUwxhqLfMAvdLQXpFOn7PEIsBjrKBgnYmwJeepucBpCT6fSkCQF7LXW2IWqJgnT3lYiyw',
                        // objectId: 'c49fe892-7d11-4ef8-a551-a755a2471b4a',
                        // name: 'Lucas Huet-Hudson',
                        // givenName: 'Lucas',
                        // surname: 'Huet-Hudson',
                        // email: 'lucashh@microsoft.com',
                        // userPrincipalName: 'lucashh@microsoft.com' } ]
                        var firstName = res.data[0].givenName;
                        var lastName = res.data[0].surname;
                        serviceNow
                            .getUserRecord(firstName, lastName)
                            .then(function(res) {
                                session.userData.caller_id = res.data.result[0].sys_id;
                                session.userData.user_name = res.data.result[0].user_name;
                                session.endDialog();
                            })
                            .catch(function(err) {
                                session.send(
                                    "Hmm, I can't find your user account with your teams credentials."
                                );
                                session.replaceDialog("/specifyCredentials");
                            });
                    })
                    .catch(function(err) {
                        session.send(
                            "Hmm, I can't find your user account with your teams credentials."
                        );
                        session.replaceDialog("/specifyCredentials");
                    });
            });
        } else {
            session.replaceDialog("/specifyCredentials");
        }
    }
]);

bot
    .dialog("/serviceNowMenu", [
        function(session) {
            var card = new builder.ThumbnailCard(session)
                .title("ServiceNow")
                .text("Here's a few things I can do:")
                .buttons([
                    builder.CardAction.imBack(
                        session,
                        "Get Incidents",
                        "View recently created ServiceNow Incidents"
                    ),
                    builder.CardAction.imBack(
                        session,
                        "Create a new ServiceNow Incident",
                        "Create a new ServiceNow Incident"
                    ),
                    builder.CardAction.imBack(
                        session,
                        "Update Incident",
                        "Add comments to a ServiceNow Incident"
                    ),
                    builder.CardAction.imBack(
                        session,
                        "Resolve Incident",
                        "Resolve your ServiceNow Incident"
                    ),
                    builder.CardAction.imBack(
                        session,
                        "Search for a Knowledge Article",
                        "Search for a Knowledge Article"
                    )
                ]);
            var message = new builder.Message(session).addAttachment(card);
            session.endConversation(message);
        }
    ])
    .triggerAction({
        matches: "serviceNowMenu"
    })
    .endConversationAction("endGreeting", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/createIncident", [
        function(session, results, next) {
            if (!session.userData.caller_id) {
                session.beginDialog("/login");
            } else {
                next();
            }
        },
        function(session, results, next) {
            session.send(
                "I understand that you want to open a new incident in ServiceNow"
            );
            builder.Prompts.choice(
                session,
                "Did I understand you correctly?", [
                    "Yes, please help me create an incident.",
                    "No, I do not need to create an incident right now."
                ], {
                    listStyle: builder.ListStyle.button
                }
            );
        },
        function(session, results, next) {
            if (
                results.response.entity === "Yes, please help me create an incident."
            ) {
                builder.Prompts.text(
                    session,
                    "What's your short description of the problem?"
                );
                next();
            } else {
                session.send(
                    "Sorry I misunderstood! Maybe I can help with something else?"
                );
                session.endDialog();
            }
        },
        function(session, results, next) {
            session.dialogData.short_description = results.response;
            session.send("Got it! I just need a little more information.");
            builder.Prompts.text(
                session,
                "Please describe the problem in more detail"
            );
        },
        function(session, results, next) {
            session.dialogData.description = results.response;
            builder.Prompts.choice(
                session,
                "Would you like to add any additional notes?", ["Yes", "No"], { listStyle: builder.ListStyle.button }
            );
        },
        function(session, results, next) {
            if (results.response.entity === "Yes") {
                builder.Prompts.text(
                    session,
                    "What other notes should I add to the incident?"
                );
            } else {
                session.send(
                    "Thanks! I was successfully able to submit your issue as an incident in ServiceNow!"
                );
                var url =
                    "";
                var imageURL =
                    "";
                var msg = new builder.Message(session);
                msg.attachments([
                    new builder.HeroCard(session)
                    .images([builder.CardImage.create(session, imageURL)])
                    .buttons([
                        builder.CardAction.openUrl(session, url, "View My Incidents")
                    ])
                ]);
                session.send(msg);
                serviceNow
                    .createIncident(session.dialogData, session.userData.caller_id)
                    .then(function(res) {
                        session.endDialog();
                    })
                    .catch(function(err) {
                        console.log("ERR", err);
                    });
            }
        },
        function(session, results, next) {
            session.dialogData.notes = results.response;
            session.send(
                "Thanks! I was successfully able to submit your issue as an incident in ServiceNow!"
            );
            var url =
                "https://dev37410.service-now.com/nav_to.do?uri=%2Fincident_list.do%3Factive%3Dtrue%26sysparm_query%3Dactive%3Dtrue%5EEQ%26sysparm_userpref_module%3D4fed4395c0a8016400fcf06c27b1e6c6%26sysparm_clear_stack%3Dtrue";
            var imageURL =
                "data:image/png;base64,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";
            var msg = new builder.Message(session);
            msg.attachments([
                new builder.HeroCard(session)
                .images([builder.CardImage.create(session, imageURL)])
                .buttons([
                    builder.CardAction.openUrl(session, url, "View My Incidents")
                ])
            ]);
            session.send(msg);
            serviceNow
                .createIncident(session.dialogData, session.userData.caller_id)
                .then(function(res) {
                    session.endDialog();
                });
        }
    ])
    .triggerAction({
        matches: "createIncident"
    })
    .endConversationAction("endIncidentCreate", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/searchKnowledgeBase", [
        function(session, results, next) {
            if (!session.userData.caller_id) {
                session.beginDialog("/login");
            } else {
                next();
            }
        },
        function(session, results, next) {
            session.send(
                "I understand that you need help finding a knowledge article in ServiceNow."
            );
            builder.Prompts.choice(
                session,
                "Did I understand you correctly?", ["Yes, please search ServiceNow.", "No, not now."], { listStyle: builder.ListStyle.button }
            );
        },
        function(session, results, next) {
            if (results.response.entity === "Yes, please search ServiceNow.") {
                builder.Prompts.text(
                    session,
                    "What would you like to search for? I will be able to provide the first 10 results of what I find."
                );
                next();
            } else {
                session.send(
                    "Sorry I misunderstood! Maybe I can help with something else?"
                );
                session.endDialog();
            }
        },
        function(session, results, next) {
            session.dialogData.searchQuery = results.response;
            serviceNow
                .searchKnowledgeBase(session.dialogData.searchQuery)
                .then(function(res) {
                    if (res.status == "200") {
                        console.log("Successfully queried KB");
                        console.log(res);
                        if (res.data.result.length > 0) {
                            session.dialogData.searchResults = res.data.result;
                            session.send("Here's what I found:");
                            var feed = session.dialogData.searchResults;
                            var msg = new builder.Message(session).attachmentLayout(
                                builder.AttachmentLayout.carousel
                            );
                            feed.forEach(function(result, i) {
                                    var url =
                                        "https://dev37410.service-now.com/sp?id=kb_article&sys_id=" +
                                        result.sys_id;
                                    msg.addAttachment(
                                        new builder.HeroCard(session)
                                        .title(result.short_description)
                                        .text(result.number)
                                        .buttons([
                                            builder.CardAction.openUrl(session, url, "Learn More")
                                        ])
                                    );
                                }),
                                session.send(msg);
                            session.replaceDialog("/getResultFeedback");
                        } else {
                            session.send(
                                "Unfortunately, I wasn't able to find anything referencing \"" +
                                session.dialogData.searchQuery +
                                '"'
                            );
                            session.replaceDialog("/getResultFailFeedback");
                        }
                    }
                });
        }
    ])
    .triggerAction({
        matches: "searchKnowledgeBase"
    })
    .endConversationAction("endSearchKnowledgeBase", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/getResultFeedback", [
        function(session, args, next) {
            builder.Prompts.choice(
                session,
                "Did that help?", ["Yes, Thanks!", "I need to rephrase what I want to search."], { listStyle: builder.ListStyle.button }
            );
        },
        function(session, results, next) {
            if (results.response.entity === "Yes, Thanks!") {
                session.send(
                    "Awesome! Let me know if I can help you find anything else!"
                );
                session.endDialog();
            } else if (
                results.response.entity === "I need to rephrase what I want to search."
            ) {
                session.send("Ok!");
                session.replaceDialog("/searchKnowledgeBase");
            }
        }
    ])
    .triggerAction({
        matches: "getResultFeedback"
    })
    .endConversationAction("endgetResultFeedback", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/getResultFailFeedback", [
        function(session, args, next) {
            builder.Prompts.choice(
                session,
                "Would you like me search for something else?", ["Yes, I'll rephrase my search query.", "No, Thanks."], { listStyle: builder.ListStyle.button }
            );
        },
        function(session, results, next) {
            if (results.response.entity === "Yes, I'll rephrase my search query.") {
                session.send("Ok!");
                session.replaceDialog("/searchKnowledgeBase");
            } else {
                session.send(
                    "Bummer! Hopefully I'll have something useful in the near future."
                );
                session.endDialog();
            }
        }
    ])
    .triggerAction({
        matches: "getResultFailFeedback"
    })
    .endConversationAction("endgetResultFailFeedback", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/updateIncident", [
        function(session, results, next) {
            if (!session.userData.caller_id) {
                session.beginDialog("/login");
            } else {
                next();
            }
        },
        function(session, results, next) {
            session.dialogData.user_name = session.userData.user_name;
            console.log(session.userData.user_name);
            session.send(
                "I understand that you need help updating an incident in ServiceNow."
            );
            builder.Prompts.choice(
                session,
                "Did I understand you correctly?", ["Yes, update an incident for me.", "No, not now."], { listStyle: builder.ListStyle.button }
            );
        },
        function(session, results, next) {
            if (results.response.entity === "Yes, update an incident for me.") {
                next();
            } else {
                session.send(
                    "Sorry I misunderstood! Maybe I can help with something else?"
                );
                session.endDialog();
            }
        },
        function(session, results, next) {
            serviceNow.getIncidents(session.userData.caller_id).then(function(res) {
                console.log("Successfully queried Incidents");
                console.log(res);
                if (res.data.result.length > 0) {
                    session.dialogData.searchResults = res.data.result;
                    session.send(
                        "Here are your 5 most recently unresolved incidents in ServiceNow:"
                    );
                    var feed = session.dialogData.searchResults;
                    var msg = new builder.Message(session).attachmentLayout(
                        builder.AttachmentLayout.list
                    );
                    feed.forEach(function(result, i) {
                            var url =
                                "https://dev37410.service-now.com/sp?sys_id=" +
                                result.sys_id +
                                "&view=sp&id=ticket&table=incident";
                            msg.addAttachment(
                                new builder.HeroCard(session)
                                .title(result.short_description)
                                .subtitle("Created " + result.opened_at)
                                .text(result.description)
                                .buttons([
                                    builder.CardAction.imBack(
                                        session,
                                        "" + result.number,
                                        "" + result.number
                                    )
                                ])
                            );
                        }),
                        builder.Prompts.text(
                            session.send(msg),
                            "Select the incident you would like to add comments to."
                        );
                    next();
                } else {
                    session.send(
                        "You don't have any incidents reported! Good for you!\""
                    );
                }
            });
        },
        function(session, results, next) {
            session.dialogData.incidentNumber = results.response;
            serviceNow
                .getIncidentByNumber(session.dialogData.incidentNumber)
                .then(function(res) {
                    session.dialogData.incidentId = res.data.result[0].sys_id;
                    console.log("Incident Sys_ID " + session.dialogData.incidentId);
                    builder.Prompts.text(session, "What comments would you like to add?");
                });
        },
        function(session, results, next) {
            session.dialogData.comments = results.response;

            console.log("Caller_ID " + session.userData.caller_id);
            serviceNow
                .updateIncident(session.dialogData, session.userData.caller_id)
                .then(function(res) {
                    session.send(
                        "Thanks! I was successfully able to add your comments to your incident!"
                    );
                    session.endDialog();
                });
        }
    ])
    .triggerAction({
        matches: "updateIncident"
    })
    .endConversationAction("endUpdateIncident", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/getIncident", [
        function(session, results, next) {
            if (!session.userData.caller_id) {
                session.beginDialog("/login");
            } else {
                next();
            }
        },
        function(session, results, next) {
            session.dialogData.user_name = session.userData.user_name;
            console.log(session.userData.user_name);
            session.send(
                "I understand that you want me to find your incidents in ServiceNow."
            );
            builder.Prompts.choice(
                session,
                "Did I understand you correctly?", ["Yes, show my most recently opened incidents.", "No, not now."], { listStyle: builder.ListStyle.button }
            );
        },
        function(session, results, next) {
            if (results.response.entity === "Yes, show my most recently opened incidents.") {
                next();
            } else {
                session.send(
                    "Sorry I misunderstood! Maybe I can help with something else?"
                );
                session.endDialog();
            }
        },
        function(session, results, next) {
            serviceNow.getIncidents(session.userData.caller_id).then(function(res) {
                console.log("Successfully queried Incidents");
                console.log(res);
                if (res.data.result.length > 0) {
                    session.dialogData.searchResults = res.data.result;
                    session.send("Here's what I found:");
                    var feed = session.dialogData.searchResults;
                    var msg = new builder.Message(session).attachmentLayout(
                        builder.AttachmentLayout.list
                    );
                    feed.forEach(function(result, i) {
                            var url =
                                "https://dev37410.service-now.com/sp?sys_id=" +
                                result.sys_id +
                                "&view=sp&id=ticket&table=incident";
                            msg.addAttachment(
                                new builder.HeroCard(session)
                                .title(result.short_description)
                                .subtitle("Created " + result.opened_at)
                                .text(result.number)
                                .buttons([
                                    builder.CardAction.openUrl(session, url, "Review Incident")
                                ])
                            );
                        }),
                        session.send(msg);
                    session.endDialog();
                } else {
                    session.send(
                        "You don't have any incidents reported! Good for you!\""
                    );
                }
            });
        }
    ])
    .triggerAction({
        matches: "getIncident"
    })
    .endConversationAction("endGetIncident", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/reopenIncident", [
        function(session, results, next) {
            if (!session.userData.caller_id) {
                session.beginDialog("/login");
            } else {
                next();
            }
        },
        function(session, args, next) {
            session.send("Great, I see that you want to re-open an incident");
            builder.Prompts.text(
                session,
                "What incident number would you like to re-open?"
            );
        },
        function(session, results, next) {
            session.dialogData.number = results.response;
            builder.Prompts.choice(
                session,
                "Would you like to add any notes to the incident?", ["Yes", "No"], { listStyle: builder.ListStyle.button }
            );
        },
        function(session, results, next) {
            if (results.response.entity === "Yes") {
                builder.Prompts.text(session, "Go ahead");
            } else {
                serviceNow
                    .reopenIncident(session.dialogData)
                    .then(function(res) {
                        session.endDialog();
                    })
                    .catch(function(err) {
                        console.log("ERR", err);
                    });
            }
        },
        function(session, results, next) {
            session.dialogData.notes = results.response;
            session.dialogData.caller_id = session.userData.caller_id;
            serviceNow.reopenIncident(session.dialogData).then(function(res) {
                console.log("Reopened Incident", res);
                session.endDialog();
            });
        }
    ])
    .triggerAction({
        matches: "reopenIncident"
    })
    .endConversationAction("endReopenIncident", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/resolveIncident", [
        function(session, results, next) {
            if (!session.userData.caller_id) {
                session.beginDialog("/login");
            } else {
                next();
            }
        },
        function(session, results, next) {
            session.dialogData.user_name = session.userData.user_name;
            console.log(session.userData.user_name);
            session.send(
                "I understand that you want to resolve a ServiceNow incident"
            );
            builder.Prompts.choice(
                session,
                "Did I understand you correctly?", ["Yes, resolve an incident for me.", "No, not now."], { listStyle: builder.ListStyle.button }
            );
        },
        function(session, results, next) {
            if (results.response.entity === "Yes, resolve an incident for me.") {
                next();
            } else {
                session.send(
                    "Sorry I misunderstood! Maybe I can help with something else?"
                );
                session.endDialog();
            }
        },
        function(session, results, next) {
            serviceNow.getIncidents(session.userData.caller_id).then(function(res) {
                console.log("Successfully queried Incidents");
                console.log(res);
                if (res.data.result.length > 0) {
                    session.dialogData.searchResults = res.data.result;
                    session.send(
                        "Here are your 5 most recently unresolved incidents in ServiceNow:"
                    );
                    var feed = session.dialogData.searchResults;
                    var msg = new builder.Message(session).attachmentLayout(
                        builder.AttachmentLayout.list
                    );
                    feed.forEach(function(result, i) {
                            var url =
                                "https://dev37410.service-now.com/sp?sys_id=" +
                                result.sys_id +
                                "&view=sp&id=ticket&table=incident";
                            msg.addAttachment(
                                new builder.HeroCard(session)
                                .title(result.short_description)
                                .subtitle("Created " + result.opened_at)
                                .text(result.description)
                                .buttons([
                                    builder.CardAction.imBack(
                                        session,
                                        "" + result.number,
                                        "" + result.number
                                    )
                                ])
                            );
                        }),
                        builder.Prompts.text(
                            session.send(msg),
                            "Select the incident you would like to resolve"
                        );
                    next();
                } else {
                    session.send(
                        "You don't have any incidents reported! Good for you!"
                    );
                }
            });
        },
        function(session, results, next) {
            session.dialogData.incidentNumber = results.response;
            console.log(
                "Dialog Data Incident Number is: " + session.dialogData.incidentNumber
            );
            serviceNow
                .getIncidentByNumber(session.dialogData.incidentNumber)
                .then(function(res) {
                    session.dialogData.incidentId = res.data.result[0].sys_id;
                    console.log(
                        "Dialog Data Incident ID is: " + session.dialogData.incidentId
                    );
                    next();
                });
        },
        function(session, results, next) {
            console.log(
                "Dialog Data Incident ID is: " + session.dialogData.incidentId
            );
            console.log(session.userData.caller_id);
            serviceNow
                .resolveIncident(session.dialogData, session.userData.caller_id)
                .then(function(res) {
                    session.send(
                        "You got it! I was successfully able to resolve your incident!"
                    );
                    session.endDialog();
                });
        }
    ])
    .triggerAction({
        matches: "resolveIncident"
    })
    .endConversationAction("endResolveIncident", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });

bot
    .dialog("/None", [
        function(session, results, next) {
            session.send(
                "Uh oh! I'm not sure I understood what you said. I may not be able to respond to your input, but you could always try to re-phrase what you said!"
            );
            session.beginDialog("/");
        }
    ])
    .triggerAction({
        matches: "None"
    });