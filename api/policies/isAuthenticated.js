module.exports = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	else {
		if (req.url.match('/api/'))
			return res.status(401).json({ error: 'authentiction failed' })
		var locals = {
			title: 'Login',
			description: 'This page requires login',
			layout: 'layout',
			pg: {
			}
		}
		res.redirect('/login?redirect=' + encodeURIComponent(req.url));
	}
};
