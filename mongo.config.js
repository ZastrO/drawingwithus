mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/datawithus');

var chatSchema = new mongoose.Schema({
	from: String,
	to: String,
	content: String,
	timestamp: {type: Date, default: Date.now}
});

var friendSchema = new mongoose.Schema({
	username: String,
	status: String
});


var roomSchema = new mongoose.Schema({ 
	id: String, 
	bg_color: String, 
	dataURL: String, 
	size: {
		width: {type: Number, min: 0}, 
		height: {type: Number, min: 0}
	}, 
	owner: String, 
	accessLevel: String, 
	blacklist: [String], 
	whitelist: [String],
	fadeTime: Number, 
	lastModified: {type: Date, default: Date.now}, 
	displayName: String, 
	desc: String,
	users: [String],
	chat: [chatSchema]}
);

var userSchema = new mongoose.Schema({
	username: String,
	password: String,
	defaults: {
		thickness: {type: Number, min: 1, default: 1},
		color: {type: String, default: '#000000'}
	},
	friends:  [friendSchema],
	bookmarks: {type: [String], default: 'lobby1'},
	email: String,
	bio: String,
	avatar: {type: String, default: 'default/default.png'},
	myRooms: [String],
	cursor: {type: String, default: 'cursor.png'}
});

Room = mongoose.model('rooms', roomSchema);
User = mongoose.model('users', userSchema);

//User.findOne({username:'baerbro'}).exec(function(errr, doc){ console.log(doc); });