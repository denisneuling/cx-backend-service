'use strict';

const fs = require("fs");
const {join} = require("path");

module.exports.register = function (app, options) {
    const dataDir = options['data-dir'];

    app.delete(['/', '/*'], (request, response) => {
        const path = join(dataDir, request.path);

        if (!fs.existsSync(path)) {
            response.status(404);
            return response.end();
        }

        let stat = fs.statSync(path);
        if (stat.isDirectory()) {
            fs.rmdirSync(path, {recursive: true, force: true});
        } else {
            fs.rmSync(path);
        }

        response.status(200);
        return response.end();
    });
}