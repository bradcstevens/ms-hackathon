module.exports = () => {
    bot.dialog("/getResultFeedback", [
            (session) => {
                builder.Prompts.choice(
                    session,
                    "Did that help?", ["Yes, Thanks!", "I need to rephrase what I want to search."], { listStyle: builder.ListStyle.button }
                );
            },
            (session, results) => {
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
        .endConversationAction(
            "endgetResultFeedback", "Ok. Goodbye.", {
                matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
                confirmPrompt: "Are you sure?"
            });
}