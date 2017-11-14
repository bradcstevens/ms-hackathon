let axios = require('axios')

let auth = `Basic ${Buffer.from("arerlend:Arthur999").toString('base64')}`;

const config = {
	headers: { 
		"Content-Type": "application/json",
		"Authorization": auth
	}
};

const createTicket = (dialogData) => {
	let route = "https://dev45236.service-now.com/api/now/v1/table/incident";
	let ticket = {
		caller_id: dialogData.caller,
		short_description: dialogData.description,
		urgency: dialogData.urgency,
		notes: dialogData.notes ? dialogData.notes: "",
		state: "New"
	}
	return axios.post(route, ticket, config)
}

const listTickets = (ticket) => {
	let route = "";
	return axios.post(route, ticket, config)
}

const closeTicket = (ticket) => {
	let route = "";
	return axios.post(route, ticket, config)
}

const updateTicket = (ticket) => {
	let route = "";
	return axios.post(route, ticket, config)
}

const reOpenTicket = (ticket) => {
	let route = "";
	return axios.post(route, ticket, config)
}

module.exports = {
	createTicket: createTicket,
	listTickets: listTickets,
	closeTicket: closeTicket,
	updateTicket: updateTicket,
	reOpenTicket: reOpenTicket
}