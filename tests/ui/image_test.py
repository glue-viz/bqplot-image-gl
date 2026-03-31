from pathlib import Path
import pytest
import playwright.sync_api
from IPython.display import display
import numpy as np


@pytest.mark.parametrize("compression", ["png", "none"])
def test_widget_image(
    ipywidgets_runner,
    page_session: playwright.sync_api.Page,
    assert_solara_snapshot,
    compression,
    request,
):
    def kernel_code(compression=compression):
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
        image = ImageGL(image=data, scales=scales_image, compression=compression)

        figure.marks = (image,)

        display(figure)

    ipywidgets_runner(kernel_code, locals=dict(compression=compression))
    svg = page_session.locator(".bqplot")
    svg.wait_for()
    # make sure the image is rendered
    page_session.wait_for_timeout(100)
    # we don't want the compression fixure in the testname, because all screenshots should be the same
    testname = (
        f"{str(Path(request.node.name))}".replace("[", "-")
        .replace("]", "")
        .replace(" ", "-")
        .replace(",", "-")
    )
    testname = testname.replace(f"-{compression}", "")
    assert_solara_snapshot(svg.screenshot(), testname=testname)


@pytest.mark.parametrize("compression", ["png", "none"])
@pytest.mark.parametrize("dtype", [np.uint8, np.float32])
def test_widget_image_rgba(
    solara_test,
    page_session: playwright.sync_api.Page,
    assert_solara_snapshot,
    compression,
    request,
    dtype,
):
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

    # four pixels, red, green, blue, and transparent
    red = [255, 0, 0, 255]
    green = [0, 255, 0, 255]
    blue = [0, 0, 255, 255]
    transparent = [0, 0, 0, 0]
    data = np.array([[red, green], [blue, transparent]], dtype=dtype)
    if dtype == np.float32:
        data = data / 255.0
    image = ImageGL(image=data, scales=scales_image, compression=compression)

    figure.marks = (image,)

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    # make sure the image is rendered
    page_session.wait_for_timeout(100)
    # we don't want the compression or dtype fixure in the testname, because all screenshots should be the same
    testname = (
        f"{str(Path(request.node.name))}".replace("[", "-")
        .replace("]", "")
        .replace(" ", "-")
        .replace(",", "-")
    )
    testname = testname.replace(f"-{compression}", "")
    testname = testname.replace(f"-{dtype.__name__}", "")
    assert_solara_snapshot(svg.screenshot(), testname=testname)


@pytest.mark.parametrize("compression", ["png", "none"])
@pytest.mark.parametrize("dtype", [np.uint8, np.float32])
def test_widget_image_rgba_transparent_no_color_leak(
    solara_test,
    page_session: playwright.sync_api.Page,
    assert_solara_snapshot,
    compression,
    request,
    dtype,
):
    """Regression test: RGBA pixels with non-zero RGB but zero alpha must not leak color.

    Before the fix, the pre-multiplied alpha blending in the shader did not
    account for the per-pixel alpha in RGBA textures, causing RGB values of
    fully transparent pixels to bleed into the framebuffer.
    """
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

    # A green background covering the full plot area
    green_bg = np.array([[[0, 255, 0, 255]]], dtype=np.uint8)
    if dtype == np.float32:
        green_bg = green_bg.astype(np.float32) / 255.0
    bg = ImageGL(
        image=green_bg, scales=scales_image, x=[0, 1], y=[0, 1], compression=compression
    )

    # Foreground: bright red RGB but fully transparent alpha.
    # Before the fix this red would leak through and tint the green background.
    red_transparent = np.array([[[255, 0, 0, 0]]], dtype=np.uint8)
    if dtype == np.float32:
        red_transparent = red_transparent.astype(np.float32) / 255.0
    fg = ImageGL(
        image=red_transparent,
        scales=scales_image,
        x=[0, 1],
        y=[0, 1],
        compression=compression,
    )

    figure.marks = (bg, fg)

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(100)
    testname = (
        f"{str(Path(request.node.name))}".replace("[", "-")
        .replace("]", "")
        .replace(" ", "-")
        .replace(",", "-")
    )
    testname = testname.replace(f"-{compression}", "")
    testname = testname.replace(f"-{dtype.__name__}", "")
    assert_solara_snapshot(svg.screenshot(), testname=testname)
