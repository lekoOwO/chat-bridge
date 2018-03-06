const http = require('http');
const https = require('https');
const mime = require('mime-types')
const fs = require('fs');
var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var protocal = url.split(':')[0].slice(-1) == 's' ? https : http
  var request = protocal.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    console.error(err);
  });
};

var format = require('string-format')
format.extend(String.prototype, {})

const main = require('./main.js')

const token = main.token;
const TelegramBot = require('node-telegram-bot-api'); // api
const bot = new TelegramBot(token, { polling: true });

const replyToTextLimit = main.replyToTextLimit;

const removeEmpty = (x) => {var obj = Object.assign({}, x);Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]);return obj;}

exports.init = () => bot.getMe().then(result => exports.id = result.id)
exports.send = ({text='', chatId=main.testTgId, photo, audio, doc, game, video, voice, videoNote, venue, contact, location, sticker, cb=() => {}}={}) => {
  if (photo) bot.sendPhoto(chatId, photo, {'caption':text}).then(() => cb());
  else if (audio) bot.sendAudio(chatId, audio, {}, {contentType: mime.lookup(audio)}).then(() => cb());
  else if (doc) bot.sendDocument(chatId, doc, {}, {contentType: mime.lookup(doc)}).then(() => cb());
  else if (game) bot.sendGame(chatId, game).then(() => cb());
  else if (video) bot.sendVideo(chatId, video, {'caption':text}, {contentType: mime.lookup(video)}).then(() => cb());
  else if (voice) bot.sendVoice(chatId, voice, {'caption':text}, {contentType: mime.lookup(voice)}).then(() => cb());
  else if (videoNote) bot.sendVideoNote(chatId, videoNote, {}, {contentType: mime.lookup(videoNote)}).then(() => cb());
  else if (venue) bot.sendVenue(chatId, venue.latitude, venue.longitude, venue.title, venue.address).then(() => cb());
  else if (contact) bot.sendContact(chatId, contact.phoneNumber, contact.firstName).then(() => cb());
  else if (location) bot.sendLocation(chatId, location.latitude, location.longitude).then(() => cb());
  else if (sticker) bot.sendSticker(chatId, sticker).then(() => cb());
  else bot.sendMessage(chatId, text).then(() => cb());
}

getMessageBasicInfo = message => {
  var text = message.caption ? message.caption : message.text ? message.text : '';
  var chatId = message.chat.id;
  var userId = message.from.id;
  var userName = message.from.first_name;
  var addition = '';
  if (message.reply_to_message){
    var replyToId = message.reply_to_message.from.id;
    var replyToName = message.reply_to_message.from.first_name;
    if (replyToId == exports.id){
      replyToName = message.reply_to_message.text.split('>')[0].slice(1);
      var replyToText = message.reply_to_message.caption ? message.reply_to_message.caption : message.reply_to_message.text;
      var offset = '<>: '.length
      var isSliced = replyToText.length > replyToName.length+offset+replyToTextLimit;
      replyToText = replyToText.substr(replyToName.length+offset, replyToTextLimit);
    }
    else {
      var replyToText = message.reply_to_message.caption ? message.reply_to_message.caption : message.reply_to_message.text;
      var isSliced = replyToText.length > replyToTextLimit;
      replyToText = replyToText.substr(0, replyToTextLimit);
  }}
  if (message.forward_from){
    var forwardFromId = message.forward_from.id;
    if (forwardFromId == exports.id) var forwardFromName = message.forward_from.text.split('>')[0].slice(1);
    else var forwardFromName = message.forward_from.first_name + (message.forward_from.last_name ? (' ' + message.forward_from.last_name) : '');
  }
  if (message.forward_from_chat){
    var forwardFromId = message.forward_from_chat.id;
    var forwardFromName = message.forward_from_chat.title ? message.forward_from_chat.title : ('@'+message.forward_from_chat.username);
  }
  return [text, chatId, userId, userName, addition, replyToId, replyToName, replyToText, forwardFromId, forwardFromName, isSliced]
}

bot.on('text', message => {
  [text, chatId, userId, userName, addition, replyToId, replyToName, replyToText, forwardFromId, forwardFromName, isSliced] = getMessageBasicInfo(message);
  main.botMessage({'chatId':chatId, 'userId':userId, 'userName':userName, 'text':text, 'replyToId':replyToId, 'replyToName':replyToName,
    'forwardFromId':forwardFromId, 'forwardFromName':forwardFromName, 'replyToText':replyToText, 'addition':addition, 'isSliced':isSliced});
});

['audio', 'document', 'photo', 'sticker', 'video', 'voice', 'video_note'].forEach(x => bot.on(x, message => {
  [text, chatId, userId, userName, addition, replyToId, replyToName, replyToText, forwardFromId, forwardFromName, isSliced] = getMessageBasicInfo(message);
  var file = x == 'photo' ? message[x].pop() : message[x]
  var fileId = file.file_id
  if (x == 'sticker') var extension = 'webp';
  else if (x == 'video_note') var extension = 'mp4';
  else if (x == 'photo') var extension = 'png';
  else var extension = file.mime_type ? file.mime_type == 'audio/mpeg3' ? 'mp3' : mime.extension(file.mime_type) : file.file_path.split('.').pop();
  var attachment = bot.getFileStream(fileId);
  attachment.path += '.' + extension;
  main.botMessage({'chatId':chatId, 'userId':userId, 'userName':userName, 'text':text, 'replyToId':replyToId, 'replyToName':replyToName,
        'forwardFromId':forwardFromId, 'forwardFromName':forwardFromName, 'replyToText':replyToText, 'attachment':attachment, 'isSliced':isSliced});
}));

bot.on('venue', message => {
  [text, chatId, userId, userName, addition, replyToId, replyToName, replyToText, forwardFromId, forwardFromName, isSliced] = getMessageBasicInfo(message);
  var venue = message.venue;
  addition += '\n🌏: {}\n🚩: {}\n🗺️: {}, {}'.format(venue.foursquare_id, venue.title, venue.address, venue.location.latitude, venue.location.longitude);
  main.botMessage({'chatId':chatId, 'userId':userId, 'userName':userName, 'text':text, 'replyToId':replyToId, 'replyToName':replyToName,
    'forwardFromId':forwardFromId, 'forwardFromName':forwardFromName, 'replyToText':replyToText, 'addition':addition, 'isSliced':isSliced});
});

bot.on('contact', message => {
  [text, chatId, userId, userName, addition, replyToId, replyToName, replyToText, forwardFromId, forwardFromName, isSliced] = getMessageBasicInfo(message);
  var contact = message.contact;
  addition += '\n📱: ' + contact.phone_number;
  addition += '\n姓名:' + contact.last_name ? (contact.first_name + contact.last_name) : contact.first_name;
  addition += 'ID: ' + contact.user_id;
  main.botMessage({'chatId':chatId, 'userId':userId, 'userName':userName, 'text':text, 'replyToId':replyToId, 'replyToName':replyToName,
    'forwardFromId':forwardFromId, 'forwardFromName':forwardFromName, 'replyToText':replyToText, 'addition':addition, 'isSliced':isSliced});
});

bot.on('location', message => {
  [text, chatId, userId, userName, addition, replyToId, replyToName, replyToText, forwardFromId, forwardFromName, isSliced] = getMessageBasicInfo(message);
  var location = message.location;
  addition += '\n🗺️: {}, {}'.format(location.latitude, location.longitude);
  main.botMessage({'chatId':chatId, 'userId':userId, 'userName':userName, 'text':text, 'replyToId':replyToId, 'replyToName':replyToName,
    'forwardFromId':forwardFromId, 'forwardFromName':forwardFromName, 'replyToText':replyToText, 'addition':addition, 'isSliced':isSliced});
});
