'use strict';

const fs = require("fs");
const {join, dirname} = require("path");

module.exports.register = (app, options) => {
    const dataDir = options['data-dir'];

    app.post(['/', '/*'], (request, response) => {
        const lastIndexOf = request.path.lastIndexOf('/');
        const requestPath = request.path.substring(0, lastIndexOf);
        const directory = join(dataDir, requestPath);
        const fileName = request.path.substring(lastIndexOf + 1);
        const filePath = directory.concat('/').concat(fileName);

        if (fs.existsSync(filePath)) {
            response.status(409);
            return response.end();
        }

        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, {recursive: true});
        }

        request.pipe(fs.createWriteStream(filePath));

        response.status(201);
        return response.end();
    });
}