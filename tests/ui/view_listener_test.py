import playwright.sync_api
from IPython.display import display

from .helpers import HAS_VISUAL_TEST_DEPS

import pytest

pytestmark = pytest.mark.skipif(not HAS_VISUAL_TEST_DEPS, reason="missing visual test deps")


def test_view_listener_reports_dimensions(
    solara_test,
    page_session: playwright.sync_api.Page,
):
    """ViewListener should populate view_data with position and size info."""
    import ipywidgets as widgets
    from bqplot import Figure, LinearScale, Axis
    from bqplot_image_gl.viewlistener import ViewListener

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=0, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    figure = Figure(scales=scales, axes=[axis_x, axis_y])

    listener = ViewListener(widget=figure)

    # Display both widgets together so solara renders them in a single mount
    display(widgets.VBox([figure, listener]))

    page_session.locator(".bqplot").wait_for()
    # Wait for the ViewListener to render JSON with dimension data.
    # The JS view renders a <pre> block with the view_data JSON once
    # the ResizeObserver fires and the round-trip completes.
    page_session.locator("pre:has-text('width')").wait_for(timeout=10000)
