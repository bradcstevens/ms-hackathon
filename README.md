# Graphs, Teams & Bots MS Hackathon

Microsoft teamed up with [CDW](https://www.cdw.com), a Fortune 500 technology solutions provider, to create a solution that would provide a more customized workspace.

## Key technologies used

- [Microsoft Bot Framework](https://docs.botframework.com)
- [Microsoft Cognitive Services LUIS API](https://luis.ai)
- [Microsoft Azure App Service](https://azure.com)
- [Microsoft Teams](https://slack.fail)
- [Office 365](https://portal.office.com)
- [ServiceNow](https://www._.com)

## Core team

- [Mike Robinson](https://www.linkedin.com/in/mike-robinson-7a8ab62/) - 
Technical Architect, CDW
- [Brad Stevens](https://www.linkedin.com/in/bradcstevens/) - 
Senior Consulting Engineer, CDW
- [Lucas Huet-Hudson](https://www.linkedin.com/in/lucas-huet-hudson-0a7110a9/) - 
Software Development Engineer, Microsoft
- Arthur Erlendsson - Software Development Engineer, Microsoft 
- [Sarah Sexton](https://www.linkedin.com/in/sarahjeannesexton/) - Technical Evangelist, Microsoft 

## Source code

A proof-of-concept solution is open-sourced under the MIT License on GitHub.

# Customer Profile

CDW is a multi-brand technology solutions provider to business, government, education, and healthcare organizations in the United States, Canada, and the United Kingdom. A Fortune 500 company with multi-national capabilities, CDW was founded in 1984 and employs nearly 8,800 coworkers. For the trailing twelve months ended September 30, 2017, the company generated net sales of nearly $15 billion. CDW's broad array of offerings range from discrete hardware and software products to integrated IT solutions such as mobility, security, cloud, data center and collaboration. 

 ![CDW Logo](/src/images/cdwLogo.png)

For this project, Microsoft worked closely with Senior Consulting Engineer Brad Stevens and Technical Architect Mike Robinson from CDW to craft a _ customizable _ bot assistant that _.

# Problem Statement

Every IT department request ticket that is sent to CDW is currently  handled by a team of humans. When a ticket is initiated, the platform responds to the sender with a canned message (set by the subscriber) notifying the sender that someone will respond shortly. The platform currently does not have a bot that can automatically respond to commonly asked questions or inquiries.

>"The Bot that we made in Microsoft Bot Framework allows for _ to engage with our _ and deeper invest themselves in _." -
>*Mike Robinson, Technical Architect, CDW*

CDW saw two primary ways to achieve this goal: make _, and better _.

>"In the world we live in, of everything being available at the click of a button, Microsoft has implemented a point-and-click solution, that we were able to leverage with minimal effort, for something as complicated as Machine Learning. LUIS is probably the best example I've seen first-hand of Machine Learning." -
>*Brad Stevens, Senior Consulting Engineer, CDW*

>"Utilizing the Microsoft Bot Builder SDK allowed us to create a working bot in a minimal amount of time (even with NLP) - the ability to add buttons to chat conversations is a great feature as well." -
>*Mike Robinson, Technical Architect, CDW*

Most _ have a large amount of information accompanying them for _ to read.

# Solution and steps

There were two primary goals to the solution: 

1. Improve _ by using cognitive intelligence to give a tailored experience based on _
2. Track and report on _: "Build Teams integration with [ServiceNow]() that collects info out of app/ticket/knowledge base and allows searching for key words. Also looking at creating a tab in Teams with open/escalate ticket options.

## Prerequisites 

1. Install [Visual Studio Code](). 
2. Obtain a [GitHub]() account.
3. Obtain an [Azure subscription]() to use Azure App Service.
4. Obtain a key for the Cognitive Services [LUIS API]().
5. Obtain an [Office 365 tenant]().
6. Install [Node.js]() and NPM on Windows 10.

## App

We wanted to integrate [ServiceNow]() with a chat bot in Microsoft Teams by using cognitive intelligence to collect information out of tickets and allow searching for key words. 

Arthur Erlendsson found out that you can override the automatically set "system" fields and change them to any string, which bypasses the need to have a separate Auth call to an external data store that keeps usernames and passwords. (This "hack" makes the solution unsafe, but easier to manage.)

# Technical delivery

The entire solution involved multiple technologies. This diagram shows the high-level architecture that is explained in each of the following sub-sections. 

 ![Architecture Diagram](/src/images/Architecture.png)

The key steps of the solution were to create a Microsoft Bot Framework bot that would run in Microsoft Teams. This bot would be integrated into CDW's internal Teams and set to activate when a person (user) wished to (open a ticket). The ticket would then be sent to ServiceNow Web API that passes the information through the _ API to gather data on userID, state, list, callerID, blank, and other data points before logging the data in (Table storage) for later analysis and passing the data back to the bot app. The bot would then tailor the conversation about the ticket based on the data gained from the API. 

## Microsoft Bot Framework

Web app URL: http://cdwb.azurewebsites.net 

Code snippet example:

``` js
bot.dialog('/', [
    function (session) {
        getProfile(session, function (session,profile) { session.beginDialog('/ensureProfile', profile); })
    },
    function (session, results) {
        session.replaceDialog('/luis');
    }
]);
```

## Microsoft Teams

Microsoft Teams is a chat-based conversation tool that contains everything a team needs to collaborate. Our goal was to extend on Teams by building a Bot, as well as extending the user interface with a custom Tab. 

In order to run the bot inside Microsoft Teams:

- The bot must be registered with the Bot Connector
- The AppId and AppPassword from the Bot Framework registration page have to be recorded in the project's web.config
- The bot must be added to Microsoft Teams

## ServiceNow

The Microsoft team worked with the ServiceNow API to implement features related to an "IT Help Desk" scenario. Examples include opening and closing request tickets, generating user database tables, and implementing Create, List, Update, and Close ticket functionality. 

# Conclusion

The challenge for us was to make _ more _ for _s and also to provide _ with more data about _. The solution achieved these two primary goals of providing a more intelligent _ and tracking _, which allows _ to better understand how _. 

The solution involved a wide range of Microsoft technologies, but focused around three main areas:

- The Microsoft Bot Framework 
- Cognitive Services to provide intelligence _ 
- Azure App Service for _, hosting, and _ .

The next steps at a high level are to further develop the solution to make it more robust and flexible, and to take it to other customers/clients/companies with the goal of gaining sponsorship to make it a production system.

## Next steps for the solution

### Authorization Security for the ServiceNow API

CDW's next steps with this solution are to talk to their clients about ServiceNow's use of Authorization via usernames, and passwords. Our workaround involved giving the bot unlimited "service account" permissions. This is not ideal for future production, because there is no way to enforce permission scopes for specific tables on users vs. the bot. 

### Create an easy-to-use interface for making modifications to tickets

Text

### Adapt for future

Some attempt was made during the project to gather information about _. 

>"Quote." - *Person, Title, CDW*