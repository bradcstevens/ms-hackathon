module.exports = () => {
    bot.dialog("/logout", (session) => {
        ba.logout(session, "aadv2");
        session.endDialog("logged_out");
    });
}