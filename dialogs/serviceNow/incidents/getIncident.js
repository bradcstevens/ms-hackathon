module.exports = () => {
    bot.dialog("/getIncident", [
            (session, results, next) => {
                if (!session.userData.caller_id) {
                    session.beginDialog("/login");
                } else {
                    next();
                }
            },
            (session) => {
                session.dialogData.user_name = session.userData.user_name;
                console.log(session.userData.user_name);
                session.send(
                    "I understand that you want me to find your incidents in ServiceNow."
                );
                builder.Prompts.choice(
                    session,
                    "Did I understand you correctly?", ["Yes, show my most recently opened incidents.", "No, not now."], { listStyle: builder.ListStyle.button }
                );
            },
            (session, results, next) => {
                if (results.response.entity === "Yes, show my most recently opened incidents.") {
                    next();
                } else {
                    session.send(
                        "Sorry I misunderstood! Maybe I can help with something else?"
                    );
                    session.endDialog();
                }
            },
            (session) => {
                serviceNow.getIncidents(session.userData.caller_id)
                    .then((res) => {
                        console.log("Successfully queried Incidents");
                        console.log(res);
                        if (res.data.result.length > 0) {
                            session.dialogData.searchResults = res.data.result;
                            session.send("Here's what I found:");
                            let feed = session.dialogData.searchResults;
                            let msg = new builder.Message(session).attachmentLayout(
                                builder.AttachmentLayout.list
                            );
                            feed.forEach((result, i) => {
                                    let url =
                                        "https://dev59625.service-now.com/sp?sys_id=" +
                                        result.sys_id +
                                        "&view=sp&id=ticket&table=incident#home"
                                    msg.addAttachment(
                                        new builder.HeroCard(session)
                                        .title(result.short_description)
                                        .subtitle("Created " + result.opened_at)
                                        .text(result.number)
                                        .buttons([
                                            builder.CardAction.openUrl(session, url, "Review Incident")
                                        ])
                                    );
                                }),
                                session.send(msg);
                            session.endDialog();
                        } else {
                            session.send(
                                "You don't have any incidents reported! Good for you!"
                            );
                            session.endDialog();
                        }
                    });
            }
        ])
        .triggerAction({
            matches: "getIncident"
        })
        .endConversationAction("endGetIncident", "Ok. Goodbye.", {
            matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
            confirmPrompt: "Are you sure?"
        });
}