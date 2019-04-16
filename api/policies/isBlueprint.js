module.exports = async function (req, res, next) {
    if (!req.isAuthenticated() || !_.get(req, 'authInfo.scope') == "blueprint")
        return res.status(401).json({ error: 'unauthorized' })
    switch (req.options.action) {
        case 'transaction/find':
            var accounts = await Account.find({ org: req.org.id });
            req.options.org_accounts = _.map(accounts, 'id');
            break;
        case 'transaction/create':
        case 'transaction/update':
            var accounts = await Account.find({ org: req.org.id })
            if (req.body.account && !_.find(accounts, { id: req.body.account }))
                return res.status(403).json({ error: 'you do not have permission to the account' });
            break;
        default:
            if (req.body && req.body.org && !(req.body.org == req.org.id))
                return res.status(403).json({ error: 'you do not have permission to the org' });
            break;
    }
    return next(null);
}