module.exports={
	gmail_filter:'Fwd:',
	active:true,
	required_fields:['datetime'],
	body_parsers:[
		{
			version:'v1',
			description:'extracts datetime for manual forwarded message',
			fields:[
				{
					name:'datetime',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'---------- Forwarded message ---------'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'To:'
						},
						{
							type:'trim',
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Subject:'
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Date:'
						},
						{
							type:'trim',
						},
					]
				}
			]
		}
	]
	
}