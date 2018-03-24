const fs        = require('fs');
const main      = require('./main.js')
const http      = require('http');
const https     = require('https');
const fb        = require("facebook-chat-api");
const fbAccount = main.fbAccount;
const buffer    = require('request').defaults({ encoding: null });

const format    = require('string-format')

format.extend(String.prototype, {})

const removeEmpty = (x) => {var obj = Object.assign({}, x);Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]);return obj;}

const download = main.downloadToBuffer ? 
  (url, dest, cb) => buffer.get(url, (err, res, body) => {if (err) {console.error(err);return}; cb(body)}) : // download to an buffer object if downloadToBuffer
  (url, dest, cb) => {
    var file      = fs.createWriteStream(dest);
    var protocal  = url.split(':')[0].slice(-1) == 's' ? https : http
    var request   = protocal.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => cb(dest));  // close() is async, call cb after close completes.
      });
    }).on('error', err => { // Handle errors
      fs.unlink(dest); // Delete the file async. (But we don't check the result)
      console.error(err);
    });
  };

if (fs.existsSync('appstate.json')) {
  fb({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if(err) return console.error(err);
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
    exports.send = ({text='', threadId=main.testMsgrId, attachment, sticker, cb=() => {}}={}) => {
      api.sendMessage(removeEmpty({'body':text, 'attachment':attachment, 'sticker':sticker}), threadId, () => cb());
    }
    id = api.getCurrentUserID()
    exports.id = id;
    var stopListening = api.listen((err, event) => {
        if(err) return console.error(err);
        console.log(event)
        if (event.threadID != main.groupMsgrId) return;
        switch(event.type) {
            case "message":
                var threadID = event.threadID;
                var senderID = event.senderID;
                if (senderID == id) return 
                var body = event.body;
                api.getThreadInfo(threadID, (err, info) => {
                  if (err) return console.log(err);
                  var nicknames = info.nicknames;
                  var userName  = senderID in nicknames ? nicknames[senderID] : api.getUserInfo(senderID, (err, users) => {
                    if(err) return console.error(err);userNameResolved(event, users[senderID].name, threadID, senderID);});
  
                  function userNameResolved(event, userName, threadID, senderID){
                  if (event.attachments.length == 0){
                    setImmediate(() => main.messengerMessage({'userName':userName, 'addition':body, 'threadId':threadID, 'senderID':senderID}))
                  }
                  else {
                    for(var i of event.attachments){
                      switch (i.type){
                        case "sticker":
                        case "animated_image":
                        case "photo":
                          var fileName = i.ID + '.' + i.url.split('.').pop().split('?')[0] || i.stickerID + '.png'
                          setImmediate(() => download(i.url, fileName, x => main.messengerMessage(
                            {'userName':userName, 'addition':body, 'threadId':threadID, 'senderID':senderID, 'photo':x, 'cb':() => main.downloadToBuffer ? () => {} : fs.unlink(fileName)})))
                          break;
                        case "file":
                          var fileName = i.name
                          setImmediate(() => download(i.url, fileName, x => main.messengerMessage(
                            {'userName':userName, 'addition':body, 'threadId':threadID, 'senderID':senderID, 'file':x, 'cb':() => main.downloadToBuffer ? () => {} : fs.unlink(fileName)})))
                          break;
                        case "video":
                          var fileName = i.filename
                          setImmediate(() => download(i.url, fileName, x => main.messengerMessage(
                            {'userName':userName, 'addition':body, 'threadId':threadID, 'senderID':senderID, "video":x, 'cb':() => main.downloadToBuffer ? () => {} : fs.unlink(fileName)})))
                          break;
                        case "audio":
                          var extension = i.url.split('.').pop().split('?')[0]
                          var audioType = 'file';
                          var fileName  = i.filename
                          if (extension == 'mp4') {fileName += '.mp3';}
                          else if (extension == 'off' | extension == 'opus') var audioType = 'voice';
                          setImmediate(() => download(i.url, fileName, x => main.messengerMessage(
                            {'userName':userName, 'addition':body, 'threadId':threadID, 'senderID':senderID, [audioType]:x, 'cb':() => main.downloadToBuffer ? () => {} : fs.unlink(fileName)})))
                          break;
                        case "share":
                          if (!(i.url.includes("//l.facebook.com/l.php?u="))){ // if url is a Facebook resource
                            let linkHTML = '<a href="{}">{}</a>'.format(i.url, i.description ? i.source + ': ' + i.description.substr(0, main.previewTextLimit) + (i.description.length <= main.previewTextLimit ? '' : '...') : i.title == '' ? i.source + " 的貼文" : i.title)
                            let text = body + '\n' + linkHTML;
                            setImmediate(() => main.messengerMessage({'userName':userName, 'addition':text, 'threadId':threadID, 'senderID':senderID}))
                            break;
                          }
                          else {
                            let url = decodeURIComponent(i.url.split('//l.facebook.com/l.php?u=')[1])
                            let text = '{}\n<a href="{}">{}</a>'.format(body, url, i.title)
                            setImmediate(() => main.messengerMessage({'userName':userName, 'addition':text, 'threadId':threadID, 'senderID':senderID}))
                            break;
                          }
                      }
                    }
                  }}
                  if (userName) userNameResolved(event, userName, threadID, senderID);
                });     
                break;         
            case "event":
                console.log(event);
                break;
        }
    });
  });
}
else {
  fb(fbAccount, (err, api) => {
    if(err) return console.error(err);
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState())); // session 保存
    console.log('首次讀取 config, 已保存 session, 請重新開啟!')
    process.exit();
});}
