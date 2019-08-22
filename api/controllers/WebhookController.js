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
var moment = require('moment-timezone');

module.exports = {

    // this is the new doc parser - needs clean up - written by Alex
    docparser: function (req, res) {


        // console.log(req.body);
        if (req.query.secret != sails.config.docparser.webhook_secret)
            return res.status(403).json({ status: 'failure', error: 'athorization failed' });

        if(!req.body.remote_id)
            return res.status(404).json({status: 'failure',  error: 'remote_id not found'});

        //format for remote id production_1 or development_1 
        var remote_id = parseInt(req.body.remote_id.split('_')[1]);

        var transformExtractedDataFromStatement=function(extacted_data,filter){
            //before modify common formator
            var data = sails.config.docparser.beforeModifyParsedData(extacted_data);

            //specific formator
            if(filter.modifyParsedData)
                data =  filter.modifyParsedData(data);

            // after modify common formator
            data = sails.config.docparser.afterModifyParsedData(data);

            return data;
        }
        var extracted_data =  req.body;
        var data;
        var filter;
        
        async.auto({
            findStatement: function (cb) {
                // remote_id = 1;
                Statement.findOne({ id: remote_id }).exec(function(err, doc){
                    if(err) return cb(err);
                    if(!doc) return cb(new Error('statement not found'));
                    filter = _.find(sails.config.docparser.filters,{docparser_id: doc.parser_used});
                    data=transformExtractedDataFromStatement(extracted_data,filter);
                    return cb(null, doc);
                });
            },
            findAccounts: ['findStatement', function(results, cb){
                var accounts = [];
                async.forEach(data.acc_numbers, function(ac, cb){
                    // check for last 4 digits.
                    Account.findOrCreate({acc_number: {endsWith: ac.substr(-4)}, org: results.findStatement.org},
                        {acc_number: ac, org: results.findStatement.org, name: 'Auto Generated: '+ ac, type: "bank"}).exec(function(e, a){
                            if(e) return cb(e);
                            accounts.push(a);
                            // set the primary account id 
                            if(data.acc_number.substr(-4) == ac.substr(-4))
                                data.acc_id = a.id;
                            return cb(null);
                        })
                }, function(err){
                    cb(err, accounts);
                })
            }],
            updateStatement: ['findAccounts' ,function (results,cb) {
                Statement.update({ id: remote_id }, 
                { 
                    extracted_data: extracted_data, 
                    data: data,
                    type:filter.type, 
                    accounts: _.map(results.findAccounts, 'id')}).exec(cb);
            }],
            // check if the statement entered is duplicate of something else
            createStatementLineItems:['updateStatement',function(results,cb){
                console.log('statement line items will be created here\n\n\n\n');
                // Line items will only be created if they dont already exist. 
                var pos=0;
               
                async.eachLimit(data.transactions,1,function(t,next){
                    t.acc_no= data.acc_number;
                    var statement_line_item={
                        extracted_data: extracted_data.transactions[pos],
                        data: data.transactions[pos],
                        statement:results.findStatement.id,
                        pos:pos,
                        details:{
                            parser_used:results.findStatement.parser_used,
                            type:_.find(sails.config.docparser.filters,{docparser_id:results.findStatement.parser_used}).type,
                        },
                        org:results.findStatement.org // this is sort of reduntant
                    }

                    var find={
                        statement:results.findStatement.id,
                        pos:pos
                    }

                    pos++;
                    Statement_line_item.findOrCreate(find, statement_line_item).exec(next);
                },function(err){
                    cb(err);
                });
                // cb(null);
            }],
            createSnapshots: ['updateStatement', function(results, cb){
                async.eachOfLimit(data.transactions, 1, function(t, index, cb){
                    var next_data = _.get(data.transactions, `${[index+1]}.date`, null);
                    if(t.balance && t.date != next_data){
                        var ss={
                            account:data.acc_id,
                            createdBy:'parsed_statement',
                            balance: t.balance,
                            takenAt: moment(t.date, 'YYYY-MM-DD').tz('Asia/Kolkata').endOf('day').toISOString()
                        }
                        Snapshot.findOrCreate(ss, ss).exec(function(err, s, created){
                            cb(err, s);
                        });
                    }else{
                        cb();
                    }
                });
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

