"use strict";

var version = require('./version').version;

Object.defineProperty(exports, "__esModule", { value: true });
const base = require("@jupyter-widgets/base");

class ViewListenerModel extends base.DOMWidgetModel {
    defaults() {
        return Object.assign({}, base.DOMWidgetModel.prototype.defaults(), {
            _model_name: "ViewListenerModel",
            _view_name: "ViewListener",
            _model_module: "bqplot-image-gl",
            _view_module: "bqplot-image-gl",
            _model_module_version: version,
            _view_module_version: version,
            widget: null,
            css_selector: null,
            view_data: {},
        });
    }
    initialize(attributes, options) {
        super.initialize(attributes, options);
        this._cleanups = [];
        this.knownViews = new Set()
        const bind = (widgetModel) => {
            // similar to ipyevents we use the _view_count to track when the views are changing
            const viewCount = widgetModel.get('_view_count');
            if (! (typeof viewCount === "number")) {
                widgetModel.set('_view_count', Object.values(widgetModel.views).length)
            }
            this.listenTo(widgetModel, 'change:_view_count', this._updateViews)
            this._updateViews();
        }
        bind(this.get('widget'));
        window.lastViewListenerModel = this;
        window.addEventListener('focus', () => {
            this._updateAllViewData();
        });
    }
    async _getViews() {
        const widgetModel = this.get('widget');
        const views = await Promise.all(Object.values(widgetModel.views));
        return views;
    }
    async _updateViews() {
        // remove old listeners
        this._cleanups.forEach((c) => c());
        this._cleanups = [];

        const views = await this._getViews();
        await Promise.all(views.map((view) => view.displayed));
        await Promise.all(views.map((view) => view.layoutPromise));

        this.set('view_data', {}) // clear data
        const selector = this.get('css_selector');
        // initial fill
        this._updateAllViewData();

        // listen to element for resize events
        views.forEach((view) => {
            const resizeObserver = new ResizeObserver(entries => {
                this._updateViewData(view, true);
            });
            let el = view.el;
            el = selector ? el.querySelector(selector) : el;
            if(el) {
                resizeObserver.observe(el);
                const cleanup = () => resizeObserver.disconnect();
                this._cleanups.push(cleanup)
            } else {
                console.error('could not find element with css selector', selector);
            }
        })
    }
    async _updateViewData(view, resized=false, focused=false) {
        const selector = this.get('css_selector');
        let el = view.el;
        el = selector ? el.querySelector(selector) : el;
        if(el) {
            const {x, y, width, height} = el.getBoundingClientRect();
            const previousData = this.get('view_data');
            let resized_at = previousData[view.cid]?.resized_at;
            let focused_at = previousData[view.cid]?.focused_at;
            const currentDateTimeJSISO = (new Date()).toISOString();
            // Javascripts toISOString and Python's datetime.fromisoformat implement different parts of
            // the ISO 8601 standard, so we replace Z (indicating Zulu time) with +00:00 to make it compatible with python
            const currentDateTime = currentDateTimeJSISO.replace('Z', '+00:00');

            resized_at = (resized || resized_at === undefined) ? currentDateTime : resized_at;
            focused_at = (focused || focused_at === undefined) ? currentDateTime : focused_at;
            this.send({
                event: 'set_view_data',
                id: view.cid,
                data: { x, y, width, height, resized_at, focused_at },
            })
        } else {
            console.error('could not find element with css selector', selector);
        }
    }
    async _updateAllViewData() {
        const views = await this._getViews();
        const currentViews = new Set();
        views.forEach((view) => {
            currentViews.add(view.cid);
            this.knownViews.add(view.cid);
            this._updateViewData(view, true, true);
        });
        const removeViews = [...this.knownViews].filter((cid) => !currentViews.has(cid));
        removeViews.forEach((cid) => {
            this.send({
                event: 'remove_view_data',
                id: cid,
            });
            this.knownViews.delete(cid);
        });
    }
}

ViewListenerModel.serializers = Object.assign({}, base.DOMWidgetModel.serializers, { widget: { deserialize: base.unpack_models } });
exports.ViewListenerModel = ViewListenerModel;

class ViewListener extends base.DOMWidgetView {
    async render() {
        const result = await super.render();
        this.renderJSON()
        this.model.on('change:view_data', this.renderJSON, this);
        window.lastViewListenerView = this;
        return result;
    }

    renderJSON() {
        const json = JSON.stringify(this.model.get('view_data'), null, 4);
        const viewCount = this.model.get('widget').get('_view_count');
        this.el.innerHTML = `viewcount: ${viewCount}: <br> <pre>${json}</pre>`
    }
}
exports.ViewListener = ViewListener;
