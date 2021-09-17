require('dotenv').config();

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
		secret: process.env.SESSION_SECRET,
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

if( process.env.STATE == 'local' ){
	var chalk = require('chalk');
	var readline = require('readline').createInterface({
		input: process.stdin,
		output: process.stdout
	});

	function getInput(){
		readline.question(`[${chalk.cyan('Accepting Input')}]\n`, cmd => {
			let [command, args] = cmd.replace(' ', '--==--').split('--==--');
			if( command in cmds ){
				cmds[command](args);
			} else {
				console.log(`No command "${chalk.cyan(command)}" exists.`);
			}
			getInput();
		});
	}

	var cmds = {
		'@': (input) => {
			let [room, msg] = input.replace(' ', '--==--').split('--==--');
			if( room.toLowerCase() == 'all' ){
				io.emit('chat', {name: 'SYSTEM', msg: msg});
			} else {
				io.to(room).emit('chat', {name: 'SYSTEM', msg: msg});
			}
		},
		'r/': (input) => {
			let [room, command] = input.replace(' ', '--==--').split('--==--');
			switch( command ){
				case 'clear':
					io.to(room).emit('clear', {});
					console.log(`Cleared r/${chalk.red(room)}'s canvas.`);
					break;
				case 'users':
					console.log(`Users in r/${chalk.red(room)}:`);
					console.log(app.locals.rooms[room].users);
					break;
				default:
					console.log(`Showing r/${chalk.red(room)}:`);
					console.log(app.locals.rooms[room]);
					break;
			}
		}
	};

	getInput();
}


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

	//Initializes new user
	socket.on('init', function(data){
		let room = app.locals.rooms[data.room];
		//This will also need to check encapsulation
		if( typeof room !== 'undefined' ){
			if( typeof room.usersInk === 'undefined' ){ room.usersInk = {}; }

			var k = Object.keys(room.users);

			for (var i = k.length - 1; i >= 0; i--) {
				if(data.id == room.users[k[i]].id) { 
					delete room.users[k[i]];
					delete room.usersInk[k[i]]; 
				}
			}

			//Stores all initial information for user into room/users object
			room.users[socket.id] = {name: data.name, id: data.id, color:data.color};
			room.usersInk[socket.id] = new InkWell(2000, socket);
			room.save();
			
			socket.join(data.room);
			socket.room = room;
			socket.roomID = data.room;
			socket.user = room.users[socket.id];
			socket.ink = room.usersInk[socket.id];

			//Notifies existing users about existence of new user
			const roomSafeUsers = Object.values(room.users);
			io.to(data.room).emit('users', roomSafeUsers);
			//Gives the new user the current look of the Canvas
			socket.emit('newRoom',room.strokeBuffer);

		} else {
			socket.emit('problems', { type:'404', msg:'Sorry! There doesn\'t seem to be a room here. :(' } );
		}
	});
	
	//Controls the message sending through app.locals.rooms
	socket.on('chat', function(data){
		socket.room.chat.push({ id: data.user, name: data.name, content:data.msg });
		socket.room.save();
		//sends message to every user within data.room
		io.to(socket.roomID).emit('chat',data);
		console.log(`[r/${chalk.red(socket.roomID)}] <${chalk.green(socket.user.name)}> ${data.msg}`);
	});

	socket.on('coordinates', function(data) {
		if(typeof socket.room === 'undefined' || 
			typeof socket.ink === 'undefined') { return; }

		socket.ink.drawNow = data.drawNow;
		if( data.drawNow && socket.user.lastX && socket.user.lastY ) {
			if(socket.ink.level > 0 ) { 
				socket.ink.deplete( data.x-socket.user.lastX, data.y-socket.user.lastY ); 
			}

			if( socket.ink.level <= 0 ){
				data.drawNow = false; 
			}
		}

		if( data.drawNow ){
			socket.room.strokeBuffer.push({
				user: socket.user.id,
				x: data.x,
				y: data.y,
				state: data.drawNow,
				color: data.color,
				pressure: 0.5,
			});
			// socket.room.save();
		}

		socket.user.lastX = data.x;
		socket.user.lastY = data.y;

		io.to(socket.roomID).emit('cursor', data);
	});

	//Changes the color of the user.
	socket.on('colorPicker', function(data) {
		//Changes the varaible with Users object
		//This is important if we want to remove sending the color back to the user when drawing
		socket.user.color = data.color;
		socket.room.save();
		//Changes the users color on page
		io.to(socket.roomID).emit('colorUpdate', data);
		//Updates what the others user see
		//Allowing for people to know who is using what color
		io.to(socket.roomID).emit('users', socket.room.users);
	});

	//Controls the clear board voting system
	socket.on('initVote', function(data) {
		//User who clicked the button changes his/her status to Y
		socket.user.voteToClear = "Y";
		//Temp Variable used to determine if everyone voted.
		var bool = true;
		var total = 0;
		var voted = 0;
		var percent = 0;

		//loops through all users in users object to see if they have voted
		//If not the temp variable will change to false
		for(var key in socket.room.users) {
			var obj = socket.room.users[key];
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
			io.to(socket.roomID).emit('clear', {});
			for(var key in socket.room.users) {
				socket.room.users[key].voteToClear = 'N';
			}
		}

		socket.room.save();
		io.to(socket.roomID).emit('newVote', {percent: percent});
	});
	
	//Removes socket from user list in room and resends updated room
	socket.on('exit', userDropped.bind(socket));
	socket.on('disconnect', userDropped.bind(socket));
});

function userDropped(){
	let room = app.locals.rooms[this.roomID];
	if( typeof room !== 'undefined' && typeof room.users[this.id] !== 'undefined' ){
		//Removes user from existing structures
		this.leave(this.room);
		delete room.users[this.id];
		delete room.usersInk[this.id];
		room.strokeBuffer = [];
		room.save();
		//Notifies users in room
		io.to(this.roomID).emit('users', Object.values(room.users));

		var peopleCount =  Object.keys(room.users).length;

		if( peopleCount == 0 ){
			delete app.locals.rooms[this.roomID];
			console.log('Everyone has left ' + this.roomID + '. Room cleared from cache.');
		}
	}
}

var server_port = 8080;
//var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
http.listen(server_port, function(){
	console.log('server active | listening on ' + ':' +server_port);
});

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