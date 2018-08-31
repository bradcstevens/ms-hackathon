module.exports = () => {
    bot.dialog("/exchangeOnlineMenu", [
            (session) => {
                let card = new builder.ThumbnailCard(session)
                    .title("Exchange Online Capabilities")
                    .text("Here's a few things I can do:")
                    .buttons([
                        builder.CardAction.imBack(
                            session,
                            "Get Your 5 Most Recent Outlook Emails",
                            "Show me my recent Outlook Emails"
                        )
                    ]);
                let message = new builder.Message(session).addAttachment(card);
                session.send(message);
            }
        ])
        .triggerAction({
            matches: "exchangeOnlineMenu"
        })
        .endConversationAction("endGreeting", "Ok. Goodbye.", {
            matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
            confirmPrompt: "Are you sure?"
        });
}