/**
 * Asset.js
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
        unit_original_amount: {
            type: 'number',
            columnType: 'float8'
        },
        unit_amount_inr: {
            type: 'number',
            columnType: 'float8'
        },
        units:{
            type:'number',
            columnType:'float8'
        },
        date: { // invoice date
            type: 'ref',
            columnType: 'timestamptz'
        },
        type: {
            type: 'string',
            isIn: ['mutual_fund', 'stock','real_estate','other'],
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
        org:{
            model:'org',
            required:true
        },
        name: {
            type: 'string',
        },
    },
}