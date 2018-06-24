module.exports = () => {
    bot.dialog("/specifyCredentials", [
        (session) => {
            builder.Prompts.text(
                session,
                "What is the first name you use to log in to Service Now?"
            );
        },
        (session, results) => {
            session.dialogData.firstName = results.response;
            builder.Prompts.text(session, "Thanks! And your last name?");
        },
        (session, results) => {
            session.dialogData.lastName = results.response;
            serviceNow
                .getUserRecord(session.dialogData.firstName, session.dialogData.lastName)
                .then((res) => {
                    session.userData.caller_id = res.data.result[0].sys_id;
                    session.send("Thanks, " + session.dialogData.firstName + "!");
                    session.endDialog();
                })
                .catch((err) => {
                    session.send(
                        "Hmm, I can't find your user account with those credentials. Let's try again."
                    );
                    session.replaceDialog("/specifyCredentials");
                });
        }
    ]);
}