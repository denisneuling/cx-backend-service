'use strict';

let winston = require('winston'),
    express = require('express'),
    http = require('http'),
    fs = require('fs'),
    os = require("os"),
    walker = require('node-walker'),
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: {},
        transports: [
            new winston.transports.Console()
        ],
    });

function BackendService(options = {}) {
    this.options = {};
    this.options['frontend-port'] = options['frontend-port'] || 8080;
    this.options['backend-port'] = options['backend-port'] || 8081;
    this.options['address'] = options['address'] || '0.0.0.0';
    this.options['data-dir'] = options['data-dir'] || os.tmpdir();

    const frontendApp = express();
    const backendApp = express();

    this.frontendServer = http.createServer({}, frontendApp);
    this.backendServer = http.createServer({}, backendApp);

    const registerRoutes = (app, path, callback = () => {
    }) => {
        walker(path, (err, filename, next) => {
            if (err) throw err;

            if (filename !== null) {
                require(filename).register(app, options, logger);
            }

            if (next) return next();

            callback();
        });
    }

    registerRoutes(frontendApp, __dirname + '/frontend');
    registerRoutes(backendApp, __dirname + '/backend');

    if (!fs.existsSync(this.options['data-dir'])) {
        logger.info(`Creating data directory ${this.options['data-dir']}`);
        fs.mkdirSync(this.options['data-dir']);
    }

    this.frontendServer.listen(this.options['frontend-port'], this.options.address, () => {
        logger.info(`Frontend api listening on http://${this.options.address}:${this.options['frontend-port']}`);
    });

    this.backendServer.listen(this.options['backend-port'], this.options.address, () => {
        logger.info(`Backend api listening on http://${this.options.address}:${this.options['backend-port']}`);
    });
}

module.exports.BackendService = BackendService;
module.exports.createBackendService = (options) => {
    return new BackendService(options);
};