"use strict";
const isTypedArray = require("is-typedarray");


export
function applyStyles(d3el, styles) {
    Object.keys(styles).forEach(key => d3el.style(key, styles[key]));
    return d3el
}

export
function applyAttrs(d3el, styles) {
    Object.keys(styles).forEach(key => d3el.attr(key, styles[key]));
    return d3el
}

export
function is_typedarray(obj) {
    return isTypedArray(obj);
}

export
function setRange(scaleView, range) {
    return scaleView.setRange ? scaleView.setRange(range) : scaleView.set_range(range);
}

export
function computeAndSetDomain(scaleModel, values, id) {
    return scaleModel.computeAndSetDomain ?
        scaleModel.computeAndSetDomain(values, id) :
        scaleModel.compute_and_set_domain(values, id);
}

export
function delDomain(scaleModel, values, id) {
    return scaleModel.delDomain ?
        scaleModel.delDomain(values, id) :
        scaleModel.del_domain(values, id);
}

export
function colorRange(scaleModel) {
    return scaleModel.colorRange || scaleModel.color_range;
}

export
function domain(scaleModel) {
    return scaleModel.domain || scaleModel.get("domain");
}
