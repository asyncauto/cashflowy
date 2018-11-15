module.exports = function(req, res, next) {
	if(req.query.secret && req.query.secret==sails.config.background_secret)
		return next();
	else
		return res.forbidden();
};