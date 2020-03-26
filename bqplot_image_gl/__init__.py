from ._version import version_info, __version__  # noqa

from .imagegl import *  # noqa


def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'bqplot-image-gl',
        'require': 'bqplot-image-gl/extension'
    }]
