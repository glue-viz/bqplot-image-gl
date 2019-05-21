from ._version import version_info, __version__

from .imagegl import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'bqplot-image-gl',
        'require': 'bqplot-image-gl/extension'
    }]
