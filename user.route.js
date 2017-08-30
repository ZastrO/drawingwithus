module.exports = function(req, res){
	var reqName = req.url.split('/')[2];
	var resName = res.locals.username;

	if( Object.keys(req.body).length !== 0  ) {
		var color 	  = req.body.default_color,
			thickness = req.body.default_thickness,
			bio		  = req.body.bio,
			avatar	  = req.body.avatar;

		User.findOneAndUpdate({username:resName}, {bio: bio, avatar: avatar, defaults: {thickness: thickness, color: color}}).exec(function(err){
			if(err){	
				res.status(500);
				res.render('error', {code: 500, msg: 'There was an unknown server error. :('});
			} else {
				req.session.defaults = {thickness: thickness, color: color};
				return res.redirect('/u/'+resName);
			}
		}); // success

		console.log( res.locals.username, color, thickness, bio, avatar );
	} else {
		User.findOne({username:reqName}).exec(function(err, doc){ 
			if(err){
				res.status(500);
				res.render('error', {code: 500, msg: 'There was an error with your request!'});
			} else {
				if(doc == null){
					res.status(404);
					res.render('error', {code: 404, msg: 'There is no user with that name!'});
				} else {
					res.render('user', {user: doc} );
				}
			}
		});
	}
}