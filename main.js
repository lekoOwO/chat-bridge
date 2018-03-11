// npm install --save Schmavery/facebook-chat-api string-format jsonfile mime-types node-telegram-bot-api
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

var [testMsgrId, testTgId, groupTgId, groupMsgrId, debug, fbAccount, tgUsers, token, replyToTextLimit, downloadToBuffer, chats] = []
var init = () => {
  if (fs.existsSync('config.json')) {
    jsonfile.readFile('./config.json', (err, obj) => {
      [testMsgrId, testTgId, groupTgId, groupMsgrId, debug, fbAccount, tgUsers, token, replyToTextLimit, downloadToBuffer] = [
        exports.testMsgrId, exports.testTgId, exports.groupTgId, exports.groupMsgrId, exports.debug, exports.fbAccount, exports.tgUsers, exports.token, exports.replyToTextLimit, exports.downloadToBuffer] = [
          obj.testMsgrId, obj.testTgId, obj.groupTgId, obj.groupMsgrId, obj.debug, obj.fbAccount, obj.tgUsers, obj.token, obj.replyToTextLimit, obj.downloadToBuffer];
      console.log('DEBUG = ' + debug.toString());
      bot = require("./bot.js")
      bot.init()
      messenger = require("./messenger.js")
      chats = {
        [groupTgId]:groupMsgrId,
        [testTgId]:testMsgrId
      }
    })}
  else {
    jsonfile.writeFile('config.json', {
      testMsgrId: 12345678987654321,
      testTgId: -1234567890,
      groupTgId: -1234567890,
      groupMsgrId: 12345678998765432,
      debug: false,
      fbAccount:{
        email: 'YOUR_FB_ACCOUNT@EMAIL.COM',
        password: 'YOUR_FB_PASSWORD'
      },
      tgUsers:{
        1234567890: 'Test Nickname for specified ID'
      },
      token: "TG_BOT_TOKEN",
      replyToTextLimit: 8,
      downloadToBuffer: true

    }, {spaces: 2}, () => {
      console.error('請正確填寫 config.json!');
      process.exit();
    })
  }
}

init()

const removeEmpty = (x) => {var obj = Object.assign({}, x);Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]);return obj;}
getChatId = value => {var value = parseInt(value);return (value in chats ? chats[value] : parseInt(Object.keys(chats).find(key => chats[key] === value)))}

getTgInfo = (userId, userName, chatId, replyToId, replyToName, forwardFromId, forwardFromName) => {
  userName = userId in tgUsers ? tgUsers[userId] : userName ? userName : userId;
  if (replyToId != bot.id){
    replyToName = replyToId in tgUsers ? tgUsers[replyId] : replyToName ? replyToName : replyToId;
  }
  forwardFromName = forwardFromId in tgUsers ? tgUsers[forwardFromId] : forwardFromName ? forwardFromName : forwardFromId;
  var threadId = getChatId(chatId) ? getChatId(chatId) : debug ? testMsgrId : false;
  return [userName, threadId, replyToName, forwardFromName]
}

exports.botMessage = ({chatId, userId, text='', userName, addition='', replyToId, replyToName, forwardFromId, forwardFromName, replyToText, attachment, sticker, cb=() => {}, isSliced, isEdited}={}) => {
  [userName, threadId, replyToName, forwardFromName] = getTgInfo(userId, userName, chatId, replyToId, replyToName, forwardFromId, forwardFromName);
  if (!threadId) return
  if (replyToName) text = isSliced ? '<{}>:({}: {}...)\n{}'.format(userName, replyToName, replyToText, text) : '<{}>:({}: {})\n{}'.format(userName, replyToName, replyToText, text);
  else if (forwardFromName) text = '<{}>:\n[轉傳自 {}]\n{}'.format(userName, forwardFromName, text) ;
  else text = '<{}>: {}'.format(userName, text);
  text += addition;
  if (isEdited) text = '[已編輯]\n' + text;
  messenger.send(removeEmpty({'text':text, 'threadId':threadId, 'attachment':attachment, 'sticker':sticker, 'cb':cb}));
}

getMsgrInfo = (senderId, userName, threadId) => {
  userName = userName ? userName : senderId;
  var chatId = getChatId(threadId) ? getChatId(threadId) : debug ? testTgId : false;
  return [userName, chatId]
}

exports.messengerMessage = ({photo, file, video, senderId, threadId, userName, addition='', cb=() => {}}={}) => {
  [userName, chatId] = getMsgrInfo(senderId, userName, threadId);
  if (!chatId) return
  if (photo) bot.send({'photo':photo, 'chatId':chatId, 'text':'<{}> '.format(userName) + addition, 'cb':cb});
  else if (file) bot.send({'doc':file, 'chatId':chatId, 'text':'<{}> '.format(userName) + addition, 'cb':cb});
  else if (video) bot.send({'video':video, 'chatId':chatId, 'text':'<{}> '.format(userName) + addition, 'cb':cb});
  else {
    text = '<{}>: {}'.format(userName, addition);
    bot.send({'text':text, 'chatId':chatId, 'cb':cb});
  }
}
