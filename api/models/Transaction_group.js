/**
 * Transaction_group.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    transaction_events:{
        collection: 'transaction_event',
        via: 'transaction_group'
    },

    transactions:{
        collection: 'transaction',
        via: 'transaction_group'
    }
  }

};

