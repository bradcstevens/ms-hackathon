module.exports = () => {
    const ba = require('../../connectorSetup');
    bot.dialog("/signin", [].concat(

        ba.authenticate("aadv2"),
        (session, args, skip) => {
            let user = ba.profile(session, "aadv2");
            session.endDialog(user.displayName);
            session.userData.accessToken = user.accessToken;
            session.userData.refreshToken = user.refreshToken;
            session.beginDialog('/workPrompt');
        }
    ));
}