global.axios = require('axios');

let auth = `Basic ${Buffer.from(process.env.SERVICENOW_SA_ID + ':' + process.env.SERVICENOW_SA_PASSWORD).toString('base64')}`;

const config = {
    headers: {
        "Content-Type": "application/json",
        "Authorization": auth
    }
};

const createIncident = (dialogData, userData) => {
    let route = "https://dev58964.service-now.com/api/now/v1/table/incident?sysparm_suppress_auto_sys_field=true";
    let incident = {
        caller_id: userData.caller_id,
        description: dialogData.description,
        short_description: dialogData.short_description,
        state: "New",
        sys_created_by: dialogData.caller,
        sys_created_on: Date.now(),
        sys_updated_by: dialogData.caller,
        sys_updated_on: Date.now()
    }
    return global.axios.post(route, incident, config)
};

const getIncidentByNumber = async(incidentNumber) => {
    let route = `https://dev58964.service-now.com/api/now/v1/table/incident?sysparm_query=number%3D${incidentNumber}`;
    return global.axios.get(route, config);
};


const resolveIncident = (dialogData, callerId) => {
    let route = `https://dev58964.service-now.com/api/now/table/incident/${dialogData.incidentId}?sysparm_exclude_ref_link=true`;
    let resolveIncident = {
        caller_id: callerId,
        close_code: "Closed/Resolved By Caller",
        close_notes: "Closed by API",
        state: "6"
    }
    return global.axios.put(route, resolveIncident, config)
};

const updateIncident = (dialogData, callerId) => {
    let route = `https://dev58964.service-now.com/api/now/v1/table/task/${dialogData.incidentId}?sysparm_exclude_ref_link=true`;
    let updateIncident = {
        caller_id: callerId,
        comments: dialogData.comments,
        sys_created_by: callerId,
        sys_created_on: Date.now()

    }

    return global.axios.put(route, updateIncident, config)
};

const reopenIncident = (incident) => {
    let route = "";
    return global.axios.post(route, incident, config)
};

const getUserRecord = (firstName, lastName) => {
    let route = `https://dev58964.service-now.com/api/now/v1/table/sys_user?sysparm_query=first_name%3D${firstName}%5Elast_name%3D${lastName}`;
    return global.axios.get(route, config);
};

const searchKnowledgeBase = (searchQuery) => {
    let route = `https://dev58964.service-now.com/api/now/table/kb_knowledge?sysparm_query=workflow_state%3Dpublished%5EmetaLIKE${searchQuery}%5EORtextLIKE${searchQuery}&sysparm_exclude_reference_link=true&sysparm_fields=sys_id%2Cshort_description%2Cworkflow_state%2Ckb_knowledge_base%2Ctext%2Cnumber&sysparm_limit=10`;

    return global.axios.get(route, config);
};

const getIncidents = (userId) => {
    let route = `https://dev58964.service-now.com/api/now/table/incident?sysparm_query=caller_id=${userId}^active=true^ORDERBYDESCsys_created_on&sysparm_fields=sys_id%2Csys_created_on%2Cnumber%2Copened_at%2Ccaller_id%2Cshort_description&sysparm_limit=5`;
    return global.axios.get(route, config);
};

module.exports = {
    createIncident: createIncident,
    resolveIncident: resolveIncident,
    updateIncident: updateIncident,
    reopenIncident: reopenIncident,
    getIncidentByNumber: getIncidentByNumber,
    getUserRecord: getUserRecord,
    getIncidents: getIncidents,
    searchKnowledgeBase: searchKnowledgeBase
};