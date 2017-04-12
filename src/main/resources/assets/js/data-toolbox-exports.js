function createExportsRoute() {
    const breadcrumbsLayout = new RcdMaterialBreadcrumbsLayout().init().
        addBreadcrumb(new RcdMaterialBreadcrumb('Data Toolbox', () => RcdHistoryRouter.setState()).init()).
        addBreadcrumb(new RcdMaterialBreadcrumb('Exports').init());

    const tableCard = new RcdMaterialTableCard('Exports').init().
        addColumn('Export name').
        addColumn('Timestamp').
        addIconArea(new RcdGoogleMaterialIconArea('delete', deleteExports).init(), {min: 1}).
        addIconArea(new RcdGoogleMaterialIconArea('file_download', dowloadExports).init(), {min: 1}).
        addIconArea(new RcdGoogleMaterialIconArea('file_upload', uploadExports).init(), {max: 0});
    const layout = new RcdMaterialLayout().init().
        addChild(tableCard);

    return {
        state: 'exports',
        name: 'Exports',
        iconArea: new RcdGoogleMaterialIconArea('import_export').init(),
        callback: (main) => {
            main.addChild(breadcrumbsLayout).addChild(layout);
            retrieveExports();
        }
    };

    function retrieveExports() {
        const infoDialog = showInfoDialog('Retrieving export list...');
        return $.ajax({
            url: config.servicesUrl + '/export-list'
        }).done(function (result) {
            tableCard.deleteRows();
            if (handleResultError(result)) {
                result.success.sort((export1, export2) => export2.timestamp - export1.timestamp).
                    forEach((anExport) => {
                        tableCard.createRow().
                            addCell(anExport.name).
                            addCell(toLocalDateTimeFormat(new Date(anExport.timestamp))).
                            setAttribute('export', anExport.name);
                    });
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    function deleteExports() {
        showConfirmationDialog("Delete selected exports?", doDeleteExports);
    }

    function doDeleteExports() {
        const infoDialog = showInfoDialog("Deleting selected exports...");
        const exportNames = tableCard.getSelectedRows().map((row) => row.attributes['export']);
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-delete',
            data: JSON.stringify({exportNames: exportNames}),
            contentType: 'application/json; charset=utf-8'
        }).done(handleResultError).fail(handleAjaxError).always(() => {
            infoDialog.close();
            retrieveExports();
        });
    }

    function dowloadExports() {
        const exportNames = tableCard.getSelectedRows().map((row) => row.attributes['export']);
        const exportNamesInput = new RcdInputElement().init().
            setAttribute('type', 'hidden').
            setAttribute('name', 'exportNames').
            setAttribute('value', exportNames);
        const downloadForm = new RcdFormElement().init().
            setAttribute('action', config.servicesUrl + '/export-download').
            setAttribute('method', 'post').
            addChild(exportNamesInput);
        document.body.appendChild(downloadForm.getDomElement());
        downloadForm.submit();
        document.body.removeChild(downloadForm.getDomElement());
    }

    var uploadForm;

    function uploadExports() {
        const uploadFileInput = new RcdInputElement().init().
            setAttribute('type', 'file').
            setAttribute('name', 'uploadFile').
            addChangeListener(doUploadExports);
        uploadForm = new RcdFormElement().init().
            addChild(uploadFileInput);
        uploadFileInput.click();
    }

    function doUploadExports() {
        const infoDialog = showInfoDialog("Uploading export archive...");
        const formData = new FormData(uploadForm.getDomElement());
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-upload',
            data: formData,
            contentType: false,
            processData: false
        }).done(handleResultError).fail(handleAjaxError).always(() => {
            infoDialog.close();
            retrieveExports();
        });
    }
}
