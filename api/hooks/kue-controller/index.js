module.exports = function(sails) {
    var loader = require('sails-util-mvcsloader')(sails);
    console.log('\n\n\n\n==============buhuhaha==============');

    // Load policies under ./api/policies and config under ./config
    loader.configure();

    /*
        OR if you want to set a custom path :

        loader.configure({
            policies: __dirname + '/api/policies',// Path to your hook's policies
            config: __dirname + '/config'// Path to your hook's config
        });
     */

    return {
        initialize: function (next) {
            /*
                Load models under ./api/models
                Load controllers under ./api/controllers
                Load services under ./api/services
            */
           
            console.log('\n\n\n%%%%%%%%%%');
            console.log(__dirname);
            // loader.inject(function (err) {
            //     return next(err);
            // });

            
                // OR if you want to set a custom path :

                loader.inject({
                    controllers: __dirname + '/api/controllers', // Path to your hook's controllers
                    models: __dirname + '/api/models', // Path to your hook's models
                    services: __dirname + '/api/services' // Path to your hook's services
                }, function (err) {
                    return next(err);
                });
             
        }
    };
}