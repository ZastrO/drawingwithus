,
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