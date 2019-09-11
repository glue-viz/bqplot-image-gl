import * as bqplot from 'bqplot';
import * as widgets from "@jupyter-widgets/base";
import * as d3contour from "d3-contour";
import * as d3geo from "d3-geo";
import * as d3 from "d3";


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
            color: null,
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
            this.updateColor()
        });
        this.listenTo(this.model, "data_updated", () => {
            this.d3path.attr("d", this.createPath())
            this.draw_labels()
            this.updateColor()
        });
    }
    updateColor() {
        const color = this.getColor();
        this.d3path.attr("stroke", color)
        this.d3label_group.selectAll("text").attr("fill", color)
    }
    getColor() {
        const model = this.model;
        var colors = this.scales.image.model.color_range;
        var color_scale = d3.scale.linear()
                                  .range(colors)
                                  .domain(this.scales.image.model.domain);
        const min = this.scales.image.model.domain[0];
        const max = this.scales.image.model.domain[this.scales.image.model.domain.length-1];
        const delta = max - min;
        // a good default color is one that is 50% off from the value of the colormap
        const level_plus_50_percent = ((model.get('level') - min) + delta / 2) % delta + min;
        const color = color_scale(level_plus_50_percent);
        return this.model.get('color') || color;
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
        // this.mask_id = `${this.cid}-${this.model.cid}`
        // this.mask = this.parent.svg.select('defs')
        //                 .append("mask")
        //                     .attr("id", this.mask_id);
        this.d3path = this.d3el
            .append("g")
                .append("path")
                    .attr("stroke", this.getColor())
                    .attr("fill", "none")
                    .attr("d", this.createPath())
                    .attr("mask", this.mask_id);
        this.d3label_group = this.d3el
            .append("g")
        this.draw_labels()
    }
    draw_labels() {
        const x_scale = this.scales.x, y_scale = this.scales.y;
        const model = this.model;

        this.d3label_group.html(null) // removes all children

        const color = this.getColor();
        const label = String(model.get('level'));
        const margin = this.parent.margin;


        // http://wiki.geojson.org/GeoJSON_draft_version_6#MultiPolygon
        this.model.contours.coordinates.forEach(polygon =>
            // http://wiki.geojson.org/GeoJSON_draft_version_6#Polygon
            polygon.forEach((linear_ring, j) => {
                const points = linear_ring.slice(1);
                var index = 0;
                const step = 40;
                // transform image pixel to bqplot/svg pixel coordinates
                const scalex = (_) => x_scale.scale(_/model.width)
                const scaley = (_) => y_scale.scale(_/model.height)
                while(index < points.length) {
                    const index_previous = (index - 1 + points.length) % points.length;
                    const index_next     = (index + 1 + points.length) % points.length;
                    const x_current = scalex(points[index][0])
                    const y_current = scaley(points[index][1])
                    const x_previous   = scalex(points[index_previous][0]);
                    const y_previous   = scaley(points[index_previous][1]);
                    const x_next       = scalex(points[index_next][0]);
                    const y_next       = scaley(points[index_next][1]);
                    const dx = x_next - x_previous;
                    const dy = y_next - y_previous;
                    var label_angle = (Math.atan2(dy, dx) * 180 / Math.PI + 180) % 360;
                    console.log('original angle', label_angle)
                    // if the label is upside down, we wanna rotate an extra 180 degrees
                    if(label_angle > 270)
                        label_angle = (label_angle + 180) % 360;
                    if(label_angle > 90)
                        label_angle = (label_angle + 180) % 360;
                    console.log('modified angle', label_angle)
                    this.d3label_group
                        .append("text")
                        .text(label)
                        .attr("transform", `translate(${x_current}, ${y_current}) rotate(${label_angle})`)
                        .attr("text-anchor", "middle")
                        .attr("fill", color)
                    // this.mask
                    //     .append("circle")
                    //     .attr("r", 20)
                    //     .attr("fill", "black")
                    //     .attr("transform", `translate(${x_current}, ${y_current})`);
                    index += step;
                    // we don't want do draw close to the end
                    if(index > (points.length - step*1.2))
                        break;
                }
            })
        )
    }
}

ContourModel.serializers = Object.assign({}, bqplot.MarkModel.serializers, {image: {deserialize: widgets.unpack_models}});

export {
    ContourModel, ContourView
}