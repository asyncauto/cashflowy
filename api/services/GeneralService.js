var async=require('async');

var normalizeUrl=function(url){
	var n=require('normalize-url');	
	return n(url,{
		normalizeHttps: false,
		stripWWW: false
	});
};


module.exports={
	/**
	 * fetches details of an item from a url
	 * @param  {[type]} req [description]

	 */
	trimUrl:function(url){
		if(url.indexOf('https://')==0)
			url=url.substring(8);
		if(url.indexOf('http://')==0)
			url=url.substring(7);
		if(url[url.length-1]=='/')
			url=url.slice(0,-1);
		return url;
	},
	trimWWW:function(url){
		if(url.indexOf('https://')==0)
			url=url.substring(8);
		if(url.indexOf('http://')==0)
			url=url.substring(7);
		if(url.indexOf('www.')==0)
			url=url.substring(4);
		if(url[url.length-1]=='/')
			url=url.slice(0,-1);
		return url;
	},
	/** 
	 * builts the list of objects to match against to be used in a query
	 * @param  {[type]} arr [description]
	 * @return string     [description]
	 */
	whereIn:function(arr){
		var result='(';
		arr.forEach(function(a,i){
			if(typeof a =='string')
				result+="'"+a+"'";
			else
				result+=a;
			if(i!=(arr.length-1))
				result+=", ";
		});
		result+=')';
		return result;
	},
	/**
	 * regular expression for checking if email is valid
	 * @param  {[type]} email [description]
	 * @return {[type]}       [description]
	 */
	validateEmail:function(email) {
		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(String(email).toLowerCase());
	},

	normalizeUrl:normalizeUrl,
	
	/**
	 * sends json or html to the browser based on some conditions
	 * @param  {obj} req
	 * @param  {obj} res
	 * @param  {string} view 
	 * @param  {obj} locals
	 * @return {[type]}
	 */
	sendJsonOrHtmlRes:function(req,res,view,locals){
		res.set('hr_status','access_granted');
		if(req.query.show_json=='true' || req.query.show_json=='True' || req.query.show_json=='t'){
			// if(req.user && req.user.is_curator==true){
				res.json(locals);
			// }
			// else
				// res.view(view,locals);
		}
		else
			res.view(view,locals);
	},
	// this function repeats an action function any number of times
	/**
	 * [repeater description]
	 * @param  {Function} fn       [description]
	 * @param  {[type]}   options_arr  array of options to be send to the function
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	repeater:function(f_name,options_arr,callback){
		options_arr.forEach(function(options){
			fn=GeneralService[f_name];
			// fn.apply()
		})

	},
	/**
	 * updates the cache of mentions count
	 * @param  {[type]}   url      url object
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
		
	makeApiKey:function(){
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (var i = 0; i < 20; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	},
	
	/**
	* This function is represent time as time lapsed from the event to now.
	* @param {date} timestamp
	* @return {string} human readable string either 5m, 10hr or oct 12
	*/
	timeAgo:function(timestamp){
		// sails.log.info("\n\n\ninside timeAgo");
		// sails.log.info(timestamp);
		var t = new Date(timestamp);
		// sails.log.info(t);
		var diff= Math.round((new Date()-t)/1000/60); // in mins
		var month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		if(diff<60){ // if less than an hour ago
			return diff+'m';
		}
		else if(diff<60*24){ // if less than a day ago
			return Math.round(diff/60)+'h';
		}
		else if(t.getFullYear() == new Date().getFullYear()){
			return month[t.getMonth()]+' '+t.getDate();
		}
		else{
			return t.getDate()+' '+month[t.getMonth()]+' '+t.getFullYear();
		}
	},
	orderCategories:function(categories){
		var parents=[];
		categories.forEach(function(category){
			if(!category.parent)
				parents.push(category);
		});
		parents.forEach(function(pc){
			pc.fullname=pc.name;
			pc.children=[];
			categories.forEach(function(c){ // level 2
				if(c.parent==pc.id)
					pc.children.push(c);
			});
			pc.children.forEach(function(p2c){ // level 2
				p2c.fullname=pc.fullname+'->'+p2c.name;
				p2c.children=[];
				categories.forEach(function(c){
					if(c.parent==p2c.id)
						p2c.children.push(c);
				});
				p2c.super_count=_.sum(p2c.children,'t_count')+p2c.t_count;
				p2c.super_sum=_.sum(p2c.children,'t_sum')+p2c.t_sum;
				p2c.children.forEach(function(p3c){ // level 3
					p3c.fullname=p2c.fullname+'->'+p3c.fullname;
					p3c.children=[];
					categories.forEach(function(c){
						if(c.parent==p3c.id)
							p3c.children.push(c);
					});
					p3c.super_count=_.sum(p3c.children,'t_count')+p3c.t_count;
					p3c.super_sum=_.sum(p3c.children,'t_sum')+p3c.t_sum;
				})
			})
			pc.super_count=_.sum(pc.children,'super_count')+pc.t_count;
			pc.super_sum=_.sum(pc.children,'super_sum')+pc.t_sum;
		});
		return parents;
	},
	/**
	 * Based on the url, it will tell you if the page is a create page or an edit page
	 * @param  {[type]} url [description]
	 * @return {[type]}     [description]
	 */
	createOrEdit:function(url){
		var temp = url.split('/');
		var create_or_edit='';
		if(temp[temp.length-1])
			create_or_edit=temp[temp.length-1];
		else
			create_or_edit=temp[temp.length-2];
		
		return create_or_edit.charAt(0).toUpperCase()+create_or_edit.slice(1);
		// returns Edit or Create - notice the caps
	},
	/**
	 * convert a promise to callback
	 * @param  {[type]}   promise  [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	p2c:function(promise,callback){
		promise.then(function(result) {
			callback(null, result);
		}, function(error) {
			callback(error);
		});
	},
	makeApiToken:function(){
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (var i = 0; i < 50; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}
}