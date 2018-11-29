module.exports={
	gmail_filter:'from:(donotreply.sbimb@sbi.co.in) subject:(Transaction Alert from SBI)',
	active:true,
	required_fields:['account_last_4_digits','currency','amount','whom_you_paid','available_credit_balance','date','time'],
	body_parsers:[
		{
			version:'neft_v1',
			description:'as of sept 2018',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'If not done by you'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' from A/C no. XXXX'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' has been completed successfully'
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
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'If not done by you'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' from A/C no. XXXX'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:0,
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
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'If not done by you'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' from A/C no. XXXX'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
					]
				},
				{
					name:'whom_you_paid',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'If not done by you'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'NEFT transfer to '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' for '
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'transaction_id',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'If not done by you'
						},
						{
							type:'trim',
						},						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'.TID:'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'.Service Charges'
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'bill_pay_v1',
			description:'as of sept 2018',
			fields:[
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not initiated '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'has been made successfully on'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'. TID. '
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:0,
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
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not initiated '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'has been made successfully on'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'. TID. '
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
					]
				},
				{
					name:'whom_you_paid',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not initiated '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Bill Payment for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been made successfully on '
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'transaction_id',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not initiated '
						},
						{
							type:'trim',
						},						
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'. TID. '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'.'
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'third_party_v1',
			description:'as of sept 2018',
			fields:[
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not initiated '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Third party transfer to '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'completed successfully'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:0,
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
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not initiated '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Third party transfer to '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'completed successfully'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
					]
				},
				{
					name:'whom_you_paid',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not initiated '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Third party transfer to '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' for '
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'transaction_id',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for banking with State Bank of India.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not initiated '
						},
						{
							type:'trim',
						},						
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'.TID: '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'.'
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