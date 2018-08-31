// require("dotenv-extended").load();
const https = require('https');
const request = require('request');
require("./connectorSetup")();

require("./dialogs/general/greeting")();
require("./dialogs/general/integrationMenu")();
require("./dialogs/general/thankYou")();

require("./dialogs/microsoftOnline/microsoftOnlineMenu")();

require("./dialogs/microsoftOnline/exchangeOnline/exchangeOnlineMenu")();

require("./dialogs/qnaMaker/basicQnAMakerDialog")();

require("./dialogs/serviceNow/auth/specifyCredentials")();
require("./dialogs/serviceNow/auth/verifyServiceNowUserLogin")();

require("./dialogs/serviceNow/incidents/getIncident")();
require("./dialogs/serviceNow/incidents/createIncident")();
require("./dialogs/serviceNow/incidents/resolveIncident")();
require("./dialogs/serviceNow/incidents/updateIncident")();

require("./dialogs/serviceNow/knowledge/searchKnowledgeBase")();
require("./dialogs/serviceNow/knowledge/getResultFeedback")();
require("./dialogs/serviceNow/knowledge/getResultFailFeedback")();

require("./dialogs/serviceNow/serviceNowMenu")();

require("./recognizers/luis/luisRecognizer");

require("./recognizers/qnaMaker/qnaRecognizer");

require("./routes/serviceNow");

const AadClientId = process.env.AadClientId;
const AadClientSecret = process.env.AadClientSecret;


bot.dialog("/", intents);

intents.matches(
    "greeting",
    builder.DialogAction.beginDialog("/greeting")
);

intents.matches(
    "integrationMenu",
    builder.DialogAction.beginDialog("/integrationMenu")
);

intents.matches(
    "ThankYou",
    builder.DialogAction.beginDialog("/thankYou")
);

intents.matches(
    "exchangeOnlineMenu",
    builder.DialogAction.beginDialog("/exchangeOnlineMenu")
);

intents.matches(
    "microsoftOnlineMenu",
    builder.DialogAction.beginDialog("/microsoftOnlineMenu")
);

intents.matches(
    "qna",
    builder.DialogAction.beginDialog("basicQnAMakerDialog")
);

intents.matches(
    "createIncident",
    builder.DialogAction.beginDialog("/createIncident")
);

intents.matches(
    "getIncident",
    builder.DialogAction.beginDialog("/getIncident")
);

intents.matches(
    "resolveIncident",
    builder.DialogAction.beginDialog("/resolveIncident")
);

intents.matches(
    "updateIncident",
    builder.DialogAction.beginDialog("/updateIncident")
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
    "getExchangeOnlineRecentMail",
    builder.DialogAction.beginDialog("/getExchangeOnlineRecentMail")
);

intents.matches(
    "signInMicrosoftOnline",
    builder.DialogAction.beginDialog("/signInMicrosoftOnline")
);

intents.matches(
    "logoutMicrosoftOnline",
    builder.DialogAction.beginDialog("/logoutMicrosoftOnline")
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

bot.dialog("/signInMicrosoftOnline", [].concat(
    ba.authenticate("aadv2"),
    (session, args, skip) => {
        let user = ba.profile(session, "aadv2");
        session.endDialog("Thanks " + user.displayName + "! You are now logged into Office 365! Currently, I can only fetch your 5 most recent e-mails and show them to you here in Teams. All you have to do is say something like 'get email' - Stay tuned for more things that I'll be able to do! ");
        session.userData.accessToken = user.accessToken;
        session.userData.refreshToken = user.refreshToken;
    }
));

bot.dialog("/logoutMicrosoftOnline", (session) => {
    ba.logout(session, "aadv2");
    session.endDialog("Got it! I've logged you out of Office 365!");

});

bot.dialog("/getExchangeOnlineRecentMail", [
    (session) => {
        getUserLatestEmail(session.userData.accessToken,
            function(requestError, result) {
                if (result && result.value && result.value.length > 0) {

                    session.send("Here are your 5 most recent e-mails:");
                    let feed = result.value;
                    let msg = new builder.Message(session).attachmentLayout(
                        builder.AttachmentLayout.carousel
                    );
                    feed.forEach((result, i) => {
                            let url = result.WebLink
                            msg.addAttachment(
                                new builder.HeroCard(session)
                                .title(result.Subject)
                                .subtitle("Received Date: " + result.ReceivedDateTime)
                                .text(result.BodyPreview)
                                .buttons([
                                    builder.CardAction.openUrl(session, url, "View in Outlook on the Web")
                                ])
                            );
                        }),
                        session.send(msg);
                    session.endDialog();


                } else {
                    console.log('no user returned');
                    if (requestError) {
                        console.error(requestError);
                        session.send(requestError);
                        // Get a new valid access token with refresh token
                        getAccessTokenWithRefreshToken(session.userData.refreshToken, (err, body, res) => {

                            if (err || body.error) {
                                session.send("Error while getting a new access token. Try saying 'sign in' or logout and login again by saying 'logout' followed by 'sign in'. Error: " + err);
                                session.endDialog();
                                session.beginDialog("/logoutMicrosoftOnline");
                            } else {
                                session.userData.accessToken = body.accessToken;
                                getUserLatestEmail(session.userData.accessToken,
                                    function(requestError, result) {
                                        if (result && result.value && result.value.length > 0) {
                                            session.send("Here are your 5 most recent e-mails:");
                                            let feed = result.value;
                                            let msg = new builder.Message(session).attachmentLayout(
                                                builder.AttachmentLayout.carousel
                                            );
                                            feed.forEach((result, i) => {
                                                    let url = result.WebLink
                                                    msg.addAttachment(
                                                        new builder.HeroCard(session)
                                                        .title(result.Subject)
                                                        .subtitle("Received Date: " + result.ReceivedDateTime)
                                                        .text(result.BodyPreview)
                                                        .buttons([
                                                            builder.CardAction.openUrl(session, url, "View in Outlook on the Web")
                                                        ])
                                                    );
                                                }),
                                                session.send(msg);
                                            session.endDialog();
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
            session.replaceDialog('/getExchangeOnlineRecentMail');
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