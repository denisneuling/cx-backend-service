'use strict';

const fs = require("fs");
const {join, dirname} = require("path");

module.exports.register = (app, options) => {
    const dataDir = options['data-dir'];

    app.post(['/', '/*'], (request, response) => {
        const path = join(dataDir, request.path);

        if (fs.existsSync(path)) {
            if (fs.statSync(path).isDirectory()) {
                response.status(409);
                return response.end();
            }

            fs.truncateSync(path)
        }

        if (!fs.existsSync(dirname(path))) {
            fs.mkdirSync(path, {recursive: true});
        }

        request.pipe(fs.createWriteStream(path));

        response.status(201);
        return response.end();
    });
}