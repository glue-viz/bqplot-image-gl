from .astroimage import AstroImage
import numpy as np
import bqplot

def test_astro_image():
    data = np.zeros((2,3))
    color_scale = bqplot.ColorScale()
    scale_x = bqplot.LinearScale()
    scale_y = bqplot.LinearScale()
    image = AstroImage(image=data, scales={'image': color_scale, 'x': scale_x, 'y': scale_y})