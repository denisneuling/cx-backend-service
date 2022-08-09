'use strict';

let winston = require('winston'),
    expressWinston = require('express-winston'),
    express = require('express'),
    serveIndex = require('serve-index'),
    bodyParser = require('body-parser'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    os = require("os"),
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: {},
        transports: [
            new winston.transports.Console()
        ],
    });

function BackendService(options) {
    options = options || {};

    this.apiPort = options['api-port'] || 8080;
    this.dataPort = options['data-port'] || 8081;
    this.address = options['address'] || '0.0.0.0';
    this.dataDir = options['data-dir'] || os.tmpdir();

    const apiApp = express();
    const dataApp = express();
    const index = serveIndex(this.dataDir, {'icons': true});

    const requestLogger = expressWinston.logger({
        winstonInstance: logger,
        meta: true, // optional: control whether you want to log the meta data about the request (default to true)
        expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
        colorize: false // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    });

    apiApp.use(requestLogger);
    dataApp.use(requestLogger);

    apiApp.use(bodyParser.json());
    apiApp.post(['/', '/*'], (request, response) => {
        let body = request.body;

        logger.info("DataEndpointReference received", {payload: body || {}});

        let id = request.body.id;
        let endpoint = request.body.endpoint;
        let authKey = request.body.authKey;
        let authCode = request.body.authCode;

        if (!!!id || !!!endpoint) {
            return response.status(400).end();
        }

        let url;
        try {
            url = new URL(endpoint);
        } catch (e) {
            logger.error(e);
            return response.status(400).end();
        }

        let port = url.port,
            protocol = (url.protocol || "http").replace(":", ""),
            host = url.hostname,
            path = url.pathname,
            query = url.search;

        const options = {
            hostname: host,
            port: !!!port ? (protocol.startsWith("https") ? 443 : 80) : port,
            path: `${path}${query}`,
            method: 'GET',
            headers: {
                "Accept": "*/*"
            }
        };

        if (authKey && authCode) {
            options.headers[authKey] = authCode;
        }

        const dataDir = this.dataDir;
        const downstreamRequest = (protocol === 'https' ? https : http).request(options, downstreamResponse => {
            logger.info("Downstream call", {statusCode: downstreamResponse.statusCode, ...options})

            response.status(downstreamResponse.statusCode);
            response.end();

            let chunkIndex = 0;
            downstreamResponse.on('data', chunk => {
                logger.info((chunkIndex <= 0 ? "Writing" : "Appending") + ` data chunk (` + Buffer.from(chunk).length + `b) from ${endpoint} to ${dataDir}/${id}`);
                if (chunkIndex <= 0 && fs.existsSync(`${dataDir}/${id}`)) {
                    fs.truncateSync(`${dataDir}/${id}`);
                }
                chunkIndex++;
                fs.appendFile(`${dataDir}/${id}`, chunk, err => {
                    if (err) throw err;
                });
            });
        });

        downstreamRequest.on('error', error => {
            logger.error(error);

            response.status(500);
            response.end();
        });

        downstreamRequest.end();
    });

    dataApp.use(['/', '/*'], express.static(this.dataDir), index);

    this.apiServer = http.createServer({}, apiApp);
    this.dataServer = http.createServer({}, dataApp);
}

BackendService.prototype.start = function () {
    if (!fs.existsSync(this.dataDir)) {
        logger.info(`Creating data directory ${this.dataDir}`);
        fs.mkdirSync(this.dataDir);
    }

    this.apiServer.listen(this.apiPort, () => {
        logger.info(`Data Plane Api adapter listening on port ${this.apiPort}`);
    });

    this.dataServer.listen(this.dataPort, () => {
        logger.info(`Serving data directory ${this.dataDir} on port ${this.dataPort}`);
    });
};

BackendService.prototype.stop = function () {
    this.apiServer.close();
    this.dataServer.close();
};

exports.BackendService = BackendService;

exports.createBackendService = (options) => {
    return new BackendService(options);
};