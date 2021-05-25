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
