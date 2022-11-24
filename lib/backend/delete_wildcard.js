'use strict';

module.exports.register = function (app, options) {

    app.delete(['/:id'], (request, response) => {
        const id = request.params.id;

        app.dataEndpointReferences = app.dataEndpointReferences.filter(value => value.id !== id)
        response.status(200);

        return response.end();
    });
}
