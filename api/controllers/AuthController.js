/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var passport = require('passport');

module.exports = {

	// _config: {
	//     actions: false,
	//     shortcuts: false,
	//     rest: false
	// },

	login: function(req, res) {
		if(req.user)
			return res.redirect('/find');
		var locals={
			error:false,
			email:''
		}
		var redirect = req.query.redirect?decodeURIComponent(req.query.redirect):'/';
		if(req.body){
			locals.email=req.body.email;
			if(!GeneralService.validateEmail(req.body.email)){
				locals.error='email entered is not a valid email'
				return res.view('login',locals);
			}
			passport.authenticate('local', function(err, user, info) {
				console.log('in passport.authenticate callback');
				if ((err) || (!user)) {
					locals.error='Your credentials does not match'
					return res.view('login',locals);
				}
				req.logIn(user, function(err) {
					if (err) res.send(err);
					if(req.session.returnTo)
						return res.redirect(req.session.returnTo);
					
					return res.redirect(redirect);
					// return res.send({
					// 	message: info.message,
					// 	user: user
					// });
				});

			})(req, res);
		}
		else{
			req.session.returnTo = '/';
			if( req.query.origin ){
			  req.session.returnTo = req.query.origin
			}else{
			  req.session.returnTo = req.header('Referer')
			}	
			res.view('login',locals);
		}
	},

	logout: function(req, res) {
		req.logout();
		res.redirect('/');
	},
	signup:function(req,res){

		if(req.user)
			return res.redirect('/find');
		var locals={
			error:false,
			user:{
				email:'',
				name:'',
				password:'',
			}
		}
		if(req.body){
			
			var user = {
				email:req.body.email,
				name:req.body.name,
				password:req.body.password
				
			}
			locals.user=user;
			if(!GeneralService.validateEmail(locals.user.email)){
				locals.error='email entered is not a valid email'
				return res.view('signup',locals);
			}
				
			User.create(user).exec(function(err,u){
				if(err){

					if(err.code=='E_VALIDATION' && err.invalidAttributes && err.invalidAttributes.email){
						locals.error='You have already registed with that email address. <a href="/login">Login in instead</a>'
						return res.view('signup',locals);
					}
					else
						res.send('unknown error');
				}
				else{
					passport.authenticate('local', function(err, user, info) {
						if ((err) || (!user)) {
							return res.send({
								message: info.message,
								user: user
							});
						}
						req.logIn(user, function(err) {
							if (err) res.send(err);
							if(req.session.returnTo)
								return res.redirect(req.session.returnTo);
							else
								return res.redirect('/');
						});
					})(req, res);
				}
			});

		}
		else{
			req.session.returnTo = '/';
			if( req.query.origin ){
			  req.session.returnTo = req.query.origin
			}else{
			  req.session.returnTo = req.header('Referer')
			}	
			res.view('signup',locals);
		}
	}
};
