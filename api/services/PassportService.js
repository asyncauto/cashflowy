const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
LocalStrategy = require('passport-local').Strategy;
BearerStrategy = require('passport-http-bearer').Strategy

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findOne({ id: id }, function (err, user) {
		done(err, user);
	});
});



/*
	email and password login strategy
*/
passport.use(new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password'
},
	function (email, password, callback) {
		console.log('inside passport LocalStrategy callback')
		User.findOne({ email: email }, function (err, user) {
			if (err) { return callback(err); }
			if (!user) {
				return callback(null, false, { message: 'Incorrect email.' });
			}

			bcrypt.compare(password, user.password, function (err, res) {
				if (!res)
					return callback(null, false, {
						message: 'Invalid Password'
					});
				var returnUser = {
					email: user.email,
					createdAt: user.createdAt,
					id: user.id,
					details: user.details
				};
				return callback(null, returnUser, {
					message: 'Logged In Successfully'
				});
			});
		});
	}
));

/**
 * api token strategy.
 */
passport.use(new BearerStrategy(
	function (api_token, done) {
		jwt.verify(api_token, sails.config.api_token_secret, function(err, jwt_decode_payload){
			if(err) return done(err);
			User.findOne(jwt_decode_payload.id).exec(function(err, user){
				if(err) return done(err);
				if(!user) return done(new Error('BLUEPRINT_USER_NOT_FOUND'));
				KmsService.decrypt(user.api_token, function(err, plain_api_token){
					if(err) return done(err);
					if(plain_api_token != api_token)
						return done(new Error('BLUEPRINT_TOKEN_IS_NOT_VALID'))
					return done(null, user, { scope: 'blueprint' });
				})
			})
		});
	}
));
