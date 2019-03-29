/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
    tableName:'invoice',
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
        sub_total_inr:{
            type: 'number',
            columnType: 'float8'
        },
        gst_total_inr: {
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
            isIn: ['receivable', 'payable'],
            allowNull:true
        },
        createdBy: {
            type: 'string',
            isIn: ['user', 'zoho']
        },
        terms: { // terms of the invoice - due on reciept, custom, due end of the month
            type: 'string',
            allowNull: true
        },
        third_party: { // particulars - name of the 3rd party company
            type: 'string',
            allowNull: true
        },
        category: { // which pnl head does this invoice belong to. Only pnl heads can be added as categories
            model: 'category',
        },
        remote_id: { // invoice number from the remote service
            type: 'string',
            allowNull: true
        },
        account: { // to which the receivable invoice money is going to come to or payable invoice is going to go from
            model: 'account',
            required: true
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