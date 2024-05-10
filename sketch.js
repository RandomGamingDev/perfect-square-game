let fx;
let post_buf;
let font;

let mouse_was_pressed = false;

const Alerts = {
  None: 0,
  Best: 1,
  DrawCircle: 2,
  TooClose: 3,
  WrongWay: 4,
  DrawFull: 5
};
let disp_alert = Alerts.DrawCircle;
const is_valid_alert = (alert) =>
  alert == Alerts.None ||
  alert == Alerts.Best ||
  alert == Alerts.DrawCircle;
const is_end_alert = (alert) =>
  alert != Alerts.None;


const closest_center_distance = 0.05;
const end_dist = 1;
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
    const has_ended = is_end_alert(disp_alert);

    // Start
    if (has_ended && !mouse_was_pressed) {
      drawn = [];
      // Too close
      if (mouse_dist_from_center / width < closest_center_distance) {
        disp_alert = Alerts.TooClose;
      }
      // Start Normally
      else {
        drawn.push(mouse_pos);
        disp_alert = Alerts.None;
      }
    }
    // Reached end (use an angle based method instead)
    else if (drawn.length > 1 && dist(...drawn[0], ...mouse_pos) < end_dist) {
      disp_alert = Alerts.Best;
    }
    // Continue
    else if (drawn.length > 0 && dist(...drawn[drawn.length - 1], ...mouse_pos) > closest_distance_to_last_point) {
      drawn.push(mouse_pos);
    }

    mouse_was_pressed = true;
  }
  else if (mouse_was_pressed) {
    if (is_valid_alert(disp_alert) && disp_alert != Alerts.Best)
      disp_alert = Alerts.DrawFull;

    mouse_was_pressed = false;
  }

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
  const yx_ratio = height / width;
  fx.setUniform("yx_ratio", yx_ratio);
  const apothem = 
    drawn.length > 0 ? 
      max(abs(drawn[0][0]), abs(drawn[0][1])) / width :
      0;
  fx.setUniform("apothem", apothem);
  rect(-width / 2, -height / 2, width, height);
  resetShader();
  //*/
  // image(post_buf, -width / 2, -height / 2);

  let score = 0.0;
  for (const point of drawn) {
    let c_vTexCoord = [point[0] / width, point[1] / height];
    if (yx_ratio > 1.0) {
      c_vTexCoord[0] *= yx_ratio;
      c_vTexCoord[1] *= yx_ratio;
    }
    c_vTexCoord[1] *= yx_ratio;

    // Absolute Centered vTexCoord
    const ac_vTexCoord = [abs(c_vTexCoord[0]), abs(c_vTexCoord[1])];
    let distance = 0.0;

    const x_dist = ac_vTexCoord[0] - apothem;
    const y_dist = ac_vTexCoord[1] - apothem;

    const in_x_range = x_dist <= 0.0;
    const in_y_range = y_dist <= 0.0;

    if (in_x_range && in_y_range)
        distance = -(x_dist > y_dist ? x_dist : y_dist) / apothem;
    else if (in_x_range)
        distance = y_dist / apothem;
    else if (in_y_range)
        distance = x_dist / apothem;
    else
        distance = sqrt(x_dist * x_dist + y_dist * y_dist) / apothem;

    distance *= 2.0;

    score += (1.0 - distance) / drawn.length
  }

  // Draw foreground
  push();
  {
    textFont(font);

    // Percentage Score
    textSize(0.04 * width);
    textAlign(RIGHT, BOTTOM);

    const valid = is_valid_alert(disp_alert);

    if (!valid) // If it's invalid it's red
      fill(255, 0, 0);
    // Fill based off of grade
    else if (score > 0.5)
      fill((2.0 - 2.0 * score) * 255.0, 255.0, 0.0);
    else
      fill(255.0, score * 255.0 * 2.0, 0.0);

    const score_str = 
      valid ?
      `${ floor(score * 100) } ${ abs(floor(score * 1000 % 10)) }%` :
      "XX X%";
    text(score_str, (valid ? 0.085 : 0.09) * width, 0.015 * width);

    // Alert
    fill(255, 255, 255);
    textSize(0.015 * width);
    textAlign(CENTER, TOP);

    let alert_text;

    switch (disp_alert) {
      case Alerts.None:
        alert_text = "";
        break;
      case Alerts.Best:
        // Detect whether it's a new best or not
        alert_text = `Best: `;
        break;
      case Alerts.DrawCircle:
        alert_text = "Start drawing a square around this point";
        break;
      case Alerts.TooClose:
        alert_text = "Too close to dot";
        break;
      case Alerts.WrongWay:
        alert_text = "Wrong way";
        break;
      case Alerts.DrawFull:
        alert_text = "Draw a full square";
        break;
    }

    text(alert_text, 0, 0.02 * height);
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