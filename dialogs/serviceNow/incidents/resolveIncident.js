module.exports = () => {
    bot.dialog("/resolveIncident", [
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
                    "I understand that you want to resolve a ServiceNow incident"
                );
                builder.Prompts.choice(
                    session,
                    "Did I understand you correctly?", ["Yes, resolve an incident for me.", "No, not now."], { listStyle: builder.ListStyle.button }
                );
            },
            (session, results, next) => {
                if (results.response.entity === "Yes, resolve an incident for me.") {
                    next();
                } else {
                    session.send(
                        "Sorry I misunderstood! Maybe I can help with something else?"
                    );
                    session.endDialog();
                }
            },
            (session, results, next) => {
                serviceNow.getIncidents(session.userData.caller_id)
                    .then((res) => {
                        console.log("Successfully queried Incidents");
                        console.log(res);
                        if (res.data.result.length > 0) {
                            session.dialogData.searchResults = res.data.result;
                            session.send(
                                "Here are your 5 most recently unresolved incidents in ServiceNow:"
                            );
                            let feed = session.dialogData.searchResults;
                            let msg = new builder.Message(session)
                                .attachmentLayout(builder.AttachmentLayout.list);
                            feed.forEach((result, i) => {
                                    let url =
                                        "https://dev58964.service-now.com/sp?sys_id=" +
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
                                    "Select the incident you would like to resolve"
                                );
                            next();
                        } else {
                            session.send(
                                "You don't have any incidents reported! Good for you!"
                            );
                            session.endDialog();
                        }
                    });
            },
            (session, results, next) => {
                session.dialogData.incidentNumber = results.response;
                console.log(
                    "Dialog Data Incident Number is: " + session.dialogData.incidentNumber
                );
                serviceNow
                    .getIncidentByNumber(session.dialogData.incidentNumber)
                    .then((res) => {
                        session.dialogData.incidentId = res.data.result[0].sys_id;
                        console.log(
                            "Dialog Data Incident ID is: " + session.dialogData.incidentId
                        );
                        next();
                    });
            },
            (session) => {
                console.log(
                    "Dialog Data Incident ID is: " + session.dialogData.incidentId
                );
                console.log(session.userData.caller_id);
                serviceNow
                    .resolveIncident(session.dialogData, session.userData.caller_id)
                    .then((res) => {
                        session.send(
                            "You got it! I was successfully able to resolve your incident!"
                        );
                        session.endDialog();
                    });
            }
        ])
        .triggerAction({
            matches: "resolveIncident"
        })
        .endConversationAction("endResolveIncident", "Ok. Goodbye.", {
            matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
            confirmPrompt: "Are you sure?"
        });
}