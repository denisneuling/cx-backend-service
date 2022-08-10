'use strict';

const expressWinston = require("express-winston");

module.exports.register = (app, options, logger) => {
    app.use(expressWinston.logger({
        winstonInstance: logger, meta: true, expressFormat: true, colorize: false
    }));

    app.use((err, req, res, next) => {
        logger.error(err)
        res.status(500).send({error: err})
    });
}