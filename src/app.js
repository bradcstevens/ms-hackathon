require('dotenv').config()
var builder = require('botbuilder');
var teams = require('botbuilder-teams');
var restify = require('restify');
var serviceNow = require("./serviceNow");


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/' + process.env.LUIS_ID + '?subscription-key=' + process.env.LUIS_KEY + '&verbose=true&timezoneOffset=0&q='
var recognizer = new builder.LuisRecognizer(model)
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

myObj = { 'username': 'null', 'createTicket': 'null', 'updateTicket': 'null', 'reopenTicket': 'null', 'listTickets': 'null', 'closeTicket': 'null' };
var isDone = false;

//Dialogs
bot.dialog('/', [
    (session, args, next) => {
        session.beginDialog('/hello')
    },
])

bot.dialog('/hello', [
    (session, results, next) => {
        session.send("Hi! I'm Mr. Meeseeks! Look at me!")
        builder.Prompts.choice(session, "What can I do for you?", ["Create a new Service Now Ticket", "Update a Service Now Ticket", "Delete a Service Now Ticket", "List all of your Service Now Tickets"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {    
        if (results.response.entity === "Create a new Service Now Ticket") {
            session.send("Create a new Service Now Ticket? Oooo yeah, caan doo!")
            session.replaceDialog('/createTicket')
        } else if (results.response.entity === "Update a Service Now Ticket") { 
            session.send(session, "Update a new Service Now Ticket? Oooo yeah, caan doo!")
            session.replaceDialog('/updateTicket')
        } else if (results.response.entity === "Delete a Service Now Ticket") {
            session.send(session, "Delete a Service Now Ticket? Oooo yeah, caan doo!")
            session.replaceDialog('/deleteTicket')
        } else if (results.response.entity === "List all of your Service Now Tickets") {
            session.send(session, "List all of your Service Now Tickets? Oooo yeah, caan doo!")
            session.replaceDialog('/listTickets')
        } else {
            session.endDialog();
        }
    },  
])

bot.dialog('/createTicket', [
    (session, args, next) => {
		let fullName = session.message.address.user.name
        let firstName = "Arthur";
        let lastName = "Erlendsson"
        serviceNow.getUserRecord(firstName, lastName)
            .then((res) => {
                session.dialogData.caller_id = res.data.result[0].sys_id;
                builder.Prompts.text(session, "Can you give me a description of the problem?")
            })
    },
    (session, results, next) => {
        session.dialogData.short_description = results.response;
        builder.Prompts.choice(session, "Thanks! What level of urgency?", ["High", "Medium", "Low"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        session.dialogData.urgency = results.response.entity;
        builder.Prompts.choice(session, "Would you like to add any additional notes?", ["Yes", "No"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        if (results.response.entity === "Yes") {
            builder.Prompts.text(session, "Go ahead")
        } else {
            serviceNow.createTicket(session.dialogData)
                .then((res) => {
                    session.endDialog();
                }).catch((err) => {
                    console.log("ERR", err)
                })
        }
    },
    (session, results, next) => {
        session.dialogData.notes = results.response;
        serviceNow.createTicket(session.dialogData)
            .then((res) => {
                session.endDialog();
            })
    }
]).triggerAction({
    matches: "/createTicket",
}).endConversationAction(
    "endTicketCreate", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^nevermind$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/updateTicket', [
    (session, args, next) => {
        builder.Prompts.text(session, "What is the number of the ticket you'd like to update?");
    },
    (session, results, next) => {
        session.dialogData.ticketNumber = results.response;
        session.send("Let me fetch that ticket for you.");
        serviceNow.getTicketByNumber(session.dialogData.ticketNumber)
            .then((res) => {
                session.dialogData.ticket = res.ticket;
            })
    },

    (session, results, next) => {
        session.dialogData.urgency = results.response.entity;
        builder.Prompts.choice(session, "What field would you like to modify?", ["Work Notes", "State"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        if (results.response.entity === "State") {
            // Update State
            var upd = "State"
            builder.Prompts.choice(session, "What shall I change the state to?", ["New", "In Process", "On Hold", "Resolved", "Closed", "Canceled"], { listStyle: builder.ListStyle.button })
        } else {
            // Update Work Notes
            var upd = "Notes"
            builder.Prompts.text(session, "Please enter the notes you wish to add")
        }
    },

   (session, results, next) => {
        if (upd === "State") {
            session.dialogData.state = results.response;
        }
        else {
            session.dialogData.notes = results.response;
        }
        
        serviceNow.updateTicket(session.dialogData)
        .then((res) => {
            console.log("Ticket Updated", res)
            session.endDialog();
        })
    },

]).triggerAction({
    matches: "UpdateTicket",
}).endConversationAction(
    "endTicketUpdate", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^nevermind$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/listTickets', [
    (session, args, next) => {
        session.send("you said hello!")
    },
]).triggerAction({
    matches: "ListTickets",
}).endConversationAction(
    "endTicketList", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^nevermind$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/reOpenTicket', [
    (session, args, next) => {
        // Get User
        let firstName = "Arthur";
        let lastName = "Erlendsson"
        serviceNow.getUserRecord(firstName, lastName)
        .then((res) => {
            session.dialogData.caller_id = res.data.result[0].sys_id;
            session.send("Great, I see that you want to re-open a ticket")
            builder.Prompts.text(session, "What ticket number would you like to re-open?")
        })
    },
    (session, results, next) => {
        session.dialogData.number = results.response;
        builder.Prompts.choice(session, "Would you like to add any notes to the ticket?", ["Yes", "No"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        if (results.response.entity === "Yes") {
            builder.Prompts.text(session, "Go ahead")
        } else {
            serviceNow.reOpenTicket(session.dialogData)
                .then((res) => {
                    session.endDialog();
                }).catch((err) => {
                    console.log("ERR", err)
                })
        }
    },
    (session, results, next) => {
        session.dialogData.notes = results.response;
        serviceNow.reOpenTicket(session.dialogData)
            .then((res) => {
                console.log("Re-opened", res)
                session.endDialog();
            })
    }
]).triggerAction({
    matches: "ReOpenTicket",
}).endConversationAction(
    "endTicketReOpen", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^nevermind$/i,
        confirmPrompt: "Are you sure?"
    }
);

bot.dialog('/closeTicket', [
    (session, args, next) => {
        // Get User
        let firstName = "Arthur";
        let lastName = "Erlendsson"
        serviceNow.getUserRecord(firstName, lastName)
        .then((res) => {
            session.dialogData.caller_id = res.data.result[0].sys_id;
            session.send("Awesome, I see that you want to close a ticket")
            builder.Prompts.text(session, "What ticket number would you like to close?")
        })
    },
    (session, results, next) => {
        session.dialogData.number = results.response;
        builder.Prompts.choice(session, "Would you like to add any notes to the ticket?", ["Yes", "No"], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        if (results.response.entity === "Yes") {
            builder.Prompts.text(session, "Go ahead")
        }
    },
    (session, results, next) => {
        session.dialogData.close_notes = results.response;
        // Change this to pull resolution codes from SN?
        builder.Prompts.choice(session, "What is the Resolution Code?", ["Solved (Work Around)", "Solved (Permanently)", "Solved Remotely (Work Around)", "Solved Remotely (Permanently)", "Not Solved (Not Reproducible)", "Not Solved (Too Costly)", "Closed/Resolved by Caller" ], { listStyle: builder.ListStyle.button })
    },
    (session, results, next) => {
        session.dialogData.close_code = results.response.entity;
        serviceNow.closeTicket(session.dialogData)
            .then((res) => {
                console.log("Ticket closed", res)
                session.endDialog();
            })
    }
]).triggerAction({
    matches: "CloseTicket",
}).endConversationAction(
    "endTicketClose", "Ok. Goodbye.",
    {
        matches: /^cancel$|^goodbye$|^nevermind$/i,
        confirmPrompt: "Are you sure?"
    }
);