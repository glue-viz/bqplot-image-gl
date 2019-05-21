var bqplot_gl_image = require('./imagegl');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'bqplot-image-gl',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'bqplot-image-gl',
          version: bqplot_gl_image.version,
          exports: bqplot_gl_image
      });
  },
  autoStart: true
};
