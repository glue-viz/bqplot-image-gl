import pytest
import playwright.sync_api
from IPython.display import display
import numpy as np

from .helpers import visual_ui_test


@pytest.mark.parametrize("show_handles", [False, True])
@visual_ui_test
def test_brush_rectangle_selector(
    solara_test,
    page_session: playwright.sync_api.Page,
    show_handles,
):
    """Regression test: BrushRectangleSelector must render a visible selection.

    This broke when d3 was bumped from v5 to v7, because the d3-brush
    event handling changed in d3 v6+ (d3.event was removed).
    """
    from bqplot import Figure, LinearScale, Axis, ColorScale
    from bqplot_image_gl import ImageGL
    from bqplot_image_gl.interacts import BrushRectangleSelector

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=0, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    scales_image = {"x": scale_x, "y": scale_y, "image": ColorScale(min=0, max=1)}

    data = np.full((64, 64), 0.5)
    image = ImageGL(image=data, scales=scales_image)

    brush = BrushRectangleSelector(x_scale=scale_x, y_scale=scale_y, show_handles=show_handles)
    brush.selected_x = [0.2, 0.8]
    brush.selected_y = [0.3, 0.7]

    figure = Figure(scales=scales, axes=[axis_x, axis_y], interaction=brush)
    figure.marks = (image,)

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(500)
    return svg.screenshot()


@pytest.mark.parametrize("show_handles", [False, True])
@visual_ui_test
def test_brush_ellipse_selector(
    solara_test,
    page_session: playwright.sync_api.Page,
    show_handles,
):
    """Regression test: BrushEllipseSelector must render a visible selection.

    This broke when d3 was bumped from v5 to v7, because the d3-brush
    event handling changed in d3 v6+ (d3.event was removed).
    """
    from bqplot import Figure, LinearScale, Axis, ColorScale
    from bqplot_image_gl import ImageGL
    from bqplot_image_gl.interacts import BrushEllipseSelector

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=0, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    scales_image = {"x": scale_x, "y": scale_y, "image": ColorScale(min=0, max=1)}

    data = np.full((64, 64), 0.5)
    image = ImageGL(image=data, scales=scales_image)

    brush = BrushEllipseSelector(x_scale=scale_x, y_scale=scale_y, show_handles=show_handles)
    brush.selected_x = [0.2, 0.8]
    brush.selected_y = [0.3, 0.7]

    figure = Figure(scales=scales, axes=[axis_x, axis_y], interaction=brush)
    figure.marks = (image,)

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(500)
    return svg.screenshot()
