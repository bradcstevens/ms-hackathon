module.exports = () => {
    bot.dialog("/thankYou", [
        (session) => {
            session.send("Of course, " + session.message.user.name + "!");
            session.replaceDialog("/");
        }
    ]).triggerAction({
        matches: "ThankYou"
    });
}