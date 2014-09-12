var express = require('express')
    , http  = require('http');

var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(8000);