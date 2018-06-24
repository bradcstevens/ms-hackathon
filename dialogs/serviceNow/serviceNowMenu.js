module.exports = () => {
    bot.dialog("/serviceNowMenu", [
            (session) => {
                let card = new builder.ThumbnailCard(session)
                    .title("ServiceNow")
                    .text("Here's a few things I can do:")
                    .buttons([
                        builder.CardAction.imBack(
                            session,
                            "Get Incidents",
                            "View recently created ServiceNow Incidents"
                        ),
                        builder.CardAction.imBack(
                            session,
                            "Create a new ServiceNow Incident",
                            "Create a new ServiceNow Incident"
                        ),
                        builder.CardAction.imBack(
                            session,
                            "Update Incident",
                            "Add comments to a ServiceNow Incident"
                        ),
                        builder.CardAction.imBack(
                            session,
                            "Resolve Incident",
                            "Resolve your ServiceNow Incident"
                        ),
                        builder.CardAction.imBack(
                            session,
                            "Search for a Knowledge Article",
                            "Search for a Knowledge Article"
                        )
                    ]);
                let message = new builder.Message(session).addAttachment(card);
                session.endConversation(message);
            }
        ])
        .triggerAction({
            matches: "serviceNowMenu"
        })
        .endConversationAction("endGreeting", "Ok. Goodbye.", {
            matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
            confirmPrompt: "Are you sure?"
        });
}