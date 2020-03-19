import ipywidgets as widgets
from traitlets import Unicode
import bqplot
from traittypes import Array
from bqplot.traits import (array_serialization, array_squeeze)
from traitlets import (Int, Unicode, List, Enum, Dict, Bool, Float,
                       Instance, TraitError, validate)
from bqplot.marks import shape
from bqplot.traits import array_to_json

@widgets.register
class ImageGL(bqplot.Mark):
    """An example widget."""
    _view_name = Unicode('ImageGLView').tag(sync=True)
    _model_name = Unicode('ImageGLModel').tag(sync=True)
    _view_module = Unicode('bqplot-image-gl').tag(sync=True)
    _model_module = Unicode('bqplot-image-gl').tag(sync=True)
    _view_module_version = Unicode('^0.3.0').tag(sync=True)
    _model_module_version = Unicode('^0.3.0').tag(sync=True)

    image = Array().tag(sync=True,
                        scaled=True,
                        rtype='Color',
                        atype='bqplot.ColorAxis',
                        **array_serialization)
    interpolation = Unicode('nearest', allow_none=True).tag(sync=True)
    opacity = Float(1.0).tag(sync=True)
    x = Array(default_value=(0, 1)).tag(sync=True, scaled=True,
                                        rtype='Number',
                                        atype='bqplot.Axis',
                                        **array_serialization)\
        .valid(array_squeeze, shape(2))
    y = Array(default_value=(0, 1)).tag(sync=True, scaled=True,
                                        rtype='Number',
                                        atype='bqplot.Axis',
                                        **array_serialization)\
        .valid(array_squeeze, shape(2))
    scales_metadata = Dict({
        'x': {'orientation': 'horizontal', 'dimension': 'x'},
        'y': {'orientation': 'vertical', 'dimension': 'y'},
        'image': {'dimension': 'color'},
    }).tag(sync=True)



def double_list_array_from_json(double_list):
    return [[array_from_json(k) for k in array_list] for array_list in double_list]


def double_list_array_to_json(double_list, obj=None):
    return [[array_to_json(k) for k in array_list] for array_list in double_list]


double_list_array_serialization = dict(to_json=double_list_array_to_json,
                                       from_json=double_list_array_from_json)


@widgets.register
class Contour(bqplot.Mark):
    _view_name = Unicode('ContourView').tag(sync=True)
    _model_name = Unicode('ContourModel').tag(sync=True)
    _view_module = Unicode('bqplot-image-gl').tag(sync=True)
    _model_module = Unicode('bqplot-image-gl').tag(sync=True)
    _view_module_version = Unicode('^0.3.0').tag(sync=True)
    _model_module_version = Unicode('^0.3.0').tag(sync=True)

    image = Instance(ImageGL, allow_none=True).tag(sync=True, **widgets.widget_serialization)
    label_steps = Int(40).tag(sync=True)
    contour_lines = List(List(Array(None, allow_none=True))).tag(sync=True,
        **double_list_array_serialization)
    level = (Float() | List(Float())).tag(sync=True)
    color = widgets.Color(None, allow_none=True).tag(sync=True)
    scales_metadata = Dict({
        'x': {'orientation': 'horizontal', 'dimension': 'x'},
        'y': {'orientation': 'vertical', 'dimension': 'y'},
    }).tag(sync=True)
