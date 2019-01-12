/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var passport = require('passport');
var request = require('request');
var async = require('async');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

module.exports = {

	// _config: {
	//     actions: false,
	//     shortcuts: false,
	//     rest: false
	// },

	login: function(req, res) {
		if(req.user)
			return res.redirect('/dashboard');
		var locals={
			error:false,
			email:''
		}
		var redirect='/';
		if(req.query.redirect && req.query.redirect!='undefined')
			redirect = decodeURIComponent(req.query.redirect);
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
			return res.redirect('/dashboard');
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
	},

	view_forgot: function(req, res){
		var locals = {
			error: '',
			message:''
		}
		res.view('forgot', locals);
	},

	/**
	 * Triggers an email to help reset the forgotten password
	 */
	forgot: function (req, res) {
		var email = req.body.email;
		
		if (!email) return res.view('reset', {
			error: 'email is mandatory',
			message:''
		});

		async.auto({
			findUser: function(cb){
				User.findOne({email:email}).exec(function(err, user){
					if(err) return cb(err);
					if(!user) return cb(new Error('user not found'));
					return cb(null, user);
				})
			},
			generateToken: ['findUser', function(results, cb){
				jwt.sign({
					email: results.findUser.email,
					for:'forgot_password'
				}, 
					sails.config.password_reset_secret, 
					{expiresIn: 60*10},  //10 mins or 600 seconds
					cb);
			}],
			sendMail:['generateToken', function(results, cb){
				var reset_url = sails.config.app_url + '/reset?token='+ results.generateToken;
				var opts={
					template:'reset',
					to:results.findUser.email,
					from:'Cashflowy<no-reply@cashflowy.in>',
					subject: 'Reset Password',
					locals:{
						name: results.findUser.name,
						url: reset_url
					}
				}
				MailgunService.sendEmail(opts,function(err){
					cb(err)
				})
			}]
		}, function(err, results){
			var locals = {
				error: err ? err.message : '',
				message: !err ? 'link sent successfully' : ''
			}
			res.view('forgot', locals);
		})
	},

	view_reset: function(req, res){
		var token =  req.query.token;

		if (!token) return res.view('reset', {
			error: 'reset token is missing',
			message:''
		});

		res.view('reset', {
			error: '',
			message:''
		});
	},

	reset: function (req, res) {
		var password = req.body.password;
		if (!password) return res.view('reset', {
			error: 'password is missing',
			message:''
		});

		var token =  req.query.token;

		if (!token) return res.view('reset', {
			error: 'reset token is missing',
			message:''
		});

		async.auto({
			verifyToken: function(cb){
				jwt.verify(token, 
					sails.config.password_reset_secret, 
					cb);
			},
			findUser: ['verifyToken', function(results, cb){
				User.findOne({email:results.verifyToken.email}).exec(function(err, user){
					if(err) return cb(err);
					if(!user) return cb(new Error('user not found'));
					return cb(null, user);
				})
			}],
			resetPassword:['findUser', function(results, cb){
				bcrypt.genSalt(10, function(err, salt) {
					bcrypt.hash(password, salt, function(err, hash) {
						if (err) {
							cb(err);
						}else{
							User.update({id: results.findUser.id},{password: hash}).exec(cb);
						}
					});
				});
			}]
		}, function(err, results){
			var locals = {
				error: err ? err.message : '',
				message: !err ? 'Password reseted successfully' : ''
			}
			res.view('reset', locals);
		})
	},
};
