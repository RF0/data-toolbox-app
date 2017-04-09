(function () {
    //@widgetWorkAround@

    const exportsTable = new RcdMaterialTable().init();
    exportsTable.header.addCell('Export name');

    const createExportIcon = new RcdMaterialActionIcon('add_circle', createExport).init().setTooltip('Create export');
    const deleteExportsIcon = new RcdMaterialActionIcon('delete', deleteExports).init().setTooltip('Delete export').enable(false);
    const loadExportsIcon = new RcdMaterialActionIcon('refresh', loadExports).init().setTooltip('Load export').enable(false);
    const downloadExportsIcon = new RcdMaterialActionIcon('file_download', dowloadExports).init().setTooltip('Dowload export').enable(false);
    const uploadExportsIcon = new RcdMaterialActionIcon('file_upload', uploadExports).init().setTooltip('Upload export').enable(false);

    exportsTable.addSelectionListener(() => {
        const nbRowsSelected = exportsTable.getSelectedRows().length;
        createExportIcon.enable(nbRowsSelected == 0);
        deleteExportsIcon.enable(nbRowsSelected > 0);
        loadExportsIcon.enable(nbRowsSelected > 0);
        downloadExportsIcon.enable(nbRowsSelected > 0);
        uploadExportsIcon.enable(nbRowsSelected == 0);
    });

    const tableNoContent = new RcdMaterialTableNoContent('No export found').init();
    const card = new RcdMaterialCard('').
        init().
        addIcon(createExportIcon).
        addIcon(deleteExportsIcon).
        addIcon(loadExportsIcon).
        addIcon(downloadExportsIcon).
        addIcon(uploadExportsIcon).
        addContent(exportsTable).
        addChild(tableNoContent);


    var exportWidgetContainer;
    const interval = setInterval(() => {
        exportWidgetContainer = document.getElementById('exportWidgetContainer');
        if (exportWidgetContainer) {
            retrieveExports();
            card.setParent(exportWidgetContainer);
            clearInterval(interval);
        }
    }, 100);


    function retrieveExports() {
        const infoDialog = showInfoDialog("Retrieving exports...", exportWidgetContainer);
        return $.ajax({
            url: config.servicesUrl + '/export-list'
        }).done(function (result) {
            exportsTable.body.clear();
            if (handleResultError(result)) {
                tableNoContent.show(result.success.length == 0);
                result.success.
                    sort((export1, export2) => export2.timestamp - export1.timestamp).
                    forEach((anExport) => {
                        exportsTable.body.createRow().
                            addCell(anExport.name).
                            setAttribute('export', anExport.name);
                    });
            }
        }).fail(handleAjaxError).always(function () {
            hideDialog(infoDialog, exportWidgetContainer);
        });
    }

    function createExport() {
        const defaultExportName = config.contentName + '-' + toLocalDateTimeFormat(new Date(), '-', '-');
        showInputDialog({
            title: "Create export",
            ok: "CREATE",
            label: "Export name",
            placeholder: defaultExportName,
            value: defaultExportName,
            callback: (value) => doCreateExport(value || defaultExportName)
        });
    }

    function doCreateExport(exportName) {
        const infoDialog = showInfoDialog("Creating export...", exportWidgetContainer);
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-create',
            data: JSON.stringify({
                contentPath: config.contentPath,
                exportName: exportName
            }),
            contentType: 'application/json; charset=utf-8'
        }).done(handleResultError).fail(handleAjaxError).always(() => {
            hideDialog(infoDialog, exportWidgetContainer);
            retrieveExports();
        });
    }

    function loadExports() {
        const infoDialog = showInfoDialog("Loading export...", exportWidgetContainer);
        const exportNames = exportsTable.getSelectedRows().
            map((row) => row.attributes['export']);
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-load',
            data: JSON.stringify({
                contentPath: config.contentPath,
                exportNames: exportNames
            }),
            contentType: 'application/json; charset=utf-8'
        }).done(handleResultError).fail(handleAjaxError).always(() => {
            hideDialog(infoDialog, exportWidgetContainer);
            retrieveExports(exportWidgetContainer);
        });
    }

    function deleteExports() {
        showConfirmationDialog("Delete selected exports?", doDeleteExports);
    }

    function doDeleteExports() {
        const infoDialog = showInfoDialog("Deleting export...", exportWidgetContainer);
        const exportNames = exportsTable.getSelectedRows().
            map((row) => row.attributes['export']);
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-delete',
            data: JSON.stringify({exportNames: exportNames}),
            contentType: 'application/json; charset=utf-8'
        }).done(handleResultError).fail(handleAjaxError).always(() => {
            hideDialog(infoDialog, exportWidgetContainer);
            retrieveExports();
        });
    }

    function dowloadExports() {
        const exportNames = exportsTable.getSelectedRows().
            map((row) => row.attributes['export']);

        const exportNamesInput = new RcdInputElement().init().
            setAttribute('type', 'hidden').
            setAttribute('name', 'exportNames').
            setAttribute('value', exportNames);

        const downloadForm = new RcdFormElement().init().
            setAttribute('action', config.servicesUrl + '/export-download').
            setAttribute('method', 'post').
            addChild(exportNamesInput);

        exportWidgetContainer.appendChild(downloadForm.getDomElement());
        downloadForm.submit();
        exportWidgetContainer.removeChild(downloadForm.getDomElement());
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
        const infoDialog = showInfoDialog("Uploading export...", exportWidgetContainer);
        const formData = new FormData(uploadForm.getDomElement());
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/export-upload',
            data: formData,
            contentType: false,
            processData: false
        }).done(handleResultError).fail(handleAjaxError).always(function () {
            hideDialog(infoDialog, exportWidgetContainer);
            retrieveExports();
        });
    }

    function handleResultError(result) {
        if (result.error) {
            showSnackbar(result.error, exportWidgetContainer);
            return false;
        }
        return true;
    }

    function handleAjaxError(jqXHR) {
        if (jqXHR.status) {
            showSnackbar('Error ' + jqXHR.status + ': ' + jqXHR.statusText, exportWidgetContainer);
        } else {
            showSnackbar('Connection refused', exportWidgetContainer);
        }
    }
}());

