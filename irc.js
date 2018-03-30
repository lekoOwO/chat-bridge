const main = require('./main.js')
const irc = require('irc');
const format = require('string-format')
format.extend(String.prototype, {})
const lang = main.lang;

const ircBot = new irc.Client(main.ircHost, main.ircNick, {
    channels: [main.ircChannel],
    userName: main.ircUserName,
    realName: main.ircRealName,
    port: main.ircPort,
    secure: main.ircUseSSL,
    stripColors: true,
    sasl: true,
    password: main.ircPassword,
    nick: main.ircNick
});

ircBot.on('registered', (message) => {
    console.log(lang.ircConnected);
});

ircBot.on('message' + main.ircChannel, (sender, message) => {
    main.ircMessage(sender, message);
});

ircBot.on('action', (sender, to, message) => {
    if (to == main.ircChannel) {
        main.ircMessage(sender, '/me ' + message);
    }
});

ircBot.addListener('error', function(message) {
    console.log('error: ', message);
});

exports.send = (sender, message) => ircBot.say(main.ircChannel, message ? '<{}>: {}'.format(sender, message): sender);
