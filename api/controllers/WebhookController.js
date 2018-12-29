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
            createStatementLineItems:['findDocument', 'findOrCreateAccount', function(results,cb){
                console.log('statement line items will be created here\n\n\n\n');
                // Line items will only be created if they dont already exist. 
                var pos=0;
                var acc_no = results.findOrCreateAccount.acc_number;
                var acc_id = results.findOrCreateAccount.id;
                async.eachLimit(req.body.transactions,1,function(t,next){
                    t.acc_no=acc_no;
                    t.acc_id = acc_id;
                    // var sli_t=CashflowyService.transformSLIToTransactionFormat(sli);
                    var statement_line_item={
                        extracted_data:t,
                        document:results.findDocument.id,
                        pos:pos,
                        user:results.findDocument.user // this is sort of reduntant
                    }
                    // statement_line_item.data=_.cloneDeep(t);
                    // statement_line_item.data.acc_no=acc_no;
                    var find={
                        document:results.findDocument.id,
                        pos:pos
                    }
                    pos++;
                    Statement_line_item.findOrCreate(find, statement_line_item).exec(next);
                },function(err){
                    cb(err);
                });
            }]
        }, function (err, results) {
            if (err){
                console.log('doc parser webhook error: ', err);
                return res.status(500).json({ status: 'error', error: err.message });}
            res.json({ status: 'success' });
        })
    },
    // this is the new doc parser - needs clean up - written by Alex
    docparser2: function (req, res) {
        console.log(req.body);
        if (req.query.secret != sails.config.docparser_webhook_secret)
            return res.status(403).json({ status: 'failure', error: 'athorization failed' });
        // req.body.remote_id?req.body.remote_id:1;
        // req.body.remote_id=1;
        async.auto({
            findDocument: function (cb) {
                Document.findOne({ id: parseInt(req.body.remote_id) }).exec(cb);
            },
            updateDocument: function (cb) {
                // cb(null);
                Document.update({ id: parseInt(req.body.remote_id) }, { parsed_data: req.body }).exec(cb);
            },
            // check if the document entered is duplicate of something else
            createStatementLineItems:['findDocument',function(results,cb){
                console.log('statement line items will be created here\n\n\n\n');
                // Line items will only be created if they dont already exist. 
                var pos=0;
                var acc_no=_.find(req.body.accounts,{acc_type:'Savings'}).acc_no;
                // var acc_no=req.body.accounts[0].acc_no;
                async.eachLimit(req.body.transactions,1,function(t,next){
                    t.acc_no=acc_no;
                    // var sli_t=CashflowyService.transformSLIToTransactionFormat(sli);
                    var statement_line_item={
                        extracted_data:t,
                        document:results.findDocument.id,
                        pos:pos,
                        user:results.findDocument.user // this is sort of reduntant
                    }
                    // statement_line_item.data=_.cloneDeep(t);
                    // statement_line_item.data.acc_no=acc_no;
                    var find={
                        document:results.findDocument.id,
                        pos:pos
                    }
                    console.log('-----');
                    console.log(statement_line_item);
                    console.log(find);
                    pos++;
                    Statement_line_item.findOrCreate(find, statement_line_item).exec(next);
                },function(err){
                    cb(err);
                });
                // cb(null);
            }]
        }, function (err, results) {
            if (err){
                console.log('\n\n\nError');
                console.log(err);
                return res.status(500).json({ status: 'error' });
            }
            // console.log(results);
            res.json({ status: 'success' });
        })
        // res.send('ok');

    }

};

