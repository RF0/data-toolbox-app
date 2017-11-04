function createApp() {
    return new RcdMaterialSinglePageApplication({title:'Data toolbox'}).
    init().
    setDefaultRoute(createPresentationRoute()).
    addRoute(new RepositoriesRoute().init()).
    addRoute(new BranchesRoute().init()).
    addRoute(new NodesRoute().init()).
    addRoute(new MetaRoute().init()).
    addRoute(new FieldsRoute().init()).
    addRoute(new PermissionsRoute().init()).
    addRoute(new SnapshotsRoute().init()).
    addRoute(new ExportsRoute().init()).
    addRoute(new DumpsRoute().init());
}

function handleResultError(result) {
    if (result.error) {
        console.log(result.error);
        new RcdMaterialSnackbar(result.error).init().open();
        return false;
    }
    return true;
}

function handleAjaxError(jqXHR, textStatus, errorThrown) {
    let errorMessage;
    if (jqXHR.status) {
        if (jqXHR.status === 200) {
            errorMessage = 'Error: ' + textStatus;
        } else {
            errorMessage = 'Error ' + jqXHR.status + ': ' + jqXHR.statusText;
        }
    } else {
        errorMessage = 'Connection refused';
    }
    console.log(errorMessage);
    if (errorThrown) {
        console.log(errorThrown);
    }
    new RcdMaterialSnackbar(errorMessage).
        init().open();
}

function retrieveTask(taskId, progressCallback, doneCallback, alwaysCallback) {
    const intervalId = setInterval(() => {
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/task-get',
            data: JSON.stringify({
                taskId: taskId
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => {
            if (handleResultError(result)) {
                const task = result.success;
                if (!task || task.state === 'FINISHED') {
                    clearInterval(intervalId);
                    doneCallback(task);
                    alwaysCallback();
                } else {
                    if (progressCallback) {
                        progressCallback(task);
                    }
                }
            } else {
                clearInterval(intervalId);
                alwaysCallback();
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            clearInterval(intervalId);
            handleAjaxError(jqXHR, textStatus, errorThrown);
            alwaysCallback();
        });
    }, 1000);
}

function showInfoDialog(text) {
    return new RcdMaterialInfoDialog({text: text}).
        init().
        open();
}

function showConfirmationDialog(text, confirmationLabel, callback) {
    return new RcdMaterialConfirmationDialog({text: text, confirmationLabel: confirmationLabel, callback: callback}).
        init().
        open();
}

function showInputDialog(params) {
    return new RcdMaterialInputDialog(params).
        init().
        open();
}

function showSelectionDialog(params) {
    return new RcdMaterialSelectionDialog(params).
        init().
        open();
}

function showDetailsDialog(title, text, callback) {
    return new RcdMaterialDetailsDialog({title: title, text: text, callback: callback}).
        init().
        open();
}

function setState(state,params) {
    RcdHistoryRouter.setState(state, params);
}

function getRepoParameter() {
    return RcdHistoryRouter.getParameters().repo;
}

function getBranchParameter() {
    return RcdHistoryRouter.getParameters().branch;
}

function getPathParameter() {
    return RcdHistoryRouter.getParameters().path;
}

function getStartParameter() {
    return RcdHistoryRouter.getParameters().start || '0';
}

function getCountParameter() {
    return RcdHistoryRouter.getParameters().count || '50';
}

function getFilterParameter() {
    return RcdHistoryRouter.getParameters().filter || '';
}

function getSortParameter() {
    return RcdHistoryRouter.getParameters().sort || '';
}

function getFieldParameter() {
    return RcdHistoryRouter.getParameters().field;
}

var app = createApp();
app.start(document.body);