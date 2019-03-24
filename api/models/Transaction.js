/**
 * Transaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {

    attributes: {
        original_currency: {
            type: 'string',
        },
        original_amount: {
            type: 'number',
            columnType: 'float8'
        },
        amount_inr: {
            type: 'number',
            columnType: 'float8'
        },
        occuredAt: { // defaults to createdAt. Useful when creating manually. 
            type: 'ref',
            columnType: 'timestamptz'
        },
        type: {
            type: 'string',
            isIn: ['income_expense', 'transfer']
        },
        createdBy: {
            type: 'string',
            isIn: ['user', 'parsed_email', 'parsed_document']
        },
        third_party: { // only for income/expense. 
            type: 'string',
        },
        account: { // from where the transaction is made
            model: 'account',
            required: true
        }
    },
    beforeCreate: function (data, cb) {
        if (_.isDate(data.occuredAt))
            data.occuredAt = data.occuredAt.toISOString()
        cb();
    },
    beforeUpdate: function (data, cb) {
        if (_.isDate(data.occuredAt))
            data.occuredAt = data.occuredAt.toISOString()
        cb();
    },
    afterCreate: function (created, cb) {
        Transaction_line_item.create({
            original_amount: created.original_amount,
            original_currency: created.original_currency,
            amount_inr: created.amount_inr,
            third_party: created.third_party,
            account: created.account,
            type: created.type,
            transaction: created.id,
            occuredAt: created.occuredAt
        }).exec(cb);
    }
}