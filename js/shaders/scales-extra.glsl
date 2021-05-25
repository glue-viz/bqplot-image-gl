// we already have this in scales.glsl in ipyvolume, but not in bqplot
#define SCALE_TYPE_LINEAR 1
#define SCALE_TYPE_LOG 2

#ifdef USE_SCALE_X
    uniform vec2 domain_x;
    #if SCALE_TYPE_x == SCALE_TYPE_LINEAR
        #define SCALE_X(x) scale_transform_linear(x, vec2(-0.5, 0.5), domain_x)
    #elif SCALE_TYPE_x == SCALE_TYPE_LOG
        #define SCALE_X(x) scale_transform_log(x, vec2(-0.5, 0.5), domain_x)
    #endif
#endif

#ifdef USE_SCALE_Y
    uniform vec2 domain_y;
    #if SCALE_TYPE_y == SCALE_TYPE_LINEAR
        #define SCALE_Y(x) scale_transform_linear(x, vec2(-0.5, 0.5), domain_y)
    #elif SCALE_TYPE_y == SCALE_TYPE_LOG
        #define SCALE_Y(x) scale_transform_log(x, vec2(-0.5, 0.5), domain_y)
    #endif
#endif
