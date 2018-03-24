// npm install --save Schmavery/facebook-chat-api string-format jsonfile mime-types node-telegram-bot-api showdown irc humps
const format = require('string-format')
const jsonfile = require('jsonfile')
const fs = require('fs');
format.extend(String.prototype, {})

console.log("   ╭─────────────────────────────────────╮")
console.log("   │                                     │")
console.log("   │   錢幣幣 Desu                        │")
console.log("   │   github.com/rexx0520/TGBridge_JS   │")
console.log("   │                                     │")
console.log("   ╰─────────────────────────────────────╯")

var [testMsgrId, testTgId, groupTgId, groupMsgrId, debug, fbAccount, tgUsers, tgToken, previewTextLimit, downloadToBuffer, chats] = []
var init = () => {
  if (fs.existsSync('config.json')) {
    jsonfile.readFile('./config.json', (err, obj) => {
      [groupMsgrId, messenger, fbAccount] = [exports.groupMsgrId, exports.messenger, exports.fbAccount] = [obj.groupMsgrId, obj.messenger, obj.fbAccount];
      [groupTgId, tgUsers, tgToken, telegram] = [exports.groupTgId, exports.tgUsers, exports.tgToken, exports.telegram] = [obj.groupTgId, obj.tgUsers, obj.tgToken, obj.telegram];
      [debug, previewTextLimit, downloadToBuffer] = [exports.debug, exports.previewTextLimit, exports.downloadToBuffer] = [obj.debug, obj.previewTextLimit, obj.downloadToBuffer];
      [irc, ircChannel, ircHost, ircNick, ircUserName, ircRealName, ircPort, ircUseSSL, ircPassword] = [
        exports.irc, exports.ircChannel, exports.ircHost, exports.ircNick, exports.ircUserName, exports.ircRealName, exports.ircPort, exports.ircUseSSL, exports.ircPassword] = [
          obj.irc, obj.ircChannel, obj.ircHost, obj.ircNick, obj.ircUserName, obj.ircRealName, obj.ircPort, obj.ircUseSSL, obj.ircPassword]
      
      console.log('DEBUG = ' + debug.toString());
      console.log('Messenger: ' + messenger.toString());
      console.log('Telegram: ' + telegram.toString());
      console.log('IRC: ' + irc.toString())
      setImmediate(() => {
        bot = telegram ? require("./bot.js") : {send: () => {}, init: () => {}}
        bot.init()
      })
      setImmediate(() => ircBot = irc ? require("./irc.js") : {send: () => {}})
      setImmediate(() => messenger = messenger ? require("./messenger.js") : {send: () => {}})
      chats = {
        [groupTgId]:groupMsgrId,
        [testTgId]:testMsgrId
      }
    })}
  else {
    jsonfile.writeFile('config.json', {
      debug: false,
      previewTextLimit: 8,
      downloadToBuffer: true,

      groupTgId: -1234567890,
      groupMsgrId: 12345678998765432,
      ircChannel: '##IRCChannel',

      messenger: true,
      fbAccount:{
        email: 'YOUR_FB_ACCOUNT@EMAIL.COM',
        password: 'YOUR_FB_PASSWORD'
      },

      telegram: true,
      tgUsers:{
        1234567890: 'Nickname for specified ID'
      },
      tgToken: "TG_BOT_TOKEN",

      irc: true,
      ircHost: 'irc.freenode.net',
      ircNick: 'IRCNick',
      ircUserName: 'YOUR_USERNAME',
      ircRealName: 'IRC_REALNAME',
      ircPassword: 'PASSWORD',
      ircPort: 6697,
      ircUseSSL: true,


    }, {spaces: 2}, () => {
      console.error('請正確填寫 config.json!');
      process.exit();
    })
  }
}

init()

const removeEmpty = (x) => {var obj = Object.assign({}, x);Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]);return obj;}
getChatId = value => {var value = parseInt(value);return (value in chats ? chats[value] : parseInt(Object.keys(chats).find(key => chats[key] === value)))}

tgGetMsgrInfo = (userId, userName, chatId, replyToId, replyToName, forwardFromId, forwardFromName) => {
  userName = userId in tgUsers ? tgUsers[userId] : userName ? userName : userId;
  if (replyToId != bot.id){
    replyToName = replyToId in tgUsers ? tgUsers[replyId] : replyToName ? replyToName : replyToId;
  }
  forwardFromName = forwardFromId in tgUsers ? tgUsers[forwardFromId] : forwardFromName ? forwardFromName : forwardFromId;
  var threadId = groupMsgrId;
  return [userName, threadId, replyToName, forwardFromName]
}

exports.botMessage = ({chatId, userId, text='', userName, addition='', replyToId, replyToName, forwardFromId, forwardFromName, replyToText, attachment, attachmentType, sticker, cb=() => {}, isSliced, isEdited}={}) => {
  [userName, threadId, replyToName, forwardFromName] = tgGetMsgrInfo(userId, userName, chatId, replyToId, replyToName, forwardFromId, forwardFromName);
  if (!threadId) return
  if (replyToName) text = isSliced ? '<{}>:({}: {}...)\n{}'.format(userName, replyToName, replyToText, text) : '<{}>:({}: {})\n{}'.format(userName, replyToName, replyToText, text);
  else if (forwardFromName) text = '<{}>:\n[轉傳自 {}]\n{}'.format(userName, forwardFromName, text) ;
  else text = '<{}>: {}'.format(userName, text);
  text += addition;
  if (isEdited) text = '[已編輯]\n' + text;
  setImmediate(() => messenger.send(removeEmpty({'text':text, 'threadId':threadId, 'attachment':attachment, 'sticker':sticker, 'cb':cb})))
  setImmediate(() => ircBot.send(attachmentType ? text + ((text == "<{}>: ".format(userName) ? "" : "\n") + "[{}]").format(attachmentType) : text))
}

msgrGetTgInfo = (senderId, userName, threadId) => {
  userName = userName ? userName : senderId;
  var chatId = groupTgId
  return [userName, chatId]
}

exports.messengerMessage = ({photo, file, video, senderId, threadId, userName, addition='', cb=() => {}}={}) => {
  [userName, chatId] = msgrGetTgInfo(senderId, userName, threadId);
  if (!chatId) return
  if (photo) {
    setImmediate(() => ircBot.send(userName, '[Photo]\n' + addition))
    setImmediate(() => bot.send({'photo':photo, 'chatId':chatId, 'text':'<{}> '.format(userName) + addition, 'cb':cb}))
  }
  else if (file) {
    setImmediate(() => ircBot.send(userName, '[File]\n' + addition))
    setImmediate(() => bot.send({'doc':file, 'chatId':chatId, 'text':'<{}> '.format(userName) + addition, 'cb':cb}))
  }
  else if (video) {
    setImmediate(() => ircBot.send(userName, '[Video]\n' + addition))
    setImmediate(() => bot.send({'video':video, 'chatId':chatId, 'text':'<{}> '.format(userName) + addition, 'cb':cb}))
  }
  else {
    text = '<{}>: {}'.format(userName, addition);
    setImmediate(() => ircBot.send(userName, addition))
    setImmediate(() => bot.send({'text':text, 'chatId':chatId, 'cb':cb}))
  }
}

exports.ircMessage = (sender, Message) => {
  text = '<{}>: {}'.format(sender, Message)
  setImmediate(() => bot.send({'text':text, 'chatId':groupTgId, 'cb':() => {}}))
  setImmediate(() => messenger.send(removeEmpty({'text':text, 'threadId':groupMsgrId, 'cb':() => {}})))
}
