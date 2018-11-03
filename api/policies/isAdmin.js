module.exports = function (req, res, next) {
    if (_.includes([1, 6], req.user.id)) {
        return next();
    }
    else {
        res.send('you need admin permissions to access this')
    }
};