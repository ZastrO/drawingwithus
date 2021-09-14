importScripts('/socket.io/socket.io.js');

socket = io();
buffer = [];

onmessage = function(e){
	buffer.push(e.data);
	this.checkBuffer();
}

checkBuffer = function(){
	if( buffer.length > 4) {
		buffer.forEach((data, i) => {
			socket.emit('coordinates', data);
			delete buffer[i];
		});
		postMessage({message: 'buffer check'});
	}
}