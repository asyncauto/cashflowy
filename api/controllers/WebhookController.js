/**
 * WebhookController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var async = require('async')
module.exports = {
    docparser: function (req, res) {
        if (req.query.secret != sails.config.docparser_webhook_secret)
            return res.status(403).json({ status: 'failure', error: 'athorization failed' });
        async.auto({
            findDocument: function (cb) {
                Document.findOne({ id: parseInt(req.body.remote_id) }).exec(cb);
            },
            updateDocument: function (cb) {
                Document.update({ id: parseInt(req.body.remote_id) }, { parsed_data: req.body }).exec(cb);
            },
            findOrCreateAccount: ['findDocument', function (results, cb) {
                var filter = {
                    like: {
                        acc_number: '%' + req.body.account_id, // ends with the following number
                    },
                    user: results.findDocument.user
                }

                var account = { // incase the account does not exist, create account.
                    acc_number: '' + req.body.account_id,
                    user: results.findDocument.user,
                    type: 'credit_card', // user might need to change this
                    name: req.body.account_holder + ' ' + req.body.account_id,
                }
                Account.findOrCreate(filter, account).exec(cb);
            }],
            findOrCreateTransactions: ['findDocument', 'findOrCreateAccount', function (results, cb) {
                async.forEachOfSeries(req.body.transactions, function (transaction, i, ecb) {
                    var find = {
                        original_currency: 'INR',
                        createdBy: 'parsed_document',
                        type: 'income_expense',
                        account: results.findOrCreateAccount.id,
                        third_party: transaction.details,
                        amount_inr: transaction.dr_cr == 'Dr' ? -1 * parseFloat(transaction.amount) : parseFloat(transaction.amount),
                        occuredAt: new Date(transaction.date)
                    }

                    var create = {
                        original_currency: 'INR',
                        createdBy: 'parsed_document',
                        type: 'income_expense',
                        account: results.findOrCreateAccount.id,
                        third_party: transaction.details,
                        amount_inr: transaction.dr_cr == 'Dr' ? -1 * parseFloat(transaction.amount) : parseFloat(transaction.amount),
                        original_amount: transaction.dr_cr == 'Dr' ? -1 * parseFloat(transaction.amount) : parseFloat(transaction.amount),
                        occuredAt: new Date(transaction.date)
                    }
                    Transaction.findOrCreate(find, create).exec(ecb)
                }, cb)
            }]
        }, function (err, results) {
            if (err)
                return res.status(500).json({ status: 'error' });
            res.json({ status: 'success' });
        })
    }

};

