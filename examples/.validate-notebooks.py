import os
import glob

import nbformat
from nbconvert.preprocessors import ExecutePreprocessor

for notebook in glob.glob('**/*.ipynb', recursive=True):

    # FIXME: the contour notebook needs a data.json file which is missing
    if 'contour' in notebook:
        continue

    print("Running {0}".format(notebook))

    with open(notebook) as f:
        nb = nbformat.read(f, as_version=4)

    ep = ExecutePreprocessor(timeout=600, kernel_name='python3')
    ep.preprocess(nb, {'metadata': {'path': os.path.dirname(notebook)}})
