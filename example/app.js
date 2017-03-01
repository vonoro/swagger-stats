'use strict';

var http = require('http');
var path = require('path');
var log4js = require('log4js');

log4js.configure({
    "appenders": [
        {
            "type": "console"
        },
        {
            "type": "dateFile",
            "filename": "./examplelog",
            "pattern": "-yyyyMMdd-hh.log",
            "alwaysIncludePattern": true
        }
    ],
    "levels": {
        "swagger-stats-example": "DEBUG",
        "swagger-stats": "DEBUG"
    }
});
var logger = log4js.getLogger('swagger-stats-example');

// Express and middlewares
var express = require('express');
var expressBodyParser = require('body-parser');
var expressFavicon = require('serve-favicon');
var expressStatic = require('serve-static');

var swaggerJSDoc = require('swagger-jsdoc');

var swStats = require('../lib');    // require('swagger-stats');

// Mockup API implementation
var API = require('./api')

var app = module.exports = express();
app.use(expressFavicon(path.join(__dirname, '../ui/favicon.png')));
app.use('/ui',expressStatic(path.join(__dirname, '../ui')));
app.use('/node_modules',expressStatic(path.join(__dirname, '../node_modules')));

// all environments
app.set('port', process.env.PORT || 3030);

// Suppress cache on the GET API responses
app.disable('etag');

// SWAGGER-JSDOC Initialization //
var swOptions = {
    swaggerDefinition: {
        "info": {
            "title": "Swagger Stats Test API",
            "version": "1.0.0"
        }
    },
    apis: ['./api.js']  // Path to the API files with swagger docs in comments
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
var swaggerSpec = swaggerJSDoc(swOptions);

// Track statistics on API request / responses
app.use(swStats());

app.get('/', function(req,res) {
    res.redirect('/ui');
});

app.get('/apidoc.json', function(req,res){
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Connect API Router
app.use('/api', API);

// Setup server
var server = http.createServer(app);
server.listen(app.get('port'));
logger.info('Server started on port ' + app.get('port') + ' http://localhost:'+app.get('port'));

process.on('SIGTERM', function(){
    logger.info('Service shutting down gracefully');
    process.exit();
});

if (process.platform === 'win32') {
    require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    }).on('SIGINT', function () {
        process.emit('SIGINT');
    });
}

process.on('SIGINT', function () {
    process.exit();
});
