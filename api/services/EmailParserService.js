var atob = require('atob');const fs = require('fs');
const readline = require('readline');
var async = require('async');


module.exports={

	/**
	 * Extract data from email body
	 * Try different body parsers
	 * For each body parser, check if all required fields are extracted. try different body parser
	 * If no body parser works, alert that no body parse gave full info
	 * latest body parser is the one on the top.
	 * [extractDataFromMessage description]
	 * @param  {[type]}   options  [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	extractDataFromMessageBody:function(options,callback){
		var extract_config = require('../filters/'+options.email_type+'.js');
		
		var body_parsers=extract_config.body_parsers;
		var ed={};
		var body_parser_used=''
		for(var i = 0;i<body_parsers.length;i++){
			// console.log(i);
			ed={};
			var all_good_flag=true;

			body_parsers[i].fields.forEach(function(field){
				ed[field.name]=EmailParserService.extractOneField(field,options.body);
				if(typeof ed[field.name]=='number' && ed[field.name]==0)
					all_good_flag=true;
				else if(!ed[field.name])
					all_good_flag=false;
			});
			// console.log(ed);
			// console.log(all_good_flag);
			if(all_good_flag){ // if all data is fine, break out.
				body_parser_used=body_parsers[i].version;
				break;
			} 
		}
		// console.log('\n\n\n\ndid this run');
		// console.log(body_parser_used);
		callback(null,{
			ed:ed,
			body_parser_used:body_parser_used,
		});
	},
	// given a body parser, the details are extracted
	extractDataFromMessageBodyUsingBodyParser:function(options,callback){
		var extract_config = require('../filters/'+options.email_type+'.js');
		var body_parser=options.body_parser;
		var ed={};
		var body_parser_used='';
		var all_good_flag=true;
		console.log('\n\n\n--------');
		console.log(body_parser);
		body_parser.fields.forEach(function(field){
			ed[field.name]=EmailParserService.extractOneField(field,options.body);
			if(typeof ed[field.name]=='number' && ed[field.name]==0)
				all_good_flag=true;
			else if(!ed[field.name])
				all_good_flag=false;
		});
		if(all_good_flag)
			body_parser_used=body_parser.version;
		
		// console.log('\n\n\n\ndid this run');
		// console.log(body_parser_used);
		callback(null,{
			ed:ed,
			body_parser_used:body_parser_used,
		});
		
	},

	extractOneField:function(field,body){
		var filters=field.filters;
		// console.log(typeof filters)
		// console.log(filters)
		filters.forEach(function(f){
			if(f.type == 'find_start_position'){
				var end = body.length;
				if(f.criteria=='text_match_after')
					var start = body.indexOf(f.q)+f.q.length;
				else if(f.criteria=='text_match_before')
					var start = body.indexOf(f.q);
				body=body.substring(start,end);
			}
			else if(f.type == 'find_end_position'){
				var start = 0;
				if(f.criteria=='text_match_after')
					var end = body.indexOf(f.q)+f.q.length;
				else if(f.criteria=='text_match_before')
					var end = body.indexOf(f.q);
				body=body.substring(start,end);
			}else if(f.type=='trim'){
				body=body.trim(body);
			} else if(f.type=='replace'){
				var temp = body.split(f.options.replace);
				body=temp.join(f.options.with);
			} else if(f.type=='substring'){
				var start = f.options.start?f.options.start:0;
				var end = f.options.end?f.options.end:body.length;
				body=body.substring(start,end);
			} else if(f.type=='is'){
				body=f.value;
			}
			// console.log('\n\n\n\n*********');
			// console.log(start);
			// console.log(end);
		})
		var output;
		if(field.type=='float')
			output = parseFloat(body);
		else if(field.type=='integer')
			output = parseInt(body);
		else 
			output = body.replace(/  +/g, ' '); // replaces multiple spaces. ref - https://stackoverflow.com/questions/1981349/regex-to-replace-multiple-spaces-with-a-single-space
			// output = body.replace(/\s\s+/g, ' '); replaces multiple spaces tabs and new lines
		return output;
	}
}