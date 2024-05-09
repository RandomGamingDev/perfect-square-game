let fx;
let post_buf;
let font;

const Alerts = {
  None: 0,
  Best: 1,
  TooClose: 2,
  WrongWay: 3,
  DrawFull: 4
};
let disp_alert = Alerts.WrongWay;

const closest_center_distance = 0.05;
const closest_distance_to_last_point = 1;
const thickness = 2;

const get_mouse_pos = () => [mouseX - width / 2, mouseY - height / 2];

function preload() {
  fx = loadShader("shaders/default.vert", "shaders/accuracy.frag");
  font = loadFont("assets/fonts/fff-forward.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noSmooth();
  noStroke();
  post_buf = createGraphics(windowWidth, windowHeight, WEBGL);
  post_buf.smooth();
}

let drawn = [];

function draw() {
  // Get mouse data
  const mouse_pos = get_mouse_pos();
  const mouse_dist_from_center = Math.sqrt(mouse_pos[0] * mouse_pos[0] + mouse_pos[1] * mouse_pos[1])
  
  // Draw the background
  background(0);
  
  // Controls
  if (mouseIsPressed) {
    if (drawn.length == 0 && mouse_dist_from_center / width < closest_center_distance) {
      drawn = [];
      disp_alert = Alerts.TooClose;
    }
    else if (drawn.length == 0) {
      drawn.push(mouse_pos);

    }
    else if (dist(...drawn[drawn.length - 1], ...mouse_pos) > closest_distance_to_last_point) {
      drawn.push(mouse_pos);
    }
  }
  else
    drawn = [];

  // Draw onto postprocessing buffer
  post_buf.clear();
  post_buf.strokeWeight(thickness);
  post_buf.stroke(255);
  // post_buf.background(0); // Use for debugging reward map
  if (drawn.length > 1) {
    post_buf.noFill();
    post_buf.beginShape();
    {
      for (let _ = 0; _ < 2; _++) // Start anchor
        post_buf.curveVertex(drawn[0][0], drawn[0][1]);
      for (let i = 1; i < drawn.length - 1; i++) // Points in the middle
        post_buf.curveVertex(drawn[i][0], drawn[i][1]);
      for (let _ = 0; _ < 2; _++) // End anchor
        post_buf.curveVertex(drawn[drawn.length - 1][0], drawn[drawn.length - 1][1]);
    }
    post_buf.endShape();
  }
  
  // Draw onto screen
  shader(fx);
  fx.setUniform("uSampler", post_buf);
  fx.setUniform("yx_ratio", height / width);
  const apothem = 
    drawn.length > 0 ? 
      max(abs(drawn[0][0]), abs(drawn[0][1])) / width :
      0;
  fx.setUniform("apothem", apothem);
  rect(-width / 2, -height / 2, width, height);
  resetShader();
  //*/
  // image(post_buf, -width / 2, -height / 2);

  let score = 0;
  for (const point of drawn) {
    /*
    let c_vTexCoord = vTexCoord - vec2(0.5);
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
    */
  }

  // Draw foreground
  push();
  {
    textFont(font);
    textSize(0.04 * width);
    textAlign(RIGHT, BOTTOM);

    const valid = disp_alert == Alerts.None || disp_alert == Alerts.Best;

    if (!valid)
      fill(255, 0, 0);

    const score_str = 
      valid ?
      `${ Math.floor(score * 100) } ${ Math.floor(score * 1000 % 10) }%` :
      "XX X%";
    text(score_str, (valid ? 0.085 : 0.09) * width, 0.015 * width);
  }
  pop();

  // Draw the centered circle
  noStroke();
  circle(0, 0, 10);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  post_buf.resizeCanvas(windowWidth, windowHeight);
}