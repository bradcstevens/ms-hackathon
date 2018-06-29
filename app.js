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
require('./connectorSetup');
require('./middleware/botauth');

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
        session.endDialog(user.displayName);
        session.userData.accessToken = user.accessToken;
        session.userData.refreshToken = user.refreshToken;
        session.beginDialog('/workPrompt');
    }
));

bot.dialog("/logout", (session) => {
    ba.logout(session, "aadv2");
    session.endDialog("logged_out");
});

bot.dialog('/workPrompt', [
    (session) => {
        getUserLatestEmail(session.userData.accessToken,
            function(requestError, result) {
                if (result && result.value && result.value.length > 0) {
                    const responseMessage = 'Your latest email is: "' + result.value[0].Subject + '"';
                    session.send(responseMessage);
                    builder.Prompts.confirm(session, "Retrieve the latest email again?");
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
                            } else {
                                session.userData.accessToken = body.accessToken;
                                getUserLatestEmail(session.userData.accessToken,
                                    function(requestError, result) {
                                        if (result && result.value && result.value.length > 0) {
                                            const responseMessage = 'Your latest email is: "' + result.value[0].Subject + '"';
                                            session.send(responseMessage);
                                            builder.Prompts.confirm(session, "Retrieve the latest email again?");
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