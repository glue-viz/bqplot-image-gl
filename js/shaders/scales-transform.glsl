    // added by bqplot-image-gl
    vec3 instanceStart_transformed = instanceStart;
    vec3 instanceEnd_transformed = instanceEnd;
    instanceStart_transformed.x = SCALE_X(instanceStart_transformed.x);
    instanceStart_transformed.y = SCALE_Y(instanceStart_transformed.y);
    instanceEnd_transformed.x = SCALE_X(instanceEnd_transformed.x);
    instanceEnd_transformed.y = SCALE_Y(instanceEnd_transformed.y);
    vec4 start = modelViewMatrix * vec4( instanceStart_transformed, 1.0 );
    vec4 end = modelViewMatrix * vec4( instanceEnd_transformed, 1.0 );


    // added by bqplot-image-gl
