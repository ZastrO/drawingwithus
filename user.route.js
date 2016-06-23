module.exports = function(req, res){

	var reqName = req.url.split('/')[2];

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