module.exports = () => {
    const model =
        "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/" +
        process.env.LuisId +
        "?subscription-key=" +
        process.env.LuisKey +
        "&verbose=true&timezoneOffset=-8.0&q=";
    luisRecognizer = new builder.LuisRecognizer(model);
}