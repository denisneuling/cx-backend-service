'use strict';

module.exports.register = function (app) {

    app.get(['/:id'], (request, response) => {
        const id = request.params.id;

        const dataEndpointReferences = app.dataEndpointReferences;
        const dataEndpointReference = dataEndpointReferences.find((value) => value.id === id);

        if (dataEndpointReference === undefined) {
            response.status(404);
        } else {
            response.json(dataEndpointReference);
            response.status(200);
        }

        return response.end();
    });

    app.get(['/'], (request, response) => {
        const dataEndpointReferences = app.dataEndpointReferences;

        response.json(dataEndpointReferences);
        response.status(200);
        return response.end();
    });
}
