module.exports = {
    gmail_filter: 'from:(alerts@hdfcbank.net) "has been credited to A/c" -{"addition/modification of the beneficiary"}',
    active: true,
    required_fields: ['account_last_4_digits', 'currency', 'amount', 'whom_you_paid', 'available_credit_balance', 'date', 'time', 'upi_ref_no'],
    body_parsers: [
        {
            version: 'v1',
            description: 'credit transactions on bank account',
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
                            q: 'has been credited to A/c XX'
                        },
                        {
                            type: 'find_end_position',
                            criteria: 'text_match_before',
                            options: {
                                case_sensitive: false,
                                beginning_of_line: true
                            },
                            q: 'on account of'
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
                            q: ' at '
                        },
                        {
                            type: 'trim',
                        },
                    ]
                },
                {
                    name: 'amount',
                    type: 'float',
                    filters: [
                        {
                            type: 'find_start_position',
                            criteria: 'text_match_after',
                            options: {
                                case_sensitive: false,
                                beginning_of_line: true
                            },
                            q: 'Amount of INR'
                        },
                        {
                            type: 'find_end_position',
                            criteria: 'text_match_before',
                            options: {
                                case_sensitive: false,
                                beginning_of_line: true
                            },
                            q: 'has been credited to A/c'
                        },
                        {
                            type: 'trim',
                        },
                        {
                            type: 'replace',
                            options: {
                                replace: ',',
                                with: '',
                            }
                        },
                    ]
                },
                {
                    name: 'third_party',
                    type: 'string',
                    filters: [
                        {
                            type: 'find_start_position',
                            criteria: 'text_match_after',
                            options: {
                                case_sensitive: false,
                                beginning_of_line: true
                            },
                            q: 'on account of'
                        },
                        {
                            type: 'find_end_position',
                            criteria: 'text_match_before',
                            options: {
                                case_sensitive: false,
                                beginning_of_line: true
                            },
                            q: 'Available balance is INR'
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
                            q: 'on '
                        },
                        {
                            type: 'trim',
                        },
                    ]
                },
            ]
        }
    ]

}