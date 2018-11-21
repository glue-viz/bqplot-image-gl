ipyastroimage
===============================

An ipywidget image widget for mainly astronomical purposes. Used for https://github.com/glue-viz/glue-jupyter

Installation
------------

To install use pip:

    $ pip install ipyastroimage


For a development installation (requires npm),

    $ git clone https://github.com/glue-viz/ipyastroimage.git
    $ cd ipyastroimage
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix ipyastroimage
    $ jupyter nbextension enable --py --sys-prefix ipyastroimage
