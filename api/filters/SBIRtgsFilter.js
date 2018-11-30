module.exports={
	gmail_filter:'from:(iphinfo.opsps@sbi.co.in) subject:(PSG)',
	active:true,
	required_fields:['account_last_4_digits','currency','amount','whom_you_paid','available_credit_balance','date','time'],
	body_parsers:[
		{
			version:'credit_v1',
			description:'as of sept 2018',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Dear Sir/Madam,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'SBI RTGS Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'A/c No XXXXXXX'
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
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Dear Sir/Madam,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'SBI RTGS Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' credited to your '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' '
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
							q:'Dear Sir/Madam,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'SBI RTGS Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' credited to your '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' '
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
							q:'Dear Sir/Madam,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'SBI RTGS Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'through RTGS with UTR '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' by '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'-Sd/'
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
							q:'Dear Sir/Madam,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'SBI RTGS Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'through RTGS with UTR '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' by '
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