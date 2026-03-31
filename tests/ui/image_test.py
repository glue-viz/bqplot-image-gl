import playwright.sync_api
from IPython.display import display
import numpy as np

from .helpers import visual_ui_test


@visual_ui_test
def test_widget_image(
    ipywidgets_runner,
    page_session: playwright.sync_api.Page,
):
    def kernel_code():
        import numpy as np
        from bqplot import Figure, LinearScale, Axis, ColorScale
        from bqplot_image_gl import ImageGL

        scale_x = LinearScale(min=0, max=1)
        scale_y = LinearScale(min=0, max=1)
        scales = {"x": scale_x, "y": scale_y}
        axis_x = Axis(scale=scale_x, label="x")
        axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

        figure = Figure(scales=scales, axes=[axis_x, axis_y])

        scales_image = {"x": scale_x, "y": scale_y, "image": ColorScale(min=0, max=2)}

        data = np.array([[0.0, 1.0], [2.0, 3.0]])
        image = ImageGL(image=data, scales=scales_image)

        figure.marks = (image,)

        display(figure)

    ipywidgets_runner(kernel_code)
    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(100)
    return svg.screenshot()


@visual_ui_test
def test_widget_image_rgba(
    solara_test,
    page_session: playwright.sync_api.Page,
):
    from bqplot import Figure, LinearScale, Axis, ColorScale
    from bqplot_image_gl import ImageGL

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=0, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    figure = Figure(scales=scales, axes=[axis_x, axis_y])

    scales_image = {"x": scale_x, "y": scale_y, "image": ColorScale(min=0, max=2)}

    # four pixels, red, green, blue, and transparent
    red = [255, 0, 0, 255]
    green = [0, 255, 0, 255]
    blue = [0, 0, 255, 255]
    transparent = [0, 0, 0, 0]
    data = np.array([[red, green], [blue, transparent]], dtype=np.uint8)
    image = ImageGL(image=data, scales=scales_image)

    figure.marks = (image,)

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(100)
    return svg.screenshot()


@visual_ui_test
def test_widget_image_rgba_transparent_no_color_leak(
    solara_test,
    page_session: playwright.sync_api.Page,
):
    """Regression test: RGBA pixels with non-zero RGB but zero alpha must not leak color.

    Before the fix, the pre-multiplied alpha blending in the shader did not
    account for the per-pixel alpha in RGBA textures, causing RGB values of
    fully transparent pixels to bleed into the framebuffer.
    """
    from bqplot import Figure, LinearScale, Axis, ColorScale
    from bqplot_image_gl import ImageGL

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=0, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    figure = Figure(scales=scales, axes=[axis_x, axis_y])

    scales_image = {"x": scale_x, "y": scale_y, "image": ColorScale(min=0, max=2)}

    # A green background covering the full plot area
    green_bg = np.array([[[0, 255, 0, 255]]], dtype=np.uint8)
    bg = ImageGL(image=green_bg, scales=scales_image, x=[0, 1], y=[0, 1])

    # Foreground: bright red RGB but fully transparent alpha.
    # Before the fix this red would leak through and tint the green background.
    red_transparent = np.array([[[255, 0, 0, 0]]], dtype=np.uint8)
    fg = ImageGL(
        image=red_transparent,
        scales=scales_image,
        x=[0, 1],
        y=[0, 1],
    )

    figure.marks = (bg, fg)

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(100)
    return svg.screenshot()
