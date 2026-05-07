var {loadBqplotGL} = require("./bqplot-gl-loader");

function is_bqplot_013_figure(fig) {
    return Boolean(fig.extras);
}

function get_bqplot_012_plotarea(fig) {
    return {
        width: fig.plotarea_width,
        height: fig.plotarea_height,
    };
}

function get_bqplot_013_plotarea(fig) {
    return {
        width: fig.plotareaWidth,
        height: fig.plotareaHeight,
    };
}

function register_bqplot_013_webgl_mark(mark_view) {
    var marks = mark_view.parent.extras && mark_view.parent.extras.webGLMarks;
    if(marks && marks.indexOf(mark_view) === -1) {
        marks.push(mark_view);
    }
}

function ensure_bqplot_013_webgl_figure(mark_view) {
    var fig = mark_view.parent;
    if(!is_bqplot_013_figure(fig)) {
        return Promise.resolve();
    }
    if(fig.extras.webGLRequestRender) {
        register_bqplot_013_webgl_mark(mark_view);
        return Promise.resolve();
    }
    return loadBqplotGL().then((bqplot_gl) => {
        if(!bqplot_gl.initializeBqplotFigure) {
            throw new Error("bqplot-gl did not export initializeBqplotFigure.");
        }
        bqplot_gl.initializeBqplotFigure(fig);
        register_bqplot_013_webgl_mark(mark_view);
    });
}

function request_bqplot_012_webgl_render(fig) {
    if(fig.update_gl) {
        fig.update_gl();
    }
}

function request_bqplot_013_webgl_render(fig) {
    if(fig.extras.webGLRequestRender) {
        fig.extras.webGLRequestRender();
    }
    // bqplot 0.13 creates Figure.extras before bqplot-gl has installed
    // the request-render hook; early draw calls during super.render()
    // are replayed after initialization.
}

function request_webgl_render(mark_view) {
    var fig = mark_view.parent;
    if(is_bqplot_013_figure(fig)) {
        request_bqplot_013_webgl_render(fig);
    } else {
        request_bqplot_012_webgl_render(fig);
    }
}

export {
    ensure_bqplot_013_webgl_figure,
    get_bqplot_012_plotarea,
    get_bqplot_013_plotarea,
    is_bqplot_013_figure,
    request_webgl_render,
};
