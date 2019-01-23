module.exports = () => {
    bot.dialog("/searchKnowledgeBase", [
            (session, results, next) => {
                if (!session.userData.caller_id) {
                    session.beginDialog("/verifyServiceNowUserLogin");
                } else {
                    next();
                }
            },
            (session) => {
                session.send(
                    "I understand that you need help finding a knowledge article in ServiceNow."
                );
                builder.Prompts.choice(
                    session,
                    "Did I understand you correctly?", ["Yes, please search for ServiceNow Published Knowledge.", "No, not now."], { listStyle: builder.ListStyle.button }
                );
            },
            (session, results, next) => {
                if (results.response.entity === "Yes, please search for ServiceNow Published Knowledge.") {
                    builder.Prompts.text(
                        session,
                        "What would you like to search for? I will be able to provide the first 10 results of what I find."
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
                session.dialogData.searchQuery = results.response;
                serviceNow
                    .searchKnowledgeBase(session.dialogData.searchQuery)
                    .then((res) => {
                        if (res.status == "200") {
                            console.log("Successfully queried KB");
                            console.log(res);
                            if (res.data.result.length > 0) {
                                session.dialogData.searchResults = res.data.result;
                                session.send("Here's what I found:");
                                let feed = session.dialogData.searchResults;
                                let msg = new builder.Message(session).attachmentLayout(
                                    builder.AttachmentLayout.carousel
                                );
                                feed.forEach((result, i) => {
                                        let url =
                                            "https://dev68819.service-now.com/sp?id=kb_article&sys_id=" +
                                            result.sys_id;
                                        msg.addAttachment(
                                            new builder.HeroCard(session)
                                            .title(result.short_description)
                                            .text(result.number)
                                            .buttons([
                                                builder.CardAction.openUrl(session, url, "Learn More")
                                            ])
                                        );
                                    }),
                                    session.send(msg);
                                session.replaceDialog("/getResultFeedback");
                            } else {
                                session.send(
                                    "Unfortunately, I wasn't able to find anything referencing \"" +
                                    session.dialogData.searchQuery +
                                    '"'
                                );
                                session.replaceDialog("/getResultFailFeedback");
                            }
                        }
                    });
            }
        ])
        .triggerAction({
            matches: "searchKnowledgeBase"
        })
        .endConversationAction("endSearchKnowledgeBase", "Ok. Goodbye.", {
            matches: /^cancel$|^goodbye$|^nevermind$|^never mind$|^exit$|^quit$|^start over$/i,
            confirmPrompt: "Are you sure?"
        });
}