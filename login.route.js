module.exports = function(req, res){

	var username = req.body.username,
		password = req.body.password;

	User.findOne({username:username, password:password}).exec(function(err, doc){ 
		if(err){
			res.status(500);
			res.render('error', {code: 500, msg: 'There was an error with your request!'});
		} else {
			if(doc == null){
				console.log('attempted log in for ' + username);
				res.status(401.1);
				res.render('error', {code: 401.1, msg: 'That seems to be incorrect! Error. Does not compute.'});
			} else {
				console.log('logged in ' + doc.username);
				req.session.loggedIn = true;
				req.session.username = doc.username;
				res.render('user', {user: doc, username: doc.username, loggedIn: true} );
			}
		}
	});
}