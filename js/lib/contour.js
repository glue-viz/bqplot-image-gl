import * as bqplot from 'bqplot';
import * as widgets from "@jupyter-widgets/base";
import * as d3contour from "d3-contour";
import * as d3geo from "d3-geo";


class ContourModel extends bqplot.MarkModel {

    defaults() {
        return _.extend(bqplot.MarkModel.prototype.defaults(), {
            _model_name : 'ContourModel',
            _view_name : 'ContourView',
            _model_module : 'bqplot-image-gl',
            _view_module : 'bqplot-image-gl',
            _model_module_version : '0.2.0',
            _view_module_version : '0.2.0',
            image: null,
            level: null,
            color: 'orange',
            scales_metadata: {
                'x': {'orientation': 'horizontal', 'dimension': 'x'},
                'y': {'orientation': 'vertical', 'dimension': 'y'},
            },
        });
    }

    initialize(attributes, options) {
        super.initialize(attributes, options);
        this.on_some_change(['level'], this.update_data, this);
        this.on_some_change(["preserve_domain"], this.update_domains, this);
        this.update_data();
    }

    update_data() {
        const image_widget = this.get('image');
        const image = image_widget.get('image')
        this.width = image.shape[1];
        this.height = image.shape[0];
        const thresholds = [this.get('level')];
        this.contours = d3contour
            .contours()
            .size([this.width, this.height])
            .contour(image.data, thresholds);
        // this.update_domains();
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

class ContourView extends bqplot.Mark {
    create_listeners() {
        super.create_listeners();
        this.listenTo(this.model, "change:color", () => {
            this.d3path.attr("stroke", this.model.get('color'))
        });
        this.listenTo(this.model, "data_updated", () => {
            this.d3path.attr("d", this.createPath())
        });
    }
    createPath() {
        const x_scale = this.scales.x, y_scale = this.scales.y;
        const model = this.model;
        var bqplot_transform = d3geo.geoTransform({
            point: function(x, y) {
                // transform x from pixel coordinates to normalized, and then use bqplot's scale
                // TODO: we should respect image's x and y
                this.stream.point(x_scale.scale(x/model.width), y_scale.scale(y/model.height));
            }
          });
        const path = d3geo.geoPath(bqplot_transform)(this.model.contours)
        return path;
    }
    render() {
        const promise = super.render()
        promise.then(() => {
            this.draw()
            this.create_listeners();
                  
        })
        return promise;
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
    draw() {
        this.d3path = this.d3el
            .append("g")
                .append("path")
                    .attr("stroke", this.model.get('color'))
                    .attr("fill", "none")
                    .attr("d", this.createPath())
    }
}

ContourModel.serializers = Object.assign({}, bqplot.MarkModel.serializers, {image: {deserialize: widgets.unpack_models}});

export {
    ContourModel, ContourView
}