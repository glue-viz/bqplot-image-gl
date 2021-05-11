"use strict";

var version = require('./version').version;

Object.defineProperty(exports, "__esModule", { value: true });
const Interaction_1 = require("bqplot");
const base_1 = require("@jupyter-widgets/base");
const d3 = require("d3");
const d3_drag_1 = require("d3-drag");
const _ = require("lodash");
const d3_selection_1 = require("d3-selection");
const d3GetEvent = function () { return require("d3-selection").event || window.event; }.bind(this);

const clickEvents = ['click', 'dblclick', 'mouseenter', 'mouseleave', 'contextmenu'];
const keyEvents = ['keydown', 'keyup'];
const throttledEvents = ['mousemove'];
const dragEvents = ['start', 'drag', 'end'];

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
            cursor: 'auto',
            next: null,
            events: [],
        });
    }
}

MouseInteractionModel.serializers = Object.assign({}, base_1.WidgetModel.serializers, { x_scale: { deserialize: base_1.unpack_models }, y_scale: { deserialize: base_1.unpack_models }, next: { deserialize: base_1.unpack_models } });
exports.MouseInteractionModel = MouseInteractionModel;
class MouseInteraction extends Interaction_1.Interaction {
    async render() {
        super.render();
        this.eventElement = d3.select(this.parent.interaction.node());
        this.nextView = null;
        this.x_scale = await this.create_child_view(this.model.get("x_scale"));
        this.y_scale = await this.create_child_view(this.model.get("y_scale"));
        this.last_mouse_point = [-1, -1];
        this.parent.on("margin_updated", this.updateScaleRanges, this);
        this.updateScaleRanges();
        const updateCursor = () => {
            this.eventElement.node().style.cursor = this.model.get('cursor');
        };
        this.listenTo(this.model, "change:cursor", updateCursor);
        this.listenTo(this.model, "change:next", this.updateNextInteract);
        updateCursor();
        const updateThrottle = () => {
            this._emitThrottled = _.throttle(this._emit, this.model.get('move_throttle'));
        }
        updateThrottle();
        this.listenTo(this.model, 'change:move_throttle', updateThrottle);
        this.listenTo(this.model, 'change:events', () => {
            this.unbindEvents();
            this.bindEvents();
        });

        this.bindEvents();
        // no await for this async function, because otherwise we want for
        // this.displayed, which will never happen before render resolves
        this.updateNextInteract();
    }

    bindEvents() {
        const events = this.model.get("events");
        // we don't want to bind these events if we don't need them, because drag events
        // can call stop propagation
        if (this.eventEnabled("dragstart") || this.eventEnabled("dragmove") || this.eventEnabled("dragend")) {
            this.eventElement.call(d3_drag_1.drag().on(this._eventName("start"), () => {
                const e = d3GetEvent();
                this._emit('dragstart', { x: e.x, y: e.y });
            }).on(this._eventName("drag"), () => {
                const e = d3GetEvent();
                this._emit('dragmove', { x: e.x, y: e.y });
            }).on(this._eventName("end"), () => {
                const e = d3GetEvent();
                this._emit('dragend', { x: e.x, y: e.y });
            }));
        }
        // and click events
        clickEvents.forEach(eventName => {
            this.eventElement.on(this._eventName(eventName), () => {
                this._emitThrottled.flush();  // we don't want mousemove events to come after enter/leave
                if (eventName !== 'mouseleave') {
                    // to allow the div to get focus, but we will not allow it to be reachable by tab key
                    this.parent.el.setAttribute("tabindex", -1);
                    // we only get keyboard events if we have focus
                    this.parent.el.focus({ preventScroll: true });
                }
                if (eventName === 'mouseleave') {
                    // restore
                    this.parent.el.removeAttribute("tabindex");
                }
                const e = d3GetEvent();
                // to be consistent with drag events, we need to user clientPoint
                const [x, y] = d3_selection_1.clientPoint(this.eventElement.node(), e);
                const events = this.model.get("events");
                if (eventName == 'contextmenu' && this.eventEnabled('contextmenu')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                this._emit(eventName, { x, y }, {button: e.button, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey});
                return false
            });
        });
        keyEvents.forEach(eventName => {
            d3.select(this.parent.el).on(this._eventName(eventName), () => {
                this._emitThrottled.flush();  // we don't want mousemove events to come after enter/leave
                const e = d3GetEvent();
                // to be consistent with drag events, we need to user clientPoint
                // const [x, y] = d3_selection_1.clientPoint(eventElement.node(), e);
                const [x, y] = this.last_mouse_point;
                e.preventDefault();
                e.stopPropagation();
                this._emit(eventName, { x, y }, {code: e.code, charCode: e.charCode, key: e.key, keyCode: e.keyCode, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey});
                return false
            });
        });
        // throttled events
        throttledEvents.forEach(eventName => {
            this.eventElement.on(this._eventName(eventName), () => {
                const e = d3GetEvent();
                // to be consistent with drag events, we need to user clientPoint
                const [x, y] = d3_selection_1.clientPoint(this.eventElement.node(), e);
                this.last_mouse_point = [x, y];
                this._emitThrottled(eventName, { x, y });
            });
        });
    }

    _eventName(name) {
        // using namespaced event names (e.g. click.view123) to support multiple
        // listeners on the same DOM element (our parent interaction node)
        return `${name}.${this.cid}`
    }

    unbindEvents() {
        const off = (name) => this.eventElement.on(this._eventName(name), null);
        clickEvents.forEach(off);
        keyEvents.forEach(off);
        throttledEvents.forEach(off);
        dragEvents.forEach(off);
    }

    eventEnabled(eventName) {
        const events = this.model.get("events");
        return (events == null) || events.includes(eventName);
    }

    async updateNextInteract() {
        // this mimics Figure.set_iteraction
        // but we want the 'next' interaction to be added after we are added
        // to the DOM, so we don't steal all mouse events
        await this.displayed;
        const next = this.model.get('next')
        if(this.nextView) {
            this.nextView.remove();
        }
        if(!next) {
            return;
        }
        this.nextView = await this.parent.create_child_view(next);
        this.parent.interaction.node().appendChild(this.nextView.el);
        this.parent.displayed.then(() => {
            this.nextView.trigger("displayed");
        });
    }

    updateScaleRanges() {
        this.x_scale.set_range(this.parent.padded_range("x", this.x_scale.model));
        this.y_scale.set_range(this.parent.padded_range("y", this.y_scale.model));
    }
    remove() {
        super.remove();
        if(this.nextView) {
            this.nextView.remove();
        }
        this.unbindEvents();
        this.parent.off('margin_updated', this.updateScaleRanges);
        this.parent.el.removeAttribute("tabindex");
        this._emitThrottled.flush();
    }
    _emit(name, { x, y }, extra) {
        if(!this.eventEnabled(name)) {
            return;
        }
        let domain = { x: this.x_scale.scale.invert(x), y: this.y_scale.scale.invert(y) };
        this.send({ event: name, pixel: { x, y }, domain: domain, ...extra });
    }
}
exports.MouseInteraction = MouseInteraction;
