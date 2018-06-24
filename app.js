require("dotenv-extended").load();
require("./connectorSetup")();
require("./dialogs/general/none")();
require("./dialogs/general/greeting")();
require("./dialogs/general/thankYou")();
require("./dialogs/serviceNow/getIncident")();
require("./dialogs/serviceNow/serviceNowMenu")();
require("./dialogs/serviceNow/createIncident")();
require("./dialogs/serviceNow/resolveIncident")();
require("./dialogs/serviceNow/updateIncident")();
require("./dialogs/serviceNow/auth/login")();
require("./dialogs/serviceNow/auth/specifyCredentials")();
require("./dialogs/serviceNow/searchKnowledgeBase")();
require("./dialogs/getResultFeedback")();
require("./dialogs/getResultFailFeedback")();
require("./dialogs/qnaMaker/basicQnAMakerDialog")();
require("./dialogs/qnaMaker/defaultWaitNextMessage")();
require("./dialogs/qnaMaker/respondFromQnAMakerResult")();

// For Local Development Use The below Code
/*
const bot = new builder.UniversalBot(connector, {
    storage: new builder.MemoryBotStorage()
});
*/

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