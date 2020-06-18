require('dotenv').config();

const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const config = require('./config');

const client = new SteamUser();

const logInOptions = {
  accountName: config.accountName,
  password: config.password,
  twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)
};

client.logOn(logInOptions);

client.on('loggedOn', () => {
  console.log('Bot logged on');
  
  client.setPersona(SteamUser.EPersonaState.Online, config.publicUsername);
  client.gamesPlayed(config.inGameName);
});

function includes(message, arr) {
  if (!message)
    return false;
  for (let i = 0; i < arr.length; i++) {
    if (message.toUpperCase().includes(arr[i].toUpperCase())) {
      return arr[i];
    }
  }
  return false;
}

client.chat.on('chatMessage', function(msgObj) {
  let steamidObj = msgObj.steamid_sender,
      message = msgObj.message;
  
  let groupId = msgObj.chat_group_id,
      chatId = msgObj.chat_id,
      serverTimestamp = msgObj.server_timestamp,
      ordinal = msgObj.ordinal;
  
  let includesBannedText = includes(message, config.bannedPhrases);
  
  if (message && includesBannedText) {
    client.chat.deleteChatMessages(groupId, chatId, [{ server_timestamp: serverTimestamp, ordinal: ordinal }], err => {
      if (err) {
        console.error(err);
      }
    });
    client.chat.setGroupUserBanState(groupId, steamidObj, true, err => {
      if (err) {
        console.error(err);
      }
    });
    console.log(`Banned user ${steamidObj.getSteamID64()} for phrase "${includesBannedText}"`);
  }
});