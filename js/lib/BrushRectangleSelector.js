"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseXYSelector = __importStar(require("bqplot")).BaseXYSelector;
const d3 = require("d3");
const d3_drag_1 = require("d3-drag");
const d3Selection = require("d3-selection");
const { applyStyles } = require("./utils");
const d3GetEvent = function () { return require("d3-selection").event; }.bind(this);

class BrushRectangleSelector extends BaseXYSelector {
    constructor() {
        super(...arguments);
        // for testing purposes we need to keep track of this at the instance level
        this.brushStartPosition = { x: 0, y: 0 };
        this.moveStartPosition = { x: 0, y: 0 };
        this.reshapeStartAngle = 0;
        this.reshapeStartRadii = { rx: 0, ry: 0 };
        this.initialDrag = false;
    }
    async render() {
        super.render();

        const scale_creation_promise = this.create_scales();
        await Promise.all([this.mark_views_promise, scale_creation_promise]);
        this.create_listeners();
        // we need to create our copy of this d3 selection, since we got out own copy of d3
        const d3el = d3.select(this.d3el.node());
        d3el.attr('clip-path', "url(#" + this.parent.clip_id + ")")
        this.eventElement = d3el.append('rect')
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("pointer-events", "all")
            .style("cursor", "crosshair")
            .style("visibility", "hidden")
        ;
        d3el.attr("class", "selector brushintsel")
        this.point1 = d3el.append("circle")
        this.point2 = d3el.append("circle")
        this.brush = d3el.append('g')
            .style("visibility", "visible");

        this.d3rectangleHandle =  this.brush.append("rect");
        this.d3rectangle =    this.brush.append("rect");
        this.eventElement.call(d3_drag_1.drag().on("start", () => {
            const e = d3GetEvent();
            if (this.model.get('selected_x') == null || this.model.get('selected_y', null)) {
                this.initialDrag = true;
            }
            this._brushStart({ x: e.x, y: e.y });
        }).on("drag", () => {
            const e = d3GetEvent();
            this._brushDrag({ x: e.x, y: e.y });
        }).on("end", () => {
            const e = d3GetEvent();
            this._brushEnd({ x: e.x, y: e.y });
            this.initialDrag = false;
            this.updateBoundingHandles();
        }));
        // events for moving the existing rectangle
        this.brush.call(d3_drag_1.drag().on("start", () => {
            const e = d3GetEvent();
            this._moveStart({ x: e.x, y: e.y });
        }).on("drag", () => {
            const e = d3GetEvent();
            this._moveDrag({ x: e.x, y: e.y });
        }).on("end", () => {
            const e = d3GetEvent();
            this._moveEnd({ x: e.x, y: e.y });
        }));
        // events for reshaping the existing rectangle
        this.d3rectangleHandle.call(d3_drag_1.drag().on("start", () => {
            const e = d3GetEvent();
            this._reshapeStart({ x: e.x, y: e.y });
        }).on("drag", () => {
            const e = d3GetEvent();
            this._reshapeDrag({ x: e.x, y: e.y });
        }).on("end", () => {
            const e = d3GetEvent();
            this._reshapeEnd({ x: e.x, y: e.y });
        }));
        this.updateRectangle();
        this.syncSelectionToMarks();
        this.listenTo(this.model, 'change:selected_x change:selected_y change:color change:style change:border_style change:rotate', () => this.updateRectangle());
        this.listenTo(this.model, 'change:selected_x change:selected_y change:rotate', this.syncSelectionToMarks);
    }
    updateBoundingHandles() {
        const handleSize = 8;
        const color = this.model.get("color") || this.model.get("border_style").fill || "black"
        if (!this.boundingRect && this.model.get("show_handles") && !this.initialDrag) {
            this.handleConfigs = [
                { name: "top", offsetX: 0, offsetY: -1, cursor: "ns-resize" },
                { name: "right", offsetX: 1, offsetY: 0, cursor: "ew-resize" },
                { name: "bottom", offsetX: 0, offsetY: 1, cursor: "ns-resize" },
                { name: "left", offsetX: -1, offsetY: 0, cursor: "ew-resize" },
                { name: "top-left", offsetX: -1, offsetY: -1, cursor: "nwse-resize", type: "corner" },
                { name: "top-right", offsetX: 1, offsetY: -1, cursor: "nesw-resize", type: "corner" },
                { name: "bottom-right", offsetX: 1, offsetY: 1, cursor: "nwse-resize", type: "corner" },
                { name: "bottom-left", offsetX: -1, offsetY: 1, cursor: "nesw-resize", type: "corner" }
            ];
            this.boundingRect = this.brush.append("rect")
                .style("fill", "none")
                .style("pointer-events", "none")
                .style("stroke", color);
            const handleDrag = d3_drag_1.drag()
                .on("start", (handle) => {
                    const e = d3GetEvent();
                    if (handle.type === "corner") {
                        this.model.set("brushing", true);
                        this.reshapeStartAngle = null;
                    } else {
                        this._reshapeStart({x: e.x, y: e.y});
                    }
                }).on("drag", (handle) => {
                    const e = d3GetEvent();
                    if (handle.type === "corner") {
                        this._reshapeDragCornerHandle(e)
                    } else {
                        this._reshapeDrag({x: e.x, y: e.y});
                    }
                    this._reshapeDrag({x: e.x, y: e.y});
                }).on("end", (handle) => {
                    const e = d3GetEvent();
                    if (handle.type === "corner") {
                        this.model.set("brushing", false);
                        this.touch();
                    } else {
                        this._reshapeEnd({x: e.x, y: e.y});
                    }
                });
            this.handleGroup = this.brush.append("g");
            this.handleSelection = this.handleGroup.selectAll("rect")
                .data(this.handleConfigs, (handle) => handle.name)
                .enter()
                .append("rect")
                .attr("width", handleSize)
                .attr("height", handleSize)
                .style("fill", "#fff")
                .style("stroke", "black")
                .style("pointer-events", "all")
                .style("cursor", (handle) => handle.cursor)
                .call(handleDrag);
        }
        if (this.boundingRect) {
            const { px1, px2, py1, py2 } = this.calculatePixelCoordinates();
            let width = px2 - px1;
            let height = py1 - py2;
            this.boundingRect
                .attr("x", px1)
                .attr("y", py2)
                .attr("width", width)
                .attr("height", height)
                .style("stroke", color);
            const handlePositions = this.handleConfigs.map((handle) => ({
                ...handle,
                x: px1 + (handle.offsetX + 1) * width / 2,
                y: py2 + (handle.offsetY + 1) * height / 2,
            }));
            this.handleSelection = this.handleSelection
                .data(handlePositions, (handle) => handle.name)
                .attr("x", (handle) => handle.x - handleSize / 2)
                .attr("y", (handle) => handle.y - handleSize / 2)
            if (this.initialDrag) {
                this.handleGroup.attr("display", "none");
                this.boundingRect.attr("display", "none");
            } else {
                this.handleGroup.attr("display", "");
                this.boundingRect.attr("display", "");
            }
        }
    }
    update_xscale_domain() {
        super.update_xscale_domain();
        if(this.x_scale && this.y_scale && this.d3rectangle)
            this.updateRectangle();
    }
    update_yscale_domain() {
        super.update_yscale_domain();
        if(this.x_scale && this.y_scale && this.d3rectangle)
            this.updateRectangle();
    }
    relayout() {
        super.relayout();
        this.x_scale.set_range(this.parent.padded_range("x", this.x_scale.model));
        this.y_scale.set_range(this.parent.padded_range("y", this.y_scale.model));
        // Called when the figure margins are updated.
        this.eventElement
            .attr("width", this.parent.width -
                           this.parent.margin.left -
                           this.parent.margin.right)
            .attr("height", this.parent.height -
                            this.parent.margin.top -
                            this.parent.margin.bottom);
        this.updateRectangle()
    }
    remove() {
        super.remove()
        // detach the event listener for dragging, since they are attached to the parent
        const bg_events = d3.select(this.parent.bg_events.node())
        bg_events.on(".start .drag .end", null);
    }
    // these methods are not private, but are used for testing, they should not be used as a public API.
    _brushStart({ x, y }) {
        console.log('start', x, y);
        this.brushStartPosition = { x, y };
        this.model.set("brushing", true);
        this.touch();
    }
    _brushDrag({ x, y }) {
        this._brush({ x, y });
    }
    _brushEnd({ x, y }) {
        console.log('end', x, y);
        this._brush({ x, y });
        this.model.set("brushing", false);
        this.touch();
    }
    _brush({ x, y }) {
        const cx = this.brushStartPosition.x;
        const cy = this.brushStartPosition.y;
        
        if (cx == x && cy == y) {
            this.model.set('selected_x', null);
            this.model.set('selected_y', null);
            this.touch();
        }
        this.model.set(
            'selected_x',
            new Float32Array(
                [cx, x].map((pixel) => this.x_scale.scale.invert(pixel))));
        this.model.set(
            'selected_y',
            new Float32Array(
                [cy, y].map((pixel) => this.y_scale.scale.invert(pixel))));
        this.touch();
    }
    _moveStart({ x, y }) {
        this.moveStartPosition = { x, y };
        this.model.set("brushing", true);
        this.touch();
    }
    _moveDrag({ x, y }) {
        this._move({ dx: x - this.moveStartPosition.x, dy: y - this.moveStartPosition.y });
        this.moveStartPosition = { x, y };
    }
    _moveEnd({ x, y }) {
        this._move({ dx: x - this.moveStartPosition.x, dy: y - this.moveStartPosition.y });
        this.model.set("brushing", false);
        this.touch();
    }
    _move({ dx, dy }) {
        // move is in pixels, so we need to transform to the domain
        const { px1, px2, py1, py2 } = this.calculatePixelCoordinates();
        let selectedX = [px1, px2].map((pixel) => this.x_scale.scale.invert(pixel + dx));
        let selectedY = [py1, py2].map((pixel) => this.y_scale.scale.invert(pixel + dy));
        this.model.set('selected_x', new Float32Array(selectedX));
        this.model.set('selected_y', new Float32Array(selectedY));
        this.touch();
    }
    _reshapeStart({ x, y }) {
        const { cx, cy, rx, ry } = this.calculatePixelCoordinates();

        const relX = x - cx;
        const relY = y - cy;
        // otherwise, we deform the rectangle by 'dragging' the rectangle at the angle we grab it
        this.reshapeStartAngle = Math.atan2(rx * relY, ry * relX);
        this.reshapeStartRadii = { rx, ry };

        this.model.set("brushing", true);
        this.touch();
    }
    _reshapeDragCornerHandle({ x, y }) {
        const { cx, cy } = this.calculatePixelCoordinates();
        let halfWidth = Math.abs(cx-x);
        let halfHeight = Math.abs(cy-y);
        let selectedX = [cx - halfWidth, cx + halfWidth].map((pixel) => this.x_scale.scale.invert(pixel));
        let selectedY = [cy - halfHeight, cy + halfHeight].map((pixel) => this.y_scale.scale.invert(pixel));
        this.model.set('selected_x', new Float32Array(selectedX));
        this.model.set('selected_y', new Float32Array(selectedY));
        this.touch();
    }
    _reshapeDrag({ x, y }) {
        if (this.reshapeStartAngle == null) {
            return;
        }
        console.log('reshape drag', x, y, this.reshapeStartAngle);
        this._reshape({ x: x, y: y, angle: this.reshapeStartAngle });
    }
    _reshapeEnd({ x, y }) {
        this._reshape({ x: x, y: y, angle: this.reshapeStartAngle });
        this.model.set("brushing", false);
        this.touch();
    }
    _reshape({ x, y, angle }) {
        const { cx, cy } = this.calculatePixelCoordinates();
        // if we are within -45,+45 degrees within 0, 90, 180, 270, or 360 degrees
        // 'round' to that angle
        angle = (angle + Math.PI * 2) % (Math.PI * 2);
        for (let i = 0; i < 5; i++) {
            const angleTest = Math.PI * i / 2;
            const angle1 = angleTest - 45 * Math.PI / 180;
            const angle2 = angleTest + 45 * Math.PI / 180;

            if ((angle > angle1) && (angle < angle2)) {
                angle = angleTest;
            }
        }
        angle = (angle + Math.PI * 2) % (Math.PI * 2);
        const relX = (x - cx);
        const relY = (y - cy);
        /*
           Solve, for known t=angle
           relX = rx cos(t)
           relY = ry sin(t) (where t is called the eccentric anomaly or just 'angle)
        */
        let rx = relX / (Math.cos(angle));
        let ry = relY / (Math.sin(angle));
        // if we are at one of the 4 corners, we fix rx, ry
        if ((angle == Math.PI / 2) || (angle == Math.PI * 3 / 2)) {
            rx = this.reshapeStartRadii.rx;
        }
        if ((angle == 0) || (angle == Math.PI)) {
            ry = this.reshapeStartRadii.ry;
        }
        // // bounding box of the rectangle in pixel coordinates:
        const [px1, px2, py1, py2] = [cx - rx, cx + rx, cy - ry, cy + ry];
        let selectedX = [px1, px2].map((pixel) => this.x_scale.scale.invert(pixel));
        let selectedY = [py1, py2].map((pixel) => this.y_scale.scale.invert(pixel));
        this.model.set('selected_x', new Float32Array(selectedX));
        this.model.set('selected_y', new Float32Array(selectedY));
        this.touch();
    }
    reset() {
        this.model.set('selected_x', null);
        this.model.set('selected_y', null);
        this.touch();
    }
    selected_changed() {
        // I don't think this should be an abstract method we should implement
        // would be good to refactor the interact part a bit
    }
    canDraw() {
        const selectedX = this.model.get('selected_x');
        const selectedY = this.model.get('selected_y');
        return Boolean(selectedX) && Boolean(selectedY);
    }
    calculatePixelCoordinates() {
        if (!this.canDraw()) {
            throw new Error("No selection present");
        }
        const selectedX = this.model.get('selected_x');
        const selectedY = this.model.get('selected_y');
        var sortFunction = (a, b) => a - b;
        let x = [...selectedX].sort(sortFunction);
        let y = [...selectedY].sort(sortFunction);
        // convert to pixel coordinates
        let [px1, px2] = x.map((v) => this.x_scale.scale(v));
        let [py1, py2] = y.map((v) => this.y_scale.scale(v));
        // bounding box, and svg coordinates
        return { px1, px2, py1, py2, cx: (px1 + px2) / 2, cy: (py1 + py2) / 2, rx: Math.abs(px2 - px1) / 2, ry: Math.abs(py2 - py1) / 2 };
    }
    updateRectangle(offsetX = 0, offsetY = 0, extraRx = 0, extraRy = 0) {
        if (!this.canDraw()) {
            this.brush.node().style.display = 'none';
        }
        else {
            const { px1, px2, py1, py2, cx, cy } = this.calculatePixelCoordinates();
            const [ x, y, width, height ] = [ px1 + offsetX, py2 + offsetY, px2 - px1, py1 - py2 ];
            this.d3rectangle
                .attr("x", x)
                .attr("y", y)
                .attr("width", width)
                .attr("height", height)
                .style('fill', this.model.get('color') || 'grey');
            applyStyles(this.d3rectangle, this.model.get('style'));
            this.d3rectangleHandle
                .attr("x", x)
                .attr("y", y)
                .attr("width", width)
                .attr("height", height)
                .style('stroke', this.model.get('color') || 'black')
            applyStyles(this.d3rectangleHandle, this.model.get('border_style'));
            this.brush.attr("transform", `rotate(${this.model.get('rotate')}, ${cx + offsetX}, ${cy + offsetY})`);
            this.brush.node().style.display = '';
            this.updateBoundingHandles();
        }
    }
    syncSelectionToMarks() {
        if (!this.canDraw())
            return;
        const { px1, px2, py1, py2, cx, cy } = this.calculatePixelCoordinates();

        const angle = -this.model.get('rotate') * Math.PI / 180;
        const point_selector = function (p) {
            const [pointX, pointY] = p;

            // Translate point to origin, rotate, then translate back
            const rotatedX = (pointX - cx) * Math.cos(angle) - (pointY - cy) * Math.sin(angle) + cx;
            const rotatedY = (pointX - cx) * Math.sin(angle) + (pointY - cy) * Math.cos(angle) + cy;
            
            // const {x: rotatedX, y: rotatedY} = this.rotatePoint(pointX, pointY, cx, cy, angle);
            
            // After rotation, we can do a simple bounds check
            const insideRectangle = rotatedX >= px1 && rotatedX <= px2 && 
                                  rotatedY >= py2 && rotatedY <= py1;
            return insideRectangle;
        };
        const rect_selector = function (xy) {
            // TODO: Leaving this to someone who has a clear idea on how this should be implemented
            // and who needs it. I don't see a good use case for this (Maarten Breddels).
            console.error('Rectangle selector not implemented');
            return false;
        };
        this.mark_views.forEach((markView) => {
            markView.selector_changed(point_selector, rect_selector);
        });
    }
}
exports.BrushRectangleSelector = BrushRectangleSelector;
