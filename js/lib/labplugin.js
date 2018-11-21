var jupyter_astroimage = require('./astroimage');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'jupyter-astroimage',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'jupyter-astroimage',
          version: jupyter_astroimage.version,
          exports: jupyter_astroimage
      });
  },
  autoStart: true
};

