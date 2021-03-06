module.exports = function(req, res){

	var reqName = req.url.split('/')[2];
	var owner = false;
	var brushes = [
		{val: 'line', name: 'Line'},
		{val: 'thinline', name: 'Thin Line'},
		{val: 'dynaline', name: 'Dynamic Line'},
		{val: 'triline', name: 'Tri Line'},
		{val: 'squiggle10', name: 'Squiggle ^10'},
		{val: 'squiggle25', name: 'Squiggle ^25'},
		{val: 'spray', name: 'Spray'},
		{val: 'circle', name: 'Circle'},
		{val: 'spraycircle', name: 'Circle Spray'},
		{val: 'scattercircles', name: 'Scattered Circles'},
		{val: 'sketchy', name: 'Sketchy'}
	];
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
				if(doc.owner == req.session.username){ owner = true; }

				switch(doc.accessLevel) {
					case "PUBLIC": 
						// connection();
					break;
					
					case "INVITE_SESSION": 
						//req.session.key doc.[newcolumn for sessionkey]
					break;
					
					case "VIEW_ONLY": 
						// sets some type of variable
					break;
					
					case "WHITELIST": 
						//req.session.user doc.whitelist
					break;
					
					case "BLACKLIST": 
						//reg.session.user doc.blacklist
					break;
				}

				res.render('room', {room: doc, owner: owner, accessLevel: accessLevel, brushes: brushes} );
			}
		}
	});
}