var express = require('express');

var app = express();
app.use(express.static(__dirname + '/public'));

var http = require('http').createServer(app);
var io = require('socket.io')(http);


var rooms = {
	lobby1: {
		bg_color: '#fff',
		users: {}
	},
	lobby2: {
		bg_color: '#888',
		users: {}
	},
	lobby3: {
		bg_color: '#000',
		users: {}
	},
};


io.on('connection', function(socket){
	socket.on('init', function(data){
		rooms[data.room].users[socket.id] = data.id;
		socket.join(data.room);
		console.log(data.room,rooms[data.room]);
	});
	
	socket.on('room',function(data){
		socket.leave(data.roomFrom);
		delete rooms[data.roomFrom].users[socket.id];
		socket.join(data.roomTo);
		
		console.log(data.name+" transfered from <"+data.roomFrom+"> to <"+data.roomTo+">");
	});
	socket.on('exit',function(data){
		socket.leave(data.roomFrom);
		delete rooms[data.roomFrom].users[socket.id];
		console.log(data.name+" has left");
	});

	socket.on('coordinates', function(data){
		
		io.to(data.room).emit('cursor',data);

	});
	
	socket.on('chat', function(data){
		
		io.to(data.room).emit('chat',data);
		console.log(data.name+" <"+data.msg+"> ");

	});
});

http.listen(1337, function(){
	console.log('listening on *:1337');
});