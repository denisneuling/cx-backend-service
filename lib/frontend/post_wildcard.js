'use strict';

const https = require("https");
const http = require("http");
const fs = require("fs");
const os = require("os");
const {join} = require("path");

module.exports.register = (app, options, logger) => {
    const dataDir = options['data-dir'];

    app.post(['/', '/*'], (request, response) => {
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
            followAllRedirects: true,
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

        const downstreamRequest = (protocol === 'https' ? https : http).request(options, downstreamResponse => {
            logger.info("Downstream call", {statusCode: downstreamResponse.statusCode, options: options, response: downstreamResponse})

            response.status(downstreamResponse.statusCode === 200 ? 200 : 503);
            response.end();

            let chunkIndex = 0;
            downstreamResponse.on('data', chunk => {
                const downloadPath = join(dataDir, id);
                logger.info((chunkIndex <= 0 ? "Writing" : "Appending") + ` data chunk (` + Buffer.from(chunk).length + `b) from ${endpoint} to ${downloadPath}`);
                if (chunkIndex <= 0 && fs.existsSync(`${downloadPath}`)) {
                    if (fs.statSync(downloadPath).isDirectory()) {
                        fs.rmdirSync(downloadPath);
                    }
                    fs.truncateSync(`${downloadPath}`);
                }
                chunkIndex++;
                fs.appendFile(`${downloadPath}`, chunk, err => {
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
}