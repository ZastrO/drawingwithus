if(typeof sessionStorage.id === 'undefined'){
	sessionStorage.id = Math.floor(Math.random()*1000000);
}
if(typeof localStorage.room === 'undefined'){
	localStorage.room = 'lobby1';
}

var room = localStorage.room;
$('#room').val(room);
var id = sessionStorage.id;


if( navigator.userAgent.indexOf("Chrome/") > 0 ) {
	localStorage.name = "Chrome";
} else if( navigator.userAgent.indexOf("Safari/") > 0 ) {
	localStorage.name = "Safari";
} else if( navigator.userAgent.indexOf("Firefox/") > 0 ) {
	localStorage.name = "FireFox";
} else if( navigator.userAgent.indexOf(".NET") > 0 ) {
	localStorage.name = "Explorer";
}

if(typeof localStorage.name == 'undefined'){
	localStorage.name = prompt("What would you like to appear to other users as?","Choose a Nickname");
}
var name = localStorage.name;

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var offset = $('#canvas').offset();
	$( window ).resize(function() {
		offset = $('#canvas').offset();
	});
context.lineJoin = 'round';
context.lineCap = 'round';

var lastXY = {x:false,y:false};
var users = [];
var color = id;

users[id] = {name:name,brush: 'line', x:0, y:0, lastX:null, lastY:null,room:room, color:'000' };

$('#colorSelector').ColorPicker({
	color: '#000',
	onShow: function (colpkr) {
		$(colpkr).fadeIn(500);
		return false;
	},
	onHide: function (colpkr) {
		$(colpkr).fadeOut(500);
		return false;
	},
	onChange: function (hsb, hex, rgb) {
		$('#colorSelector div').css('backgroundColor', '#' + hex);
		color = users[id].color = hex;
		socket.emit('colorPicker', {id:id, room:users[id].room, color: hex });
	}
});

var brushes = {
	line: function(user,x,y,options){
		context.beginPath();
		context.moveTo(user.lastX, user.lastY);
		context.lineTo(x, y);
		context.stroke();
		
		user.lastX = x;
		user.lastY = y;
	},
	thinline: function(user,x,y,options){
		context.lineWidth = 1;
		context.beginPath();
		context.moveTo(user.lastX, user.lastY);
		context.lineTo(x, y);
		context.stroke();
		
		user.lastX = x;
		user.lastY = y;
	},
	triline: function(user,x,y,options){
		context.beginPath();
		context.moveTo(user.lastX, user.lastY);
		context.lineTo(x, y);
		context.moveTo(user.lastX-5, user.lastY-5);
		context.lineTo(x-5, y-5);
		context.moveTo(user.lastX+5, user.lastY+5);
		context.lineTo(x+5, y+5);
		context.stroke();
		
		user.lastX = x;
		user.lastY = y;
	},
	squiggle10: function(user,x,y,options){
		var randXY = {x: x-Math.floor(Math.random()*10),y: y-Math.floor(Math.random()*10)};
		context.beginPath();
		context.moveTo(user.lastX, user.lastY);
		context.lineTo(randXY.x, randXY.y);
		context.stroke();
		
		user.lastX = randXY.x;
		user.lastY = randXY.y;
	},
	squiggle25: function(user,x,y,options){
		var randXY = {x: x-Math.floor(Math.random()*25),y: y-Math.floor(Math.random()*25)};
		context.beginPath();
		context.moveTo(user.lastX, user.lastY);
		context.lineTo(randXY.x, randXY.y);
		context.stroke();
		
		user.lastX = randXY.x;
		user.lastY = randXY.y;
	},
	sketchy: function(user,x,y,options){
		context.beginPath();
		context.moveTo(user.lastX, user.lastY);
		context.lineTo(x, y);
		context.moveTo(user.lastX-Math.floor(Math.random()*5), user.lastY-Math.floor(Math.random()*5));
		context.lineTo(x, y);
		context.moveTo(user.lastX+Math.floor(Math.random()*5), user.lastY+Math.floor(Math.random()*5));
		context.lineTo(x, y);
		context.stroke();
		
		user.lastX = x;
		user.lastY = y;
	},
	dynaline: function(user,x,y,options){
		var xmax = Math.max(x,user.lastX);
		var ymax = Math.max(y,user.lastY);
		var xmin = Math.min(x,user.lastX);
		var ymin = Math.min(y,user.lastY);
		
		var xdif = xmax-xmin, ydif = ymax-ymin;
		
		if( (xdif >= 50) || (ydif >= 50) ){
			context.lineWidth = 1;
		} else if( (xdif > 40) || (ydif > 40) ){
			context.lineWidth = 2;
		} else if( (xdif > 30) || (ydif > 30) ){
			context.lineWidth = 3;
		} else if( (xdif > 20) || (ydif > 20) ){
			context.lineWidth = 4;
		} else if( (xdif <= 19) || (ydif <= 19) ){
			context.lineWidth = 5;
		}
		//console.log(xdif,ydif)
		
		context.beginPath();
		context.moveTo(user.lastX, user.lastY);
		context.lineTo(x,y);
		context.stroke();
		
		user.lastX = x;
		user.lastY = y;
	},
	circle: function(user,x,y,options){
		context.beginPath();
		context.arc(x, y, 3, 0, 2 * Math.PI, false);
		context.stroke();
		
		user.lastX = x;
		user.lastY = y;
	},
	scattercircles: function(user,x,y,options){
		context.beginPath();
		context.arc(x, y, Math.floor(Math.random()*5), Math.random()*2 * Math.PI, Math.random()*2 * Math.PI, false);
		context.stroke();
		
		user.lastX = x;
		user.lastY = y;
	},
	spraycircle: function(user,x,y,options){
		var spraysize = Math.floor(Math.random()*5);
		for(var i = 0; i<spraysize; i++){
			var randXY = {x: x-Math.floor(Math.random()*25),y: y-Math.floor(Math.random()*25)};
			context.beginPath();
			context.arc(randXY.x, randXY.y, Math.floor(Math.random()*5), 0, 2 * Math.PI, false);
			context.stroke();
		}
		user.lastX = x;
		user.lastY = y;
	},
	spray: function(user,x,y,options){
		var spraysize = Math.floor(Math.random()*5)+5;
		for(var i = 0; i<spraysize; i++){
			var randXY = {x: x-Math.floor(Math.random()*25),y: y-Math.floor(Math.random()*25)};
			context.beginPath();
			context.fillRect(randXY.x, randXY.y, 1, 1);
			context.stroke();
		}
		user.lastX = x;
		user.lastY = y;
	}/*,
	test: function(user,x,y,options){
		context.beginPath();
		context.moveTo(user.lastX, user.lastY);
		context.lineTo(x, y);
		context.stroke();
		
		user.lastX = x;
		user.lastY = y;
	}*/
};

function draw(x,y,id,brush){
	var user = users[id];
	//var offset = $('#canvas').offset();
	/*var xOffset = ($('body').width() - canvas.width) / 2;*/
	//x = (x - offset.left);
	//y = (y - offset.top);
	
	context.fillStyle = '#'+users[id].color;
	context.lineWidth = 2;
	context.strokeStyle = '#'+users[id].color;
	/*context.fillRect(x,y,3,3);*/
	if( !user.lastX && !user.lastY ){
			context.beginPath();
			context.moveTo(x, y);
			user.lastX = x;
			user.lastY = y;
	} else {
		brushes[brush](user,x,y);
	}
	
}

var socket = io();
var drawNow = false;

socket.emit('init', {id:id, name:name, room:users[id].room, color: "000"});

$('.openui, .closeui').click(function(){
	$('.ui, .openui').toggle('slide');
});

$('#brush').change(function(e){
	var val = $(e.target).val();
	console.log('Brush',val);
	users[id].brush = val;
});

$('#room').change(function(e){
	var val = $(e.target).val();
	localStorage.room = val;
	socket.emit('room',{id:id,name:name,roomFrom:room,roomTo:$(e.target).val()});
	users[id].room = room = val;
});

$('#chat').submit(function(e){
	e.preventDefault();
	var val = $(e.target).find('#msg').val();
	socket.emit('chat',{user:id,name:name,room:room,msg:val});
	$(e.target).find('#msg').val('')
	$('#msgBox').append('<div class="msgBubble" style="position:absolute; text-align: center; width: 100%;" >'+val+'</div>');
	$('#msgBox .msgBubble:last-of-type').animate(
		{
			top: '-150px',
			opacity: '0'
		},
		5000,
		function(){
			$(this).remove();
		}
	);
});
$('#voteToClear').click(function() {
	socket.emit('initVote', {id:id, name:name, room:users[id].room});
});

$('body').mousedown(function(){ drawNow = true; });
$('body').mouseup(function(){ drawNow = false; users[id].lastX = false; users[id].lastY = false; });

$('#canvas').mousemove(function(e){
	var x = (e.pageX - offset.left);
	var y = (e.pageY - offset.top);
	
	socket.emit('coordinates', {id:id,name:name,brush:users[id].brush,drawNow:drawNow,x:x,y:y, room:users[id].room, color:users[id].color});
	
});

var canvasSnap = setInterval(
	function(){ socket.emit('canvas', {room:users[id].room, dataURL:canvas.toDataURL()}) },
	5000
);

socket.on('chat', function(data){
	console.log(data);
	$('.mouse_'+data.user+' .message').stop().css('opacity','1').show().html(data.msg);
	$('.mouse_'+data.user+' .message').fadeOut(5000); 

});

socket.on('newRoom', function(data){
	context.clearRect(0, 0, canvas.width, canvas.height);
	var img = new Image;
	img.onload = function(){
	  context.drawImage(img,0,0); // Or at whatever offset you like
	};
	img.src = data;
});

socket.on('cursor', function(data){
	if( ($('.mouse_'+data.id).length < 1) && (data.room == users[id].room) && (data.id != id) ){
		users[data.id] = {name:data.name,brush:data.brush, x:data.x, y:data.y, lastX:null, lastY:null, room:data.room, color: data.color };
		$('body').append($('<div class="mouse_'+data.id+'" data-name="'+data.name+'" style="top:'+(data.y+offset.top)+'px;left:'+(data.x+offset.left)+'px;"><img src="/images/pencil.png" ><div class="message"></div></div>'));
	} else if (data.room == users[id].room) {
		$('.mouse_'+data.id).css({
			'top': ((data.y+offset.top)-16)+'px',
			'left': (data.x+offset.left)+'px'
		});
	} else if (data.room != users[id].room) {
		$('.mouse_'+data.id).remove();
	}
	
	if(data.drawNow){
		draw(data.x,data.y,data.id,data.brush);
	} else {
		users[data.id].lastX = false;
		users[data.id].lastY = false;
	}
});

socket.on('users', function(data) {
	$('.userList').empty();
	$.each(data, function() {
		$('.userList').append('<li>'+this.name+'<div style="background: #'+this.color+';" title="#'+this.color+'"></div></li>');
	});
});
socket.on('colorUpdate', function(data) {
	users[data.id].color = data.color;
});

socket.on('clear', function() {
	context.clearRect(0, 0, canvas.width, canvas.height);
});

setInterval(function(){
	context.fillStyle = 'rgba(255,255,255,.05)';
	context.fillRect( 0, 0, $(canvas).width(), $(canvas).height());
}, 1500);


window.onbeforeunload = closingCode;
function closingCode(){
	socket.emit('exit',{user:id,name:name,roomFrom:room});
   return null;
}