module.exports={
	
	required_fields:['account_last_4_digits','currency','amount','whom_you_paid','ref_no'],
	body_parsers:[
		{
			version:'incoming_v1',
			description:'latest',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Credited to account ending with '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Sending FI:'
						},
						{
							type:'trim',
						},
						
					]
                },
                {
					name:'ref_no',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Refer to wire sequence number'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'in your inquiry.'
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'in the amount of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'was received from'
                        },
                        {
							type:'substring',
							options:{
								start:0,
								end:1,
							}
						},
						{
							type:'trim',
						},
						
						
                        {
							type:'replace',
							options:{
								replace:'$',
								with:'USD',
							}
						},
						
						{
							type:'trim',
						},
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'in the amount of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:', was received from'
						},
						{
							type:'trim',
						},
						
						{
							type:'substring',
							options:{
								start:1,
							}
						},
                        {
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
						
						{
							type:'trim',
						},
					]
				},
				{
					name:'third_party',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'was received from'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Contact Wire Transfer Department'
						},
						{
							type:'trim',
						},
						
					]
				},
				{
					name:'date',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Your wire transfer on '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:', in the amount of'
						},
						{
							type:'trim',
						},
						
					]
				},
				
			]
        },
      
		
	]
}