global.axios = require('axios');

const getResourceGroup = (resoureGroup) => {
    let route = `https://management.azure.com/subscriptions/26fd9d2b-a6e5-412b-af5f-31f63064a82c/resourceGroups?api-version=2014-04-01`
    return global.axios.get(route, config);
};

module.exports = {
    getResourceGroup: getResourceGroup
};