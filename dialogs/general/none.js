module.exports = () => {
    bot.dialog("/None", [
            (session) => {
                session.send(
                    "Oops! I didn't understand what you said, " +
                    session.message.user.name +
                    "! Either I'm not sure how to respond, or I may not have the answer right now. You could always \
                try to rephrase your question and I'll try again to find you an answer!"
                );
                session.beginDialog("/");
            }
        ])
        .triggerAction({
            matches: "None"
        });
}