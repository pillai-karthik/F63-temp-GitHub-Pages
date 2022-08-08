import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
testSupport([
    { client: 'Chrome' },
]);
function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
    if (!isSupported) {
        console.log(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
            `is not well supported at this time, continue at your own risk.`);
    }
}
const controls = window;
const drawingUtils = window;
const mpFaceMesh = window;
const config = { locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@` +
            `${mpFaceMesh.VERSION}/${file}`;
    } };
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
/**
 * Solution options.
 */
const solutionOptions = {
    selfieMode: true,
    enableFaceGeometry: false,
    maxNumFaces: 1,
    refineLandmarks: false,
    minDetectionConfidence: 0.3,
    minTrackingConfidence: 0.3
};
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};
const lookAngles = [[0,0],[50,0],[-50,0],[0,30],[50,30],[-50,30]];

var uid = null;
var pos_no = 0;
var showFaceMesh = true;
var initialShow = false;
var popup = document.getElementsByClassName("popup")[0];
var mesh_btn = document.getElementById("mesh_btn");
var img = document.getElementById("pos_img");
var img_list = ["./Images/0.png","./Images/1.png","./Images/2.png","./Images/3.png","./Images/4.png","./Images/5.png","./Images/6.png"];
img.src = img_list[0];
function openPopup()
{
    popup.classList.add("open-popup");
}
function closePopup()
{
    popup.classList.remove("open-popup");
}
function toggleMesh()
{
    showFaceMesh = !showFaceMesh;
    if(showFaceMesh)
    {
        console.log('act');
        mesh_btn.classList.add("mesh_active");
    }
    else{
        mesh_btn.classList.remove("mesh_active");
    }
}
mesh_btn.addEventListener("click",toggleMesh);
document.getElementsByClassName("close_btn")[0].addEventListener("click",closePopup);

function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            if (typeof(landmarks) === 'undefined')
            {
                console.log('UNDEFINED');
            }
            if (showFaceMesh==true)
            {drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_EYE, { color: '#00c9c9' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_EYEBROW, { color: '#00c9c9' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_EYE, { color: '#00c9c9' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_EYEBROW, { color: '#00c9c9' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_FACE_OVAL, { color: '#E0E0E0' });
            drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LIPS, { color: '#E0E0E0' });
            if (solutionOptions.refineLandmarks) {
                drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_RIGHT_IRIS, { color: '#00c9c9' });
                drawingUtils.drawConnectors(canvasCtx, landmarks, mpFaceMesh.FACEMESH_LEFT_IRIS, { color: '#00c9c9' });
            }}
            var return_val = calc_face_dir([landmarks[4],landmarks[127],landmarks[356],landmarks[6]]);
            var angles = return_val[0];
            var face_width = return_val[1];
            if (!initialShow){
                openPopup();
                initialShow = !initialShow;
            }
            get_capture(angles, landmarks[4], face_width, results.image);
            // console.log(results.image);
            // console.log(typeof(results.image));
        }
    }
    canvasCtx.restore();
}

function get_capture(curr_angle, landmark, face_width, image)
{
    if (pos_no >= lookAngles.length)
    {
        console.log("Complete");
    }
    else{
        var move_angle = [curr_angle[0]-lookAngles[pos_no][0],curr_angle[1]-lookAngles[pos_no][1]];
        if ((Math.abs(move_angle[0]) < 5) && (Math.abs(move_angle[1]) < 5))
        {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.drawImage(image, 0, 0, canvasElement.width, canvasElement.height);
            const base64Canvas = canvasElement.toDataURL("image/jpeg").split(';base64,')[1];
            var image_data = {'image':base64Canvas, 'index':pos_no, 'uid':uid};

            const xmlhttp = new XMLHttpRequest();
            xmlhttp.open('POST','http://127.0.0.1:5000/submit_image', true);
            xmlhttp.setRequestHeader("Content-type","application/json");
            xmlhttp.setRequestHeader("Access-Control-Allow-Origin", "*");
            xmlhttp.setRequestHeader("Access-Control-Allow-Headers", "*");
            xmlhttp.setRequestHeader("Access-Control-Allow-Credentials","true");

            xmlhttp.onload = function() {
                var server_reply = JSON.parse(this.responseText);
                // console.log(server_reply);
                uid = server_reply.uid;
                // console.log(uid);
            }

            xmlhttp.upload.onprogress = function(e) {
            console.log(`${e.loaded}B of ${e.total}B uploaded!`)
            }
            xmlhttp.send(JSON.stringify(image_data)); 
            pos_no +=1;
            img.src = img_list[pos_no];
            if (pos_no >= lookAngles.length)
                img.width = img.height = '300';
            openPopup();
        }
        var arrow_color = get_color(Math.abs(move_angle[0]));
        draw_arrow(move_angle[0], 'h', arrow_color);
        arrow_color = get_color(Math.abs(move_angle[1]));
        draw_arrow(move_angle[1], 'w', arrow_color);
        // var nose_pos = {x:landmark.x*canvasElement.width, y:landmark.y*canvasElement.height};
        // var alignment = [(move_angle[0]>0)?'right':'left','right'];
        // var offsets={h:[(move_angle[0]>0)?-100:100,20], v:[30,(move_angle[1]>0)?-70:70]};
        // var print_angle = [Math.abs(move_angle[0]), Math.abs(move_angle[1])];
        // draw_angle(print_angle, nose_pos, face_width, alignment, offsets);
    }
}

function get_color(position)
{
    var color_3 = {r:255, g:0, b:0};
    var color_2 = {r:255, g:255, b:0};
    var color_1 = {r:0, g:255, b:0};
    if (position>=100) {
        var color = color_3;
    }
    else if (position<50){
        var color = {r:(((50-position)*color_1.r) + (position*color_2.r))/50,g:(((50-position)*color_1.g) + (position*color_2.g))/50,b:(((50-position)*color_1.b) + (position*color_2.b))/50};
    }
    else {
        var color = {r:(((100-position)*color_2.r) + ((position-50)*color_3.r))/50,g:(((100-position)*color_2.g) + ((position-50)*color_3.g))/50,b:(((100-position)*color_2.b) + ((position-50)*color_3.b))/50};
    }
    return "#" + ((1<<24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1);
}

function calc_face_dir(landmarks)
{
    var v31 = {i:(landmarks[1].x - landmarks[3].x),j:(landmarks[1].y - landmarks[3].y),k:(landmarks[1].z - landmarks[3].z)};
    var v32 = {i:(landmarks[2].x - landmarks[3].x),j:(landmarks[2].y - landmarks[3].y),k:(landmarks[2].z - landmarks[3].z)};
    var v21 = {i:(landmarks[1].x - landmarks[2].x)/4,j:(landmarks[1].y - landmarks[2].y)/4,k:(landmarks[1].z - landmarks[2].z)/4};
    var normal = {i:(v31.j*v32.k-v31.k*v32.j), j:(v31.k*v32.i-v31.i*v32.k), k:(v31.i*v32.j-v31.j*v32.i)};
    var t = ((normal.i*(landmarks[3].x-landmarks[0].x) + normal.j*(landmarks[3].y-landmarks[0].y) + normal.k*(landmarks[3].z-landmarks[0].z))/(normal.i*normal.i + normal.j*normal.j + normal.k*normal.k));
    var proj = {x:landmarks[0].x + t*normal.i, y:landmarks[0].y + t*normal.j, z:landmarks[0].z + t*normal.k};
    var face_dir_vector = {i:proj.x - landmarks[3].x, j:proj.y - landmarks[3].y, k:proj.z - landmarks[3].z}
    var face_dir_mag = Math.sqrt(Math.pow(face_dir_vector.i,2)+Math.pow(face_dir_vector.j,2)+Math.pow(face_dir_vector.k,2));
    var face_dir_normal = {i:face_dir_vector.i/face_dir_mag,j:face_dir_vector.j/face_dir_mag, k:face_dir_vector.k/face_dir_mag};
    var k = 0.1;
    var h_angle = (face_dir_normal.i>0?1:-1) * Math.acos(-1*face_dir_normal.k/Math.sqrt(Math.pow(face_dir_normal.i,2)+Math.pow(face_dir_normal.k,2)));
    var v_angle = (face_dir_normal.j>0?1:-1) * Math.acos(-1*face_dir_normal.k/Math.sqrt(Math.pow(face_dir_normal.j,2)+Math.pow(face_dir_normal.k,2)));
    var face_dir = {x: landmarks[0].x + k*face_dir_normal.i, y: landmarks[0].y + k*face_dir_normal.j, z: landmarks[0].z + k*face_dir_normal.k};
    var hoz_line_l = {x:face_dir.x-Math.cos(h_angle)*v21.i,y:face_dir.y-Math.cos(h_angle)*v21.j,z:face_dir.z-Math.cos(h_angle)*v21.k};
    var hoz_line_2 = {x:face_dir.x+Math.cos(h_angle)*v21.i,y:face_dir.y+Math.cos(h_angle)*v21.j,z:face_dir.z+Math.cos(h_angle)*v21.k};
    var ver_line_l = {x:face_dir.x-Math.cos(v_angle)*normal.i,y:face_dir.y-Math.cos(v_angle)*normal.j,z:face_dir.z-Math.cos(v_angle)*normal.k};
    var ver_line_2 = {x:face_dir.x+Math.cos(v_angle)*normal.i,y:face_dir.y+Math.cos(v_angle)*normal.j,z:face_dir.z+Math.cos(v_angle)*normal.k};
    // draw_line([face_dir, landmarks[0]], 2);
    // draw_line([proj, landmarks[3]], 2);
    if (showFaceMesh==true)
    {
        draw_line([hoz_line_l, hoz_line_2], 2, '#FF0000');
        draw_line([ver_line_l, ver_line_2], 2, '#00FF00');
    }
    return [[parseInt((180/Math.PI)*h_angle),parseInt((180/Math.PI)*v_angle)], v21];
}

function draw_line(points, lw = 5,color = '#0000FF')
{
    var brushstyle = {color: color, lineWidth: lw};
    drawingUtils.drawConnectors(canvasCtx, points, [[0,1]], brushstyle);
}

function draw_arrow(length = 100, alignment = 'h', color = '#0000ff', width = 30)
{
    canvasCtx.fillStyle = color;
    if(alignment == 'h')
    {
        var pos_x = parseInt(window.innerWidth*0.5);
        var pos_y = parseInt(window.innerHeight*0.85);
        var arrow_length = parseInt(length*window.innerWidth*0.8/100);
        var tipL   = 0.1 * arrow_length;
        var tipW   = 0.65 * width;
        var p1       = {x: pos_x+(arrow_length/2), y: pos_y + ((width-tipW)/2)};
        var p2       = {x: pos_x-((arrow_length-tipL)/2), y: pos_y + ((width-tipW)/2)};
        var p3       = {x: pos_x-((arrow_length-tipL)/2), y: pos_y + (width/2)};
        var p4       = {x: pos_x-(arrow_length/2), y: pos_y};
        var p5       = {x: pos_x-((arrow_length-tipL)/2), y: pos_y - (width/2)};
        var p6       = {x: pos_x-((arrow_length-tipL)/2), y: pos_y - ((width-tipW)/2)};
        var p7       = {x: pos_x+(arrow_length/2), y: pos_y - ((width-tipW)/2)};
    }
    else{
        var pos_x = parseInt(window.innerWidth*0.85);
        var pos_y = parseInt(window.innerHeight*0.5);
        var arrow_length = parseInt(length*window.innerHeight*0.8/100);
        var tipL   = 0.1 * arrow_length;
        var tipW   = 0.65 * width;
        var p1       = {y: pos_y+(arrow_length/2), x: pos_x + ((width-tipW)/2)};
        var p2       = {y: pos_y-((arrow_length-tipL)/2), x: pos_x + ((width-tipW)/2)};
        var p3       = {y: pos_y-((arrow_length-tipL)/2), x: pos_x + (width/2)};
        var p4       = {y: pos_y-(arrow_length/2), x: pos_x};
        var p5       = {y: pos_y-((arrow_length-tipL)/2), x: pos_x - (width/2)};
        var p6       = {y: pos_y-((arrow_length-tipL)/2), x: pos_x - ((width-tipW)/2)};
        var p7       = {y: pos_y+(arrow_length/2), x: pos_x - ((width-tipW)/2)};
    }
    canvasCtx.beginPath();
    canvasCtx.moveTo(p1.x, p1.y);
    canvasCtx.lineTo(p2.x, p2.y);
    canvasCtx.lineTo(p3.x, p3.y);      
    canvasCtx.lineTo(p4.x, p4.y);  
    canvasCtx.lineTo(p5.x, p5.y);
    canvasCtx.lineTo(p6.x, p6.y);
    canvasCtx.lineTo(p7.x, p7.y);
    canvasCtx.closePath();
    canvasCtx.fill();
}

// function draw_angle(angles, nose_pos, face_width, alignments=['right','left'], offsets={h:[0,0], v:[0,0]})
// {
//     canvasCtx.fillStyle = '#0000FF';
//     canvasCtx.font = "40px sans-serif";
//     canvasCtx.textAlign = alignments[0];
//     canvasCtx.fillText(angles[0] +'°', nose_pos.x + offsets.h[0], nose_pos.y + offsets.h[1]);
//     canvasCtx.fillStyle = '#0000FF';
//     canvasCtx.font = "40px sans-serif";
//     canvasCtx.textAlign = alignments[1];
//     canvasCtx.fillText(angles[1] +'°', nose_pos.x + offsets.v[0], nose_pos.y + offsets.v[1]);
// }

const faceMesh = new mpFaceMesh.FaceMesh(config);
faceMesh.setOptions(solutionOptions);
faceMesh.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, solutionOptions)
    .add([
    // new controls.StaticText({ title: 'MediaPipe Face Mesh' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onFrame: async (input, size) => {
            const aspect = size.height / size.width;
            const window_aspect = window.innerHeight/window.innerWidth;
            let width, height;
            if (aspect > window_aspect) {
                width = window.innerWidth;
                height = width * aspect;     
            }
            else {
                height = window.innerHeight;
                width = parseInt(height / aspect);
            }
            canvasElement.width = width;
            canvasElement.height = height;
            await faceMesh.send({ image: input });
        },
    }),
    // new controls.Slider({
    //     title: 'Max Number of Faces',
    //     field: 'maxNumFaces',
    //     range: [1, 4],
    //     step: 1
    // }),
    // new controls.Toggle({ title: 'Refine Landmarks', field: 'refineLandmarks' }),
    // new controls.Slider({
    //     title: 'Min Detection Confidence',
    //     field: 'minDetectionConfidence',
    //     range: [0, 1],
    //     step: 0.01
    // }),
    // new controls.Slider({
    //     title: 'Min Tracking Confidence',
    //     field: 'minTrackingConfidence',
    //     range: [0, 1],
    //     step: 0.01
    // }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    faceMesh.setOptions(options);
});