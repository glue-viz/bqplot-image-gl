"use strict";

var version = require('./version').version;

Object.defineProperty(exports, "__esModule", { value: true });
const Interaction_1 = require("bqplot");
const base_1 = require("@jupyter-widgets/base");
const d3 = require("d3");
const d3_drag_1 = require("d3-drag");
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
        ['click', 'dblclick'].forEach(eventName => {
            eventElement.on(eventName, () => {
                const e = d3GetEvent();
                // to be consistent with drag events, we need to user clientPoint
                const [x, y] = d3_selection_1.clientPoint(eventElement.node(), e);
                this._emit(eventName, { x, y });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW91c2VJbnRlcmFjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Nb3VzZUludGVyYWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0NBQTRDO0FBQzVDLGdEQUFtRTtBQUNuRSxxQ0FBK0I7QUFDL0IsK0NBQTJDO0FBQzNDLE1BQU0sVUFBVSxHQUFHLGNBQVcsT0FBTyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsS0FBSyxDQUFBLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvRSx1Q0FBeUM7QUFFekMsTUFBYSxxQkFBc0IsU0FBUSxrQkFBVztJQUNsRCxRQUFRO1FBQ0oseUJBQVcsa0JBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQ3ZDLFdBQVcsRUFBRSx1QkFBdUIsRUFDcEMsVUFBVSxFQUFFLGtCQUFrQixFQUM5QixhQUFhLEVBQUUsUUFBUSxFQUN2QixZQUFZLEVBQUUsUUFBUSxFQUN0QixxQkFBcUIsRUFBRSxzQkFBWSxFQUNuQyxvQkFBb0IsRUFBRSxzQkFBWSxFQUNsQyxPQUFPLEVBQUUsSUFBSSxFQUNiLE9BQU8sRUFBRSxJQUFJLEVBQ2IsTUFBTSxFQUFFLE1BQU0sSUFDaEI7SUFDTixDQUFDOztBQUVNLGlDQUFXLHFCQUNYLGtCQUFXLENBQUMsV0FBVyxJQUMxQixPQUFPLEVBQUUsRUFBRSxXQUFXLEVBQUUsb0JBQWEsRUFBRSxFQUN2QyxPQUFPLEVBQUUsRUFBRSxXQUFXLEVBQUUsb0JBQWEsRUFBRSxJQUMxQztBQW5CTCxzREFvQkM7QUFFRCxNQUFhLGdCQUFpQixTQUFRLHlCQUFXO0lBRzdDLEtBQUssQ0FBQyxNQUFNO1FBQ1IsMEJBQTBCO1FBQzFCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDL0IsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxp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
