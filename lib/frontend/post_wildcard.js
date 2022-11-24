'use strict';

module.exports.register = (app, options, logger) => {
    app.post(['/', '/*'], (request, response) => {
        let body = request.body;

        logger.info("DataEndpointReference received", {payload: body || {}});

        let id = request.body.id;
        let endpoint = request.body.endpoint;

        if (!!!id || !!!endpoint) {
            return response.status(400).end();
        }

        try {
            new URL(endpoint);
        } catch (e) {
            logger.error(e);
            return response.status(400).end();
        }

        app.dataEndpointReferences.push(body);
        return response.status(200).end();
    });
}
