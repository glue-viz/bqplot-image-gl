var version = require('./version').version;
var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var d3 = require("d3");
var bqplot = require('bqplot');
var THREE = require('three');
var values = require('./values');

const chunk_scales_extra = require('raw-loader!../shaders/scales-extra.glsl').default;
const chunk_scales_transform = require('raw-loader!../shaders/scales-transform.glsl').default;

const scaleTypeMap = {
    linear: 1,
    log: 2,
};

class LinesGLModel extends bqplot.LinesModel {
    defaults() {
        return _.extend(bqplot.MarkModel.prototype.defaults(), {
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
        this.uniforms = THREE.UniformsUtils.merge( [
            THREE.UniformsLib.common,
            THREE.UniformsLib.specularmap,
            THREE.UniformsLib.envmap,
            THREE.UniformsLib.aomap,
            THREE.UniformsLib.lightmap,
            THREE.UniformsLib.fog,
            {
                domain_x : { type: "2f", value: [0., 1.] },
                domain_y : { type: "2f", value: [0., 1.] },
                diffuse: {type: '3f', value: [1, 0, 0]},
                opacity: {type: 'f', value: 1.0},
            }
        ]);
        this.scale_defines = {}
        // ShaderLib.basic/dashed
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: THREE.ShaderChunk.meshbasic_vert,
            fragmentShader: THREE.ShaderChunk.meshbasic_frag
        });

        const result = await super.render();
        window.lastLinesGLView = this;


        this.material.onBeforeCompile = (shader) => {
            // we include the scales header, and a snippet that uses the scales
            shader.vertexShader = "// added by bqplot-image-gl\n#include <scales>\n" + chunk_scales_extra + "// added by bqplot-image-gl\n" + shader.vertexShader;
            // we modify the shader to include an extra snippet after this 'magic' line
            const magic = '#include <morphtarget_vertex>';
            const offset = shader.vertexShader.search(magic);
            shader.vertexShader = shader.vertexShader.slice(0, offset) + chunk_scales_transform + shader.vertexShader.slice(offset);
            shader.fragmentShader = shader.fragmentShader;
        };
        this._updateMaterialScales();

        this.geometry = new THREE.BufferGeometry();
        this._updateGeometry();
        this.line = new THREE.Line(this.geometry, this.material);
        this.line.computeLineDistances();

        this.camera = new THREE.OrthographicCamera( 1 / - 2, 1 / 2, 1 / 2, 1 / - 2, -10000, 10000 );
        this.camera.position.z = 10;
        // work in normalize coordinates (default for the scales)
        this.camera.left  = -0.5;
        this.camera.right = 0.5;
        this.camera.bottom = -0.5;
        this.camera.top = 0.5;
        this.camera.updateProjectionMatrix();

        this.scene = new THREE.Scene();
        this.scene.add(this.line);
        this.listenTo(this.model, 'change:x change:y', this._updateGeometry, this);

        return result;
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
        this.geometry.addAttribute( 'position', new THREE.Float32BufferAttribute(current.array_vec3['position'], 3)); 

    }

    update_style() {
        const color = new THREE.Color(this.model.get('colors')[0]);
        this.uniforms['diffuse'].value = color.toArray();
        const opacities = this.model.get('opacities');
        if(opacities && opacities.length) {
            this.uniforms['opacity'].value = opacities[0];
        } else {
            this.uniforms['opacity'].value = 1.;
        }
        this.update_scene();
    }

    _updateMaterialScales() {
        const scales = {x: this.scales.x.model, y: this.scales.y.model}
        const new_scale_defines = {...this.scale_defines};
        for (const key of Object.keys(scales)) {
            this.uniforms[`domain_${key}`].value = scales[key].domain;
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
