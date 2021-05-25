"use strict";
// NOTE: this is the generate js file from ipyvolume/js/values.ts
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// var _ = require("underscore");
const lodash_1 = require("lodash");
const THREE = __importStar(require("three"));
const utils = __importStar(require("./utils"));
/* Manages a list of scalar and arrays for use with WebGL instanced rendering
*/
class Values {
    constructor(names, names_vec3, getter, sequence_index, names_vec4 = []) {
        this.length = Infinity;
        this.scalar = {};
        this.scalar_vec3 = {};
        this.scalar_vec4 = {};
        this.array = {};
        this.array_vec3 = {};
        this.array_vec4 = {};
        this.values = {};
        // _.each(names, (name) => {
        for (const name of names) {
            const value = getter(name, sequence_index, Values.defaults[name]);
            if (utils.is_typedarray(value)) {
                if (name !== "selected") { // hardcoded.. hmm bad
                    this.length = Math.min(this.length, value.length);
                }
                this.array[name] = value;
            }
            else {
                this.scalar[name] = value;
            }
            this.values[name] = value;
        }
        for (const name of names_vec3) {
            let value = getter(name, sequence_index, Values.defaults[name]);
            if (name.indexOf("color") !== -1 && typeof value === "string") {
                // special case to support controlling color from a widget
                const color = new THREE.Color(value);
                // no sequence, scalar
                value = new Float32Array([color.r, color.g, color.b]);
            }
            if (utils.is_typedarray(value) && value.length > 3) {
                // single value is interpreted as scalar
                this.array_vec3[name] = value;
                this.length = Math.min(this.length, value.length / 3);
            }
            else {
                this.scalar_vec3[name] = value;
            }
            this.values[name] = value;
        }
        for (const name of names_vec4) {
            let value = getter(name, sequence_index, Values.defaults[name]);
            if (name.indexOf("color") !== -1 && typeof value === "string") {
                // special case to support controlling color from a widget
                const color = new THREE.Color(value);
                value = new Float32Array([color.r, color.g, color.b, 1.0]);
            }
            if (utils.is_typedarray(value) && value.length > 4) {
                this.array_vec4[name] = value;
                // color vectors have 4 components
                this.length = Math.min(this.length, value.length / 4);
            }
            else {
                // single value is interpreted as scalar
                this.scalar_vec4[name] = value;
            }
            this.values[name] = value;
        }
    }
    trim(new_length) {
        this.array = lodash_1.mapValues(this.array, (array) => {
            return array.length === new_length ? array : array.slice(0, new_length);
        });
        this.array_vec3 = lodash_1.mapValues(this.array_vec3, (array_vec3) => {
            return array_vec3.length === new_length * 3 ? array_vec3 : array_vec3.slice(0, new_length * 3);
        });
        this.array_vec4 = lodash_1.mapValues(this.array_vec4, (array_vec4) => {
            return (array_vec4.length === new_length * 4) ? array_vec4 : array_vec4.slice(0, new_length * 4);
        });
        this.length = new_length;
    }
    ensure_array(name_or_names) {
        const names = lodash_1.isArray(name_or_names) ? name_or_names : [name_or_names];
        for (const name of names) {
            if (typeof this.scalar[name] !== "undefined") {
                const array = this.array[name] = new Float32Array(this.length);
                array.fill(this.scalar[name]);
                delete this.scalar[name];
                delete this.values[name];
            }
            const value_vec3 = this.scalar_vec3[name];
            const value_vec4 = this.scalar_vec4[name];
            if (typeof value_vec3 !== "undefined") {
                const array = this.array_vec3[name] = new Float32Array(this.length * 3);
                for (let i = 0; i < this.length; i++) {
                    array[i * 3 + 0] = value_vec3[0];
                    array[i * 3 + 1] = value_vec3[1];
                    array[i * 3 + 2] = value_vec3[2];
                }
                delete this.scalar_vec3[name];
                delete this.values[name];
            }
            if (typeof value_vec4 !== "undefined") {
                this.array_vec4[name] = new Float32Array(this.length * 4);
                const array = this.array_vec4[name];
                for (let i = 0; i < this.length; i++) {
                    array[i * 4 + 0] = value_vec4[0];
                    array[i * 4 + 1] = value_vec4[1];
                    array[i * 4 + 2] = value_vec4[2];
                    array[i * 4 + 3] = value_vec4[3];
                }
                delete this.scalar_vec4[name];
                delete this.values[name];
            }
        }
    }
    grow(new_length) {
        this.array = lodash_1.mapValues(this.array, (array) => {
            const new_array = new array.constructor(new_length);
            new_array.set(array);
            return new_array;
        });
        this.array_vec3 = lodash_1.mapValues(this.array_vec3, (array_vec3) => {
            const new_array = new array_vec3.constructor(new_length * 3);
            new_array.set(array_vec3);
            return new_array;
        });
        this.length = length;
    }
    pad(other) {
        this.array = lodash_1.mapValues(this.array, (array, name) => {
            const new_array = new array.constructor(other.length);
            if (typeof other.array[name] === "undefined") { // then other must be a scalar
                new_array.fill(other.scalar[name], this.length);
            }
            else {
                new_array.set(other.array[name].slice(this.length), this.length);
            }
            new_array.set(array);
            return new_array;
        });
        this.array_vec3 = lodash_1.mapValues(this.array_vec3, (array_vec3, name) => {
            const new_array = new array_vec3.constructor(other.length * 3);
            if (typeof other.array_vec3[name] === "undefined") { // then other must be a scalar
                const other_scalar = other.scalar_vec3[name];
                for (let i = this.length; i < other.length; i++) {
                    new_array[i * 3 + 0] = other_scalar[0];
                    new_array[i * 3 + 1] = other_scalar[1];
                    new_array[i * 3 + 2] = other_scalar[2];
                }
            }
            else {
                new_array.set(other.array_vec3[name].slice(this.length * 3), this.length * 3);
            }
            new_array.set(array_vec3);
            return new_array;
        });
        this.array_vec4 = lodash_1.mapValues(this.array_vec4, (array_vec4, name) => {
            const new_array = new array_vec4.constructor(other.length * 4);
            if (typeof other.array_vec4[name] === "undefined") {
                // then other must be a scalar
                const other_scalar = other.scalar_vec4[name];
                for (let i = this.length; i < other.length; i++) {
                    new_array[i * 4 + 0] = other_scalar[0];
                    new_array[i * 4 + 1] = other_scalar[1];
                    new_array[i * 4 + 2] = other_scalar[2];
                    new_array[i * 4 + 3] = other_scalar[3];
                }
            }
            else {
                new_array.set(other.array_vec4[name].slice(this.length * 4), this.length * 4);
            }
            new_array.set(array_vec4);
            return new_array;
        });
        this.length = other.length;
    }
    select(selected) {
        // copy since we will modify
        const sizes = this.array.size = this.array.size.slice();
        const size_selected = this.array.size_selected;
        // copy since we will modify
        const color = this.array_vec4.color = this.array_vec4.color.slice();
        const color_selected = this.array_vec4.color_selected;
        // this assumes, and requires that color_selected is an array, maybe a bit inefficient
        selected.forEach((element, index) => {
            if (index < this.length) {
                sizes[index] = size_selected[index];
                color[index * 4 + 0] = color_selected[index * 4 + 0];
                color[index * 4 + 1] = color_selected[index * 4 + 1];
                color[index * 4 + 2] = color_selected[index * 4 + 2];
                color[index * 4 + 3] = color_selected[index * 4 + 3];
            }
        });
    }
    merge_to_vec3(names, new_name) {
        const element_length = names.length;
        const array = new Float32Array(this.length * element_length); // Float32Array should be replaced by a good common value
        names.forEach((name, index) => {
            this.ensure_array(name);
            const array1d = this.array[name];
            for (let i = 0; i < this.length; i++) {
                array[i * element_length + index] = array1d[i];
            }
            delete this.array[name];
            delete this.values[name];
        });
        this.array_vec3[new_name] = array;
    }
    pop(name_or_names) {
        const names = lodash_1.isArray(name_or_names) ? name_or_names : [name_or_names];
        // _.each(names, (name) => {
        names.forEach((name, index) => {
            [this.scalar,
                this.scalar_vec3,
                this.array,
                this.array_vec3].forEach((storage) => {
                if (typeof storage[name] !== "undefined") {
                    delete storage[name];
                }
            });
        });
    }
    add_attributes(geometry, postfix = "") {
        postfix = postfix;
        // set all attributes
        lodash_1.forOwn(this.array, (array, name) => {
            if (name.indexOf("selected") === -1) {
                // selected attributes should not be send to the shader
                const attr = new THREE.InstancedBufferAttribute(array, 1, false, 1);
                geometry.addAttribute(name + postfix, attr);
            }
        });
        lodash_1.forOwn(this.array_vec3, (array, name) => {
            if (name.indexOf("selected") === -1) {
                // selected attributes should not be send to the shader
                const attr = new THREE.InstancedBufferAttribute(array, 3, false, 1);
                attr.normalized = name.indexOf("color") === -1 ? false : true; // color should be normalized
                geometry.addAttribute(name + postfix, attr);
            }
        });
        lodash_1.forOwn(this.array_vec4, (array, name) => {
            if (name.indexOf("selected") === -1) {
                // selected attributes should not be send to the shader
                const attr = new THREE.InstancedBufferAttribute(array, 4, false, 1);
                attr.normalized = name.indexOf("color") === -1 ? false : true; // color should be normalized
                geometry.addAttribute(name + postfix, attr);
            }
        });
        lodash_1.forOwn(this.scalar, (scalar, name) => {
            if (name.indexOf("selected") === -1) {
                // selected attributes should not be send to the shader
                const attr = new THREE.InstancedBufferAttribute(new Float32Array([scalar]), 1, false, this.length);
                geometry.addAttribute(name + postfix, attr);
            }
        });
        lodash_1.forOwn(this.scalar_vec3, (scalar_vec3, name) => {
            if (name.indexOf("selected") === -1) {
                // selected attributes should not be send to the shader
                const attr = new THREE.InstancedBufferAttribute(scalar_vec3, 3, false, this.length);
                attr.normalized = name.indexOf("color") === -1 ? false : true; // color should be normalized
                geometry.addAttribute(name + postfix, attr);
            }
        });
        lodash_1.forOwn(this.scalar_vec4, (scalar_vec4, name) => {
            if (name.indexOf("selected") === -1) {
                // selected attributes should not be send to the shader
                const attr = new THREE.InstancedBufferAttribute(scalar_vec4, 4, false, this.length);
                attr.normalized = name.indexOf("color") === -1 ? false : true; // color should be normalized
                geometry.addAttribute(name + postfix, attr);
            }
        });
    }
}
exports.Values = Values;
Values.defaults = {
    vx: 0,
    vy: 1,
    vz: 0,
    x: 0,
    y: 0,
    z: 0,
    size: 0,
};
