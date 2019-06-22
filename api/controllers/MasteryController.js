module.exports={
	intro:function(req,res){
		var locals={};
		var current_level= _.get(req.user,'details.mastery.current_level');
		if(!current_level){

			current_level=sails.config.levels[0].slug;
			var details= req.user.details;
			details.mastery={
				current_level:sails.config.levels[0].slug,
				completed_steps:{}
			}
			sails.config.levels.forEach(function(level){
				details.mastery.completed_steps[level.slug]=[];
			})
			User.update({id:req.user.id},{details:details}).exec(function(err,result){
				if(err)
					throw err;
				res.redirect('/org/'+req.org.id+'/mastery/'+current_level+'/intro');
			})
		}
		else
			res.redirect('/org/'+req.org.id+'/mastery/'+current_level+'/intro');
		// res.view('mastery/landing',locals);
	},
	viewStep:function(req,res){
		var locals={};
		// check if the level exists
		var level=_.find(sails.config.levels,{slug:req.params.level});
		if(!level)
			return res.send('this level does not exist');
		var step=_.find(level.steps,{slug:req.params.step});
		if(!step)
			return res.send('this step does not exist');
		// check if the step exists
		res.view('mastery/'+req.params.level+'__'+req.params.step,locals)
	},
	completeStep:function(req,res){
		// is there any more incomplete steps?
		// should you move to the next level
		// update user
		// redirect user to the next step
	}
	// upgrade level
}