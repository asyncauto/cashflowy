module.exports={
	gmail_filter:'from:(CitiAlert.India@citicorp.com) subject:("Transaction confirmation on your Citibank credit card")',
	active:true,
	required_fields:['credit_card_last_4_digits','balance_currency','balance_amount','date','time'],
	body_parsers:[
		{
			version:'v1',
			description:'this works till Oct 2018',
			fields:[
				{
					name:'credit_card_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'balance in your Citibank account No. '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'You can withdraw upto '
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
							q:' is '
                        },
                        {
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'XXXXXX'
						},
						{
							type:'trim',
                        },
                        
					]
				},
				{
					name:'balance_currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'balance in your Citibank account No. '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'You can withdraw upto '
						},
						{
							type:'trim',
						},
						
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' is '
						},
						{
							type:'trim',
                        },
                        {
							type:'substring',
							options:{
								end:3,
							}
                        },
                        {
							type:'replace',
							options:{
								replace:'Rs.',
								with:'INR',
							}
                        },
                        {
							type:'replace',
							options:{
								replace:'Rs ',
								with:'INR',
							}
                        },
                        {
							type:'trim',
                        },
					]
				},
				
				{
					name:'balance_amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'balance in your Citibank account No. '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'You can withdraw upto '
						},
						{
							type:'trim',
						},
						
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' is '
						},
						{
							type:'trim',
                        },
                        {
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' '
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
							q:'As on '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'balance in your Citibank account No. '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:','
						},
						{
							type:'trim',
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