var AWS = require('aws-sdk');
var machinelearning = new AWS.MachineLearning({
    accessKeyId: sails.config.aws.key,
    secretAccessKey: sails.config.aws.secret,
    region: sails.config.aws.region
});

var async = require('async');

module.exports = {
    predictCategory: function (transaction, cb) {
        async.auto({
            getAccount: function (cb) {
                Account.findOne(transaction.account).exec(cb);
            },
            createPredictionPayload: ['getAccount', function (results, cb) {
                var payload = {
                    // createdBy: transaction.createdBy,
                    // description: transaction.description,
                    // account: transaction.account ? transaction.account.toString() : '',
                    // to_account: transaction.to_account ? transaction.to_account.toString() : '',
                    third_party: transaction.third_party,
                }
                // payload = _.pick(payload, _.identity);
                cb(null, payload)
            }],
            getPrediction: ['createPredictionPayload', function (results, cb) {
                var params = {
                    MLModelId: sails.config.aws.category_model_id, /* required */
                    PredictEndpoint: sails.config.aws.prediction_endpoint, /* required */
                    Record: results.createPredictionPayload
                };
                machinelearning.predict(params, function (err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        return cb(err);
                    } // an error occurred
                    else return cb(null, data);           // successful response
                });
            }],
            findOrCreateCategory: ['getPrediction', function (results, cb) {
                var category_name = results.getPrediction.Prediction.predictedLabel
                Category.findOrCreate({ name: category_name, user: results.getAccount.user }, {
                    user: results.getAccount.user, name: category_name, budget: 1000,
                    description: 'created by category prediction, update per your usecase'
                }).exec(cb);
            }],
            addCategoryToTransaction: ['findOrCreateCategory', function (results, cb) {
                Transaction.update(transaction.id, { category: results.findOrCreateCategory.id }).exec(cb);
            }],
            addPredictionTag: ['findOrCreateCategory', function (results, cb) {
                Tag.findOrCreate({ name: 'predicted_category', user: results.getAccount.user },
                    { name: 'predicted_category', user: results.getAccount.user }).exec(function (err, tag) {
                        tag.transactions.add(transaction.id)
                        tag.save(cb);
                    })
            }]
        }, cb);
    }
}