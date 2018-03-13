let axios = require('axios')

let auth = `Basic ${Buffer.from("admin:Password999!").toString('base64')}`;

const config = {
    headers: {
        "Content-Type": "application/json",
        "Authorization": auth
    }
};


const createTicket = (dialogData, callerId) => {
    let route = "https://dev45236.service-now.com/api/now/v1/table/incident?sysparm_suppress_auto_sys_field=true";
    let ticket = {
        caller_id: callerId,
        short_description: dialogData.short_description,
        urgency: dialogData.urgency,
        state: "New",
        sys_created_by: dialogData.caller,
        sys_created_on: Date.now(),
        sys_updated_by: dialogData.caller,
        sys_updated_on: Date.now()
    }
    return axios.post(route, ticket, config)
}

const getTicketByNumber = async(ticketNumber) => {
    let route = `https://dev45236.service-now.com/api/now/v1/table/incident?sysparm_query=number%3D${ticketNumber}`;
    return axios.get(route, config);
}

const listTickets = async(callerId) => {
    let route = `https://dev45236.service-now.com/api/now/table/incident?sysparm_query=caller_id%3D${callerId}`;
    return axios.get(route, config)
}

const closeTicket = (ticket) => {
    let route = "";
    return axios.post(route, ticket, config)
}
const updateTicket = (ticketID, notes, userId) => {
    let route = `https://dev45236.service-now.com/api/now/v1/table/task/${ticketID}?sysparm_exclude_ref_link=true`;
    let updateTicket = {
        caller_id: userId,
        /* short_description: ticket.short_description, */
        work_notes: notes
            /* urgency: ticket.urgency,
            state: ticket.state,
            sys_updated_by: userId,
            sys_updated_on: Date.now() */
    }

    return axios.put(route, updateTicket, config)
}

const reOpenTicket = (ticket) => {
    let route = "";
    return axios.post(route, ticket, config)
}

const getUserRecord = (firstName, lastName) => {
    let route = `https://dev45236.service-now.com/api/now/v1/table/sys_user?sysparm_query=first_name%3D${firstName}%5Elast_name%3D${lastName}`;
    return axios.get(route, config);
}

const searchKb = (searchQuery) => {
    let route = `https://dev45236.service-now.com/api/now/v1/table/kb_knowledge?sysparm_query=short_descriptionLIKE${searchQuery}&sysparm_fields=short_description&sysparm_limit=10`;
    return axios.get(route, config);
}

module.exports = {
    createTicket: createTicket,
    listTickets: listTickets,
    closeTicket: closeTicket,
    updateTicket: updateTicket,
    reOpenTicket: reOpenTicket,
    getUserRecord: getUserRecord,
    getTicketByNumber: getTicketByNumber,
    searchKb: searchKb
}