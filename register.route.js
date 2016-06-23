module.exports = function(req, res, transporter){

	var username  = req.body.username,
		password  = req.body.password1,
		password2 = req.body.password2,
		email	  = req.body.email,
		bio		  = req.body.bio,
		avatar	  = req.body.avatar;

	if( password !== password2 ) {
		res.status(400);
		res.render('error', {code: 400, msg: 'The passwords that you entered do not match.'});
	} else	if( !validateEmail(email) ) {
		res.status(400);
		res.render('error', {code: 400, msg: 'The email that you entered is not valid.'});
	} else {
		User.findOne({username:username}).exec(function(err, doc){ 
			if(doc){
				res.status(226);
				res.render('error', {code: 226, msg: 'The following username already exists: ' + doc.username});
			} else {
				User.findOne({email:email}).exec(function(err, doc){
					if(doc){
						res.status(226);
						res.render('error', {code: 226, msg: 'The following email already exists: ' + doc.email});
					} else {
						var user = new User({
							username: username,
							password: password,
							email: email,
							bio: bio
						});

						console.log(user);

						user.save(function(err){
							if(err){	
								res.status(500);
								res.render('error', {code: 500, msg: 'There was an unknown server error. :('});
							} else {
								transporter.sendMail({
									from: 'no-reply@drawingwith.us',
									to: email,
									subject: 'Welcome!',
									text: 'Hey ' + username + '! Welcome to Drawingwith.us! '
								});
								res.render('error', {code: 'YES!', msg: 'Your new account has been created! Welcome to Drawingwith.us'});
							}
						}); // success
					}
				}); // email check
			}
		}); // username check
	}

}


function validateEmail(email) {
	var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
	return re.test(email);
}