"use strict";

var version = require('./version').version;

Object.defineProperty(exports, "__esModule", { value: true });
const Interaction_1 = require("bqplot");
const base_1 = require("@jupyter-widgets/base");
const d3 = require("d3");
const d3_drag_1 = require("d3-drag");
const _ = require("lodash");
const d3_selection_1 = require("d3-selection");
const d3GetEvent = function () { return require("d3-selection").event; }.bind(this);

class MouseInteractionModel extends base_1.WidgetModel {
    defaults() {
        return Object.assign({}, base_1.WidgetModel.prototype.defaults(), {
            _model_name: "MouseInteractionModel",
            _view_name: "MouseInteraction",
            _model_module: "bqplot-image-gl",
            _view_module: "bqplot-image-gl",
            _model_module_version: version,
            _view_module_version: version,
            scale_x: null,
            scale_y: null,
            scale_y: null,
            move_throttle: 50,
            cursor: 'auto' });
    }
}

MouseInteractionModel.serializers = Object.assign({}, base_1.WidgetModel.serializers, { x_scale: { deserialize: base_1.unpack_models }, y_scale: { deserialize: base_1.unpack_models } });
exports.MouseInteractionModel = MouseInteractionModel;
class MouseInteraction extends Interaction_1.Interaction {
    async render() {
        // events for dragging etc
        const eventElement = d3.select(this.d3el.node());
        super.render();
        this.x_scale = await this.create_child_view(this.model.get("x_scale"));
        this.y_scale = await this.create_child_view(this.model.get("y_scale"));
        this.parent.on("margin_updated", this.updateScaleRanges, this);
        this.updateScaleRanges();
        const updateCursor = () => {
            eventElement.node().style.cursor = this.model.get('cursor');
        };
        this.listenTo(this.model, "change:cursor", updateCursor);
        updateCursor();
        const updateThrottle = () => {
            this._emitThrottled = _.throttle(this._emit, this.model.get('move_throttle'));
        }
        updateThrottle();
        this.listenTo(this.model, 'change:move_throttle', updateThrottle);

        eventElement.call(d3_drag_1.drag().on("start", () => {
            const e = d3GetEvent();
            this._emit('dragstart', { x: e.x, y: e.y });
        }).on("drag", () => {
            const e = d3GetEvent();
            this._emit('dragmove', { x: e.x, y: e.y });
        }).on("end", () => {
            const e = d3GetEvent();
            this._emit('dragend', { x: e.x, y: e.y });
        }));
        // and click events
        ['click', 'dblclick', 'mouseenter', 'mouseleave'].forEach(eventName => {
            eventElement.on(eventName, () => {
                this._emitThrottled.flush();  // we don't want mousemove events to come after enter/leave
                const e = d3GetEvent();
                // to be consistent with drag events, we need to user clientPoint
                const [x, y] = d3_selection_1.clientPoint(eventElement.node(), e);
                this._emit(eventName, { x, y });
            });
        });
        // throttled events
        ['mousemove'].forEach(eventName => {
            eventElement.on(eventName, () => {
                const e = d3GetEvent();
                // to be consistent with drag events, we need to user clientPoint
                const [x, y] = d3_selection_1.clientPoint(eventElement.node(), e);
                this._emitThrottled(eventName, { x, y });
            });
        });
    }
    updateScaleRanges() {
        this.x_scale.set_range(this.parent.padded_range("x", this.x_scale.model));
        this.y_scale.set_range(this.parent.padded_range("y", this.y_scale.model));
    }
    remove() {
        super.remove();
        this.parent.off('margin_updated', this.updateScaleRanges);
    }
    _emit(name, { x, y }) {
        let domain = { x: this.x_scale.scale.invert(x), y: this.y_scale.scale.invert(y) };
        this.send({ event: name, pixel: { x, y }, domain: domain });
    }
}
exports.MouseInteraction = MouseInteraction;
