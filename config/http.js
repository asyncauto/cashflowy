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

  middleware: {

  /***************************************************************************
  *                                                                          *
  * The order in which middleware should be run for HTTP request. (the Sails *
  * router is invoked by the "router" middleware below.)                     *
  *                                                                          *
  ***************************************************************************/

    passportInit    : require('passport').initialize(),
    passportSession : require('passport').session(),
    // sentryRequestHandler: Raven.requestHandler(),
    // sentryerrorHandler: Raven.errorHandler(),
    order: [
      'sentryRequestHandler',
      'startRequestTimer',
      'cookieParser',
      'session',
      'passportInit',     
      'passportSession',
      'myRequestLogger',
      'bodyParser',
      'handleBodyParserError',
      'compress',
      'methodOverride',
      'poweredBy',
      '$custom',
      'router',
      'www',
      'favicon',
      '404',
      // 'sentryerrorHandler',
      '500'
    ],

  /****************************************************************************
  *                                                                           *
  * Example custom middleware; logs each request to the console.              *
  *                                                                           *
  ****************************************************************************/

    myRequestLogger: function (req, res, next) {
      // to ignore - req.url starting with /styles,/js,/semantic,/favicon.ico,/health
      var patt = new RegExp("^\/(js|semantic|styles|favicon|health)");
      if(!patt.test(req.url)){
        // console.log("\n\n\n really?");
        // console.log(req.url);
        // console.log(patt.test(req.url));
        // console.log("Requested :: ", req.method, req.protocol, req.host, req.url);
        var log={
          app_env: process.env.NODE_ENV.substring(0,3),
          status: 'REQUESTED',
          req_method:req.method,
          req_url:req.url,
          req_body: req.body ? req.body : {},
          req_query: req.query ? req.query : {},
          req_protocol:req.protocol,
          req_host:req.host,
          req_ip: req.ip,
          
          // inside req.headers
          // req_headers_host:req.headers.host,
          // req_headers_connection:req.headers.connection,
          // req_headers_userAgent:req.headers["user-agent"],
          // req_headers_origin:req.headers.origin,
          // req_headers_accept:req.headers.accept,
          // req_headers_referer:req.headers.referer,
          // req_headers_acceptEncoding:req.headers["accept-encoding"],
          // req_headers_acceptLanguage:req.headers["accept-language"],
          // req_headers_cookie:req.headers.cookie,
          // req_headers_ifModifiedSince:req.headers["if-modified-since"],
          // req_headers_x_forwarded_for: req.headers["x-forwarded-for"],
          // req_headers_x_real_ip: req.headers["x-real-ip"],
          
          req_headers:req.headers,

          req_statusCode:req.statusCode,
          req_statusMessage:req.statusMessage,

          req_route_path: (req.route) ? req.route.path : null,
          
          // user info
          req_user_id: (req.user) ? req.user.id : null,
          req_user_username: (req.user) ? req.user.username : null,
          req_user_twitter: (req.user) ? req.user.twitter : null,
          req_sessionID:req.sessionID,
        };

        var start_time = new Date();
        sails.log.info(JSON.stringify(log));

        res.on('finish', function() {
          log.status='RESPONDED';
          log.res_status_code= res.statusCode.toString();
          log.res_time= (new Date())- start_time;
          sails.log.info(JSON.stringify(log));
        });
        //To handle the timeout scenarios
        res.on('close', function () {
          log.status='CLOSED';
          log.res_status_code= res.statusCode.toString();
          log.res_time= (new Date())- start_time;
          sails.log.info(JSON.stringify(log));
        });
      }
      return next();
    }


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
