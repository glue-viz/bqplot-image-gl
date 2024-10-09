from pathlib import Path
import pytest
import ipywidgets as widgets
import playwright.sync_api
from IPython.display import display
import numpy as np



@pytest.mark.parametrize("compression", ["png", "none"])
def test_widget_image(ipywidgets_runner, page_session: playwright.sync_api.Page, assert_solara_snapshot, compression, request):

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

        data = np.array([[0., 1.], [2., 3.]])
        image = ImageGL(image=data, scales=scales_image, compression=compression)

        figure.marks = (image,)

        display(figure)

    ipywidgets_runner(kernel_code, locals=dict(compression=compression))
    svg = page_session.locator(".bqplot")
    svg.wait_for()
    # make sure the image is rendered
    page_session.wait_for_timeout(100)
    # we don't want the compression fixure in the testname, because all screenshots should be the same
    testname = f"{str(Path(request.node.name))}".replace("[", "-").replace("]", "").replace(" ", "-").replace(",", "-")
    testname = testname.replace(f"-{compression}", "")
    assert_solara_snapshot(svg.screenshot(), testname=testname)



@pytest.mark.parametrize("compression", ["png", "none"])
@pytest.mark.parametrize("dtype", [np.uint8, np.float32])
def test_widget_image_rgba(solara_test, page_session: playwright.sync_api.Page, assert_solara_snapshot, compression, request, dtype):

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
        data = data / 255.
    image = ImageGL(image=data, scales=scales_image, compression=compression)

    figure.marks = (image,)

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    # make sure the image is rendered
    page_session.wait_for_timeout(100)
    # we don't want the compression or dtype fixure in the testname, because all screenshots should be the same
    testname = f"{str(Path(request.node.name))}".replace("[", "-").replace("]", "").replace(" ", "-").replace(",", "-")
    testname = testname.replace(f"-{compression}", "")
    testname = testname.replace(f"-{dtype.__name__}", "")
    assert_solara_snapshot(svg.screenshot(), testname=testname)
