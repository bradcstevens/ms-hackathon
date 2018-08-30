module.exports = () => {
    bot.dialog("/updateIncident", [
            (session, results, next) => {
                if (!session.userData.caller_id) {
                    session.beginDialog("/verifyServiceNowUserLogin");
                } else {
                    next();
                }
            },
            (session) => {
                session.dialogData.user_name = session.userData.user_name;
                console.log(session.userData.user_name);
                session.send(
                    "I understand that you need help updating an incident in ServiceNow."
                );
                builder.Prompts.choice(
                    session,
                    "Did I understand you correctly?", ["Yes, update an incident for me.", "No, not now."], { listStyle: builder.ListStyle.button }
                );
            },
            (session, results, next) => {
                if (results.response.entity === "Yes, update an incident for me.") {
                    next();
                } else {
                    session.send(
                        "Sorry I misunderstood! Maybe I can help with something else?"
                    );
                    session.endDialog();
                }
            },
            (session, next) => {
                serviceNow.getIncidents(session.userData.caller_id).then((res) => {
                    console.log("Successfully queried Incidents");
                    console.log(res);
                    if (res.data.result.length > 0) {
                        session.dialogData.searchResults = res.data.result;
                        session.send(
                            "Here are your 5 most recently unresolved incidents in ServiceNow:"
                        );
                        let feed = session.dialogData.searchResults;
                        let msg = new builder.Message(session)
                            .attachmentLayout(
                                builder.AttachmentLayout.list
                            );
                        feed.forEach((result, i) => {
                                let url =
                                    "https://dev62329.service-now.com/sp?sys_id=" +
                                    result.sys_id +
                                    "&view=sp&id=ticket&table=incident#home";
                                msg.addAttachment(
                                    new builder.HeroCard(session)
                                    .title(result.short_description)
                                    .subtitle("Created " + result.opened_at)
                                    .text(result.description)
                                    .buttons([
                                        builder.CardAction.imBack(
                                            session,
                                            "" + result.number,
                                            "" + result.number
                                        )
                                    ])
                                );
                            }),
                            builder.Prompts.text(
                                session.send(msg),
                                "Select the incident you would like to add comments to."
                            );
                        next();
                    } else {
                        session.send(
                            "You don't have any incidents reported! Good for you!"
                        );
                    }
                });
            },
            (session, results) => {
                session.dialogData.incidentNumber = results.response;
                serviceNow
                    .getIncidentByNumber(session.dialogData.incidentNumber)
                    .then((res) => {
                        session.dialogData.incidentId = res.data.result[0].sys_id;
                        console.log("Incident Sys_ID " + session.dialogData.incidentId);
                        builder.Prompts.text(session, "What comments would you like to add?");
                    });
            },
            (session, results) => {
                session.dialogData.comments = results.response;
                console.log("Caller_ID " + session.userData.caller_id);
                serviceNow
                    .updateIncident(session.dialogData, session.userData.caller_id)
                    .then((res) => {
                        session.send(
                            "Thanks! I was successfully able to add your comments to your incident!"
                        );
                        session.endDialog();
                    });
            }
        ])
        .triggerAction({
            matches: "updateIncident"
        })
        .endConversationAction(
            "endUpdateIncident", "Ok. Goodbye.", {
                matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
                confirmPrompt: "Are you sure?"
            });
}