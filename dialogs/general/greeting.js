module.exports = () => {
    bot.dialog("/greeting", [
        (session) => {
            session.send(
                "Hi! I'm Mr. Meeseeks! Look at me! \
                I'm a bot that can help you manage incidents in ServiceNow! \
                Go ahead! Ask me a question! Try saying something like: 'What can you do?'"
            );
            session.replaceDialog("/");
        }
    ]).triggerAction({
        matches: "greeting"
    }).endConversationAction("endHello", "Ok. Goodbye.", {
        matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
        confirmPrompt: "Are you sure?"
    });
}