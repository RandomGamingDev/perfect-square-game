precision mediump float;

varying vec2 vTexCoord;
uniform float yx_ratio;
uniform float apothem;
uniform sampler2D uSampler;

void main() {
    vec4 tex_col = texture2D(uSampler, vTexCoord);
    if (tex_col == vec4(0.0)) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Centered vTexCoord
    vec2 c_vTexCoord = vTexCoord - vec2(0.5);
    if (yx_ratio > 1.0)
        c_vTexCoord *= yx_ratio;
    c_vTexCoord.y *= yx_ratio;

    // Absolute Centered vTexCoord
    vec2 ac_vTexCoord = abs(c_vTexCoord);
    float dist = 0.0;

    float x_dist = ac_vTexCoord.x - apothem;
    float y_dist = ac_vTexCoord.y - apothem;

    bool in_x_range = x_dist <= 0.0;
    bool in_y_range = y_dist <= 0.0;

    if (in_x_range && in_y_range)
        dist = -(x_dist > y_dist ? x_dist : y_dist) / apothem;
    else if (in_x_range)
        dist = y_dist / apothem;
    else if (in_y_range)
        dist = x_dist / apothem;
    else
        dist = sqrt(x_dist * x_dist + y_dist * y_dist) / apothem;

    dist *= 2.0;

    /*
    0.0: GREEN
    0.5: YELLOW
    1.0: RED
    */
    gl_FragColor =
        tex_col.a * 
        (
        dist < 0.5 ?
            vec4(dist * 2.0, 1.0, 0.0, 1.0) :
            vec4(1.0, 2.0 - 2.0 * dist, 0.0, 1.0)
        );
}