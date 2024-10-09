/*jshint esversion: 6 */

var version = require('./version').version;

var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var d3 = require("d3");
var bqplot = require('bqplot');
var THREE = require('three');

var interpolations = {'nearest': THREE.NearestFilter, 'bilinear': THREE.LinearFilter};

var jupyter_dataserializers = require("jupyter-dataserializers");
var serialize = require("./serialize");

class ImageGLModel extends bqplot.MarkModel {

    defaults() {
        return _.extend(bqplot.MarkModel.prototype.defaults(), {
            _model_name : 'ImageGLModel',
            _view_name : 'ImageGLView',
            _model_module : 'bqplot-image-gl',
            _view_module : 'bqplot-image-gl',
            _model_module_version : version,
            _view_module_version : version,
            interpolation: 'nearest',
            opacity: 1.0,
            x: (0.0, 1.0),
            y: (0.0, 1.0),
            scales_metadata: {
                'x': {'orientation': 'horizontal', 'dimension': 'x'},
                'y': {'orientation': 'vertical', 'dimension': 'y'},
            },
        });
    }

    initialize(attributes, options) {
        super.initialize(attributes, options);
        this.on_some_change(['x', 'y'], this.update_data, this);
        this.on_some_change(["preserve_domain"], this.update_domains, this);
        this.listenTo(this, "change:image", () => {
            const previous = this.previous("image");
            if(previous.image && previous.image.src) {
                URL.revokeObjectURL(previous.image.src);
            }
        }, this);

        this.update_data();
    }

    close(comm_closed) {
        const image = this.get("image");
        if(image.image && image.image.src) {
            URL.revokeObjectURL(previous.image.src);
        }
        return super.close(comm_closed);
    }

    update_data() {
        this.mark_data = {
            x: this.get("x"), y: this.get("y")
        };
        this.update_domains();
        this.trigger("data_updated");
    }

    update_domains() {
        if(!this.mark_data) {
            return;
        }
        var scales = this.get("scales");
        var x_scale = scales.x;
        var y_scale = scales.y;

        if(x_scale) {
            if(!this.get("preserve_domain").x) {
                x_scale.compute_and_set_domain(this.mark_data.x, this.model_id + "_x");
            } else {
                x_scale.del_domain([], this.model_id + "_x");
            }
        }
        if(y_scale) {
            if(!this.get("preserve_domain").y) {
                y_scale.compute_and_set_domain(this.mark_data.y, this.model_id + "_y");
            } else {
                y_scale.del_domain([], this.model_id + "_y");
            }
        }
    }

}

ImageGLModel.serializers = Object.assign({}, bqplot.MarkModel.serializers,
                                         { x: serialize.array_or_json,
                                           y: serialize.array_or_json,
                                           image: {
                                                deserialize: async (obj, manager) => {
                                                    if(obj.type == "image") {
                                                        // the data is encoded in an image with LA format
                                                        // luminance for the intensity, alpha for the mask
                                                        let image = new Image();
                                                        const blob = new Blob([obj.data], {type: `image/${obj.format}`});
                                                        const url = URL.createObjectURL(blob);
                                                        image.src = url;
                                                        await new Promise((resolve, reject) => {
                                                            image.onload = resolve;
                                                            image.onerror = reject;
                                                        } );
                                                        return {image, min: obj.min, max: obj.max, use_colormap: obj.use_colormap};
                                                    } else {
                                                        // otherwise just a 'normal' ndarray
                                                        let state = {buffer: obj.value, dtype: obj.dtype, shape: obj.shape};
                                                        return jupyter_dataserializers.JSONToArray(state);
                                                    }
                                                },
                                                serialize: (ar) => {
                                                    const {buffer, dtype, shape} = jupyter_dataserializers.arrayToJSON(ar);
                                                    return {value: buffer, dtype:dtype, shape:shape}
                                                }
                                            }});

class ImageGLView extends bqplot.Mark {

    render() {
        var base_render_promise = super.render();
        window.last_image = this;

        this.image_plane = new THREE.PlaneBufferGeometry( 1.0, 1.0 );
        this.image_material = new THREE.ShaderMaterial( {
                    uniforms: {
                        image: { type: 't', value: null },
                        // the domain of the image pixel data (for intensity only, for rgb this is ignored)
                        // these 3 uniforms map one to one to the colorscale
                        colormap: { type: 't', value: null },
                        color_min: {type: 'f', value: 0.0},
                        color_max: {type: 'f', value: 1.0},
                        // the type of scale (linear/log) for x/y will be substituted in the shader
                        // map from domain
                        domain_x : { type: "2f", value: [0.0, 1.0] },
                        domain_y : { type: "2f", value: [0.0, 1.0] },
                        // to range (typically, pixel coordinates)
                        range_x  : { type: "2f", value: [0.0, 1.0] },
                        range_y  : { type: "2f", value: [0.0, 1.0] },
                        // basically the corners of the image
                        image_domain_x  : { type: "2f", value: [0.0, 1.0] },
                        image_domain_y  : { type: "2f", value: [0.0, 1.0] },
                        // in the case we use an image for the values, the image is normalized, and we need to scale
                        // it back to a particular image range
                        // This needs to be set to [0, 1] for array data (which is not normalized)
                        range_image  : { type: "2f", value: [0.0, 1.0] },
                        // extra opacity value
                        opacity: {type: 'f', value: 1.0}
                    },
                    vertexShader: require('raw-loader!../shaders/image-vertex.glsl').default,
                    fragmentShader: require('raw-loader!../shaders/image-fragment.glsl').default,
                    transparent: true,
                    alphaTest: 0.01, // don't render almost fully transparant objects
                    blending: THREE.CustomBlending,
                    depthTest: false,
                    depthWrite: false,

                    // pre multiplied colors
                    blendEquation: THREE.AddEquation,
                    blendSrc: THREE.OneFactor,
                    blendDst: THREE.OneMinusSrcAlphaFactor,

                    blendEquationAlpha: THREE.AddEquation,
                    blendSrcAlpha: THREE.OneFactor,
                    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,

                });

        this.image_mesh = new THREE.Mesh(this.image_plane, this.image_material );
        this.camera = new THREE.OrthographicCamera( 1 / - 2, 1 / 2, 1 / 2, 1 / - 2, -10000, 10000 );
        this.camera.position.z = 10;
        this.scene = new THREE.Scene();
        this.scene.add(this.image_mesh);

        return base_render_promise.then(() => {
            this.create_listeners();
            this.update_minmax();
            this.update_colormap();
            this.update_opacity();
            this.update_image();
            this.update_scene();
            this.listenTo(this.parent, "margin_updated", () => {
                this.update_scene();
                this.draw();
            });
        });
    }

    set_positional_scales() {
        var x_scale = this.scales.x,
            y_scale = this.scales.y;
        this.listenTo(x_scale, "domain_changed", function() {
            if (!this.model.dirty) {
                this.update_scene();
             }
        });
        this.listenTo(y_scale, "domain_changed", function() {
            if (!this.model.dirty) {
                this.update_scene();
            }
        });
    }

    set_ranges() {
        var x_scale = this.scales.x,
            y_scale = this.scales.y;
        if(x_scale) {
            x_scale.set_range(this.parent.padded_range("x", x_scale.model));
        }
        if(y_scale) {
            y_scale.set_range(this.parent.padded_range("y", y_scale.model));
        }
    }

    create_listeners() {
        super.create_listeners();
        this.listenTo(this.model, "change:interpolation", () => {
            if(!this.texture)
                return;
            this.texture.magFilter = interpolations[this.model.get('interpolation')];
            this.texture.minFilter = interpolations[this.model.get('interpolation')];
            // it seems both of these need to be set before the filters have effect
            this.texture.needsUpdate = true;
            this.image_material.needsUpdate = true;
            this.update_scene();
        });
        var sync_visible = () => {
            this.image_material.visible = this.model.get('visible');
            this.update_scene();
        };
        this.listenTo(this.model, "change:visible", sync_visible , this);
        sync_visible();
        this.listenTo(this.model, "change:opacity", () => {
            this.update_opacity();
            this.update_scene();
        }, this);
        this.listenTo(this.scales.image.model, "domain_changed", () => {
            this.update_minmax();
            this.update_scene();
        }, this);
        this.listenTo(this.scales.image.model, "colors_changed", () => {
            this.update_colormap();
            this.update_scene();
        }, this);
        this.listenTo(this.scales.image.model, "domain_changed", this.update_image, this);
        this.listenTo(this.model, "change:image", () => {
            this.update_image();
            this.update_scene();
        }, this);
        this.listenTo(this.model, "data_updated", function() {
            //animate on data update
            var animate = true;
            this.update_scene(animate);
        }, this);
    }

    update_minmax() {
        var min = this.scales.image.model.get('min');
        var max = this.scales.image.model.get('max');
        if(typeof min !== 'number')
            min = 0;
        if(typeof max !== 'number')
            max = 0;
        this.image_material.uniforms.color_min.value = min;
        this.image_material.uniforms.color_max.value = max;
    }

    update_opacity() {
        this.image_material.uniforms.opacity.value = this.model.get('opacity');
    }

    update_colormap() {
		
        var parse_color_string = function(string){
            const hex_pattern = /.([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/;
            const tuple_pattern = /rgb\((\d+), (\d+), (\d+)\)/;
            var hex_match = hex_pattern.exec(string);
            if (hex_match) {
                return [parseInt("0x" + hex_match[1]),
                        parseInt("0x" + hex_match[2]),
                        parseInt("0x" + hex_match[3])];
            }
            var tuple_match = tuple_pattern.exec(string)
            if (tuple_match) {
                return [parseInt(tuple_match[1]),
                        parseInt(tuple_match[2]),
                        parseInt(tuple_match[3])];
	        }
        }
		
        // convert the d3 color scale to a texture
        var colors = this.scales.image.model.color_range;
        var color_scale = d3.scaleLinear()
                                  .range(colors)
                                  .domain(_.range(colors.length).map((i) => i/(colors.length-1)));
        var colormap_array = [];
        var N = 256;
        var colormap = _.map(_.range(N), (i) => {
            var index = i/(N-1);
            var rgb = color_scale(index);
            rgb = parse_color_string(rgb);
            colormap_array.push(rgb[0], rgb[1], rgb[2]);
        });
        colormap_array = new Uint8Array(colormap_array);
        this.colormap_texture = new THREE.DataTexture(colormap_array, N, 1, THREE.RGBFormat, THREE.UnsignedByteType);
        this.colormap_texture.needsUpdate = true;
        this.image_material.uniforms.colormap.value = this.colormap_texture;
    }

    update_image(skip_render) {
        var image = this.model.get("image");
        var type = null;
        if(image.image) {
            // the data is encoded in an image with LA format
            if(this.texture) {
                this.texture.dispose();
            }
            this.texture = new THREE.Texture(image.image);
            this.texture.needsUpdate = true;
            this.texture.flipY = false;
            this.image_material.uniforms.image.value = this.texture;
            this.image_material.defines.USE_COLORMAP = image.use_colormap;
            this.image_material.needsUpdate = true;
            this.image_material.uniforms.range_image.value = [image.min, image.max];
        } else {
            // we are not dealing with an image, but with an array
            // which is not normalized, so we can reset the range_image
            this.image_material.uniforms.range_image.value = [0, 1];
            var data = image.data;
            if(data instanceof Uint8Array) {
                type =  THREE.UnsignedByteType;
            } else if(data instanceof Float64Array) {
                console.warn('ImageGLView.data is a Float64Array which WebGL does not support, will convert to a Float32Array (consider sending float32 data for better performance).');
                data = Float32Array.from(data);
                type =  THREE.FloatType;
            } else if(data instanceof Float32Array) {
                type =  THREE.FloatType;
            } else {
                console.error('only types uint8 and float32 are supported');
                return;
            }
            if(this.scales.image.model.get('scheme') && image.shape.length == 2) {
                if(this.texture)
                    this.texture.dispose();
                this.texture = new THREE.DataTexture(data, image.shape[1], image.shape[0], THREE.LuminanceFormat, type);
                this.texture.needsUpdate = true;
                this.image_material.uniforms.image.value = this.texture;
                this.image_material.defines.USE_COLORMAP = true;
                this.image_material.needsUpdate = true;
            } else if(image.shape.length == 3) {
                this.image_material.defines.USE_COLORMAP = false;
                if(this.texture)
                    this.texture.dispose();
                if(image.shape[2] == 3)
                    this.texture = new THREE.DataTexture(data, image.shape[1], image.shape[0], THREE.RGBFormat, type);
                if(image.shape[2] == 4)
                    this.texture = new THREE.DataTexture(data, image.shape[1], image.shape[0], THREE.RGBAFormat, type);
                this.texture.needsUpdate = true;
                this.image_material.uniforms.image.value = this.texture;
            } else {
                console.error('image data not understood');
            }
        }
        this.texture.magFilter = interpolations[this.model.get('interpolation')];
        this.texture.minFilter = interpolations[this.model.get('interpolation')];
    }

    update_scene(animate) {
        this.parent.update_gl();
    }

    render_gl() {
        var fig = this.parent;
        var renderer = fig.renderer;
        var image = this.model.get("image");

        var x_scale = this.scales.x ? this.scales.x : this.parent.scale_x;
        var y_scale = this.scales.y ? this.scales.y : this.parent.scale_y;

        // set the camera such that we work in pixel coordinates
        this.camera.left  = 0;
        this.camera.right = fig.plotarea_width;
        this.camera.bottom = 0;
        this.camera.top = fig.plotarea_height;
        this.camera.updateProjectionMatrix();

        var x = this.model.get('x');
        var y = this.model.get('y');
        var x0 = x[0], x1 = x[1];
        var y0 = y[0], y1 = y[1];
        var x0_pixel = x_scale.scale(x0), x1_pixel = x_scale.scale(x1);
        var y0_pixel = y_scale.scale(y0), y1_pixel = y_scale.scale(y1);

        var pixel_width  = x1_pixel - x0_pixel;
        var pixel_height = y1_pixel - y0_pixel;
        this.image_mesh.position.set(x0_pixel + pixel_width/2, fig.plotarea_height - (y0_pixel + pixel_height/2), 0);
        this.image_mesh.scale.set(pixel_width, pixel_height, 1);

        this.image_material.uniforms.range_x.value = x_scale.scale.range();
        // upside down in opengl
        this.image_material.uniforms.range_y.value = [y_scale.scale.range()[1], y_scale.scale.range()[0]];
        this.image_material.uniforms.domain_x.value = x_scale.scale.domain();
        this.image_material.uniforms.domain_y.value = y_scale.scale.domain();

        this.image_material.uniforms.image_domain_x.value = [x0, x1];
        this.image_material.uniforms.image_domain_y.value = [y0, y1];

        renderer.render(this.scene, this.camera);
        var canvas = renderer.domElement;
    }

    relayout() {
        this.update_scene();
    }

    draw(animate) {
        this.set_ranges();

    }
}


var ImageMark = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ImageMark',
        _view_name : 'HelloView',
        _model_module : 'bqplot-image-gl',
        _view_module : 'bqplot-image-gl',
        _model_module_version : version,
        _view_module_version : version,
        value : 'Hello World'
    })
});


export {
    ImageGLModel, ImageGLView
};
