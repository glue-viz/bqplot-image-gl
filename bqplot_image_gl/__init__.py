from ._version import version_info, __version__  # noqa

from .imagegl import *  # noqa


def _prefix():
    import sys
    from pathlib import Path
    prefix = sys.prefix
    here = Path(__file__).parent
    # for when in dev mode
    if (here.parent / 'share/jupyter/nbextensions/bqplot-image-gl').exists():
        prefix = here.parent
    return prefix


def _jupyter_labextension_paths():
    return [{
        'src': f'{_prefix()}/share/jupyter/labextensions/bqplot-image-gl/',
        'dest': 'bqplot-image-gl',
    }]


def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': f'{_prefix()}/share/jupyter/nbextensions/bqplot-image-gl/',
        'dest': 'bqplot-image-gl',
        'require': 'bqplot-image-gl/extension'
    }]
