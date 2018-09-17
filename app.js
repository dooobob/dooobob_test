var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var apiRouter = require('./routes/api');

var subdomain = require('express-subdomain');

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var rooms = [];
io.on('connection', function(socket) {
    console.log('a user connected');
    // roos.push({
    //     roomId = '0001',
    //     roomName = '1번방의 기적'
    // });
    socket.on('getRoomList', function() {
        socket.emit('getRoomListResult', rooms);
    });

    // 방만들기 이벤트 처리
    socket.on('createRoom', function(data) {
        var roomObj = {};
        roomObj.roomId = socket.id;
        roomObj.roomName = data;
        // 배열에 저장해 놓고
        rooms.push(roomObj);
        // 클라이언트에게 이벤트를 발생 시키고  socket id 를 전달한다.
        socket.emit('makeAndMove', socket.id);
    });

    socket.on('joinRoom', function(data) {
        // data => {roomId:'xxx', chatName:'xxx'}
        // 방의 아이디로 socket 을 그룹으로 묶는다.
        socket.join(data.roomId);
        // socket 객체에 그룹명을 저장한다.
        socket.roomId = data.roomId;
        // 조인 할 방객체의 참조값을 얻어 찾아온다.
        var roomObj = getRoomObj(data.roomId);
        if (roomObj.members == undefined) { // 방을 최초로 만든경우
            roomObj.members = [];
            // 참여자 정보를 객체에 담아서 members에 저장한다.
            var mem = {};
            mem.socketId = socket.id;
            mem.chatName = data.chatName;
            roomObj.members.push(mem);
            // 새로운 방이 만들어 졌다고 모든 클라이언트에게 이벤트 발생시키기
            io.sockets.emit('newRoom', rooms);
        } else { // 이미 존재하고 있는 방인 경우
            var mem = {};
            mem.socketId = socket.id;
            mem.chatName = data.chatName;
            roomObj.members.push(mem);
        }

        // 이벤트를 발생시킨 클라이언트에게 방의 이름을 전달해준다.
        socket.emit('joinRoomResult', roomObj.roomName);
        // 같은 대화방 안에 있는 클라이언트에게 새로운 정보를 전달해준다.
        var newPerson = {};
        newPerson.chatName = data.chatName;
        newPerson.members = roomObj.members;
        // 그룹 전송
        io.sockets.in(data.roomId).emit('newPerson', newPerson);
    });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use(subdomain('api', apiRouter));

app.use('/healthCheck', function(req, res) {
    res.send('healthCheck');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;