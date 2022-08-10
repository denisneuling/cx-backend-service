'use strict';

const fs = require("fs");
const {join} = require("path");

module.exports.register = (app, options) => {
    const dataDir = options['data-dir'];

    app.head(['/', '/*'], (request, response) => {
        const path = join(dataDir, request.path);

        response.status(fs.existsSync(path) ? 200 : 404);
        response.status(200);
    });
}