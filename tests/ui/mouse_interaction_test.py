import playwright.sync_api
from IPython.display import display

from .helpers import HAS_VISUAL_TEST_DEPS

import pytest

pytestmark = pytest.mark.skipif(
    not HAS_VISUAL_TEST_DEPS, reason="missing visual test deps"
)


def test_mouse_interaction_click(
    solara_test,
    page_session: playwright.sync_api.Page,
):
    """MouseInteraction should report click events with domain coordinates."""
    from bqplot import Figure, LinearScale, Axis
    from bqplot_image_gl.interacts import MouseInteraction

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=0, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    events_received = []

    mouse = MouseInteraction(x_scale=scale_x, y_scale=scale_y, events=["click"])
    mouse.on_msg(lambda widget, content, buffers: events_received.append(content))

    figure = Figure(scales=scales, axes=[axis_x, axis_y], interaction=mouse)

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(200)

    # Click roughly in the center of the plot area
    box = svg.bounding_box()
    svg.click(position={"x": box["width"] // 2, "y": box["height"] // 2})
    page_session.wait_for_timeout(200)

    assert len(events_received) >= 1
    event = events_received[0]
    assert event["event"] == "click"
    assert "domain" in event
    assert "pixel" in event
    # Domain coordinates should be roughly in the middle of 0-1
    assert 0.2 < event["domain"]["x"] < 0.8
    assert 0.2 < event["domain"]["y"] < 0.8


def test_mouse_interaction_mousemove(
    solara_test,
    page_session: playwright.sync_api.Page,
):
    """MouseInteraction should report mousemove events when enabled."""
    from bqplot import Figure, LinearScale, Axis
    from bqplot_image_gl.interacts import MouseInteraction

    scale_x = LinearScale(min=0, max=1)
    scale_y = LinearScale(min=0, max=1)
    scales = {"x": scale_x, "y": scale_y}
    axis_x = Axis(scale=scale_x, label="x")
    axis_y = Axis(scale=scale_y, label="y", orientation="vertical")

    events_received = []

    mouse = MouseInteraction(
        x_scale=scale_x, y_scale=scale_y, events=["mousemove"], move_throttle=0
    )
    mouse.on_msg(lambda widget, content, buffers: events_received.append(content))

    figure = Figure(scales=scales, axes=[axis_x, axis_y], interaction=mouse)

    display(figure)

    svg = page_session.locator(".bqplot")
    svg.wait_for()
    page_session.wait_for_timeout(200)

    # Move mouse across the plot area
    box = svg.bounding_box()
    x_start = int(box["width"] * 0.3)
    x_end = int(box["width"] * 0.7)
    y_mid = int(box["height"] // 2)
    page_session.mouse.move(box["x"] + x_start, box["y"] + y_mid)
    page_session.mouse.move(box["x"] + x_end, box["y"] + y_mid)
    page_session.wait_for_timeout(200)

    assert len(events_received) >= 1
    assert all(e["event"] == "mousemove" for e in events_received)
