/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Only applies to HTTP requests (not WebSockets)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.http.html
 */

const Sentry = require('@sentry/node');

Sentry.init({ dsn: process.env.SENTRY_DNS });


module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Express middleware to use for every Sails request. To add custom          *
  * middleware to the mix, add a function to the middleware config object and *
  * add its key to the "order" array. The $custom key is reserved for         *
  * backwards-compatibility with Sails v0.9.x apps that use the               *
  * `customMiddleware` config option.                                         *
  *                                                                           *
  ****************************************************************************/
  trustProxy: true,

  middleware: {

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP request. (the Sails *
    * router is invoked by the "router" middleware below.)                     *
    *                                                                          *
    ***************************************************************************/

    passportInit: require('passport').initialize(),
    passportSession: require('passport').session(),
    
    sentryRequestHandler: Sentry.Handlers.requestHandler(),
    sentryerrorHandler: Sentry.Handlers.errorHandler(),
    order: [
      'sentryRequestHandler',
      'cookieParser',
      'session',
      'passportInit',
      'passportSession',
      'bodyParser',
      'myRequestLogger',
      'compress',
      'poweredBy',
      '$custom',
      'router',
      'www',
      'favicon',
      'sentryerrorHandler'
    ],

    /****************************************************************************
    *                                                                           *
    * Example custom middleware; logs each request to the console.              *
    *                                                                           *
    ****************************************************************************/
    myRequestLogger: require('sails-helper').requestLogger,


    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests. By    *
    * default,Sails uses [skipper](http://github.com/balderdashy/skipper). See *
    * https://github.com/expressjs/body-parser for other options. Note that    *
    * Sails uses an internal instance of Skipper by default; to override it    *
    * and specify more options, make sure to "npm install                      *
    * skipper@for-sails-0.12 --save" in your app first. You can also specify a *
    * different body parser or a custom function with req, res and next        *
    * parameters (just like any other middleware function).                    *
    *                                                                          *
    ***************************************************************************/


    // bodyParser: require('skipper')({strict: true})

  },


  /***************************************************************************
  *                                                                          *
  * The number of milliseconds to cache static assets in production.         *
  * These are any flat files like images, scripts, styleshseets, etc.        *
  * that are served by the static middleware.  By default, these files       *
  * are served from `.tmp/public`, a hidden folder compiled by Grunt.        *
  *                                                                          *
  ***************************************************************************/

  // cache: 31557600000
};
