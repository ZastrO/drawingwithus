module.exports = function(req, res){
	var resName = res.locals.username;

	if( Object.keys(req.body).length !== 0  ) {
		var color 	  = req.body.default_color,
			thickness = req.body.default_thickness,
			bio		  = req.body.bio,
			avatar	  = req.body.avatar;

		return res.redirect('/m/'+doc.id);
	} else {
		res.render('create-room', {} );
	}
}