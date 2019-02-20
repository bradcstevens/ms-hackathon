module.exports = () => {
    bot.dialog("/microsoftOnlineMenu", [
            (session) => {
                let card = new builder.ThumbnailCard(session)
                    .title("Microsoft Online Capabilities")
                    .text("Here's a few things I can do:")
                    .buttons([
                        builder.CardAction.imBack(
                            session,
                            "Login to Microsoft Online",
                            "Login me into Microsoft Online"
                        ),
                        builder.CardAction.imBack(
                            session,
                            "Logout of Microsoft Online",
                            "Logout me out of Microsoft Online"
                        ),
                        builder.CardAction.imBack(
                            session,
                            "Exchange Online Capabilities",
                            "Show me what you can do with Exchange Online"
                        )
                    ]);
                let message = new builder.Message(session).addAttachment(card);
                session.endDialog(message);
            }
        ])
        .triggerAction({
            matches: "microsoftOnlineMenu"
        })
        .endConversationAction("endGreeting", "Ok. Goodbye.", {
            matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
            confirmPrompt: "Are you sure?"
        });
}