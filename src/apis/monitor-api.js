const {sender_get} = require('./sender')

module.exports = {
    count: function(payload) {
        const route = '/sellpro_request/_count';
        return sender_get(route, payload);
    },
    search: function(payload) {
        const route = '/sellpro_request/_search';
        return sender_get(route, payload);
    }
};
