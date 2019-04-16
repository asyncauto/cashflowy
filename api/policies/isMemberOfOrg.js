var async= require('async');
module.exports = function (req, res, next) {
    console.log(req.params);
    if(req.params.o_id){
        async.auto({
            getOrg:function(callback){
                Org.findOne({ id: req.params.o_id }).exec(callback);
            },
            checkMembership:function(callback){
                Member.find({org:req.params.o_id,user:req.user.id}).exec(callback);
            },
            // get all orgs that the user is part of
            getAllMemberships:function(callback){
                Member.find({user:req.user.id}).populate('org').exec(callback);
            }
        },function(err,results){
            if (results.checkMembership && results.checkMembership.length){ // there is a membership for that user in that org
            // if (results.checkMembership){ // there is a membership for that user in that org
                req.org=results.getOrg;
                req.user.memberships = results.getAllMemberships;
                next(err);
            }else{
                if(req.url.match('/api/'))
                    return res.status(403).json({error: 'you are not part of this org'});
                res.send('you are not part of this org');
            }
        })
        
    }else{
        if(req.url.match('/api/'))
            return res.status(403).json({error: 'you are not part of this org'});
        res.send('you are not part of this org');
    }
};
