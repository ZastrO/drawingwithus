module.exports = function(req, res){

	var reqName = req.url.split('/')[2];

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
	{val: 'sketchy', name: 'Sketchy'}];

	Room.findOne({id:reqName}).exec(function(err, doc){ 
		if(err){
			res.status(500);
			res.render('error', {code: 500, msg: 'There was an error with your request!'});
		} else {
			if(doc == null){
				res.status(404);
				res.render('error', {code: 404, msg: 'There is no room with that name!'});
			} else {
				req.app.locals.rooms[doc.id] = doc;
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
				res.render('room', {room: doc, brushes: brushes} );
			}
		}
	});
}