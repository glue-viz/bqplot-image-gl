from ._version import version_info, __version__

from .astroimage import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'jupyter-astroimage',
        'require': 'jupyter-astroimage/extension'
    }]
