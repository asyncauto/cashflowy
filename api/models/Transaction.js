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
            isIn: ['user', 'parsed_email', 'parsed_statement']
        },
        third_party: { // only for income/expense. 
            type: 'string',
            allowNull: true
        },
        account: { // from where the transaction is made
            model: 'account',
            required: true
        },
        transaction_categories:{
			collection: 'transaction_category',
			via: 'transaction'
		},
        transaction_group: {
            model: 'transaction_group'
        }
    },

    beforeCreate: async function (data, cb) {
        if (_.isDate(data.occuredAt))
            data.occuredAt = data.occuredAt.toISOString()
        // create a tg and tag the tg id to transaction
        var tg = await Transaction_group.create()
        data.transaction_group = tg.id
        cb();
    },
    beforeUpdate: function (data, cb) {
        if (_.isDate(data.occuredAt))
            data.occuredAt = data.occuredAt.toISOString()
        cb();
    },
    afterCreate: async function (created, cb) {
        Transaction_category.create({
            original_amount: created.original_amount,
            original_currency: created.original_currency,
            amount_inr: created.amount_inr,
            third_party: created.third_party,
            account: created.account,
            type: created.type,
            transaction: created.id,
            occuredAt: created.occuredAt,
            transaction_group: created.transaction_group
        }).exec(cb);
    }
}