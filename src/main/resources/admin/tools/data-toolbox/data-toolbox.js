exports.get = function (req) {
    return {
        body: '<html><head></head><body><h1>My first tool</h1></body></html>',
        contentType: 'text/html'
    };
};