// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var HelpMessage = `- Caso você queira criar uma nova lista de tarefas, digite: lista <nome>
-Caso queira adicionar uma nova tarefa a uma lista: adicionar <tarefa> na lista <lista>`;

var UserNameKey = 'UserName';
var UserWelcomedKey = 'UserWelcomed';
var TarefasKey = 'Tarefas';

// Setup bot with default dialog
var bot = new builder.UniversalBot(connector, function (session) {

    // is user's name set? 
    var userName = session.userData[UserNameKey];
    if (!userName) {
        return session.beginDialog('greet');
    }
});

// Enable Conversation Data persistence
bot.set('persistConversationData', true);

// // search dialog
// bot.dialog('search', function (session, args, next) {
//     // perform search
//     var city = session.privateConversationData[TarefasKey] || session.conversationData[TarefasKey];
//     var userName = session.userData[UserNameKey];
//     var messageText = session.message.text.trim();
//     session.send('%s, wait a few seconds. Searching for \'%s\' in \'%s\'...', userName, messageText, city);
//     session.send('https://www.bing.com/search?q=%s', encodeURIComponent(messageText + ' in ' + city));
//     session.endDialog();
// });

// reset bot dialog
bot.dialog('reset', function (session) {
    // reset data
    delete session.userData[UserNameKey];
    delete session.conversationData[TarefasKey];
    delete session.privateConversationData[TarefasKey];
    delete session.privateConversationData[UserWelcomedKey];
    session.endDialog('Ups... I\'m suffering from a memory loss...');
}).triggerAction({ matches: /^reset/i });

// // print current city dialog
// bot.dialog('printCurrentCity', function (session) {
//     var userName = session.userData[UserNameKey];
//     var defaultCity = session.conversationData[TarefasKey];
//     var userCity = session.privateConversationData[TarefasKey];
//     if (!defaultCity) {
//         session.endDialog('I don\'t have a search city configured yet.');
//     } else if (userCity) {
//         session.endDialog(
//             '%s, you have overridden the city. Your searches are for things in %s. The default conversation city is %s.',
//             userName, userCity, defaultCity);
//     } else {
//         session.endDialog('Hey %s, I\'m currently configured to search for things in %s.', userName, defaultCity);
//     }
// }).triggerAction({ matches: /^current city/i });

// // change current city dialog
// bot.dialog('changeCurrentCity', function (session, args) {
//     // change default city
//     var newCity = args.intent.matched[1].trim();
//     session.conversationData[TarefasKey] = newCity;
//     var userName = session.userData[UserNameKey];
//     session.endDialog('All set %s. From now on, all my searches will be for things in %s.', userName, newCity);
// }).triggerAction({ matches: /^change city to (.*)/i });

// change my current city dialog
bot.dialog('addTodo', function (session, args) {
    // change user's city
    var todo = args.intent.matched[1].trim();
    session.privateConversationData[TarefasKey] = todo;
    var userName = session.userData[UserNameKey];
    session.endDialog('Pronto %s! A seguinte tarefa', userName, newCity);
}).triggerAction({ matches: /^adiciona (.*)/i });

// Greet dialog
bot.dialog('greet', new builder.SimpleDialog(function (session, results) {
    if (results && results.response) {
        session.userData[UserNameKey] = results.response;
        session.privateConversationData[UserWelcomedKey] = true;
        return session.endDialog('Bem-vindo %s! %s', results.response, HelpMessage);
    }

    builder.Prompts.text(session, 'Olá, antes de tudo, poderia me dizer o seu nome?');
}));