const {search} = require('../apis/monitor-api');
const {get_midnight_stamp} = require('../utils/time-utils');
const {send_mail} = require('./send-mail');

async function calculate_bandwidth_usage() {
    const query = {
        "query": {
            "bool": {
                "filter": {
                    "range": {
                        "created_at": {
                            "gte": get_midnight_stamp()
                        }
                    }
                }
            }
        },
        "aggs": {
            "sum_in_bandwidth": {
                "sum": {
                    "field": "in_bandwidth"
                }
            },
            "sum_out_bandwidth": {
                "sum": {
                    "field": "out_bandwidth"
                }
            }
        },
        "size": 0
    };
    try {
        const data = await search(query);
        return {
            sum_in_bandwidth: data.aggregations.sum_in_bandwidth.value,
            sum_out_bandwidth: data.aggregations.sum_out_bandwidth.value,
        };
    } catch (err) {
        throw new Error(err);
    }
}

function check_exceed_limit_usage(on_warned) {
    calculate_bandwidth_usage().then(data => {
        const limit_gb = 1;
        const {sum_in_bandwidth, sum_out_bandwidth} = data;
        const sum_in_bandwidth_gb = Math.round(parseFloat(sum_in_bandwidth) * 100 / Math.pow(2, 30)) / 100;
        const sum_out_bandwidth_gb = Math.round(parseFloat(sum_out_bandwidth) * 100 / Math.pow(2, 30)) / 100;
        const usage_gb = sum_in_bandwidth_gb + sum_out_bandwidth_gb;
        if (usage_gb > limit_gb) {
            send_mail({
                mail_title: "Proxy usage exceeded",
                mail_content: [
                    `Your usage has exceeded today ${limit_gb} GB threshold. Right now, total usage is ${usage_gb} GB, including:`,
                    ``,
                    `${sum_in_bandwidth_gb} GB ingress traffic`,
                    `${sum_out_bandwidth_gb} GB egress traffic`,
                    ``,
                    `Please check if you think this usage is abnormal.`
                ].join('\n'),
            }).then(() => {on_warned()}, err => {console.error("SEND_MAIL", err)});
        }
    }, err => {
        console.error("CALCULATE_BANDWIDTH_USAGE", err)
    })
}

module.exports = {check_exceed_limit_usage};