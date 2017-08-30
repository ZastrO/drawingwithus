var express = 		require('express');
var bodyParser = 	require('body-parser');
var session = 		require('express-session');
var nodemailer = 	require('nodemailer'),
	transporter = 	nodemailer.createTransport();
var debugging = true;

require('./mongo.config.js');

var app = express();
	app.set('views', __dirname + '/views');
	app.set('view engine', 'pug');
	app.use(express.static(__dirname + '/public'));

	app.use(session({
		genid: function(req) {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		},
		secret: 'drawingfriendsf0r3v3r',
		resave: false,
		saveUninitialized: false
	}));

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	
	app.use(function(req, res, next) {
		res.locals.loggedIn = false;
		if(typeof req.session.username !== 'undefined') {
			res.locals.username = req.session.username;
			res.locals.defaults = req.session.defaults;
			res.locals.loggedIn = true;
		}
		next();
	});

var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
	res.render('index', { title : 'Home' }  );
});

app.post('/login/', function(req, res) {
	require('./login.route.js')(req, res);
});
app.get('/logout/', function(req, res) {
	req.session.destroy(function(err) {});
	res.locals.username = null;
	res.locals.loggedIn = false;
	res.render('error', {code: 'BYE', msg: 'You have been successfully logged out. Come back soon ;)'});
});

app.get('/register/', function (req, res) {
	res.render('register', {}  );
});

app.post('/register/', function (req, res) {
	require('./register.route.js')(req, res, transporter);
});

app.get('/create-room/', function (req, res) {
	if( res.locals.loggedIn ) {
		require('./create-room.route.js')(req, res);
	} else {
		res.render('error', {code: 'Access Error', msg: 'You need to be logged in to create a room!'});
	}
});

app.post('/create-room/', function (req, res) {
	if( res.locals.loggedIn ) {
		require('./create-room.route.js')(req, res);
	} else {
		res.render('error', {code: 'Access Error', msg: 'You need to be logged in to create a room!'});
	}
});

app.get('/u/*', function (req, res) {
	require('./user.route.js')(req, res);
});

app.post('/u/*', function (req, res) {
	require('./user.route.js')(req, res);
});

app.get('/m/*', function (req, res) {
	require('./moderate.route.js')(req, res);
});

app.get('/r/*', function (req, res) {
	require('./room.route.js')(req, res);
});


// PULL FROM MONGO DB
var rooms = {
	lobby1: {
		displayName: "Main Lobby",
		bg_color: '#fff',
		dataURL: "",
		size: {width: 1170, height: 680},
		owner: "String",
		accessLevel: 1,
		blacklist: ["123456", "123455", "123454"],
		whitelist: ["234567", "234566"],
		fadeTime: "0",
		lastModified: "1970-01-01 00:00:01",
		users: {}
	},
	lobby2: {
		displayName: "Persistent Lobby",
		size: {width: 1170, height: 680},
		bg_color: '#888',
		fadeTime: "0",
		users: {}
	},
	lobby3: {
		displayName: "Fast and Small Lobby",
		size: {width: 500, height: 500},
		bg_color: '#000',
		fadeTime: "0.5",
		users: {}
	}
};


io.on('connection', function(socket){

	socket.on('init', function(data){
		init(socket, data);
	});
	
	socket.on('room',function(data){
		room(socket, data);
	});

	socket.on('chat', function(data){
		chat(data);
	});

	socket.on('canvas',function(data){
		if( typeof rooms[data.room] !== 'undefined' ){
			rooms[data.room].dataURL = data.dataURL;
		} else {
			socket.emit('problems', { type:'404', msg:'Sorry! There doesn\'t seem to be a room here. :(' } );
		}
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

	socket.on('disconnect', function() {
		if( typeof rooms[socket.room] !== 'undefined' ){
			//Removes user from existing structures
			socket.leave(socket.room);
			delete rooms[socket.room].users[socket.id];
			//Notifies users in room
			io.to(socket.room).emit('users', rooms[socket.room].users);

			console.log(socket.id+" has left");
		}
	});
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 4027;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
http.listen(server_port, server_ip_address, function(){
	console.log('server active | listening on ' +server_ip_address+ ':' +server_port);
});

//Initializes new user
function init (socket ,data) {
	//This will also need to check encapsulation
	if( typeof rooms[data.room] !== 'undefined' ){

		//Stores all initial information for user into room/users object
		rooms[data.room].users[socket.id] = {name: data.name, id: data.id, color:data.color};
		
		socket.join(data.room);
		socket.room = data.room;

		//Notifies existing users about existence of new user
		io.to(data.room).emit('users', rooms[data.room].users);
		//Gives the new user the current look of the Canvas
		socket.emit('newRoom',rooms[data.room].dataURL);

		//console.log(data.room,rooms[data.room].users);
	} else {
		socket.emit('problems', { type:'404', msg:'Sorry! There doesn\'t seem to be a room here. :(' } );
	}
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
	var total = 0;
	var voted = 0;
	var percent = 0;

	//loops through all users in users object to see if they have voted
	//If not the temp variable will change to false
	for(var key in rooms[data.room].users) {
		var obj = rooms[data.room].users[key];
		total++;
		if(typeof obj.voteToClear == 'undefined' || obj.voteToClear == 'N') {
			bool = false;
		} else {
			voted++;
		}
	}
	percent = Math.floor((voted/total)*100);
	//If the temp varaible remains to be true, everyone voted
	//data will be emited to the room to clear everyones board.
	if(bool == true) {
		io.to(data.room).emit('clear', {});
		for(var key in rooms[data.room].users) {
			rooms[data.room].users[key].voteToClear = 'N';
		}
	}
	io.to(data.room).emit('newVote', {percent: percent});
}
