module.exports={
	intro:function(req,res){
		var locals={};
		res.view('intro/landing',locals);
	},
	createAccount:function(req,res){
		var locals={};
		res.view('intro/create_account',locals)
	}	
}