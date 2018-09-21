module.exports = function(req, res, next) {
	if(req.query.secret && req.query.secret=='aslfhlaksbfalskhbfdladshbflkasj2346ncaubdlai2shflasdflhasbdflks234alkjfnslcnalsjnf')
		return next();
	else
		return res.forbidden();
};