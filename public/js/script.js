if(typeof sessionStorage.id === 'undefined'){
	sessionStorage.id = Math.floor(Math.random()*1000000);
}
if(typeof localStorage.room === 'undefined'){
	localStorage.room = location.pathname.replace('/r/','');
	localStorage.room = localStorage.room.replace('/m/','');
}

var room = location.pathname.replace('/r/','');
var room = room.replace('/m/','');
/* $('#room').val(room); */
var id = sessionStorage.id;


if( typeof localStorage.name == 'undefined' ){
	if( navigator.userAgent.indexOf("Chrome/") > 0 ) {
		localStorage.name = "Chrome";
	} else if( navigator.userAgent.indexOf("Safari/") > 0 ) {
		localStorage.name = "Safari";
	} else if( navigator.userAgent.indexOf("Firefox/") > 0 ) {
		localStorage.name = "FireFox";
	} else if( navigator.userAgent.indexOf(".NET") > 0 ) {
		localStorage.name = "Explorer";
	}
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

var lastXY = {x:null,y:null};
var users = [];
var color = id;

users[id] = {name:name,brush: 'line', x:0, y:0, lastX:null, lastY:null,room:room, color: roomConfig.color };

$('#colorSelector').ColorPicker({
	color: roomConfig.color,
	onShow: function (colpkr) {
		$(colpkr).fadeIn(500);
		return false;
	},
	onHide: function (colpkr) {
		$(colpkr).fadeOut(500);
		return false;
	},
	onChange: function (hsb, hex, rgb) {
		$('#colorSelector div').css('background', 'linear-gradient(#'+hex+' 0, #'+hex+' 100%) no-repeat center left');
		color = users[id].color = hex;
		socket.emit('colorPicker', {id:id, room:users[id].room, color: hex });
	}
});
$('#colorSelector div').css('background', 'linear-gradient(#'+roomConfig.color+' 0, #'+roomConfig.color+' 100%) no-repeat center left');

var brushes = {
	line: function(user,x,y,options){
		context.beginPath();
		context.moveTo(user.lastX, user.lastY);
		context.lineTo(x, y);
		context.stroke();
		
		user.lastX = x;
		user.lastY = y;
	}
};

function draw(x,y,id,brush){
	var user = users[id];

	context.fillStyle = '#'+users[id].color;
	context.lineWidth = 1;
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

socket.emit('init', {id:id, name:name, room:users[id].room, color: roomConfig.color});

console.log(socket);

socket.on('problems', function(data){
	switch (data.type){
		case '404':
			$('#canvas').replaceWith('<h1><br><br><br>'+data.msg+'</h1>');
			$('.ui, .openui').remove();
		break;
	}
});

socket.on('chat', function(data){
	$('.chat-ui .list-group').append('<li class="list-group-item"><span class="name">'+data.name+'</span> '+data.msg+'</li>');
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
	var rect = canvas.getBoundingClientRect();

	if( ($('.mouse_'+data.id).length < 1) && (data.room == users[id].room) && (data.id != id) ){
		users[data.id] = {name:data.name,brush:data.brush, x:data.x, y:data.y, lastX:null, lastY:null, room:data.room, color: data.color };
		$('.pencils').append($('<div class="mouse mouse_'+data.id+'" data-name="'+data.name+'" style="top:'+(data.y+offset.top)+'px;left:'+(data.x+offset.left)+'px;"><img src="/images/pencil.png" ><div class="message"></div></div>'));
	} else if (data.room == users[id].room) {
		var x = (data.x * ( rect.right - rect.left ) ) / (canvas.width );
		var y = (data.y * ( rect.bottom - rect.top ) ) / (canvas.height );
		/*$('.mouse_'+data.id).css({
			'top': ((data.y+offset.top)-16)+'px',
			'left': (data.x+offset.left)+'px'
		});*/
		$('.mouse_'+data.id).css({
			'top': (y-4)+'px',
			'left': x+'px'
		});
	} else if (data.room != users[id].room) {
		$('.mouse_'+data.id).remove();
	}
	
	if(data.drawNow){
		draw(data.x,data.y,data.id,data.brush);
	} else {
		users[data.id].lastX = null;
		users[data.id].lastY = null;

	}
});

socket.on('users', function(data) {
	$('.userList').empty();
	$.each(data, function() {
		$('.userList').append('<li class="list-group-item">'+this.name+'<div style="background: #'+this.color+';" title="#'+this.color+'"></div></li>');
	});
	/*$('.mouse').each( function(data){
		var isHere = false;
		var mouseId = $(this).attr('class').split('_')[1];
		for (var i = data.length - 1; i >= 0; i--) {
			if( data[i].user == mouseId ){
				isHere = true;
			}
		};
		if(!isHere){
			$('.mouse_'+mouseId).remove();
		}
	}(data));*/
});
socket.on('colorUpdate', function(data) {
	users[data.id].color = data.color;
});
socket.on('ink', function(data) {
	$('#colorSelector div').css('backgroundPosition', ((1 - data.level/data.cap) * -100) + 'px 0px');
});

socket.on('newVote', function(data) {
	if ( ($('#voteToClear .badge').length > 0) && (data.percent != 100) ){
		$('#voteToClear .badge').html(data.percent+'%');
	} else if(data.percent != 100) {
		$('#voteToClear').append('<span class="badge">'+data.percent+'%</span>');
	}
});

socket.on('clear', function() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	$('#voteToClear .badge').remove();
});


$('.open-draw-ui, .close-draw-ui').click(function(){
	$('.draw-ui, .open-draw-ui').toggle('slide');
});
$('.open-chat-ui, .close-chat-ui').click(function(){
	$('.chat-ui, .open-chat-ui').toggle('slide', {direction: 'right'});
});
setTimeout(function(){
	$('.close-draw-ui, .close-chat-ui').click();
}, 4000);

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
	socket.emit('chat',{user:id,name:name,room:room,msg:$(e.target).find('#msg').val()});
	$('#msg').val('');
});
$('#voteToClear').click(function() {
	socket.emit('initVote', {id:id, name:name, room:users[id].room});
});

$('body').on('mousedown touchstart',	drawNowFunc);
//$('body').bind('touchstart',drawNowFunc);
$('body').on('mouseup touchend touchcancel',		noDrawFunc);
//$('body').bind('touchend', 	noDrawFunc);


$('#canvas').on('mousemove touchmove', 	touchHandler);

function drawNowFunc(){
	users[id].lastX = null; 
	users[id].lastY = null;
	
	drawNow = true;
}

function noDrawFunc(){
	drawNow = false; 
	socket.emit('coordinates', {id:id,name:name,drawNow:drawNow});
}

function touchHandler(e){
	e.preventDefault();

	var rect = canvas.getBoundingClientRect();

	if(e.type == "touchmove") {
		var targetRect = e.originalEvent.touches[0].target.getBoundingClientRect();
		e.offsetX = e.originalEvent.touches[0].pageX - targetRect.left;
		e.offsetY = e.originalEvent.touches[0].pageY - targetRect.top;
	}

	var x = Math.round(e.offsetX/(rect.right-rect.left)*canvas.width);
	var y = Math.round(e.offsetY/(rect.bottom-rect.top)*canvas.height);
	
	//console.log("x: "+ x  +" -- y: " + y );

	socket.emit('coordinates', {id:id,name:name,brush:users[id].brush,drawNow:drawNow,x:x,y:y, room:users[id].room, color:users[id].color});
}

var canvasSnap = setInterval(
	function(){ socket.emit('canvas', {room:users[id].room, dataURL:canvas.toDataURL()}) },
	5000
);
if(roomConfig.fadeTime !== 0) {
	/*setInterval(function(){
		context.save();
		//context.globalAlpha = 0.08;
		context.fillStyle = 'rgba(230,230,230,0.05)';
		context.fillRect( 0, 0, $(canvas).width(), $(canvas).height());
		context.restore();
	}, 40);*/

	/*setInterval(function(){
		context.save();
		context.globalAlpha = 0.3;
		context.fillStyle = 'rgb(255,255,255)';
		context.fillRect( 0, 0, $(canvas).width(), $(canvas).height());
		context.restore();
	}, 30000);*/
}




window.onbeforeunload = closingCode;
function closingCode(){
	socket.emit('exit',{user:id,name:name,roomFrom:room});
   return null;
}