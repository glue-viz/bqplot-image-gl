from pathlib import Path
import pytest
import ipywidgets as widgets
import playwright.sync_api
from IPython.display import display
import numpy as np
from bqplot import Figure, LinearScale, Axis, ColorScale
from bqplot_image_gl import ImageGL, Contour


@pytest.mark.parametrize("compression", ["png", "none"])
def test_widget_image(solara_test, page_session: playwright.sync_api.Page, assert_solara_snapshot, compression, request):

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=0, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    figure = Figure(scales=scales, axes=[axis_x, axis_y])

    scales_image = {"x": scale_x, "y": scale_y, "image": ColorScale(min=0, max=2)}

    x = np.linspace(0, 1, 128)
    y = np.linspace(0, 1, 256)
    X, Y = np.meshgrid(x, y)
    data = 5. * np.sin(2 * np.pi * (X + Y**2))

    image = ImageGL(image=data, scales=scales_image, compression=compression)
    contour = Contour(image=image, level=[2, 4], scales=scales_image)


    figure.marks = (image, contour)

    display(figure)


    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(100)
    # although the contour is almost the same, due to precision issues, the image is slightly different
    # therefore unlike the image_test, we use a different testname/image name based on the fixture value
    # for compression
    assert_solara_snapshot(svg.screenshot())
