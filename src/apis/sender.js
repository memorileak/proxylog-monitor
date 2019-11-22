const config = require('config');
const axios = require('axios');
const LOG_URI = config.get('log_url');

function handle_response(res) {
    if (res.data) {
        return Promise.resolve(res.data);
    } else {
        return Promise.reject("Unknown error");
    }
}

module.exports = {
    sender_get: function(route, payload) {
        const FULL_URL = `${LOG_URI}${route}`;
        const data = payload;
        const headers = {'Content-Type': 'application/json'};
        return axios.get(FULL_URL, {headers, data}).then(handle_response);
    },
};
