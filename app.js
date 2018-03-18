require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 9000, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD,
    // openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

var HelpMessage = '\n * If you want to know which city I\'m using for my searches type \'current city\'. \n * Want to change the current city? Type \'change city to cityName\'. \n * Want to change it just for your searches? Type \'change my city to cityName\'';
var UserNameKey = 'UserName';
var UserWelcomedKey = 'UserWelcomed';
var CityKey = 'City';

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function (session) {
    session.beginDialog('greet');
});
bot.set('storage', tableStorage);

bot.dialog('/', function (session) {
    console.log('enter');
    session.send(session.message.text);
});

bot.dialog('greet', function (session) {
    console.log('teste');
    session.send('Hello I\'m a checkbot, what can I do for you?');
});

// search dialog
bot.dialog('search', function (session, args, next) {
    // perform search
    var city = session.privateConversationData[CityKey] || session.conversationData[CityKey];
    var userName = session.userData[UserNameKey];
    var messageText = session.message.text.trim();
    session.send('%s, wait a few seconds. Searching for \'%s\' in \'%s\'...', userName, messageText, city);
    session.endDialog();
});