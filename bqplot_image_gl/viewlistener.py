import ipywidgets as widgets
from ipywidgets.widgets import widget_serialization
from traitlets import Unicode, Dict, Instance
from bqplot_image_gl._version import __version__
from typing import cast, Dict as DictType
from typing_extensions import TypedDict

__all__ = ['ViewListener']


class ViewDataEntry(TypedDict):
    x: float
    y: float
    width: float
    height: float
    resized_at: str  # ISO 8601
    focused_at: str  # ISO 8601


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
    view_data = Dict(value_trait=cast(DictType[str, ViewDataEntry], {})).tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.on_msg(self._on_custom_msg)

    def _on_custom_msg(self, widget, content, buffers=None):
        if content.get('event', '') == 'set_view_data':
            id = content['id']
            data = content['data']
            self.view_data = {**self.view_data, id: data}
        elif content.get('event', '') == 'remove_view_data':
            id = content['id']
            new_view_data = {k: v for k, v in self.view_data.items() if k != id}
            self.view_data = new_view_data
