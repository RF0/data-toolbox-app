class FieldDialog extends RcdMaterialModalDialog {

    constructor(params) {
        super(params.action + ' field', params.text, true, true);
        this.action = params.action;
        this.callback = params.callback;
        let options = ['BinaryReference', 'Boolean', 'DateTime', 'Double', 'GeoPoint', 'Link', 'LocalDate', 'LocalDateTime', 'LocalTime',
            'Long', 'PropertySet', 'Reference', 'String', 'Xml'];
        if (params.action === 'Edit') {
            options.splice(options.indexOf('PropertySet'), 1);
        }
        this.nameField = params.action == 'Create' && new RcdMaterialTextField('Name', 'Name').init();
        this.typeField = new RcdMaterialDropdown('Type', options)
            .init()
            .selectOption(params.field && params.field.type || 'String');
        this.valueField = new RcdMaterialTextField('Value', 'Value').init()
            .setValue(params.field && params.field.value || '');
    }

    init() {
        const closeCallback = () => this.close();
        const confirmationCallback = (source, event) => {
            this.close();
            if (this.action == 'Create') {
                this.callback(this.nameField.getValue(), this.typeField.getSelectedValue(), this.valueField.getValue());
            } else {
                this.callback(this.typeField.getSelectedValue(), this.valueField.getValue());
            }
            event.stopPropagation();
        };
        return super.init()
            .addAction('CANCEL', closeCallback)
            .addAction(this.action, confirmationCallback)
            .addKeyUpListener('Enter', confirmationCallback)
            .addKeyUpListener('Escape', closeCallback)
            .addItem(this.nameField)
            .addItem(this.typeField)
            .addItem(this.valueField);
    }

    open(parent) {
        super.open(parent);
        if (this.nameField) {
            this.nameField.focus().select();
        } else {
            this.valueField.focus().select();
        }
        return this;
    }
}

class FieldsRoute extends DtbRoute {
    constructor() {
        super({
            state: 'fields'
        });
    }

    onDisplay() {
        this.refreshBreadcrumbs();
        this.retrieveFields();
    }

    createLayout() {
        const createFieldIconArea = new RcdGoogleMaterialIconArea('add_circle', () => this.createField()).init()
            .setTooltip('Create field');

        this.tableCard = new RcdMaterialTableCard('Fields').init()
            .addClass('dtb-table-card-fields')
            .addColumn('Name', {classes: ['non-mobile-cell']})
            .addColumn('Index', {classes: ['non-mobile-cell', 'index']})
            .addColumn('Name[Idx]', {classes: ['mobile-cell']})
            .addColumn('Value', {classes: ['non-mobile-cell']})
            .addColumn('Type', {classes: ['non-mobile-cell', 'type']})
            .addColumn('Type: Value', {classes: ['mobile-cell']})
            .addColumn(null, {icon: true})
            .addIconArea(createFieldIconArea);

        return new RcdMaterialLayout().init().addChild(this.tableCard);
    }

    retrieveFields() {
        const infoDialog = showShortInfoDialog('Retrieving fields...');
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/fields-list',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                path: getPathParameter(),
                field: getFieldParameter(),
                start: getStartParameter(),
                count: getCountParameter()
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => this.onFieldsRetrieval(result)).fail(handleAjaxError).always(() => {
            infoDialog.close();
        });
    }

    onFieldsRetrieval(result) {
        this.tableCard.deleteRows();

        const headerRow = this.tableCard.createRow({selectable: false}).addCell('..', {classes: ['non-mobile-cell']}).addCell('',
            {classes: ['non-mobile-cell']}).addCell('..', {classes: ['mobile-cell']}).addCell('', {classes: ['non-mobile-cell']}).addCell(
            '', {classes: ['non-mobile-cell']}).addCell('', {classes: ['mobile-cell']}).addCell('', {icon: true}).addClass('rcd-clickable');

        if (getFieldParameter()) {
            headerRow.addClickListener(() => setState('fields',
                {repo: getRepoParameter(), branch: getBranchParameter(), path: getPathParameter(), field: this.getParentField()}));
        } else {
            headerRow.addClickListener(
                () => setState('nodes', {repo: getRepoParameter(), branch: getBranchParameter(), path: this.getParentPath()}));
        }

        if (handleResultError(result)) {
            const fields = result.success.hits;

            fields.forEach(field => {

                let editFieldIconArea = null;
                if (field.type !== 'PropertySet') {
                    const editFieldCallback = () => this.editField(field);
                    editFieldIconArea = new RcdGoogleMaterialIconArea('edit', (source, event) => {
                        editFieldCallback();
                        event.stopPropagation();
                    })
                        .init()
                        .setTooltip('Edit field');
                }

                const row = this.tableCard.createRow({selectable: false})
                    .addCell(field.name, {classes: ['non-mobile-cell']})
                    .addCell(field.index, {classes: ['non-mobile-cell']})
                    .addCell(field.name + '[' + field.index + ']', {classes: ['mobile-cell']})
                    .addCell(field.value, {classes: ['non-mobile-cell']})
                    .addCell(field.type, {classes: ['non-mobile-cell']})
                    .addCell(field.type + ': ' + field.value, {classes: ['mobile-cell']})
                    .addCell(editFieldIconArea, {icon: true});

                if (field.type === 'PropertySet') {
                    row.addClass('rcd-clickable').addClickListener(() => setState('fields', {
                        repo: getRepoParameter(),
                        branch: getBranchParameter(),
                        path: getPathParameter(),
                        field: (getFieldParameter() ? getFieldParameter() + '.' + field.name : field.name) + '[' + field.index + ']'
                    }))
                }
            });

            const startInt = parseInt(getStartParameter());
            const countInt = parseInt(getCountParameter());
            const previousCallback = () => setState('fields', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter(),
                field: getFieldParameter(),
                start: Math.max(0, startInt - countInt),
                count: getCountParameter()
            });
            const nextCallback = () => setState('fields', {
                repo: getRepoParameter(),
                branch: getBranchParameter(),
                path: getPathParameter(),
                field: getFieldParameter(),
                start: startInt + countInt,
                count: getCountParameter()
            });
            this.tableCard.setFooter({
                start: parseInt(getStartParameter()),
                count: fields.length,
                total: result.success.total,
                previousCallback: previousCallback,
                nextCallback: nextCallback
            });
        }
    }

    editField(field) {
        new FieldDialog({
            action: 'Edit',
            field: field,
            callback: (type, value) => this.doEditField(field, type, value)
        }).init().open();
    }

    doEditField(field, type, newValue) {
        const infoDialog = showShortInfoDialog('Updating field...');
        const fieldParameter = (getFieldParameter() ? getFieldParameter() + '.' : '') + field.name +
                               (field.index ? '[' + field.index + ']' : '');
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/field-update',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                path: getPathParameter(),
                field: fieldParameter,
                value: newValue,
                type: type
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleResultError(result) && displaySnackbar('Field updated')).fail(handleAjaxError).always(() => {
            infoDialog.close();
            RcdHistoryRouter.refresh();
        });
    }

    createField() {
        new FieldDialog({
            action: 'Create',
            callback: (name, type, value) => this.doCreateField(name, type, value)
        }).init().open();
    }

    doCreateField(name, type, value) {
        const infoDialog = showShortInfoDialog('Creating field...');
        return $.ajax({
            method: 'POST',
            url: config.servicesUrl + '/field-create',
            data: JSON.stringify({
                repositoryName: getRepoParameter(),
                branchName: getBranchParameter(),
                path: getPathParameter(),
                parentPath: getFieldParameter(),
                name: name,
                type: type,
                value: value
            }),
            contentType: 'application/json; charset=utf-8'
        }).done((result) => handleResultError(result) && displaySnackbar('Field created')).fail(handleAjaxError).always(() => {
            infoDialog.close();
            RcdHistoryRouter.refresh();
        });
    }

    refreshBreadcrumbs() {
        const repositoryName = getRepoParameter();
        const branchName = getBranchParameter();
        const path = getPathParameter();
        const field = getFieldParameter();

        this.breadcrumbsLayout.setBreadcrumbs([new RcdMaterialBreadcrumb('Data Toolbox', () => setState()).init(),
            new RcdMaterialBreadcrumb('Data Tree', () => setState('repositories')).init(),
            new RcdMaterialBreadcrumb(repositoryName, () => setState('branches', {repo: repositoryName})).init(),
            new RcdMaterialBreadcrumb(branchName, () => setState('nodes', {repo: repositoryName, branch: branchName})).init()]);

        if (path === '/') {
            this.breadcrumbsLayout.addBreadcrumb(new RcdMaterialBreadcrumb('root!data',
                field ? () => setState('fields', {repo: repositoryName, branch: branchName, path: path}) : undefined).init());
        } else {
            this.breadcrumbsLayout.addBreadcrumb(
                new RcdMaterialBreadcrumb('root', () => setState('nodes', {repo: repositoryName, branch: branchName, path: '/'})).init());
        }

        if (path === '/') {
            app.setTitle('Root node data');
        } else {
            const pathElements = path.substring(1).split('/');
            app.setTitle(pathElements[pathElements.length - 1] + ' data');

            let currentPath = '';
            pathElements.forEach((subPathElement, index, array) => {
                currentPath += '/' + subPathElement;
                const constCurrentPath = currentPath;

                if (index < array.length - 1) {
                    this.breadcrumbsLayout.addBreadcrumb(new RcdMaterialBreadcrumb(subPathElement,
                        () => setState('nodes', {repo: repositoryName, branch: branchName, path: constCurrentPath})).init());
                } else {
                    this.breadcrumbsLayout.addBreadcrumb(new RcdMaterialBreadcrumb(subPathElement + '!data',
                        field ? () => setState('fields', {repo: repositoryName, branch: branchName, path: path}) : undefined).init());
                }
            });
        }

        if (field) {
            const fieldElements = field.split('.');
            let currentField = '';
            fieldElements.forEach((subFieldElement, index, array) => {
                currentField += currentField ? '.' + subFieldElement : subFieldElement;
                const constCurrentField = currentField;
                const simplifiedSubFieldElement = subFieldElement.endsWith('[0]')
                    ? subFieldElement.substring(0, subFieldElement.length - 3)
                    : subFieldElement;

                if (index < array.length - 1) {
                    this.breadcrumbsLayout.addBreadcrumb(new RcdMaterialBreadcrumb(simplifiedSubFieldElement,
                        () => setState('fields', {repo: repositoryName, branch: branchName, path: path, field: constCurrentField})).init(),
                        ' . ');
                } else {
                    this.breadcrumbsLayout.addBreadcrumb(new RcdMaterialBreadcrumb(simplifiedSubFieldElement, undefined).init(), ' . ');
                }
            });
        }

    }

    displayHelp() {
        const viewDefinition = 'The view represents node data fields in a tree structure. Modification of fields will be provided in an ulterior version.';
        new HelpDialog('Data', [viewDefinition]).init().open();
    }
}
