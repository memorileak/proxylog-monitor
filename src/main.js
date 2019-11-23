const {CronJob} = require('cron');

const {check_exceed_limit_usage} = require('./controllers/check-limit-usage');
const {daily_report} = require('./controllers/daily-report');

module.exports = function() {
    let exceed_warned = false;

    // Reset exceed_warned everyday
    new CronJob('0 0 0 * * *', () => {
        exceed_warned = false;
    }, null, true);

    // Check usage exceed every hours
    new CronJob('0 0 * * * *', () => {
        if (!exceed_warned) {
            check_exceed_limit_usage(() => {exceed_warned = true});
        }
    }, null, true);

    // Daily report
    new CronJob('0 0 0 * * *', () => {
        daily_report();
    }, null, true);

    console.log("Proxylog monitor is online");
};