require("dotenv-extended").load();
require("./connectorSetup")();
require("./dialogs/general/none")();
require("./dialogs/general/greeting")();
require("./dialogs/general/thankYou")();
require("./dialogs/serviceNow/incidents/getIncident")();
require("./dialogs/serviceNow/serviceNowMenu")();
require("./dialogs/serviceNow/incidents/createIncident")();
require("./dialogs/serviceNow/incidents/resolveIncident")();
require("./dialogs/serviceNow/incidents/updateIncident")();
require("./dialogs/serviceNow/auth/login")();
require("./dialogs/serviceNow/auth/specifyCredentials")();
require("./dialogs/serviceNow/knowledge/searchKnowledgeBase")();
require("./dialogs/serviceNow/knowledge/getResultFeedback")();
require("./dialogs/serviceNow/knowledge/getResultFailFeedback")();
require("./dialogs/qnaMaker/basicQnAMakerDialog")();
const Promise = require('es6-promise').Promise;
const AuthenticationContext = require('adal-node').AuthenticationContext;

bot.dialog("/intents", intents);

intents.matches(
    "greeting",
    builder.DialogAction.beginDialog("/greeting")
);

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

intents.matches(
    "ThankYou",
    builder.DialogAction.beginDialog("/thankYou")
);

intents.matches(
    "qna",
    builder.DialogAction.beginDialog("basicQnAMakerDialog")
);

intents.matches(
    "none",
    builder.DialogAction.beginDialog("/None")
);

intents.onDefault(
    [
        (session) => {
            let message = session.message.text
            session.send(
                "Oops! I didn't understand **'" + message + "'** " +
                session.message.user.name +
                "! Either I'm not sure how to respond, or I may not have the answer right now. You could always \
                try to rephrase your question and I'll try again to find you an answer!"
            );
        }
    ]
);

    
    //=========================================================
    // Bot authorization delegation middleware
    //=========================================================
    let getAuthorization = (session, args, next) => {

        // User is not already signed-in
        if (!session.privateConversationData['accessToken']) {

            // Set the arbitrary state as the current session address
            var stateToken = encodeURIComponent(JSON.stringify(session.message.address))
            var authorizationUrl = adalConfig.templateAuthzUrl.replace('<state>', stateToken);

            var actionLabel = 'You need to sign in to Office 365 before playing with this bot!';
            var buttonLabel = 'Sign-in';
            var signInCard = null;

            // The Sign-In card is not supported by Microsoft Teams for now (23/01/2017)
            // https://msdn.microsoft.com/en-us/microsoft-teams/bots#cards-and-buttons
            if (session.message.address.channelId === "msteams" || "emulator") {

                var link = builder.CardAction.openUrl(session, authorizationUrl,buttonLabel)

                signInCard = new builder.ThumbnailCard(session)
                .title("Authorization required!")
                .text(actionLabel)
                .buttons([link]);

            } else {

                // Send sign-in card
                signInCard =  new builder.SigninCard(session)
                    .text(actionLabel)
                    .button(buttonLabel, authorizationUrl);        
            }

            var msg = new builder.Message(session).attachments([signInCard]);
            session.send(msg);

        } else {

            // If the user is  already signed-in, we check if the access token is expired
            var expiresOn = session.privateConversationData['expiresOn'];
            var refreshToken = session.privateConversationData['refreshToken']

            if (new Date(expiresOn) >= Date.now() ) {
                
                acquireTokenWithRefreshToken(refreshToken).then((response) => {

                    // Refresh the token infos
                    session.privateConversationData['accessToken'] = response.accessToken;
                    session.privateConversationData['expiresOn'] = response.expiresOn;
                    session.privateConversationData['refreshToken'] = response.refreshToken;

                    next();

                }).catch((errorMessage) => {
                    console.log(errorMessage);
                });
            } else {
                next();
            }             
        }
    }
    global.acquireTokenWithAuthorizationCode = (authorizationCode) => {

        var authenticationContext = new AuthenticationContext(adalConfig.authorityUrl);

        var p = new Promise((resolve, reject) => {

            authenticationContext.acquireTokenWithAuthorizationCode(
                authorizationCode,
                adalConfig.redirectUri, // This URL must be the same as the redirect_uri of the original request or the reply url of the Azure AD App. Otherwise, it will throw an error.
                adalConfig.resource,
                adalConfig.clientId, 
                adalConfig.clientSecret,
                (err, response) => {

                    if (err) {
                        reject('error: ' + err.message + '\n');

                    } else {
                        resolve({ 
                            userName: (response.givenName + " " + response.familyName),
                            accessToken: response.accessToken,
                            expiresOn: response.expiresOn,
                            refreshToken: response.refreshToken,
                        }); 
                    }
                });
        });

        return p;
    }

    let acquireTokenWithRefreshToken = (refreshToken) => {

        var authenticationContext = new AuthenticationContext(adalConfig.authorityUrl);

        var p = new Promise((resolve, reject) => {

            authenticationContext.acquireTokenWithRefreshToken(
                refreshToken,
                adalConfig.clientId,
                adalConfig.clientSecret,
                adalConfig.resource,
                (err, response) => {

                    if (err) {
                        reject(errorMessage = 'error: ' + err.message + '\n');

                    } else {
                        resolve({ 
                            userName: (response.givenName + " " + response.familyName),
                            accessToken: response.accessToken,
                            expiresOn: response.expiresOn,
                            refreshToken: response.refreshToken,
                        }); 
                    }
                });
        });

        return p;
    }
    bot.dialog('/', 
    [   getAuthorization,
        (session) => {

            const keywords = session.message.text

            // Check if a a message has been typed
            if (keywords) {

                // For debugging purpose, we add an arbitrary command to reset the bot state (we also could have implement a logout mechanism).
                // Initially the native /deleteprofile command was used but it is not available in the Bot Framework v3 anymore.
                if (keywords === "reset") {
                    session.privateConversationData = {};

                    // Get back to the main dialog route and prompt for a sign in
                    session.beginDialog("/");
                } else {

                    session.beginDialog("/intents");
                }
            }
        }
    ]);