class NodesRoute extends DtbRoute {
    constructor() {
        super({
            state: 'nodes'
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.retrieveNodes();
    }
    
    createLayout() {
        const exportIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/export-icon.svg', () => this.exportNode()).init().
            setTooltip('Export selected node');
        const importIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/import-icon.svg', () => this.importNode()).init().
            setTooltip('Import node export');
        const moveIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/rename.svg', () => this.moveNode()).init().
            setTooltip('Move/rename node');
        const filterIconArea = new RcdGoogleMaterialIconArea('filter_list', () => this.filterNodes()).init().
            setTooltip('Filter nodes');
        const sortIconArea = new RcdGoogleMaterialIconArea('sort', () => this.sortNodes()).init().
            setTooltip('Sort nodes');
        const deleteIconArea = new RcdGoogleMaterialIconArea('delete', () => this.deleteNodes()).init().
            setTooltip('Delete selected nodes', RcdMaterialTooltipAlignment.RIGHT);
        this.tableCard = new RcdMaterialTableCard('Nodes').init().
            addColumn('Node name').
            addColumn('Node ID', {classes: ['non-mobile-cell']}).
            addColumn('', {icon: true, classes: ['non-mobile-cell']}).
            addColumn('', {icon: true, classes: ['non-mobile-cell']}).
            addColumn('', {icon: true, classes: ['non-mobile-cell']}).
            addColumn('', {icon: true, classes: ['non-mobile-cell']}).
            addColumn('', {icon: true, classes: ['mobile-cell']}).
            addIconArea(exportIconArea, {min: 1, max: 1}).
            addIconArea(importIconArea, {max: 0}).
            addIconArea(moveIconArea, {min: 1}).
            addIconArea(filterIconArea, {max: 0}).
            addIconArea(sortIconArea, {max: 0}).
            addIconArea(deleteIconArea, {min: 1});

        return new RcdMaterialLayout().init().
            addChild(this.tableCard);
    }

    retrieveNodes() {
        const infoDialog = showShortInfoDialog('Retrieving node list...');
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-getchildren',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                parentPath: getPathParameter(),
                start: getStartParameter(),
                count: getCountParameter(),
                filter: getFilterParameter(),
                sort: getSortParameter()
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => this.onNodesRetrieval(result)).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    onNodesRetrieval(result) {
        this.tableCard.deleteRows();

        this.tableCard.createRow({selectable:false}).
            addCell('..').
            addCell('', {classes: ['non-mobile-cell']}).
            addCell(null, {icon: true, classes: ['non-mobile-cell']}).
            addCell(null, {icon: true, classes: ['non-mobile-cell']}).
            addCell(null, {icon: true, classes: ['non-mobile-cell']}).
            addCell(null, {icon: true, classes: ['non-mobile-cell']}).
            addCell(null, {icon: true, classes: ['mobile-cell']}).
            addClass('rcd-clickable').
            addClickListener(() => {
                if (getPathParameter()) {
                    setState('nodes', {repo:getRepoParameter(), branch: getBranchParameter(), path: getPathParameter() === '/' ? null : this.getParentPath()});
                } else {
                    setState('branches', {repo:getRepoParameter()});
                }
            });

        if (handleResultError(result)) {
            result.success.hits.forEach((node) => {
                
                const displayMetaDataCallback = () => setState('system-properties',{repo: getRepoParameter(), branch: getBranchParameter(), path: node._path});
                const displayPropertiesCallback = () => setState('properties',{repo: getRepoParameter(), branch: getBranchParameter(), path: node._path});
                const displayPermissionsCallback = () => setState('permissions',{repo: getRepoParameter(), branch: getBranchParameter(), path: node._path});
                const editJsonCallback = () => this.editJson(node._id);
                
                const displayMetaDataIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/meta.svg', (source, event) => {displayMetaDataCallback();event.stopPropagation();}).init().setTooltip('Display system properties');
                const displayPropertiesIconArea = new RcdImageIconArea(config.assetsUrl + '/icons/properties.svg', (source, event) => {displayPropertiesCallback();event.stopPropagation();}).init().setTooltip('Display properties');
                const displayPermissionsIconArea = new RcdGoogleMaterialIconArea('lock', (source, event) => {displayPermissionsCallback();event.stopPropagation();}).init().setTooltip('Display permissions');
                const editJsonArea = new RcdImageIconArea(config.assetsUrl + '/icons/json.svg', (source, event) => {editJsonCallback();event.stopPropagation();}).init().setTooltip('Edit JSON');
                
                const moreIconAreaItems =  [{text:'Display system properties', callback: displayMetaDataCallback}, 
                    {text:'Display properties', callback: displayPropertiesCallback}, 
                    {text:'Display permissions', callback: displayPermissionsCallback},
                    {text:'Edit JSON', callback: editJsonCallback}];
                const moreIconArea = new RcdGoogleMaterialIconArea('more_vert', (source, event) => {
                    RcdMaterialMenuHelper.displayMenu(source, moreIconAreaItems, 250)
                    event.stopPropagation();
                }).init().setTooltip('Display...');

                const row = this.tableCard.createRow().
                    addCell(node._name).
                    addCell(node._id, {classes: ['non-mobile-cell']}).
                    addCell(displayMetaDataIconArea, {icon: true, classes: ['non-mobile-cell']}).
                    addCell(displayPropertiesIconArea, {icon: true, classes: ['non-mobile-cell']}).
                    addCell(displayPermissionsIconArea, {icon: true, classes: ['non-mobile-cell']}).
                    addCell(editJsonArea, {icon: true, classes: ['non-mobile-cell']}).
                    addCell(moreIconArea, {icon: true, classes: ['mobile-cell']}).
                    setAttribute('id', node._id).
                    setAttribute('path', node._path).
                    setAttribute('name', node._name).
                    addClass('rcd-clickable').
                    addClickListener(() => setState('nodes', {repo: getRepoParameter(), branch: getBranchParameter(), path: node._path}));
                row.checkbox.addClickListener((event) => event.stopPropagation());
            });

            const startInt = parseInt(getStartParameter());
            const countInt = parseInt(getCountParameter());
            const previousCallback = () => setState('nodes', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter(),
                start: Math.max(0, startInt - countInt),
                count: getCountParameter(),
                filter: getFilterParameter(),
                sort: getSortParameter()});
            const nextCallback = () => setState('nodes', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter(),
                start: startInt + countInt,
                count: getCountParameter(),
                filter: getFilterParameter(),
                sort: getSortParameter()});
            this.tableCard.setFooter({
                start: parseInt(getStartParameter()),
                count: result.success.hits.length,
                total: result.success.total,
                previousCallback: previousCallback,
                nextCallback: nextCallback
            });
        }
    }
    
    deleteNodes() {
        showConfirmationDialog("Delete selected nodes?", 'DELETE', () => this.doDeleteNodes());
    }

    doDeleteNodes() {
        const infoDialog = showLongInfoDialog("Deleting nodes...");
        const nodeKeys = this.tableCard.getSelectedRows().map((row) => row.attributes['id']);
        $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-delete',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                keys: nodeKeys
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Deleting nodes...',
            doneCallback: (success) => displaySnackbar(success + ' node' + (success > 1 ? 's': '') + ' deleted'),
            alwaysCallback: () => this.retrieveNodes()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    editJson(nodeKey) {
        if (!nodeKey) {
            nodeKey = this.tableCard.getSelectedRows().map((row) => row.attributes['id'])[0];
        }

        const infoDialog = showShortInfoDialog("Retrieving jsoneditor..." + nodeKey);
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-get',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                key: nodeKey
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => {
            if (handleResultError(result)) {
                var jsonEditor;
                showConfirmationDialog("View / Modify JSON", 'MODIFY', () => this.doModifyJson(nodeKey, jsonEditor)).
                addClass('jsoneditor-dialog');
                var container = document.querySelector(".jsoneditor-dialog .rcd-material-dialog-body");
                const options = {
                    mode: 'tree',
                    modes: ['code', 'form', 'text', 'tree', 'view'], // allowed modes
                    onError: function (err) {
                        alert(err.toString());
                    },
                    onModeChange: function (newMode, oldMode) {
                        //console.log('Mode switched from', oldMode, 'to', newMode);
                    },
                    onEditable: function (node) {
                        // node is an object like:
                        //   {
                        //     field: 'FIELD',
                        //     value: 'VALUE',
                        //     path: ['PATH', 'TO', 'NODE']
                        //   }
                        switch (node.field) {
                            case '_id':
                                return {
                                    field: false,
                                    value: false
                                };
                            case '_name':
                                return {
                                    field: false,
                                    value: false
                                };
                            case '_path':
                                return {
                                    field: false,
                                    value: false
                                };
                            case '_childOrder':
                                return {
                                    field: false,
                                    value: true
                                };
                            case '_indexConfig':
                                return {
                                    field: false
                                };
                            case '_inheritsPermissions':
                                return {
                                    field: false,
                                    value: true
                                };
                            case '_permissions':
                                return {
                                    field: false
                                };
                            case '_state':
                                return {
                                    field: false
                                };
                            case '_nodeType':
                                return {
                                    field: false
                                };
                            case '_versionKey':
                                return {
                                    field: false,
                                    value: false
                                };
                            case '_timestamp':
                                return {
                                    field: false
                                };
                            default:
                                return {
                                    field: true,
                                    value: true
                                };
                        }
                    }
                };
                jsonEditor = new JSONEditor(container, options);
                jsonEditor.set(result.success);
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });

    }

    doModifyJson(nodeKey, json) {
        console.log(json.get());
        var infoDialog;
        if (!nodeKey) {
            infoDialog = showShortInfoDialog("Error. Nodekey is undefined");
        }else{
            infoDialog = showLongInfoDialog("Modifying JSON...");
        }
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-modify',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                key: nodeKey,
                json: json.get()
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => {
            if (handleResultError(result)) {
                displaySnackbar('Node modified');
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    formatJson(value, tab) {
        if (typeof value === 'string') {
            return '<a class=json-string>"' + value + '"</a>';
        } else if (typeof value === "number") {
            return '<a class=json-number>' + value + '</a>';
        } else if (typeof value === "boolean") {
            return '<a class=json-boolean>' + value + '</a>';
        } else if (Array.isArray(value)) {
            let formattedArray = '[\n';
            for (let i = 0; i < value.length; i++) {
                const arrayElement = value[i];
                formattedArray += tab + '  ' + this.formatJson(arrayElement, tab + '  ') + (i < (value.length - 1) ? ',' : '') + '\n';
            }
            formattedArray += tab + ']';
            return formattedArray;
        } else if (typeof value === "object") {
            let formattedObject = '{\n';
            const attributeNames = Object.keys(value);
            for (let i = 0; i < attributeNames.length; i++) {
                const attributeName = attributeNames[i];
                formattedObject += tab + '  "' + attributeName + '": ' + this.formatJson(value[attributeName], tab + '  ') +
                                   (i < (attributeNames.length - 1) ? ',' : '') + '\n';
            }
            formattedObject += tab + '}';
            return formattedObject;
        } else {
            return value;
        }
    }

    moveNode() {
        const nodeCount = this.tableCard.getSelectedRows().map((row) => row.attributes['path']).length;
        const pathPrefix = this.getPathPrefix();
        const title = nodeCount == 1 ? 'Move/rename node' : 'Move nodes';
        const currentValue = nodeCount == 1 ? this.tableCard.getSelectedRows().map((row) => row.attributes['path'])[0] : pathPrefix;
        const currentActionLabel = nodeCount == 1 ? 'RENAME' : 'MOVE';
        const currentLabel = nodeCount == 1 ? 'New name/path/parent path' : 'New parent path';
        const inputDialog = new RcdMaterialInputDialog({
            title: title,
            confirmationLabel: currentActionLabel,
            label: currentLabel,
            placeholder: '',
            value: currentValue,
            callback: (value) => isValid(value) && this.doMoveNode(value)
        }).init();
        
        //TODO Implement clean solution. Adapt Framework
        inputDialog.addInputListener((source) => {
            const newValue = source.getValue();
            inputDialog.enable(isValid(newValue));
            if (nodeCount == 1) {
                const newActionLabel = isRename(newValue) ? 'RENAME' : 'MOVE';
                inputDialog.setConfirmationLabel(newActionLabel);
            }
        });
        
        function isValid(value) {
            if (!value) {
                return false;
            }
            if (nodeCount > 1 && value.slice(-1) !== '/') {
                return false;
            }
            return true;
        }
        
        function isRename(value) {
            if (!value) {
                return false;
            }
            if (value.startsWith(pathPrefix)){
                const subValue = value.substr(pathPrefix.length);
                return subValue.length > 0 && subValue.indexOf('/') === -1;
            }
            return false;
        }
        inputDialog.open();
    }
    
    doMoveNode(newNodePath) {
        const infoDialog = showLongInfoDialog("Moving nodes...");
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-move',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                sources: this.tableCard.getSelectedRows().map((row) => row.attributes['id']),
                target: newNodePath
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Moving nodes...',
            doneCallback: (success) =>  displaySnackbar('Node(s) moved'),
            alwaysCallback: () => RcdHistoryRouter.refresh()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    filterNodes() {
        showInputDialog({
            title: "Filter nodes",
            confirmationLabel: "FILTER",
            label: "Query expression",
            placeholder: '',
            value: decodeURIComponent(getFilterParameter()),
            callback: (value) => setState('nodes', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter(),
                start: 0,
                count: getCountParameter(),
                filter: encodeURIComponent(value),
                sort: getSortParameter()})
        });
    }

    sortNodes() {
        showInputDialog({
            title: "Sort nodes",
            confirmationLabel: "SORT",
            label: "Sort expression",
            placeholder: '',
            value: decodeURIComponent(getSortParameter()),
            callback: (value) => setState('nodes', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter(),
                start: 0,
                count: getCountParameter(),
                filter: getFilterParameter(),
                sort: encodeURIComponent(value)})
        });
    }

    exportNode() {
        const baseExportName = getPathParameter()
            ? (this.tableCard.getSelectedRows().map((row) => row.attributes['name'])[0] || 'export') + '-' + getBranchParameter()
            : getRepoParameter() + '-' + getBranchParameter();
        const defaultExportName = baseExportName + '-' + toLocalDateTimeFormat(new Date(), '-', '-');
        showInputDialog({
            title: "Export node",
            confirmationLabel: "EXPORT",
            label: "Export name",
            placeholder: defaultExportName,
            value: defaultExportName,
            callback: (value) => this.doExportNode(value || defaultExportName)
        });
    }

    doExportNode(exportName) {
        const infoDialog = showLongInfoDialog("Exporting nodes...");
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-export',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                nodePath: this.tableCard.getSelectedRows().map((row) => row.attributes['path'])[0],
                exportName: exportName
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Exporting nodes...',
            doneCallback: (success) =>  new ExportResultDialog(success).init().open(),
            alwaysCallback: () => setState('exports')
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    importNode() {
        const infoDialog = showShortInfoDialog("Retrieving node export list...");
        return $.ajax({
            url: config.servicesUrl + '/export-list'
        }).done((result) => {
            if (handleResultError(result)) {
                const exportNames = result.success.
                    sort((export1, export2) => export2.timestamp - export1.timestamp).
                    map((anExport) =>anExport.name);
                this.selectNodeExport(exportNames);
            }
        }).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    selectNodeExport(exportNames) {
        showSelectionDialog({
            title: "Select node export",
            confirmationLabel: "IMPORT",
            label: "Export name",
            options: exportNames,
            callback: (exportName) => this.doImportNode(exportName)
        });
    }

    doImportNode(exportName) {
        const infoDialog = showLongInfoDialog("Importing nodes...");
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/node-import',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                nodePath: getPathParameter() || '/',
                exportName: exportName
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleTaskCreation(result, {
            taskId: result.taskId,
            message: 'Importing nodes...',
            doneCallback: (success) =>  new ImportResultDialog([exportName], success).init().open(),
            alwaysCallback: () => RcdHistoryRouter.refresh()
        })).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    refreshBreadcrumbs() {
        const repositoryName = getRepoParameter();
        const branchName = getBranchParameter();
        const path = getPathParameter();

        this.breadcrumbsLayout.
            setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox', () => setState()).init(),
                new RcdMaterialBreadcrumb('Data Tree', () => setState('repositories')).init(),
                new RcdMaterialBreadcrumb(repositoryName, () => setState('branches', {repo: repositoryName})).init(),
                new RcdMaterialBreadcrumb(branchName, path && (() => setState('nodes',{repo: repositoryName, branch: branchName}))).init()]);

        if (path) {
            this.breadcrumbsLayout.addBreadcrumb(new RcdMaterialBreadcrumb('root', path === '/' ? undefined :
                                                                              () => setState('nodes', {repo: repositoryName, branch: branchName, path: '/'})).init());

            if (path === '/') {
                app.setTitle('Root node');
            } else {
                const pathElements = path.substring(1).split('/')
                app.setTitle(pathElements[pathElements.length - 1]);

                let currentPath = '';
                pathElements.forEach((subPathElement, index, array) => {
                    currentPath += '/' + subPathElement;
                    const constCurrentPath = currentPath;
                    this.breadcrumbsLayout.addBreadcrumb(new RcdMaterialBreadcrumb(subPathElement, index < array.length - 1
                        ? (() => setState('nodes', {repo: repositoryName, branch: branchName, path: constCurrentPath}))
                        : undefined).init());
                });
            }
        } else {
            app.setTitle(branchName);
        }
    }

    displayHelp() {
        const definition = 'A Node represents a single storable entity of data. ' +
                           'It can be compared to a row in sql or a document in document oriented storage models.<br/>' +
                           'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/developer/node-domain/nodes.html">Nodes</a> for more information. ';

        const structureDefinition = 'This tool represent nodes in a tree structure. ' +
                                    'While this solution is adapted to repositories like cms-repo or system-repo, ' +
                                    'it may be problematic for custom repositories or for nodes with too many children. ' +
                                    'Node search for all paths will be available in the future, but if this representation is blocking we recommend using the tool ' +
                                    '<a class="rcd-material-link" href="https://market.enonic.com/vendors/runar-myklebust/repoxplorer">repoXPlorer</a>.';

        const viewDefinition = 'The view lists in a table all the direct children nodes of the current node (or the root node for a branch). Click on a row to display its direct children.';
        new HelpDialog('Nodes', [definition, structureDefinition, viewDefinition]).
        init().
        addActionDefinition({
            iconSrc: config.assetsUrl + '/icons/export-icon.svg',
            definition: 'Export the selected node into $XP_HOME/data/export/[export-name]. The display will switch to the Exports view.'
        }).
        addActionDefinition({
            iconSrc: config.assetsUrl + '/icons/import-icon.svg',
            definition: 'Import previously exported nodes as children under the current node (or as root node)'
        }).
        addActionDefinition({
            iconSrc: config.assetsUrl + '/icons/rename.svg',
            definition: 'Move or rename node(s). If the value ends in slash \'/\', it specifies the parent path where to be moved. ' +
                        'Otherwise, it means the new desired path or name for the node (available only if one node is selected).'
        }).
        addActionDefinition({
            iconName: 'filter_list',
            definition: 'Filter the nodes based on a query expression. ' +
                        'Example: "_id = \'role:system.admin"\'. ' +
                        'See <a class="rcd-material-link" href="http://xp.readthedocs.io/en/6.10/reference/query-language.html#compareexpr">Query language</a> for more information.'
        }).
        addActionDefinition({
            iconName: 'sort',
            definition: 'Sort the nodes based on an expression. ' +
                        'The sorting expression is composed of a node property to sort on and the direction: ascending or descending.' +
                        'Examples: "_timestamp DESC", "_name ASC"'
        }).
        addActionDefinition({iconName: 'delete', definition: 'Delete the selected nodes.'}).
        addActionDefinition({iconSrc: config.assetsUrl + '/icons/meta.svg',definition: 'Display the node system properties.'}).
        addActionDefinition({iconSrc: config.assetsUrl + '/icons/properties.svg',definition: 'Display the node properties.'}).
        addActionDefinition({iconName: 'lock',definition: 'Display the node permissions.'}).
        addActionDefinition({iconSrc: config.assetsUrl + '/icons/json.svg',definition: 'Display the node as JSON.'}).
        open();
    }
}
