'use strict';

const fs = require("fs");
const {join} = require("path");

module.exports.register = function (app, options) {
    const dataDir = options['data-dir'];

    app.get(['/', '/*'], (request, response) => {
        const path = join(dataDir, request.path);

        response.format({
            json: () => {
                if (!fs.existsSync(path)) {
                    response.status(404);
                    return response.end();
                }

                if (!fs.statSync(path).isDirectory()) {
                    response.status(409);
                    return response.end();
                }
                const files = fs.readdirSync(path);

                response.status(200);
                response.json(files)
                return response.end();
            },
            default: () => {
                if (!fs.existsSync(path)) {
                    response.status(404);
                    return response.end();
                }

                response.status(200)
                response.end(Buffer.from(fs.readFileSync(path)));
                return response.end();
            }
        })
    });
}