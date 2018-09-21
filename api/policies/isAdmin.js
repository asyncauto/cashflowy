module.exports = function(req, res, next) {
   if (req.user.id==1) {
        return next();
    }
    else{
	    res.send('you need admin permissions to access this')
    }
};