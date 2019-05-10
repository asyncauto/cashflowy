/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
    // tableName:'loan',
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
        balance_due_inr: {
            type: 'number',
            columnType: 'float8'
        },
        date: { // invoice date
            type: 'ref',
            columnType: 'timestamptz'
        },
        type: {
            type: 'string',
            isIn: ['borrowing', 'lending'],
            allowNull:true
        },
        description: {
            type: 'string',
            allowNull: true
        },
        createdBy: {
            type: 'string',
            isIn: ['user']
        },
        third_party: {
            type: 'string',
            allowNull: true
        },
        is_paid_fully:{
            type: 'boolean',
            defaultsTo: false       
        },
        org:{
            model:'org',
            required:true
        },
    },
}