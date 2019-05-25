module.exports={
	index:function(req,res){
		var locals={};
		res.view('user_settings/index',locals);
	},
	listDevices:function(req,res){
		var locals={};
		res.view('user_settings/list_devices',locals);
	},
	createDevice:function(req,res){
		var locals={};
		if(req.body){
			var uaParser = require('ua-parser-js');
			var user_agent= uaParser(req.body.user_agent);
			var device={
				name:user_agent.browser.name+' on '+user_agent.os.name,
				is_enabled:true,
				user:req.user.id,
				push_subscription:req.body.push_subscription,
				details:{
					user_agent:user_agent,
				}
			}
			Device.create(device).exec(function(err,device){
				res.redirect('/user/'+req.user.id+'/settings/devices');
			});
		}else{
			res.view('user_settings/create_device',locals);
		}
	}
}