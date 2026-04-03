import playwright.sync_api
from IPython.display import display
import numpy as np

from .helpers import visual_ui_test


@visual_ui_test
def test_widget_lines(
    solara_test,
    page_session: playwright.sync_api.Page,
):
    from bqplot import Figure, LinearScale, Axis
    from bqplot_image_gl import LinesGL

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=-1, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    x = np.linspace(0, 1, 200)
    y = np.sin(4 * np.pi * x)

    line = LinesGL(x=x, y=y, scales=scales, colors=["orange"])

    figure = Figure(scales=scales, axes=[axis_x, axis_y], marks=[line])

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(100)
    return svg.screenshot()


@visual_ui_test
def test_widget_lines_two(
    solara_test,
    page_session: playwright.sync_api.Page,
):
    from bqplot import Figure, LinearScale, Axis
    from bqplot_image_gl import LinesGL

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=-1, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    x = np.linspace(0, 1, 200)

    line1 = LinesGL(x=x, y=np.sin(4 * np.pi * x), scales=scales, colors=["orange"])
    line2 = LinesGL(
        x=x, y=np.cos(4 * np.pi * x), scales=scales, colors=["steelblue"],
        stroke_width=3, opacities=[0.6],
    )

    figure = Figure(scales=scales, axes=[axis_x, axis_y], marks=[line1, line2])

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(100)
    return svg.screenshot()
