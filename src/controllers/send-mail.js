const config = require('config');
const {spawn} = require('child_process');
const {Readable} = require('stream');

const recipient = config.get('recipient');
const from_header = config.get('from_header');


function send_mail({mail_title, mail_content}) {
    return new Promise((resolve, reject) => {
        const send_m = spawn('mail', ['-a', `from: ${from_header}`,'-s', mail_title, recipient]);
        send_m.on('exit', (code, signal) => {
            if (code === 0) {
                resolve('Send successful');
            } else {
                reject("Send failed");
            }
        });

        const mail_content_stream = new Readable();
        mail_content_stream.push(mail_content);
        mail_content_stream.push(null);
        mail_content_stream.pipe(send_m.stdin);
    });
}

module.exports = {send_mail};