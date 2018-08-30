/**
 * MainController
 *
 * @description :: Server-side logic for managing mains
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const fs = require('fs');
const async = require('async');
const fx = require('money');
fx.base='INR';
fx.rates={
	'EUR':0.0125660,
	'USD':0.0146289,
	'MYR':0.0595751,
	'IDR':211.557,
	'INR':1,
	'CZK':0.320764,
	'HUF':4.03376,

}
module.exports = {
	testKuePage:function(req,res){
		TestService.printTest();
		// console.log(sails.services);
		// Cache.findOne({key:"landing_page_stats"}).exec(function(err,result){
		// 	if(err)
		// 		throw err;
			var locals={
				// stats:result.value
			}
			sails.hooks.views.render('/../api/hooks/kue-controller/views/sample',{},function(err,html){
				
				console.log(__dirname);
				console.log(err);
				console.log(html);
				res.send(html);
			});
		
		// res.send('this is from test kue controller');
			// res.view('sample',locals);
		// });
	}
};


//

