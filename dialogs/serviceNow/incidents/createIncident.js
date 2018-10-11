module.exports = () => {
    bot.dialog("/createIncident", [
            (session, results, next) => {
                // if (!session.userData.caller_id) {
                session.beginDialog("/verifyServiceNowUserLogin");
                // } else {
                //    console.log(session.userData);
                //    next();
                // }
            },
            (session) => {
                session.send(
                    "I understand that you want to open a new incident in ServiceNow"
                );
                builder.Prompts.choice(
                    session,
                    "Did I understand you correctly?", [
                        "Yes, please help me create an incident.",
                        "No, I do not need to create an incident right now."
                    ], {
                        listStyle: builder.ListStyle.button
                    }
                );
            },
            (session, results, next) => {
                if (
                    results.response.entity === "Yes, please help me create an incident."
                ) {
                    builder.Prompts.text(
                        session,
                        "What's your short description of the problem?"
                    );
                    next();
                } else {
                    session.send(
                        "Sorry I misunderstood! Maybe I can help with something else?"
                    );
                    session.endDialog();
                }
            },
            (session, results) => {
                session.dialogData.short_description = results.response;
                session.send("Got it! I just need a little more information.");
                builder.Prompts.text(
                    session,
                    "Please describe the problem in more detail"
                );
            },
            (session, results) => {
                session.dialogData.description = results.response;
                builder.Prompts.choice(
                    session,
                    "Would you like to add any additional notes?", ["Yes", "No"], { listStyle: builder.ListStyle.button }
                );
            },
            (session, results, next) => {
                if (results.response.entity === "Yes") {
                    builder.Prompts.text(
                        session,
                        "What other notes should I add to the incident?"
                    );
                    next();
                } else {
                    session.send(
                        "Thanks! I was successfully able to submit your issue as an incident in ServiceNow!"
                    );
                    let url =
                        "https://dev72787.service-now.com/nav_to.do?uri=%2Fincident_list.do%3Factive%3Dtrue%26sysparm_query%3Dactive%3Dtrue%5EEQ%26sysparm_userpref_module%3D4fed4395c0a8016400fcf06c27b1e6c6%26sysparm_clear_stack%3Dtrue";
                    let imageURL =
                        "https://az818438.vo.msecnd.net/icons/service-now.png";
                    let msg = new builder.Message(session);
                    msg.attachments([
                        new builder.HeroCard(session)
                        .images([builder.CardImage.create(session, imageURL)])
                        .buttons([
                            builder.CardAction.openUrl(session, url, "View My Incidents")
                        ])
                    ]);
                    session.send(msg);
                    serviceNow
                        .createIncident(session.dialogData, session.userData)
                        .then((res) => {
                            session.endDialog();
                        })
                        .catch((err) => {
                            console.log("ERR", err);
                        });
                }
            },
            (session, results) => {
                session.dialogData.notes = results.response;
                session.send(
                    "Thanks! I was successfully able to submit your issue as an incident in ServiceNow!"
                );
                var url =
                    "https://dev72787.service-now.com/nav_to.do?uri=%2Fincident_list.do%3Factive%3Dtrue%26sysparm_query%3Dactive%3Dtrue%5EEQ%26sysparm_userpref_module%3D4fed4395c0a8016400fcf06c27b1e6c6%26sysparm_clear_stack%3Dtrue";
                var imageURL =
                    "https://az818438.vo.msecnd.net/icons/service-now.png";
                let msg = new builder.Message(session);
                msg.attachments([
                    new builder.HeroCard(session)
                    .images([builder.CardImage.create(session, imageURL)])
                    .buttons([
                        builder.CardAction.openUrl(session, url, "View My Incidents")
                    ])
                ]);
                session.send(msg);
                global.serviceNow
                    .createIncident(session.dialogData, session.userData)
                    .then((res) => {
                        session.endDialog();
                    });
            }
        ])
        .triggerAction({
            matches: "createIncident"
        })
        .endConversationAction("endIncidentCreate", "Ok. Goodbye.", {
            matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
            confirmPrompt: "Are you sure?"
        });
}