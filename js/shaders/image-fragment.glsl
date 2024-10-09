#include <scales>

varying vec2 pixel_coordinate;
uniform sampler2D image;
uniform sampler2D colormap;
uniform float color_min;
uniform float color_max;
uniform float opacity;

uniform vec2 range_x;
uniform vec2 range_y;

uniform vec2 domain_x;
uniform vec2 domain_y;

uniform vec2 image_domain_x;
uniform vec2 image_domain_y;

uniform vec2 range_image;


bool isnan(float val)
{
  return (val < 0.0 || 0.0 < val || val == 0.0) ? false : true;
}



void main(void) {
    // bring pixels(range) to world space (domain)
    float x_domain_value = scale_transform_linear_inverse(pixel_coordinate.x, range_x, domain_x);
    float y_domain_value = scale_transform_linear_inverse(pixel_coordinate.y, range_y, domain_y);
    // normalize the coordinates for the texture
    float x_normalized   = scale_transform_linear(x_domain_value, vec2(0., 1.), image_domain_x);
    float y_normalized   = scale_transform_linear(y_domain_value, vec2(0., 1.), image_domain_y);
    vec2 tex_uv = vec2(x_normalized, y_normalized);
#ifdef USE_COLORMAP
    // r (or g or b) is used for the value, alpha for the mask (is 0 if a nan is found)
    vec2 pixel_value = texture2D(image, tex_uv).ra;
    float raw_value = pixel_value[0] * (range_image[1] - range_image[0]) + range_image[0];
    float opacity_image = pixel_value[1];
    float value = (raw_value - color_min) / (color_max - color_min);
    vec4 color;
    if(isnan(value)) // nan's are interpreted as missing values, and 'not shown'
        color = vec4(0., 0., 0., 0.);
    else
        color = texture2D(colormap, vec2(value, 0.5));
#else
    vec4 color = texture2D(image, tex_uv);
    float opacity_image = 1.0;
#endif
    // since we're working with pre multiplied colors (regarding blending)
    // we also need to multiply rgb by opacity
    gl_FragColor = color * opacity * opacity_image;
}
