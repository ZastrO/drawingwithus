var express = require('express');

var app = express();
app.use(express.static(__dirname + '/public'));

var http = require('http').createServer(app);
var io = require('socket.io')(http);

var rooms = {
	lobby1: {
		bg_color: '#fff',
		dataURL: "",
		roomSize: {width: 1170, height: 800},
		owner: "String",
		encapsulation: {
			accessLevel: 1,
			blacklist: (123456, 123455, 123454),
			whitelist: (234567, 234566)
		},
		fadeTime: ".1",
		lastModified: "1970-01-01 00:00:01",
		displayName: "Lobby 1",
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
		init(socket, data);
	});

	socket.on('exit',function(data){
		exit(socket, data);
	});
	
	socket.on('room',function(data){
		room(socket, data);
	});

	socket.on('chat', function(data){
		chat(data);
	});

	socket.on('canvas',function(data){
		rooms[data.room].dataURL = data.dataURL;
	});

	socket.on('coordinates', function(data){
		io.to(data.room).emit('cursor',data);
	});

	socket.on('colorPicker', function(data) {
		colorPicker(socket, data);
	});

	socket.on('initVote', function(data) {
		initVote(socket, data);
	});
});

http.listen(1337, function(){
	console.log('listening on *:1337');
});

//Initializes new user
function init (socket ,data) {
	//Stores all initial information for user into room/users object
	rooms[data.room].users[socket.id] = {name: data.name, id: data.id, color:data.color};
	socket.join(data.room);

	//Notifies existing users about existence of new user
	io.to(data.room).emit('users', rooms[data.room].users);
	//Gives the new user the current look of the Canvas
	socket.emit('newRoom',rooms[data.room].dataURL);

	console.log(data.room,rooms[data.room].users);
}

//Removes exiting user
function exit (socket, data) {
	//Removes user from existing structures
	socket.leave(data.roomFrom);
	delete rooms[data.roomFrom].users[socket.id];
	//Notifies users in room
	io.to(data.roomFrom).emit('users', rooms[data.roomFrom].users);

	console.log(data.name+" has left");
}

//Run If a user Switches Rooms
function room(socket, data){
	//Leave current Room
	socket.leave(data.roomFrom);
	//Deletes the users socket.id from users table within old room
	delete rooms[data.roomFrom].users[socket.id];
	//Adds the users socket.id to users table for new room
	rooms[data.roomTo].users[socket.id] = {name: data.name, id: data.id};
	//Joins room
	socket.join(data.roomTo);

	//Gives the user swiching rooms the current look of the canvas
	socket.emit('newRoom',rooms[data.roomTo].dataURL);
	//Updates other users of the location of user that is switching
	io.to(data.roomFrom).emit('users', rooms[data.roomFrom].users);
	io.to(data.roomTo).emit('users', rooms[data.roomTo].users);

	console.log(data.name+" transfered from <"+data.roomFrom+"> to <"+data.roomTo+">");
	console.log(data.roomTo, rooms[data.roomTo].users);
}

//Controls the message sending through rooms
function chat(data) {
	//sends message to every user within data.room
	io.to(data.room).emit('chat',data);
	console.log(data.name+" ["+data.msg+"] ");
}

//Changes the color of the user.
function colorPicker(socket, data) {
	//Changes the varaible with Users object
	//This is important if we want to remove sending the color back to the user when drawing
	rooms[data.room].users[socket.id].color = data.color;
	//Changes the users color on page
	io.to(data.room).emit('colorUpdate', data);
	//Updates what the others user see
	//Allowing for people to know who is using what color
	io.to(data.room).emit('users', rooms[data.room].users);
}

//Controls the clear board voting system
function initVote(socket, data) {
	//User who clicked the button changes his/her status to Y
	rooms[data.room].users[socket.id].voteToClear = "Y";
	//Temp Variable used to determine if everyone voted.
	var bool = true;
	//loops through all users in users object to see if they have voted
	//If not the temp variable will change to false
	for(var key in rooms[data.room].users) {
		var obj = rooms[data.room].users[key];
		if(typeof obj.voteToClear == 'undefined' || obj.voteToClear == 'N') {
			bool = false;
		}
	}
	//If the temp varaible remains to be true, everyone voted
	//data will be emited to the room to clear everyones board.
	if(bool == true) {
		io.to(data.room).emit('clear', {});
		for(var key in rooms[data.room].users) {
			rooms[data.room].users[key].voteToClear = 'N';
		}
	}
}