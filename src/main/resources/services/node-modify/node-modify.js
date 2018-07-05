var nodeLib = require('/lib/xp/node');
var escapeLib = require('/lib/escape');
var exceptionLib = require('/lib/exception');

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var repositoryName = body.repositoryName;
    var branchName = body.branchName;
    var key = body.key;
    var json = body.json;

    var result = exceptionLib.runSafely(modifyNode, [repositoryName, branchName, key, json], 'Error while modifying node');
    return {
        contentType: 'application/json',
        body: result
    };
};

function modifyNode(repositoryName, branchName, key, json) {
    var repoConnection = nodeLib.connect({
        repoId: repositoryName,
        branch: branchName
    });

    var result = repoConnection.modify({
        key: key,
        editor: function(c){
            c = json;
            return c;
        }
    });

    var escapedResult = escapeLib.escapeHtml(result);

    return {
        success: escapedResult
    };
}