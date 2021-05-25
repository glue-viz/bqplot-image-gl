import ipywidgets as widgets
import bqplot
from traitlets import Unicode
from bqplot_image_gl._version import __version__

__all__ = ['LinesGL']


@widgets.register
class LinesGL(bqplot.Lines):
    """An example widget."""
    _view_name = Unicode('LinesGLView').tag(sync=True)
    _model_name = Unicode('LinesGLModel').tag(sync=True)
    _view_module = Unicode('bqplot-image-gl').tag(sync=True)
    _model_module = Unicode('bqplot-image-gl').tag(sync=True)
    _view_module_version = Unicode('^' + __version__).tag(sync=True)
    _model_module_version = Unicode('^' + __version__).tag(sync=True)
