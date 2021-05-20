import ipywidgets as widgets
from ipywidgets.widgets import widget_serialization
from traitlets import Unicode, Dict, Instance
from bqplot_image_gl._version import __version__

__all__ = ['ViewListener']


@widgets.register
class ViewListener(widgets.DOMWidget):
    _view_name = Unicode('ViewListener').tag(sync=True)
    _model_name = Unicode('ViewListenerModel').tag(sync=True)
    _view_module = Unicode('bqplot-image-gl').tag(sync=True)
    _model_module = Unicode('bqplot-image-gl').tag(sync=True)
    _view_module_version = Unicode('^' + __version__).tag(sync=True)
    _model_module_version = Unicode('^' + __version__).tag(sync=True)

    widget = Instance(widgets.Widget).tag(sync=True, **widget_serialization)
    css_selector = Unicode(None, allow_none=True).tag(sync=True)
    view_data = Dict().tag(sync=True)
