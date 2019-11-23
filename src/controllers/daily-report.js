const {search, count} = require('../apis/monitor-api');
const {get_midnight_stamp} = require('../utils/time-utils');
const {send_mail} = require('./send-mail');

async function calculate_usage_for_report() {
    const count_query = {
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
        }
    };
    const search_query = {
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
            },
            "sum_bandwidth_by_service": {
                "terms": {
                    "field": "service_invoker.keyword"
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
                }
            }
        },
        "size": 0
    };
    try {
        const count_data = await count(count_query);
        const search_data= await search(search_query);
        return {
            total_requests: count_data.count,
            sum_in_bandwidth: search_data.aggregations.sum_in_bandwidth.value,
            sum_out_bandwidth: search_data.aggregations.sum_out_bandwidth.value,
            sum_bandwidth_by_service: search_data.aggregations.sum_bandwidth_by_service.buckets,
        };
    } catch (err) {
        throw new Error(err);
    }
}

function daily_report() {
    calculate_usage_for_report().then(data => {
        const {
            total_requests, 
            sum_in_bandwidth, sum_out_bandwidth,
            sum_bandwidth_by_service: sbbs,
        } = data;

        const sum_in_bandwidth_mb = Math.round(parseFloat(sum_in_bandwidth) * 100 / Math.pow(2, 20)) / 100;
        const sum_out_bandwidth_mb = Math.round(parseFloat(sum_out_bandwidth) * 100 / Math.pow(2, 20)) / 100;
        const sum_in_bandwidth_gb = Math.round(parseFloat(sum_in_bandwidth) * 100 / Math.pow(2, 30)) / 100;
        const sum_out_bandwidth_gb = Math.round(parseFloat(sum_out_bandwidth) * 100 / Math.pow(2, 30)) / 100;
        const usage_gb = sum_in_bandwidth_gb + sum_out_bandwidth_gb;

        let labeled_service_usage_mb = 0;

        const sum_bandwidth_by_service = sbbs.map(service_stat => {
            service_usage = parseFloat(service_stat.sum_in_bandwidth.value) + parseFloat(service_stat.sum_out_bandwidth.value);
            service_usage_mb = Math.round(service_usage * 100 / Math.pow(2, 20)) / 100;
            labeled_service_usage_mb += service_usage_mb;
            return {
                key: service_stat.key,
                value_mb: service_usage_mb,
            };
        }).concat([{
            key: 'other',
            value_mb: sum_in_bandwidth_mb + sum_out_bandwidth_mb - labeled_service_usage_mb,
        }]);

        send_mail({
            mail_title: "Proxy usage daily report",
            mail_content: [
                `Today we made ${total_requests} requests, total usage is ${usage_gb} GB, including:`,
                ``,
                `${sum_in_bandwidth_gb} GB ingress traffic`,
                `${sum_out_bandwidth_gb} GB egress traffic`,
                ``,
                `Usage by service:`,
                ``,
                sum_bandwidth_by_service.map(service_stat => `${service_stat.key}: ${service_stat.value_mb} MB`).join('\n'),
            ].join('\n'),
        }).then(() => {
            console.log(`Daily report was sent: ${(new Date()).toLocaleString()}`);
        }, err => {
            console.error("SEND_MAIL", err);
        });
    }, err => {
        console.error("DAILY_REPORT", err);
    });
}

module.exports = {daily_report};