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
		caller_id: dialogData.caller_id,
		short_description: dialogData.description,
		urgency: dialogData.urgency,
		notes: dialogData.notes ? dialogData.notes: "",
		state: "New"
	}
	console.log(ticket)
	return axios.post(route, ticket, config)
}

const listTickets = async (callerId) => {
	let route = `https://dev45236.service-now.com/api/now/table/incident?sysparm_query=caller_id%3D${callerId}`;
	return axios.get(route, config)
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

const getUserRecord = async (firstName, lastName) => {
	let route = `https://dev45236.service-now.com/api/now/v1/table/sys_user?sysparm_query=first_name%3D${firstName}%5Elast_name%3D${lastName}`;
	return axios.get(route,config);
}

module.exports = {
	createTicket: createTicket,
	listTickets: listTickets,
	closeTicket: closeTicket,
	updateTicket: updateTicket,
	reOpenTicket: reOpenTicket,
	getUserRecord: getUserRecord
}