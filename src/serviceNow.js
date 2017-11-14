let axios = require('axios')

const config = {
	headers: { "Content-Type": "application/json" }
};

const createTicket = (dialogData) => {
	let route = "";
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
	reOpenTicket: reOpenTicket,
}