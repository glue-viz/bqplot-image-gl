// we already have this in scales.glsl in ipyvolume, but not in bqplot
#define SCALE_TYPE_LINEAR 1
#define SCALE_TYPE_LOG 2

#ifdef USE_SCALE_X
    uniform vec3 domain_x;
    uniform vec2 range_x;
    #if SCALE_TYPE_x == SCALE_TYPE_LINEAR
        #define SCALE_X(x) scale_transform_linear(x, range_x, domain_x)
    #elif SCALE_TYPE_x == SCALE_TYPE_LOG
        #define SCALE_X(x) scale_transform_log(x, range_x, domain_x)
    #endif
#endif

#ifdef USE_SCALE_Y
    uniform vec3 domain_y;
    uniform vec2 range_y;
    #if SCALE_TYPE_y == SCALE_TYPE_LINEAR
        #define SCALE_Y(x) scale_transform_linear(x, range_y, domain_y)
    #elif SCALE_TYPE_y == SCALE_TYPE_LOG
        #define SCALE_Y(x) scale_transform_log(x, range_y, domain_y)
    #endif
#endif
