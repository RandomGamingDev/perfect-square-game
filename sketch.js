const starting_animation = [[-149, -121], [-150, -120], [-150, -117], [-151, -106], [-151, -96], [-152, -83], [-154, -66], [-155, -47], [-155, -31], [-156, -14], [-157, 4], [-157, 24], [-157, 43], [-157, 56], [-157, 70], [-157, 80], [-157, 88], [-157, 101], [-157, 105], [-156, 110], [-156, 113], [-156, 117], [-156, 120], [-156, 122], [-156, 124], [-156, 127], [-156, 129], [-156, 131], [-156, 135], [-156, 138], [-156, 141], [-156, 143], [-156, 145], [-156, 147], [-156, 149], [-156, 151], [-155, 153], [-154, 154], [-151, 154], [-147, 155], [-142, 155], [-136, 155], [-131, 154], [-125, 153], [-116, 152], [-107, 151], [-99, 151], [-90, 151], [-79, 152], [-72, 152], [-63, 152], [-53, 151], [-45, 151], [-36, 150], [-30, 149], [-22, 148], [-14, 148], [-7, 147], [3, 147], [9, 147], [17, 147], [24, 147], [39, 146], [59, 145], [68, 144], [76, 143], [90, 142], [108, 140], [115, 139], [123, 138], [138, 137], [147, 136], [154, 135], [157, 134], [160, 133], [162, 133], [165, 133], [166, 129], [167, 122], [167, 113], [167, 98], [166, 77], [166, 66], [165, 56], [165, 46], [165, 30], [165, 18], [165, -2], [165, -11], [165, -29], [165, -38], [165, -54], [165, -63], [165, -71], [164, -78], [164, -86], [164, -95], [164, -103], [164, -109], [164, -115], [164, -128], [164, -134], [164, -138], [165, -144], [165, -147], [164, -148], [161, -149], [154, -149], [145, -149], [137, -149], [129, -148], [122, -148], [115, -147], [110, -147], [103, -146], [97, -146], [90, -145], [81, -144], [72, -144], [65, -143], [56, -143], [45, -142], [36, -141], [29, -141], [20, -141], [13, -141], [7, -140], [3, -140], [-3, -140], [-10, -140], [-16, -139], [-19, -139], [-23, -138], [-29, -137], [-35, -137], [-42, -136], [-47, -135], [-52, -134], [-57, -134], [-61, -133], [-65, -132], [-70, -131], [-76, -130], [-83, -129], [-86, -129], [-88, -129], [-91, -128], [-95, -128], [-98, -128], [-100, -127], [-103, -127], [-108, -126], [-111, -126], [-114, -125], [-116, -125], [-119, -124], [-123, -124], [-128, -123], [-133, -122], [-136, -121], [-140, -120], [-143, -119], [-146, -119], [-148,-119]];

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

let best_score = 0.0;

const closest_center_distance = 0.05;
const end_dist = 1;
const closest_distance_to_last_point = 1;
const thickness = 2;

const sign = Math.sign;
const get_mouse_pos = () => [mouseX - width / 2, mouseY - height / 2];
const angle_dif = (x1, y1, x2, y2) => atan2(y1, x1) - atan2(y2, x2);
const is_clockwise = (...args) => angle_dif(...args) < 0;
const transposed_angle_dif = (x1, y1, x2, y2) => atan2(x1, y1) - atan2(x2, y2);
const get_percentage_str = (percentage, point) => `${ floor(percentage * 100) }${ point }${ abs(floor(percentage * 1000 % 10)) }%`;

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
    const clockwise = drawn.length >= 2 ? is_clockwise(...drawn[0], ...drawn[1]) : null;

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
    // Test whether or not the user's going in the wrong direction
    else if (
      clockwise != null &&
      (clockwise ? 1 : -1) * angle_dif(...drawn[drawn.length - 1], ...mouse_pos) > 0 &&
      (clockwise ? -1 : 1) * transposed_angle_dif(...drawn[drawn.length - 1], ...mouse_pos) > 0
    ) {
      disp_alert = Alerts.WrongWay;
    }
    // Reached end
    else if (clockwise != null && clockwise != is_clockwise(...drawn[0], ...drawn[drawn.length - 1]) && clockwise == is_clockwise(...drawn[0], ...mouse_pos)) {
      drawn.push(mouse_pos);
      disp_alert = Alerts.Best;
    }
    // Continue
    else if (!has_ended && drawn.length > 0 && dist(...drawn[drawn.length - 1], ...mouse_pos) > closest_distance_to_last_point) {
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
        distance = -(x_dist > y_dist ? x_dist : y_dist);
    else if (in_x_range)
        distance = y_dist;
    else if (in_y_range)
        distance = x_dist;
    else
        distance = sqrt(x_dist * x_dist + y_dist * y_dist);

    distance *= 1.0 / apothem;

    score += (1.0 - min(distance, 1.0)) / drawn.length
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
      get_percentage_str(score, ' ') :
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
        const new_record = score > best_score;
        alert_text = "";
        if (new_record) {
          best_score = score;
          alert_text += "New ";
        }
        alert_text += `Best: ${ get_percentage_str(best_score, '.') }`
        break;
      case Alerts.DrawCircle:
        const num_points_to_draw = floor(millis() * 60 / 1000);
        if (num_points_to_draw < starting_animation.length)
          drawn = starting_animation.slice(0, num_points_to_draw).map((p) => p.map((a) => a * 0.002 * min(width, height)));
        console.log(drawn);
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