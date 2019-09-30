module.exports.filetypeparser = {

    filters:[
        {
            type:'hdfc_credit_card',
            required_keywords:[
                'HDFC',
                'Card Credit Card Statement'
            ]
        },
        
        {
            type:'yes_bank_credit_card',
            required_keywords:[]
        },
        
        {
            type:'hsbc_credit_card',
            required_keywords:[]
        },
        {
            type:'icici_bank_credit_card',
            required_keywords:[]
        },
        {
            type:'hsbc_credit_card',
            required_keywords:[]
        },
        {
            type:'icici_bank',
            required_keywords:[]
        },
        {
            type:'sbi_bank',
            required_keywords:[
                'SBIN0',
                'Account Statement'
            ]
        },
        {
            type:'hdfc_bank',
            required_keywords:[
                'HDFC000',
                'Statement'
            ]
        },

    ]
}