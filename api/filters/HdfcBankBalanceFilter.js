module.exports = {
	gmail_filter: 'from:(alerts@hdfcbank.net) Available balance in your A/c -{has been debited from}',
	active: true,
	required_fields: ['account_last_4_digits', 'balance_currency', 'balance_amount', 'date', 'time'],
	body_parsers: [
		{
			version: 'v1',
			description: 'availabel balance alert',
			fields: [
				{
					name: 'account_last_4_digits',
					type: 'integer',
					filters: [
						{
							type: 'find_start_position',
							criteria: 'text_match_after',
							options: {
								case_sensitive: false,
								beginning_of_line: true
							},
							q: 'Available balance in your A/c XX'
						},
						{
							type: 'find_end_position',
							criteria: 'text_match_before',
							options: {
								case_sensitive: false,
								beginning_of_line: true
							},
							q: 'Credits in A/c are subject to clearing.'
						},
						{
							type: 'trim',
						},
						{
							type: 'find_end_position',
							criteria: 'text_match_before',
							options: {
								case_sensitive: false,
								beginning_of_line: true
							},
							q: ' at'
						},
						{
							type: 'trim',
						},
					]
				},
				{
					name: 'balance_currency',
					type: 'string',
					filters: [
						{
							type: 'find_end_position',
							criteria: 'text_match_before',
							options: {
								case_sensitive: false,
								beginning_of_line: true
							},
							q: 'Credits in A/c are subject to clearing.'
						},
						{
							type: 'trim',
						},
						{
							type: 'find_start_position',
							criteria: 'text_match_after',
							options: {
								case_sensitive: false,
								beginning_of_line: true
							},
							q: 'is'
						},
						{
							type: 'trim',
						},
						{
							type: 'find_end_position',
							criteria: 'text_match_before',
							options: {
								case_sensitive: false,
								beginning_of_line: true
							},
							q: '.'
						},
						{
							type: 'trim',
						},
						{
							type: 'substring',
							options: {
								start: 0,
								end: 3,
							}
						},
						{
							type: 'replace',
							options: {
								replace: 'Rs.',
								with: 'INR',
							}
						},
					]
				},
				{
					name: 'balance_amount',
					type: 'float',
					filters: [
						{
							type: 'find_end_position',
							criteria: 'text_match_before',
							options: {
								case_sensitive: false,
								beginning_of_line: true
							},
							q: 'Credits in A/c are subject to clearing.'
						},
						{
							type: 'trim',
						},
						{
							type: 'find_start_position',
							criteria: 'text_match_after',
							options: {
								case_sensitive: false,
								beginning_of_line: true
							},
							q: 'is'
						},
						{
							type: 'trim',
						},
						{
							type: 'find_end_position',
							criteria: 'text_match_before',
							options: {
								case_sensitive: false,
								beginning_of_line: true
							},
							q: '.'
						},
						{
							type: 'trim',
						},
						{
							type: 'substring',
							options: {
								start: 3
							}
						},
						{
							type: 'replace',
							options: {
								replace: ',',
								with: '',
							}
						}
					]
				}
			]
		}
	]

}