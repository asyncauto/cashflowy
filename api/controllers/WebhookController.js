/**
 * WebhookController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var async = require('async')
var Bull = require( 'bull' );
// create our job queue
var queue = new Bull('queue',{redis:sails.config.bull.redis});

module.exports = {

    // this is the new doc parser - needs clean up - written by Alex
    docparser: function (req, res) {


        // console.log(req.body);
        if (req.query.secret != sails.config.docparser.webhook_secret)
            return res.status(403).json({ status: 'failure', error: 'athorization failed' });

        var transformExtractedDataFromDocument=function(extacted_data,filter){
            //before modify common formator
            var data = sails.config.docparser.beforeModifyParsedData(extacted_data);

            //specific formator
            if(filter.modifyParsedData)
                data =  filter.modifyParsedData(data);

            // after modify common formator
            data = sails.config.docparser.beforeModifyParsedData(data);

            return data;
        }
        var extracted_data =  req.body;
        var data;
        var filter;
        
        async.auto({
            findDocument: function (cb) {
                // req.body.remote_id = 5;
                Document.findOne({ id: parseInt(req.body.remote_id) }).exec(function(err, doc){
                    if(err) return cb(err);
                    if(!doc) return cb(new Error('document not found'));
                    filter = _.find(sails.config.docparser.filters,{docparser_id: doc.parser_used});
                    data=transformExtractedDataFromDocument(extracted_data,filter);
                    return cb(null, doc);
                });
            },
            findAccounts: ['findDocument', function(results, cb){
                var accounts = [];
                async.forEach(data.acc_numbers, function(ac, cb){
                    // check for last 4 digits.
                    Account.findOrCreate({acc_number: {endsWith: ac.substr(-4)}, org: results.findDocument.org},
                        {acc_number: ac, org: results.findDocument.org, name: 'Auto Generated: '+ ac, type: "bank"}).exec(function(e, a){
                            if(e) return cb(e);
                            accounts.push(a);
                            return cb(null);
                        })
                }, function(err){
                    cb(err, accounts);
                })
            }],
            updateDocument: ['findAccounts' ,function (results,cb) {
                Document.update({ id: parseInt(req.body.remote_id) }, 
                { 
                    extracted_data: extracted_data, 
                    data: data,
                    type:filter.type, 
                    accounts: _.map(results.findAccounts, 'id')}).exec(cb);
            }],
            // check if the document entered is duplicate of something else
            createStatementLineItems:['updateDocument',function(results,cb){
                console.log('statement line items will be created here\n\n\n\n');
                // Line items will only be created if they dont already exist. 
                var pos=0;
               
                async.eachLimit(data.transactions,1,function(t,next){
                    t.acc_no= data.acc_number;
                    var statement_line_item={
                        extracted_data: extracted_data.transactions[pos],
                        data: data.transactions[pos],
                        document:results.findDocument.id,
                        pos:pos,
                        details:{
                            parser_used:results.findDocument.parser_used,
                            type:_.find(sails.config.docparser.filters,{docparser_id:results.findDocument.parser_used}).type,
                        },
                        org:results.findDocument.org // this is sort of reduntant
                    }

                    var find={
                        document:results.findDocument.id,
                        pos:pos
                    }

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

    },

    mailgunInboudParser: function(req, res){
        // console.log(req.body);
        if (req.query.secret != sails.config.mailgun.webhook_secret)
            return res.status(403).json({ status: 'failure', error: 'athorization failed' });
        
        queue.add('parse_inbound_mail', req.body).then(function(){        
            res.ok();
		}).catch(function(err){
            if(err) return res.status(500).json({error: err.message});
        });
    }

};

