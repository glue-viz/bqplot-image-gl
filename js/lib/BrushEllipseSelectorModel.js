"use strict";

var version = require('./version').version;

Object.defineProperty(exports, "__esModule", { value: true });
const BrushSelectorModel = require("bqplot").BrushSelectorModel;
class BrushEllipseSelectorModel extends BrushSelectorModel {
    defaults() {
        return Object.assign({}, BrushSelectorModel.prototype.defaults(), {
            _model_module: 'bqplot-image-gl',
            _view_module: 'bqplot-image-gl',
            _model_module_version: version,
            _view_module_version: version,
            _model_name: "BrushEllipseSelectorModel",
            _view_name: "BrushEllipseSelector",
            pixel_aspect: null,
            style: {
                fill: "green",
                opacity: 0.3,
                cursor: "grab",
            }, border_style: {
                fill: "none",
                stroke: "green",
                opacity: 0.3,
                cursor: "col-resize",
                "stroke-width": "3px",
            }
        });
    }
}
BrushEllipseSelectorModel.serializers = Object.assign({}, BrushSelectorModel.serializers);
exports.BrushEllipseSelectorModel = BrushEllipseSelectorModel;
