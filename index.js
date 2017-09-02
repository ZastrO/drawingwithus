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
var io = require('socket.io')(http, {
	pingInterval: 5000,
	pingTimeout: 2000
});

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

app.get('/r/*', function (req, res) {
	require('./room.route.js')(req, res);
});


// Fills up from db
app.locals.rooms = {};


io.on('connection', function(socket){

	socket.on('init', function(data){
		init(socket, data);
	});
	
	socket.on('chat', function(data){
		chat(data);
	});

	socket.on('canvas',function(data){
		if( typeof app.locals.rooms[data.room] !== 'undefined' ){
			app.locals.rooms[data.room].dataURL = data.dataURL;
			app.locals.rooms[data.room].save();
		} else {
			socket.emit('problems', { type:'404', msg:'Sorry! There doesn\'t seem to be a room here. :(' } );
		}
	});

	socket.on('coordinates', function(data) {
		if(typeof app.locals.rooms[socket.room] === 'undefined' || 
			typeof app.locals.rooms[socket.room].usersInk === 'undefined' ||
			typeof app.locals.rooms[socket.room].usersInk[socket.id] === 'undefined') { return; }

		var ut = app.locals.rooms[socket.room].users[socket.id];

		app.locals.rooms[socket.room].usersInk[socket.id].drawNow = data.drawNow;
		if( data.drawNow && ut.lastX && ut.lastY ) {
			if(app.locals.rooms[socket.room].usersInk[socket.id].level > 0 ) { 
				app.locals.rooms[socket.room].usersInk[socket.id].deplete( data.x-ut.lastX, data.y-ut.lastY ); 
			}

			if( app.locals.rooms[socket.room].usersInk[socket.id].level <= 0 ){
				data.drawNow = false; 
			}
		}

		app.locals.rooms[socket.room].users[socket.id].lastX = data.x;
		app.locals.rooms[socket.room].users[socket.id].lastY = data.y;

		io.to(data.room).emit('cursor', data);
	});

	socket.on('colorPicker', function(data) {
		colorPicker(socket, data);
	});

	socket.on('initVote', function(data) {
		initVote(socket, data);
	});

	socket.on('disconnect', function() {
		exit(socket);
	});
	socket.on('exit', function() {
		exit(socket);
	});
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 4027;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
http.listen(server_port, server_ip_address, function(){
	console.log('server active | listening on ' +server_ip_address+ ':' +server_port);
});

//Initializes new user
function init (socket, data) {
	//This will also need to check encapsulation
	if( typeof app.locals.rooms[data.room] !== 'undefined' ){
		if( typeof app.locals.rooms[data.room].usersInk === 'undefined' ){ app.locals.rooms[data.room].usersInk = {}; }

		var k = Object.keys(app.locals.rooms[data.room].users);

		for (var i = k.length - 1; i >= 0; i--) {
			if(data.id == app.locals.rooms[data.room].users[k[i]].id) { 
				delete app.locals.rooms[data.room].users[k[i]];
				delete app.locals.rooms[data.room].usersInk[k[i]]; 
			}
		}

		//Stores all initial information for user into room/users object
		app.locals.rooms[data.room].users[socket.id] = {name: data.name, id: data.id, color:data.color};
		app.locals.rooms[data.room].usersInk[socket.id] = new InkWell(2000, socket);
		app.locals.rooms[data.room].save();
		
		socket.join(data.room);
		socket.room = data.room;

		//Notifies existing users about existence of new user
		const roomSafeUsers = Object.keys(app.locals.rooms[data.room].users).map(key => app.locals.rooms[data.room].users[key]);
		io.to(data.room).emit('users', roomSafeUsers);
		//Gives the new user the current look of the Canvas
		socket.emit('newRoom',app.locals.rooms[data.room].dataURL);

	} else {
		socket.emit('problems', { type:'404', msg:'Sorry! There doesn\'t seem to be a room here. :(' } );
	}
}

//Removes socket from user list in room and resends updated room
function exit(socket) {
	if( typeof app.locals.rooms[socket.room] !== 'undefined' && typeof app.locals.rooms[socket.room].users[socket.id] !== 'undefined' ){
		//Removes user from existing structures
		socket.leave(socket.room);
		delete app.locals.rooms[socket.room].users[socket.id];
		delete app.locals.rooms[socket.room].usersInk[socket.id];
		app.locals.rooms[socket.room].save();
		//Notifies users in room
		io.to(socket.room).emit('users', app.locals.rooms[socket.room].users);

		var peopleCount =  Object.keys(app.locals.rooms[socket.room].users).length;

		if( peopleCount == 0 ){
			delete app.locals.rooms[socket.room];
			console.log('Everyone has left ' + socket.room + '. Room cleared from cache.');
		}
	}
}

//Controls the message sending through app.locals.rooms
function chat(data) {
	app.locals.rooms[data.room].chat.push({ id: data.user, name: data.name, content:data.msg });
	app.locals.rooms[data.room].save();
	//sends message to every user within data.room
	io.to(data.room).emit('chat',data);
	console.log(data.name+" ["+data.msg+"] ");
}

//Changes the color of the user.
function colorPicker(socket, data) {
	//Changes the varaible with Users object
	//This is important if we want to remove sending the color back to the user when drawing
	app.locals.rooms[data.room].users[socket.id].color = data.color;
	app.locals.rooms[data.room].save();
	//Changes the users color on page
	io.to(data.room).emit('colorUpdate', data);
	//Updates what the others user see
	//Allowing for people to know who is using what color
	io.to(data.room).emit('users', app.locals.rooms[data.room].users);
}

//Controls the clear board voting system
function initVote(socket, data) {
	//User who clicked the button changes his/her status to Y
	app.locals.rooms[data.room].users[socket.id].voteToClear = "Y";
	//Temp Variable used to determine if everyone voted.
	var bool = true;
	var total = 0;
	var voted = 0;
	var percent = 0;

	//loops through all users in users object to see if they have voted
	//If not the temp variable will change to false
	for(var key in app.locals.rooms[data.room].users) {
		var obj = app.locals.rooms[data.room].users[key];
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
		for(var key in app.locals.rooms[data.room].users) {
			app.locals.rooms[data.room].users[key].voteToClear = 'N';
		}
	}

	app.locals.rooms[data.room].save();
	io.to(data.room).emit('newVote', {percent: percent});
}

function InkWell(levelCap, socket){
	this.levelCap = levelCap;
	this.level = levelCap;
	this.socket = socket;
	this.drawNow = false;

	this.ivl = setInterval(() => {
		if( this.level < this.levelCap && !this.drawNow ) {this.level += 100;}
		if( this.level > this.levelCap ) {this.level = levelCap;}
		this.socket.emit('ink', {level: this.level, cap: this.levelCap});
	}, 200);

	this.deplete = (xval, yval) => { this.level -= Math.hypot(xval, yval) };
	this.destroy = () => { clearInterval(this.ivl) };
}