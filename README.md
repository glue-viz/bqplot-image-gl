# bqplot-image-gl

An ipywidget image widget for showing images in bqplot using WebGL.
Used for https://github.com/glue-viz/glue-jupyter

(currently requires latest developer version of bqplot)

# Installation

To install use pip:

    $ pip install bqplot-image-gl

# Installation (developers)

    # make sure you have node
    $ conda install -c conda-forge nodejs

    # clone the repo
    $ git clone https://github.com/glue-viz/bqplot-image-gl.git
    $ cd bqplot-image-gl

    # install in dev mode
    $ pip install -e .
    # symlink the share/jupyter/nbextensions/bqplot-image-gl directory
    $ jupyter nbextension install --py --symlink --sys-prefix --overwrite bqplot_image_gl
    # enable the extension (normally done by copying the .json in your prefix)
    $ jupyter nbextension enable --py --sys-prefix bqplot_image_gl
    # for jupyterlab (>=3.0), symlink share/jupyter/labextensions/bqplot-image-gl
    $ jupyter labextension develop . --overwrite

## workflow for notebook

    $ (cd js; npm run watch:nbextension)
    # make changes and wait for bundle to automatically rebuild
    # reload jupyter notebook

## workflow for lab

    $ (cd js; npm run watch:labextension)
    # make changes and wait for bundle to automatically rebuild
    # reload jupyterlab
