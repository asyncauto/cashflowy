/**
 * Transaction_group.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    transactions:{
        collection: 'transaction',
        via: 'transaction_group'
    },

    transaction_categories:{
        collection: 'transaction_category',
        via: 'transaction_group'
    }

  }

};

