var version = require('./version').version;

import * as bqplot from 'bqplot';
import * as widgets from "@jupyter-widgets/base";
import * as d3contour from "d3-contour";
import * as d3geo from "d3-geo";
import * as d3 from "d3";
import * as jupyter_dataserializers from "jupyter-dataserializers";


class ContourModel extends bqplot.MarkModel {

    defaults() {
        return _.extend(bqplot.MarkModel.prototype.defaults(), {
            _model_name : 'ContourModel',
            _view_name : 'ContourView',
            _model_module : 'bqplot-image-gl',
            _view_module : 'bqplot-image-gl',
            _model_module_version : version,
            _view_module_version : version,
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
        this.on_some_change(['level', 'contour_lines'], this.update_data, this);
        this.on_some_change(["preserve_domain"], this.update_domains, this);
        this.update_data();
    }

    update_data() {
        const image_widget = this.get('image');
        const level = this.get('level')
        // we support a single level or multiple
        this.thresholds = Array.isArray(level) ? level : [level];
        if(image_widget) {
                const image = image_widget.get('image')
                this.width = image.shape[1];
                this.height = image.shape[0];
                this.contours = this.thresholds.map((threshold) => d3contour
                                                    .contours()
                                                    .size([this.width, this.height])
                                                    .contour(image.data, [threshold])
                                                    )
        } else {
            this.width = 1;   // precomputed contour_lines will have to be in normalized
            this.height = 1;  // coordinates.
            const contour_lines = this.get('contour_lines');
            this.contours = contour_lines.map((contour_line_set) => {
                return {
                    type: 'MultiLineString',
                    coordinates: contour_line_set.map((contour_line) => {
                        // this isn't really efficient, if we do real WebGL rendering
                        // we may keep this as typed array
                        var values = [];
                        for(var i = 0; i < contour_line.size/2; i++) {
                            values.push([contour_line.get(i, 0), contour_line.get(i, 1)])
                        }
                        return values;
                    })
                }
            })
        }
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
        this.listenTo(this.model, "change:label_steps", () => {
            this.updateLabels()
        })
        this.listenTo(this.model, "change:color", () => {
            // TODO: this is not efficient, but updateColor does not work as it is
            // this.updateColors()
            this.updatePaths()
            this.updateLabels()
        });
        this.listenTo(this.model, "data_updated", () => {
            this.updatePaths()
            this.updateLabels()
        });
    }
    updateColors() {
        const color = this.getColor();
        this.paths
                .data(this.model.thresholds)
                .attr("stroke", this.getColor.bind(this))
        this.d3path.attr("stroke", color)
        this.d3label_group.selectAll("text").attr("fill", color)
    }
    getColor(threshold, index) {
        if(this.model.get('color'))
            return this.model.get('color');
        const model = this.model;
        var colors = this.scales.image.model.color_range;
        var color_scale = d3.scaleLinear()
                                  .range(colors)
                                  .domain(this.scales.image.model.domain);
        const min = this.scales.image.model.domain[0];
        const max = this.scales.image.model.domain[this.scales.image.model.domain.length-1];
        const delta = max - min;
        // a good default color is one that is 50% off from the value of the colormap
        const level_plus_50_percent = ((threshold - min) + delta / 2) % delta + min;
        const color = color_scale(level_plus_50_percent);
        return color;
    }
    createPath(index) {
        const x_scale = this.scales.x, y_scale = this.scales.y;
        const model = this.model;
        var bqplot_transform = d3geo.geoTransform({
            point: function(x, y) {
                // transform x from pixel coordinates to normalized, and then use bqplot's scale
                // TODO: we should respect image's x and y
                this.stream.point(x_scale.scale(x/model.width), y_scale.scale(y/model.height));
            }
          });
        const path = d3geo.geoPath(bqplot_transform)(this.model.contours[index])
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
        this.d3path = this.d3el.append("g");//.attr("stroke", "yellow");
        this.d3label_group = this.d3el.append("g")
        this.updatePaths()
        this.updateLabels()
    }
    updatePaths() {
        this.paths = this.d3el.select("g").selectAll("path").data(this.model.thresholds);
        const enter = this.paths.enter().append("path");
        // we set attrs on the new and existing elements (hence the merge)
        this.paths.merge(enter)
                    .attr("stroke", this.getColor.bind(this))
                    .attr("fill", "none")
                    .attr("d", (threshold, index) => {
                        return this.createPath(index)
                    })
                    .attr("mask", this.mask_id)
            ;
        this.paths.exit().remove();

    }
    updateLabels() {
        const x_scale = this.scales.x, y_scale = this.scales.y;
        const model = this.model;

        this.d3label_group.html(null) // removes all children
        const margin = this.parent.margin;


        this.model.contours.forEach((contour, index) => {
            const color = this.getColor(model.thresholds[index], index);
            const label = String(model.thresholds[index]);
                // http://wiki.geojson.org/GeoJSON_draft_version_6#MultiPolygon
            const is_polygon = contour.type == 'MultiPolygon';
            contour.coordinates.forEach(polygon => {
                // a MultiPolygon is a list of rings
                // http://wiki.geojson.org/GeoJSON_draft_version_6#Polygon
                const linestring_list = is_polygon ? polygon : [polygon]
                linestring_list.forEach((line_list, j) => {
                    // in the case of multipolygons, the beginning and end are the same.
                    const points = is_polygon ? line_list.slice(1) : line_list;
                    var index = 0;
                    const step = this.model.get('label_steps');
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
                        // if the label is upside down, we wanna rotate an extra 180 degrees
                        if(label_angle > 270)
                            label_angle = (label_angle + 180) % 360;
                        if(label_angle > 90)
                            label_angle = (label_angle + 180) % 360;
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
            })
        })
    }
}

ContourModel.serializers = Object.assign({}, bqplot.MarkModel.serializers, {
    image: {deserialize: widgets.unpack_models},
    contour_lines: {deserialize: (obj, manager) => {
        return obj.map((countour_line_set) => countour_line_set.map((contour_line) => {
            let state = {buffer: contour_line.value, dtype: contour_line.dtype, shape: contour_line.shape};
            return jupyter_dataserializers.JSONToArray(state);

        }));
    }}
});

export {
    ContourModel, ContourView
}
