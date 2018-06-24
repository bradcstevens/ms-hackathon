module.exports = () => {
    bot.dialog("/getResultFailFeedback", [
            (session) => {
                builder.Prompts.choice(
                    session,
                    "Would you like me search for something else?", ["Yes, I'll rephrase my search query.", "No, Thanks."], { listStyle: builder.ListStyle.button }
                );
            },
            (session, results) => {
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
        .endConversationAction(
            "endgetResultFailFeedback", "Ok. Goodbye.", {
                matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
                confirmPrompt: "Are you sure?"
            }
        );
}