# Visual regression tests using Galata

This directory contains visual regression tests for bqplot-image-gl, using Galata.

In order to run them, you need to install dependencies:

```bash
$ conda install -c conda-forge "yarn<2" jupyterlab=3.5.3
$ yarn install$
$ npx playwright install chromium
```

Then start JupyterLab in one terminal (you need to check that it properly starts on port 8988):
```bash
$ yarn run start-jlab
```

Finally, run the galata tests:
```bash
TARGET_URL=http://127.0.0.1:8988 yarn run test
```

If bqplot-image-gl visuals change, you can re-generate reference images by running:
```bash
yarn test:update
```

## Notebooks directory

The `tests/notebooks` directory contains the test notebooks. For most notebooks (*e.g.* `bars.ipynb`, `scatter.ipynb`) Galata will run them cell by cell and take a screenshot of each output, comparing with the reference images.

When running notebooks named `*_update.ipynb`, Galata will always take the first cell output as reference which must contain the plot, later cells will only be used to update the plot, those notebooks are checking that bqplot-image-gl is properly taking updates into account on already-created plots.

## Add a new test

You can add a new test by simply adding a new notebook to the `tests/notebooks` directory and updating the references. If you want to test updating plots, create notebook named `*_update.ipynb`, create a plot in your first cell then update the plot in later cells.


## Updating reference images

In CI, just say 'update galata' (without quotes) in a message to trigger the update of the reference images.