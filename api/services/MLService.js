var AWS = require('aws-sdk');
var machinelearning = new AWS.MachineLearning({
    accessKeyId: sails.config.aws.key,
    secretAccessKey: sails.config.aws.secret,
    region: sails.config.aws.region
});

module.exports = {
    predictCategory: function (tc, cb) {
        async.auto({
            getAccount: function (cb) {
                Account.findOne(tc.account).exec(cb);
            },
            createPredictionPayload: ['getAccount', function (results, cb) {
                var payload = {
                    // createdBy: tc.createdBy,
                    // description: tc.description,
                    // account: tc.account ? tc.account.toString() : '',
                    // to_account: tc.to_account ? tc.to_account.toString() : '',
                    third_party: tc.third_party,
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
                // for initial trail, only categorize if category belongs to org
                var category_name = results.getPrediction.Prediction.predictedLabel
                Category.find({ name: category_name, org: results.getAccount.org }).exec(cb);
            }],
            addCategoryToTransactionCategory: ['findOrCreateCategory', function (results, cb) {
                if (!_.get(results, 'findOrCreateCategory[0]', null)) return cb(null);
                Transaction_category.update(tc.id, { category: results.findOrCreateCategory[0].id }).exec(cb);
            }],
            addPredictionTag: ['findOrCreateCategory', async function (results) {
                if (!_.get(results, 'findOrCreateCategory[0]', null)) return;
                var pc_tag = await Tag.findOrCreate({ name: 'predicted_category', type: 'global' }, { name: 'predicted_category', type: 'global' });
                return await Tag.addToCollection(pc_tag.id, 'tcs').members([tc.id]).tolerate('E_UNIQUE');
            }]
        }, cb);
    }
}