module.exports = function(req, res){
	var resName = res.locals.username;

	if( Object.keys(req.body).length !== 0  ) {
		var id 			= req.body.id,
			displayName = req.body.displayName,
			accessLevel = req.body.accessLevel,
			bgColor 	= req.body.bgColor,
			fadeTime 	= req.body.fadeTime,
			width 		= req.body.width,
			height 		= req.body.height;

		console.log( req.body );

		Room.findOne({id:id}).exec(function(err, doc){ 
			if(doc){
				res.status(226);
				res.render('error', {code: 226, msg: 'The following roomID already exists: ' + doc.id});
			} else {
				var room = new Room({
					id: id,
					bgColor: bgColor,
					size: { width: width, height: height },
					owner: resName,
					accessLevel: accessLevel,
					fadeTime: fadeTime,
					lastModified: (new Date()).getTime(),
					displayName: displayName
				});

				console.log(room);

				room.save(function(err){
					if(err){	
						res.status(500);
						res.render('error', {code: 500, msg: 'There was an unknown server error. :('});
					} else {
						User.findOne({username:resName}).exec(function(err, doc){
							if(doc){
								doc.myRooms.push(id);
								doc.save(function(err){
									if(err){	
										res.status(500);
										res.render('error', {code: 500, msg: 'There was an unknown server error. :('});
									} else {
										return res.redirect('/r/'+id);
									}
								});
							} 
						}); // success
					}
				}); // success
			}
		}); // username check
	} else {
		res.render('create-room', {} );
	}
}