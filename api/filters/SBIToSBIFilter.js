module.exports={
	gmail_filter:'from:(donotreply.inb@sbi.co.in) subject:(Transaction acknowledgement)',
	active:true,
	required_fields:['account_last_4_digits','currency','amount','whom_you_paid','available_credit_balance','date','time'],
	body_parsers:[
		{
			version:'v1',
			description:'as of sept 2018',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for using State Bank Internet Banking.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not logged'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' from A/c ending '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' to '
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
							q:'Thank you for using State Bank Internet Banking.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not logged'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' for transaction of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' from A/c ending '
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
							q:'Thank you for using State Bank Internet Banking.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not logged'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' for transaction of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' from A/c ending '
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
							type:'trim',
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
							q:'Thank you for using State Bank Internet Banking.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not logged'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' from A/c ending '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' to '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' on '
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
							q:'Thank you for using State Bank Internet Banking.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not logged'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' from A/c ending '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' is '
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
			version:'v2',
			description:'Payment of bescom',
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
							q:'In case you have not logged'
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
							q:'has been processed successfully'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:0,
								end:2,
							}
						},
						{
							type:'replace',
							options:{
								replace:'Rs',
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
							q:'In case you have not logged'
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
							q:'has been processed successfully'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:2,
							}
						},
						{
							type:'trim',
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
							q:'In case you have not logged'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Your payment of '
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
							q:'In case you have not logged'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Txn Ref is '
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
			version:'v3',
			description:'for emails where there is no mention on thirdparty',
			fields:[
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for using State Bank Internet banking'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not logged'
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
							q:' on '
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
							q:'Thank you for using State Bank Internet banking'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not logged'
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
							q:' on '
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
							type:'trim',
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
					name:'transaction_id',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Thank you for using State Bank Internet banking'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'In case you have not logged'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Your Transaction Ref No '
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
			]
		},
	]
	
}