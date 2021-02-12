from __future__ import print_function
from os.path import join as pjoin
from setuptools import setup, find_packages, Command
import os

from jupyter_packaging import (
    create_cmdclass,
    install_npm,
    ensure_targets,
    combine_commands,
    get_version,
    skip_if_exists,
)

LONG_DESCRIPTION = 'An ipywidget image widget for astronomical purposes'
here = os.path.dirname(os.path.abspath(__file__))
name = 'bqplot-image-gl'
package_name = name.replace('-', '_')
version = get_version(pjoin(package_name, '_version.py'))

js_dir = pjoin(here, 'js')

# Representative files that should exist after a successful build
jstargets = [
    pjoin('share', 'jupyter', 'nbextensions', f'{name}', 'index.js'),
    # pjoin('share', 'jupyter', 'labextensions', f'{name}', 'package.json'),
]

data_files_spec = [
    (f'share/jupyter/nbextensions/{name}', f'share/jupyter/nbextensions/{name}', '*.js'),
    (f'share/jupyter/labextensions/{name}/', f'share/jupyter/labextensions/{name}/', '**'),
    (f'etc/jupyter/nbconfig/notebook.d', f'etc/jupyter/nbconfig/notebook.d', f'{name}.json'),
]

js_command = combine_commands(
    install_npm(js_dir, build_dir='share/jupyter/', source_dir='js/src', build_cmd='build'), ensure_targets(jstargets),
)

cmdclass = create_cmdclass('jsdeps', data_files_spec=data_files_spec)
is_repo = os.path.exists(os.path.join(here, '.git'))
if is_repo:
    cmdclass['jsdeps'] = js_command
else:
    cmdclass['jsdeps'] = skip_if_exists(jstargets, js_command)

setup(
    name=name,
    version=version,
    description='An ipywidget image widget for astronomical purposes',
    long_description=LONG_DESCRIPTION,
    include_package_data=True,
    install_requires=[
        'ipywidgets>=7.0.0',
        'bqplot>=0.12'
    ],
    packages=find_packages(),
    zip_safe=False,
    cmdclass=cmdclass,
    author='Maarten A. Breddels',
    author_email='maartenbreddels@gmail.com',
    url='https://github.com/glue-viz/bqplot-image-gl',
    keywords=[
        'ipython',
        'jupyter',
        'widgets',
    ],
    classifiers=[
        'Development Status :: 4 - Beta',
        'Framework :: IPython',
        'Intended Audience :: Developers',
        'Intended Audience :: Science/Research',
        'Topic :: Multimedia :: Graphics',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
    ],
)
