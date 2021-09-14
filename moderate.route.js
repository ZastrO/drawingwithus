module.exports = function(req, res){

	var reqName = req.url.split('/')[2];

	var accessLevel = [
		{val: 'PUBLIC', name: 'Public'},
		{val: 'INVITE_SESSION', name: 'Invite'},
		{val: 'VIEW_ONLY', name: 'View Only'},
		{val: 'WHITELIST', name: 'Whitelist'},
		{val: 'BLACKLIST', name: 'BlackList'}
	];

	Room.findOne({id:reqName}).exec(function(err, doc){ 
		if(err){
			res.status(500);
			res.render('error', {code: 500, msg: 'There was an error with your request!'});
		} else {
			if(doc == null){
				res.status(404);
				res.render('error', {code: 404, msg: 'There is no room with that name!'});
			} else {
				if(typeof req.app.locals.rooms[doc.id] === 'undefined'){ req.app.locals.rooms[doc.id] = doc; }
				res.render('moderate', {room: doc, accessLevel: accessLevel} );
			}
		}
	});

}