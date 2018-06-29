require("dotenv-extended").load();
const https = require('https');
const request = require('request');
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
require('./connectorSetup');
const AadClientId = process.env.AadClientId;
const AadClientSecret = process.env.AadClientSecret;

bot.dialog("/", intents);

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

intents.matches(
    "workPrompt",
    builder.DialogAction.beginDialog("/workPrompt")
);

intents.matches(
    "signIn",
    builder.DialogAction.beginDialog("/signIn")
);

intents.matches(
    "logout",
    builder.DialogAction.beginDialog("/logout")
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

bot.dialog("/signIn", [].concat(

    ba.authenticate("aadv2"),
    (session, args, skip) => {
        let user = ba.profile(session, "aadv2");
        session.send(
            "Thanks! " + user.displayName + "!"
        );
        session.endDialog();
        session.userData.accessToken = user.accessToken;
        session.userData.refreshToken = user.refreshToken;
        session.beginDialog('/workPrompt');
    }
));

bot.dialog("/logout", (session) => {
    ba.logout(session, "aadv2");
    session.endDialog();

});

bot.dialog("/workPrompt", [
    (session, results, next) => {
        if (!session.userData.accessToken) {
            session.beginDialog("/signIn");
        } else {
            next();
        }
    },
    (session) => {
        getUserLatestEmail(session.userData.accessToken,
            function(requestError, result) {
                if (result && result.value && result.value.length > 0) {
                    
                    session.send("Here's what I found:");
                            let feed = result.value;
                            let msg = new builder.Message(session).attachmentLayout(
                                builder.AttachmentLayout.list
                            );
                            feed.forEach((result, i) => {
                                    let url = result.WebLink
                                    msg.addAttachment(
                                        new builder.HeroCard(session)
                                        .title(result.Subject)
                                        .subtitle("Received Date " + result.ReceivedDateTime)
                                        .text(result.BodyPreview)
                                        .buttons([
                                            builder.CardAction.openUrl(session, url, "View in Outlook on the Web")
                                        ])
                                    );
                                }),
                                session.send(msg);
                                
                    session.send(responseMessage);
                } else {
                    console.log('no user returned');
                    if (requestError) {
                        console.error(requestError);
                        session.send(requestError);
                        // Get a new valid access token with refresh token
                        getAccessTokenWithRefreshToken(session.userData.refreshToken, (err, body, res) => {

                            if (err || body.error) {
                                session.send("Error while getting a new access token. Please try logout and login again. Error: " + err);
                                session.endDialog();
                                session.beginDialog("/logout");
                            } else {
                                session.userData.accessToken = body.accessToken;
                                getUserLatestEmail(session.userData.accessToken,
                                    function(requestError, result) {
                                        if (result && result.value && result.value.length > 0) {
                                            console.log(result);
                                            const responseMessage = 'Your latest email is: "' + result.value[0].Subject + '"';
                                            session.send(responseMessage);
                                        }
                                    }
                                );
                            }

                        });
                    }
                }
            }
        );
    },
    (session, results) => {
        var prompt = results.response;
        if (prompt) {
            session.replaceDialog('/workPrompt');
        } else {
            session.endDialog();
        }
    }
]);

const getAccessTokenWithRefreshToken = (refreshToken, callback) => {
    var data = 'grant_type=refresh_token' +
        '&refresh_token=' + refreshToken +
        '&client_id=' + 
        AadClientId +
        '&client_secret=' + encodeURIComponent(AadClientSecret)

    var options = {
        method: 'POST',
        url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        body: data,
        json: true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };

    request(options, function(err, res, body) {
        if (err) return callback(err, body, res);
        if (parseInt(res.statusCode / 100, 10) !== 2) {
            if (body.error) {
                return callback(new Error(res.statusCode + ': ' + (body.error.message || body.error)), body, res);
            }
            if (!body.access_token) {
                return callback(new Error(res.statusCode + ': refreshToken error'), body, res);
            }
            return callback(null, body, res);
        }
        callback(null, {
            accessToken: body.access_token,
            refreshToken: body.refresh_token
        }, res);
    });
}

const getUserLatestEmail = (accessToken, callback) => {
    var options = {
        host: 'outlook.office.com', //https://outlook.office.com/api/v2.0/me/messages
        path: '/api/v2.0/me/MailFolders/Inbox/messages?$top=5',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Bearer ' + accessToken
        }
    };
    https.get(options, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var error;
            if (response.statusCode === 200) {
                console.log(response);
                callback(null, JSON.parse(body));
            } else {
                error = new Error();
                error.code = response.statusCode;
                error.message = response.statusMessage;
                // The error body sometimes includes an empty space
                // before the first character, remove it or it causes an error.
                body = body.trim();
                error.innerError = body;
                callback(error, null);
            }
        });
    }).on('error', function(e) {
        callback(e, null);
    });
}