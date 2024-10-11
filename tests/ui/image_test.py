import ipywidgets as widgets
import playwright.sync_api
from IPython.display import display



def test_widget_image(ipywidgets_runner, page_session: playwright.sync_api.Page, assert_solara_snapshot):

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

        data = np.array([[0., 1.], [2., 3.]])
        image = ImageGL(image=data, scales=scales_image)

        figure.marks = (image,)

        display(figure)

    ipywidgets_runner(kernel_code)
    svg = page_session.locator(".bqplot")
    svg.wait_for()
    # make sure the image is rendered
    page_session.wait_for_timeout(100)
    assert_solara_snapshot(svg.screenshot())
