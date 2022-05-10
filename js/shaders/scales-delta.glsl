// these scale transformations use a vec3 for the domain where the last element [2] contains the delta
// where for the log version, it contains log(domain[1]) - log(domain[0]).
// This avoids rounding issues when using float32 math on the GPU, since
// dividing by (domain[1] - domain[0]) can becomes a division by zero when
// domain[1] - is in the range domain[0] * (1 + 1e-8), i.e. the relative float32
// precision.
// Instead, we compute the delta in Javascript, which uses float64.
// This allows us to zoom into a line plot with abound 14 orders of magnitude
// at around 1e15-1e16 we also start seeing rounding issues with float64.

float scale_transform_linear(float domain_value, vec2 range, vec3 domain) {
    float normalized = (domain_value - domain[0]) / (domain[2]);
    float range_value = normalized * (range[1] - range[0]) + range[0];
    return range_value;
}

float scale_transform_linear_inverse(float range_value, vec2 range, vec3 domain) {
    float normalized = (range_value - range[0]) / (range[1] - range[0]);
    float domain_value = normalized * (domain[2]) + domain[0];
    return domain_value;
}

float scale_transform_log(float domain_value, vec2 range, vec3 domain) {
    float normalized = (log(domain_value) - log(domain[0])) / (domain[2]);
    float range_value = normalized * (range[1] - range[0]) + range[0];
    return range_value;
}

float scale_transform_log_inverse(float range_value, vec2 range, vec3 domain) {
    float normalized = (range_value - range[0]) / (range[1] - range[0]);
    float domain_value = exp(normalized * (log(domain[1]) - log(domain[0])) + log(domain[0]));
    return domain_value;
}
