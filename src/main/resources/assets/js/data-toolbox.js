function createApp() {
    return new RcdMaterialSinglePageApplication('Data toolbox').
        init().
        setDefaultRoute(createPresentationRoute()).
        addRoute(createDumpsRoute()).
        addRoute(createExportsRoute()).
        addRoute(createSnapshotsRoute()).
        addRoute(createRepositoriesRoute()).
        addRoute(createBranchesRoute()).
        addRoute(createNodesRoute());
}

function handleResultError(result) {
    if (result.error) {
        new RcdMaterialSnackbar(result.error).init().open();
        return false;
    }
    return true;
}

function handleAjaxError(jqXHR) {
    if (jqXHR.status) {
        new RcdMaterialSnackbar('Error ' + jqXHR.status + ': ' + jqXHR.statusText).
            init().open();
    } else {
        new RcdMaterialSnackbar('Connection refused').
            init().open();
    }
}

function showInfoDialog(text) {
    return new RcdMaterialInfoDialog({text: text}).
        init().
        open();
}

function showConfirmationDialog(text, callback) {
    return new RcdMaterialConfirmationDialog({text: text, callback: callback}).
        init().
        open();
}

var app = createApp();
app.start(document.body);