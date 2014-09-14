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
		rooms[data.room].users[socket.id] = {name: data.name, id: data.id, color:data.color};
		socket.join(data.room);


		io.to(data.room).emit('users', rooms[data.room].users);
		socket.emit('newRoom',rooms[data.room].dataURL);

		console.log(data.room,rooms[data.room].users);
	});
	
	socket.on('room',function(data){
		socket.leave(data.roomFrom);
		delete rooms[data.roomFrom].users[socket.id];
		rooms[data.roomTo].users[socket.id] = {name: data.name, id: data.id};
		socket.join(data.roomTo);

		socket.emit('newRoom',rooms[data.roomTo].dataURL);
		io.to(data.roomFrom).emit('users', rooms[data.roomFrom].users);
		io.to(data.roomTo).emit('users', rooms[data.roomTo].users);

		console.log(data.name+" transfered from <"+data.roomFrom+"> to <"+data.roomTo+">");
		console.log(data.roomTo, rooms[data.roomTo].users);
	});

	socket.on('canvas',function(data){
		rooms[data.room].dataURL = data.dataURL;
	});

	socket.on('exit',function(data){
		socket.leave(data.roomFrom);
		delete rooms[data.roomFrom].users[socket.id];

		io.to(data.roomFrom).emit('users', rooms[data.roomFrom].users);

		console.log(data.name+" has left");
	});

	socket.on('coordinates', function(data){
		io.to(data.room).emit('cursor',data);

	});
	
	socket.on('chat', function(data){
		
		io.to(data.room).emit('chat',data);
		console.log(data.name+" ["+data.msg+"] ");

	});

	socket.on('initVote', function(data) {
		rooms[data.room].users[socket.id].voteToClear = "Y";
		var bool = true;
		for(var key in rooms[data.room].users) {
			var obj = rooms[data.room].users[key];
			if(typeof obj.voteToClear == 'undefined' || obj.voteToClear == 'N') {
				bool = false;
			}
		}
		if(bool == true) {
			io.to(data.room).emit('clear', {});
			for(var key in rooms[data.room].users) {
				rooms[data.room].users[key].voteToClear = 'N';
			}
		}
	});
	socket.on('colorPicker', function(data) {
		rooms[data.room].users[socket.id].color = data.color;
		io.to(data.room).emit('colorUpdate', data);
		console.log(rooms[data.room].users);

		io.to(data.room).emit('users', rooms[data.room].users);
	});

});

http.listen(1337, function(){
	console.log('listening on *:1337');
});
