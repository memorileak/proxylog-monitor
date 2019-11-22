module.exports = {
    get_midnight_stamp: function() {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        return midnight.getTime();
    }
}
