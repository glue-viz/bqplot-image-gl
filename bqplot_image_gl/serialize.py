from PIL import Image
import numpy as np
import io

from bqplot.traits import array_serialization


def array_to_image_or_array(array, widget):
    if widget.compression in ["png", "webp"]:
        return array_to_image(array, widget.compression)
    else:
        return array_serialization["to_json"](array, widget)


def not_implemented(image):
    # the widget never sends the image data back to the kernel
    raise NotImplementedError("deserializing is not implemented yet")


def array_to_image(array, image_format):
    # convert the array to a png image with intensity values only
    array = np.array(array, copy=False)
    min, max = None, None
    use_colormap = False
    if array.ndim == 2:
        use_colormap = True
        min = np.nanmin(array)
        max = np.nanmax(array)

        array = (array - min) / (max - min)
        # only convert to uint8 if the array is float
        if array.dtype.kind == "f":
            array_bytes = (array * 255).astype(np.uint8)
        else:
            array_bytes = array
        intensity_image = Image.fromarray(array_bytes, mode="L")

        # create a mask image with 0 for NaN values and 255 for valid values
        isnan = ~np.isnan(array)
        mask = (isnan * 255).astype(np.uint8)
        mask_image = Image.fromarray(mask, mode="L")

        # merge the intensity and mask image into a single image
        image = Image.merge("LA", (intensity_image, mask_image))
    else:
        # if floats, convert to uint8
        if array.dtype.kind == "f":
            array_bytes = (array * 255).astype(np.uint8)
        elif array.dtype == np.uint8:
            array_bytes = array
        else:
            raise ValueError(
                "Only float arrays or uint8 arrays are supported, your array has dtype"
                "{array.dtype}"
            )
        if array.shape[2] == 3:
            image = Image.fromarray(array_bytes, mode="RGB")
        elif array.shape[2] == 4:
            image = Image.fromarray(array_bytes, mode="RGBA")
        else:
            raise ValueError(
                "Only 2D arrays or 3D arrays with 3 or 4 channels are supported, "
                f"your array has shape {array.shape}"
            )

    # and serialize it to a PNG
    png_data = io.BytesIO()
    image.save(png_data, format=image_format, lossless=True)
    png_bytes = png_data.getvalue()
    original_byte_length = array.nbytes
    uint8_byte_length = array_bytes.nbytes
    compressed_byte_length = len(png_bytes)
    return {
        "type": "image",
        "format": image_format,
        "use_colormap": use_colormap,
        "min": min,
        "max": max,
        "data": png_bytes,
        # this metadata is only useful/needed for debugging
        "shape": array.shape,
        "info": {
            "original_byte_length": original_byte_length,
            "uint8_byte_length": uint8_byte_length,
            "compressed_byte_length": compressed_byte_length,
            "compression_ratio": original_byte_length / compressed_byte_length,
            "MB": {
                "original": original_byte_length / 1024 / 1024,
                "uint8": uint8_byte_length / 1024 / 1024,
                "compressed": compressed_byte_length / 1024 / 1024,
            },
        },
    }


image_data_serialization = dict(
    to_json=array_to_image_or_array, from_json=not_implemented
)
