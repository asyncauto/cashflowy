module.exports={
	gmail_filter:'from:(neftinfo.psg@sbi.co.in) subject:(PSG)',
	active:true,
	required_fields:['account_last_4_digits','currency','amount','whom_you_paid','available_credit_balance','date','time'],
	body_parsers:[
		{
			version:'debit_v1',
			description:'as of nov 2018',
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Your A/c XXXXXXX'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' has been debited with '
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'has been debited with '
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'has been debited with '
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' towards NEFT with UTR'
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' sent to '
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'towards NEFT with UTR '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' sent to'
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'debit_v2',
			description:'as of nov 2018',
			fields:[
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Your NEFT of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' with UTR '
						},
						{
							type:'trim',
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' '
						},
						{
							type:'trim',
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
							q:'Dear Sir/Madam,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:'Your NEFT of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' with UTR '
						},
						{
							type:'trim',
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' credited to Beneficiary AC NO. '
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
							q:'Dear Sir/Madam,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' with UTR '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' DTD '
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'credit_v1',
			description:'as of nov 2018',
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' credited to your A/c No XXXXXXX'
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' credited to your A/c No'
						},
						{
							type:'trim',
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							q:' credited to your A/c No'
						},
						{
							type:'trim',
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' through NEFT with UTR '
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
							q:'SBI NEFT Team'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							q:' through NEFT with UTR '
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