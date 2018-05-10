// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var builder_cognitiveservices = require('botbuilder-cognitiveservices');

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

var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: '5b882d6c-51fd-4f02-8792-66e96047d676', // process.env.QnAKnowledgebaseId, 
    subscriptionKey: '27883617601c4945b0fec62b63888cbb'
}); //process.env.QnASubscriptionKey});

var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'Me desculpe não entendi. Pode-me dizer de outra forma?',
    qnaThreshold: 0.3
});

server.post('/api/messages', connector.listen());

var UserNameKey = 'UserName';
var UserWelcomedKey = 'UserWelcomed';
var TarefasKey = 'Tarefas';
var HelpMessage = 'Caso queira adicionar uma nova tarefa digite: Adicionar <nomeTarefa>';

var bot = new builder.UniversalBot(connector);

// Enable Conversation Data persistence
bot.set('persistConversationData', true);

basicQnAMakerDialog.respondFromQnAMakerResult = function (session, qnaMakerResult) {
    // Save the question
    var question = session.message.text;
    session.conversationData.userQuestion = question;
    var answer = qnaMakerResult.answers[0].answer;

    var isControlFormat = answer.includes(';');
    if (!isControlFormat) {
        session.send(answer);
        return;
    }

    var control = answer.split(';');
    var key = control[0];
    var configuration = control.slice(1);
    switch (key) {
        case 'ADD_TODO':
            session.endDialog('Tarefa adicionada!');
            break;
        case 'CHANGE_NAME':
            var regexExtract = configuration[0];
            var helpMessage = configuration[1];

            username = session.message.text.replace(regexExtract, '');
            session.userData[UserNameKey] = username;
            session.endDialog('Bem-vindo %s! %s', username, helpMessage);
            break;
    }
}
bot.dialog('/', basicQnAMakerDialog);

// reset bot dialog
bot.dialog('reset', function (session) {
    // reset data
    delete session.userData[UserNameKey];
    delete session.conversationData[TarefasKey];
    delete session.privateConversationData[TarefasKey];
    delete session.privateConversationData[UserWelcomedKey];
    session.endDialog('Dados foram removidos.');
}).triggerAction({ matches: /^reset/i });

bot.dialog('addTodo', function (session, args) {
    var todo = args.intent.matched[2].trim();
    var todoList = session.privateConversationData[TarefasKey] || '';

    if (todoList)
        todoList += ';';

    session.privateConversationData[TarefasKey] = todoList + todo;

    var userName = session.userData[UserNameKey];

    session.send('Pronto %s! A seguinte tarefa "%s" foi adicionada.', userName, todo);
    session.endDialog('Para ver outros comandos disponíveis digite: Ajuda');

}).triggerAction({ matches: /^adiciona(r)? (.*)/i });

bot.dialog('listTodos', function (session, args) {
    var todos = (session.privateConversationData[TarefasKey] || '').split(';');
    var userName = session.userData[UserNameKey];
    var todoList = '';

    todos.forEach(element => {
        if (element)
            todoList += '\n * ' + element + '\n';
    });

    if (todoList)
        session.send('Suas tarefas:\n' + todoList);
    else
        session.send('Você ainda não possui novas tarefas.');
    session.endDialog('Para ver outros comandos disponíveis digite: Ajuda');
}).triggerAction({ matches: /^lista(r)?/i });

// Greet dialog
bot.dialog('greet', function (session, args) {
    var todo = args.intent.matched[1].trim();
    session.userData[UserNameKey] = todo;
    session.send('Bem-vindo %s!', todo);
    session.send(HelpMessage);
}).triggerAction({ matches: /^meu\s*nome\s*é\s*(.*)/i });