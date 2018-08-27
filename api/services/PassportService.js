var passport = require('passport'),
LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');

passport.serializeUser(function(user, done) {
	console.log('inside PassportService.passport.serializeUser');
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	console.log('inside PassportService.passport.deserializeUser');
	User.findOne({ id: id } , function (err, user) {
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
	function(email, password, callback) {
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
					id: user.id
				};
				return callback(null, returnUser, {
					message: 'Logged In Successfully'
				});
			});
		});
	}
));
