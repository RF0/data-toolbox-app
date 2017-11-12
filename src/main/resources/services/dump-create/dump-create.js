var taskLib = require('/lib/xp/task');

exports.post = function (req) {
    var bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdDumpScriptBean');
    var body = JSON.parse(req.body);
    var dumpName = body.dumpName;

    var taskId = taskLib.submit({
        description: 'Dump creation',
        task: function () {
            taskLib.progress({info: 'Creating dump...'});
            taskLib.progress({info: bean.create(dumpName)});
        }
    });

    return {
        contentType: 'application/json',
        body: {taskId: taskId}
    }
};