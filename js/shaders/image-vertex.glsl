varying vec2 pixel_coordinate;
uniform mat3 transform;

void main(void) {
    vec3 pos3d = transform * position;
    vec2 pos2d = pos3d.xy;// / pos3d.z;
    vec4 view_position = modelViewMatrix * vec4(pos2d.x, pos2d.y, 0., 1.0);
    vec4 view_position2 = modelViewMatrix * vec4(position.x, position.y, 0., 1.0);
    pixel_coordinate = view_position2.xy;
    gl_Position = projectionMatrix * view_position;
}
