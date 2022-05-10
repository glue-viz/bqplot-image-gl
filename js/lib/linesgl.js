var version = require('./version').version;
var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var d3 = require("d3");
var bqplot = require('bqplot');
var THREE = require('three');
var values = require('./values');

var Line2 = require('./examples/lines/Line2').Line2;
var LineMaterial = require('./examples/lines/LineMaterial').LineMaterial;
var LineGeometry = require('./examples/lines/LineGeometry').LineGeometry;


const chunk_scales = require('raw-loader!../shaders/scales-delta.glsl').default;
const chunk_scales_extra = require('raw-loader!../shaders/scales-extra.glsl').default;
const chunk_scales_transform = require('raw-loader!../shaders/scales-transform.glsl').default;

const scaleTypeMap = {
    linear: 1,
    log: 2,
};

class LinesGLModel extends bqplot.LinesModel {
    defaults() {
        return _.extend(bqplot.LinesModel.prototype.defaults(), {
            _model_name : 'LinesGLModel',
            _view_name : 'LinesGLView',
            _model_module : 'bqplot-image-gl',
            _view_module : 'bqplot-image-gl',
            _model_module_version : version,
            _view_module_version : version,
        });
    }
}

class LinesGLView extends bqplot.Lines {

    async render() {
        this.uniforms = {
            // 3rd element is delta
            domain_x : { type: "3f", value: [0., 1., 1.] },
            domain_y : { type: "3f", value: [0., 1., 1.] },
            range_x : { type: "2f", value: [0., 1.] },
            range_y : { type: "2f", value: [0., 1.] },
            diffuse: {type: '3f', value: [1, 0, 0]},
            opacity: {type: 'f', value: 1.0},
        }
        this.scale_defines = {}
        this.material = new LineMaterial({
            blending: THREE.CustomBlending,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            blendEquation: THREE.AddEquation,
            transparent: true,
            // this causes the overdraw of the line caps and joins (circles)
            // to not overdraw, causing transparancy to show the circles
            depthFunc: THREE.LessDepth,
        });
        this.uniforms = this.material.uniforms = {...this.material.uniforms, ...this.uniforms};


        const result = await super.render();
        window.lastLinesGLView = this;


        this.material.onBeforeCompile = (shader) => {
            // we include the scales header, and a snippet that uses the scales
            shader.vertexShader = "// added by bqplot-image-gl\n" + chunk_scales +  chunk_scales_extra + "// added by bqplot-image-gl\n" + shader.vertexShader;
            // we modify the shader to replace a piece
            const begin = 'vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );'
            const offset_begin = shader.vertexShader.indexOf(begin);
            if (offset_begin == -1) {
                console.error('Could not find magic begin line in shader');
            }
            const end = 'vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );';
            const offset_end = shader.vertexShader.indexOf(end);
            if (offset_end == -1) {
                console.error('Could not find magic end line in shader');
            }
            shader.vertexShader = shader.vertexShader.slice(0, offset_begin) + chunk_scales_transform + shader.vertexShader.slice(offset_end + end.length);
        };
        this._updateMaterialScales();
        this.update_stroke_width();

        this.geometry = new LineGeometry();
        this._updateGeometry();
        this.line = new Line2(this.geometry, this.material);
        this.line.frustumCulled = false;

        this.camera = new THREE.OrthographicCamera( 1 / - 2, 1 / 2, 1 / 2, 1 / - 2, -10000, 10000 );
        this.camera.position.z = 10;
        this.camera.updateProjectionMatrix();

        this.scene = new THREE.Scene();
        this.scene.add(this.line);
        this.listenTo(this.model, 'change:x change:y', this._updateGeometry, this);

        return result;
    }

    create_listeners() {
        super.create_listeners();
        var sync_visible = () => {
            this.material.visible = this.model.get('visible');
            this.update_scene();
        };
        this.listenTo(this.model, "change:visible", sync_visible , this);
    }
    
    _updateGeometry() {
        const scalar_names = ["x", "y", "z"];
        const vector4_names = [];
        const get_value = (name, index, default_value) => {
            if (name === "z") {
                return 0;
            }
            return this.model.get(name);
        }
        const sequence_index = 0; // not used (see ipyvolume)
        const current = new values.Values(scalar_names, [], get_value, sequence_index, vector4_names);
        current.ensure_array('z')
        current.merge_to_vec3(["x", "y", "z"], "position");
         // important to reset this, otherwise we may use an old buffered value
         // Note that if we upgrade threejs, this may be named differently https://github.com/mrdoob/three.js/issues/18990
        this.geometry.maxInstancedCount = undefined;
        this.geometry.setPositions(current.array_vec3['position'])

    }

    update_style() {
        const color = new THREE.Color(this.model.get('colors')[0]);
        this.material.color = color.toArray();
        const opacities = this.model.get('opacities');
        if(opacities && opacities.length) {
            this.uniforms['opacity'].value = opacities[0];
        } else {
            this.uniforms['opacity'].value = 1.;
        }
        this.update_scene();
    }

    update_stroke_width() {
        this.material.linewidth = this.model.get('stroke_width')
        this.update_scene();
    }

    _updateMaterialScales() {
        const scales = {x: this.scales.x.model, y: this.scales.y.model}
        const new_scale_defines = {...this.scale_defines};
        for (const key of Object.keys(scales)) {
            const domain = scales[key].domain
            let delta = domain[1] - domain[0];
            // see scales-delta.glsl
            if(scales[key].type == 'log') {
                delta = Math.log(domain[1]) - Math.log(domain[0]);
            }
            this.uniforms[`domain_${key}`].value = [domain[0], domain[1], delta];
            new_scale_defines[`SCALE_TYPE_${key}`] = scaleTypeMap[scales[key].type];
        }
        if (!_.isEqual(this.scale_defines, new_scale_defines) ) {
            this.scale_defines = new_scale_defines;
            this._updateMaterials();
        }
    }

    _updateMaterials() {
        this.material.defines = {...this.scale_defines, USE_SCALE_X: true, USE_SCALE_Y: true};
        this.material.needsUpdate = true;
    }

    update_line_xy() {
        // called when the scales are changing
        this._updateMaterialScales();
        this.update_scene();
    }


    render_gl() {
        var fig = this.parent;
        var renderer = fig.renderer;
        this.camera.left = 0;
        this.camera.right = fig.plotarea_width;
        this.camera.bottom = 0;
        this.camera.top = fig.plotarea_height;
        this.camera.updateProjectionMatrix();

        const x_scale = this.scales.x ? this.scales.x : this.parent.scale_x;
        const y_scale = this.scales.y ? this.scales.y : this.parent.scale_y;
        const range_x = this.parent.padded_range('x', x_scale.model);
        const range_y = this.parent.padded_range('y', y_scale.model);
        this.uniforms[`range_x`].value = range_x;
        this.uniforms['resolution'].value = [fig.plotarea_width, fig.plotarea_height];
        this.uniforms[`range_y`].value = [range_y[1], range_y[0]]; // flipped coordinates in WebGL
        // every line cleans the depth buffer, since we have to draw with depthFunc: THREE.LessDepth
        // if we don't do this, we will not overdraw on other lines
        // A possible alternative would be to give each mark a z value according to index in Figure.marks
        renderer.clearDepth();
        renderer.render(this.scene, this.camera);
    }

    update_scene(animate) {
        this.parent.update_gl();
    }

    relayout() {
        this.update_scene();
    }

    draw(animate) {
        this.set_ranges();
        this.update_line_xy(animate);
        this.update_style();
    }
}

export {
    LinesGLModel, LinesGLView
};
