// ibvs = image-based-visual-servoing

//ECMAScript module

//npm install https://github.com/PeterTadich/FischerTechnik https://github.com/PeterTadich/controller-interface https://github.com/PeterTadich/central-camera https://github.com/PeterTadich/matrix-computations

import * as hlao from 'matrix-computations';
import * as hlao from 'central-camera';
import * as hlao from 'FischerTechnik';
import * as rcim from 'controller-interface';
//import * as hlao from '../matrix-computations/hlao.mjs';
//import * as ccam from '../central-camera/ccam.mjs';
//import * as fir3 from '../FischerTechnik/fir3.mjs';
//import * as rcim from '../controller-interface/rcim.mjs';

//Capture image.
//   - ref: I:\code\spatial_v2\js\vision\videoToCanvas.html
//Process image.
//   - find feature vector (image coordinate of the point of interest).
//   - thresholding (high contrast scene)
//Calculate the image Jacobian 'Jp'.
//   - eq 15.7, page 462 Robotics, vision and control.
//Calculate feature velocity.
//   - eq 15.10, page 465 Robotics, vision and control.
//   - require a goal position image coordinate (for example the principal point).
//Calculate camera velocity.
//   - eq 15.11, page 465 Robotics, vision and control.

//Takes a snapshot of the video.
function snap(callback) {
    // Define the size of the rectangle that will be filled (basically the entire element)
    context.fillRect(0, 0, w, h);
    // Grab the image from the video
    context.drawImage(video, 0, 0, w, h);
    
    if(typeof callback != 'undefined') callback();
}

//Process the image (thresholding). ref: visionSystem.js
//Run:
//snap();
var idx = [];
function imageProcess(callback){
    var imageData = context.getImageData(0, 0, w, h);

    //var threshold = 215;
    var threshold = 195;
    idx = [];
    for(var i=0;i<imageData.data.length; i=i+4){
        //Step 6. Calc. the difference between snapshot with laser and and snapshot with laser off.
        var R0 = imageData.data[i];
        //var G0 = imageData.data[i+1];
        //var B0 = imageData.data[i+2];
        //var Y0 = parseFloat(R0) + parseFloat(G0) + parseFloat(B0); //Intensity.
        //Step 7. Find all pixels greater than threshold.
        if(R0 > threshold){
            var c = 255; //White.
            idx.push(i);
        } else {
            var c = 0; //Black.
        }
        imageData.data[i] = c;
        imageData.data[i+1] = c;
        imageData.data[i+2] = c;
    }
    
    //Clear the canvas.
    context.clearRect(0, 0, w, h);
    context.putImageData(imageData, 0, 0);
    
    if(typeof callback != 'undefined') callback();
}

//Calculate the bounding box and centroid. ref: visionSystem.js
//Run:
//snap();
//imageProcess();
function boundingBox(callback){
    //Create bounding box.
    console.log("'depthEstimate()' state: Creating the bounding box.");
    var imax = Number.MIN_SAFE_INTEGER;
    var imin = Number.MAX_SAFE_INTEGER;
    var jmax = Number.MIN_SAFE_INTEGER;
    var jmin = Number.MAX_SAFE_INTEGER;
    for(var i=0;i<idx.length; i=i+1){
        var col = idx[i] % (4 * w); //Column offset.
        var row = (idx[i] - col) / (4 *w); //Row number.
        col = col / 4; //Column number
        //console.log('(' + row + ',' + col + ')');
        if(imax < row) imax = row;
        if(imin > row) imin = row;
        if(jmax < col) jmax = col;
        if(jmin > col) jmin = col;
    }
    //Log the bounding box
    //.rect(x,y,width,height);
    //x, the x-coordinate of the upper-left corner of the rectangle
    //y, the y-coordinate of the upper-left corner of the rectangle
    //width, the width of the rectangle, in pixels
    //height, the height of the rectangle, in pixels
    //ref: https://www.w3schools.com/tags/canvas_rect.asp
    console.log('Bounding box:' );
    console.log('   - x: ' +  jmin);
    console.log('   - y: ' +  imin);
    console.log('   - width: ' +  (jmax-jmin));
    console.log('   - height: ' +  (imax-imin));
    var u_pixel = (jmin + (jmax-jmin)/2);
    var v_pixel = (imin + (imax-imin)/2);
    console.log('   - centroid (x,y): (' + u_pixel + ', ' + v_pixel + ')');

    //Blue rectangle.
    context.beginPath();
    context.lineWidth="1";
    context.strokeStyle="blue";
    context.rect(jmin,imin,(jmax-jmin+1),(imax-imin+1));
    context.stroke(); 
    context.strokeStyle="black";
    
    //Centroid.
    //ref: https://www.w3schools.com/tags/canvas_arc.asp
    context.beginPath();
    context.arc(u_pixel,v_pixel,2,0,2*Math.PI);
    context.fillStyle = "blue";
    context.fill();
    context.fillStyle = "black";
    
    if(typeof callback != 'undefined') callback([[u_pixel],[v_pixel]]);
    else return([[u_pixel],[v_pixel]]);
}

//Calculate the camera velocity.
//Run:
//snap();
//imageProcess();
//var Vc = cameraVelocity();
//Vc = [
//    [ -0.0125 ] //Vx camera coordinate frame
//    [  0.0301 ] //Vy
//    [ -0.0046 ] //Vz
//    [ -0.0077 ] //wx
//    [ -0.0032 ] //wy
//    [  0.0000 ] //wz
//];
//TEST.
/*
//MATLAB:
JPEG_width = 640;
JPEG_height = 480;
pu = (3.6 * 1e-3)/JPEG_width;
pv = (2.7 * 1e-3)/JPEG_height;
f = 4.63/1000.0;
cam = CentralCamera('focal', f, 'pixel', [pu pv], 'resolution', [JPEG_width JPEG_height], 'centre', [JPEG_width/2 JPEG_height/2]);
//‘focal’, Focal length [metres]
//‘pixel’, Pixel size [W H]
//‘resolution’, Image plane resolution [W H].
//‘centre’, P Principal point (2 x 1)
/*
//cam =
//name: noname [central-perspective]      
//  focal length:   0.00463               
//  pixel size:     (5.625e-06, 5.625e-06)
//  principal pt:   (320, 240)            
//  number pixels:  640 x 480             
//  T:                                    
//      1  0  0  0                        
//      0  1  0  0                        
//      0  0  1  0                        
//      0  0  0  1                        
centre = [336.5; 420.5];
J = cam.visjac_p(centre, 0.25);
//J =
//   1.0e+03 *
//   -3.2924         0    0.0660    0.0036   -0.8234    0.1805
//         0   -3.2924    0.7220    0.8627   -0.0036   -0.0165
Jinv = pinv(J);
//Jinv =
//   1.0e-03 *
//   -0.2849    0.0012
//    0.0012   -0.2720
//    0.0054    0.0596
//   -0.0000    0.0713
//   -0.0713         0
//    0.0156   -0.0014
Vc = Jinv * ([JPEG_width/2; JPEG_height/2] - centre);
//Vc =
//    0.0045
//    0.0491
//   -0.0109
//   -0.0129
//    0.0012
//    0.0000
*/
/*
//JavaScript:
var Z = 0.25;
var centre = [[336.5], [420.5]];
var JPEG_width = 640; //160, 640
var JPEG_height = 480; //128, 480
//   - image area = 3.6 x 2.7 mm^2 (ref: itm-c-328.pdf)
//   - number of pixels = 640 x 480
//    Intrinsic parameters.
cameraParameters.pu = (3.6 * 1e-3)/JPEG_width;
cameraParameters.pv = (2.7 * 1e-3)/JPEG_height;
cameraParameters.f = 4.63/1000.0;
cameraParameters.principalPoint.u0 = ~~(JPEG_width/2);
cameraParameters.principalPoint.v0 = ~~(JPEG_height/2);
var J = image_jacobian(cameraParameters, Z, centre); //See centralCamera.js
//J = [
//    [3.2924, 0.0000, 0.0660, 0.0036, -0.8234, 0.1805],
//    [0.0000,-3.2924, 0.7220, 0.8627, -0.0036,-0.0165]
//] * 1e+3;
var Jinv = image_jacobian_inverse(J); //See centralCamera.js
//Jinv = [
//    [-0.2849,  0.0012],
//    [ 0.0012, -0.2720],
//    [ 0.0054,  0.0596],
//    [ 0.0000,  0.0713],
//    [-0.0713,  0.0000],
//    [ 0.0156, -0.0014]
//] * 1e-3;
var Vc = matrix_multiplication(
    Jinv,
    matrix_arithmetic([[cameraParameters.principalPoint.u0],[cameraParameters.principalPoint.v0]], centre, '-') //IMPORTANT: dt = 1.
);
//Vc = [
//    [ 0.0045],
//    [ 0.0491],
//    [-0.0109],
//    [-0.0129],
//    [ 0.0012],
//    [ 0.0000]
//];
Vc = 0.25 * Vc;
//Vc = [
//   [ 0.0011],
//   [ 0.0123],
//   [-0.0027],
//   [-0.0032],
//   [ 0.0003],
//   [ 0.0000]
//];
*/
function cameraVelocity(callback){
    //   Calculate the image Jacobian. 
    //   - part 1. Set 'Z' (z coordinate which is a constant).
    var Z = 0.08;
    //   - part 2. Get feature centre (centroid).
    var centre = boundingBox(); //returns a column vector.
    //    var centre = [
    //        [centre[0][0]*JPEG_width], //See C328_PIC18F4620.js
    //        [centre[1][0]*JPEG_height]
    //    ];
    //   - part 3. Setup the camera --> update 'cameraParameters' see 'centralCamera.js'.
    /*
    //    Microsoft LifeCam NX-3000:
    //       - Resolution: motion video: 640 x 480 pixels.
    //    Due to the lack of information on 'LifeCam' using C328 data. ref: C328_PIC18F4620.js
    var JPEG_width = 640; //160, 640
    var JPEG_height = 480; //128, 480
    //   - image area = 3.6 x 2.7 mm^2 (ref: itm-c-328.pdf)
    //   - number of pixels = 640 x 480
    //    Intrinsic parameters.
    cameraParameters.pu = (3.6 * 1e-3)/JPEG_width;
    cameraParameters.pv = (2.7 * 1e-3)/JPEG_height;
    cameraParameters.f = 4.63/1000.0;
    cameraParameters.principalPoint.u0 = ~~(JPEG_width/2);
    cameraParameters.principalPoint.v0 = ~~(JPEG_height/2);
    */
    //    OfficeOne Webcam 300K CMOS Sensor (640 x 480 @ 30 FPS)
    //    Intrinsic parameters. See 'centralCamera.js'.
    var JPEG_width = 640; //160, 640
    var JPEG_height = 480; //128, 480
    //cameraParameters.pu = (5.6 * 1e-6); //ref: I:\code\spatial_v2\js\vision\C328\others\itm-c-328.pdf
    //cameraParameters.pv = (5.6 * 1e-6);
    //cameraParameters.f = (4.0 * 1e-3);
    //cameraParameters.principalPoint.u0 = ~~(JPEG_width/2);
    //cameraParameters.principalPoint.v0 = ~~(JPEG_height/2);
    var opts = {
        pu: (5.6 * 1e-6), //ref: I:\code\spatial_v2\js\vision\C328\others\itm-c-328.pdf
        pv: (5.6 * 1e-6),
        f: (4.0 * 1e-3),
        principalPoint: {
            u0: ~~(JPEG_width/2),
            v0: ~~(JPEG_height/2)
        }
    };
    ccam.setCamParameters(opts);
    //   - part 4. Calculate the image Jacobian. ref: teddyHunter.js
    var J = ccam.image_jacobian(ccam.cameraParameters, Z, centre); //See centralCamera.js
    //   - part 5. Calculate the pseudo-inverse of the image Jacobian. ref: teddyHunter.js
    var Jstar = ccam.image_jacobian_inverse(J); //See centralCamera.js
    //   - part 6. Calculate the camera velocity. IMPORTANT: dt = 1. ref: teddyHunter.js
    var Vc = hlao.matrix_multiplication(
        Jstar,
        hlao.matrix_arithmetic([[ccam.cameraParameters.principalPoint.u0],[ccam.cameraParameters.principalPoint.v0]], centre, '-') //IMPORTANT: dt = 1.
    );
    //console.log('Vc before lambda:');
    //console.log(Vc);
    var Vc = hlao.matrix_multiplication_scalar(Vc,0.25); //lambda. ref: eq 15.10, page 462, 466 Robotics, vision and control.
    
    if(typeof callback != 'undefined') callback(Vc);
    else return(Vc);
}

//Run:
/*
snap();
imageProcess();
var Vc = cameraVelocity();
//var dp_actual = [[0.0],[0.0],[0.0]]; //home
var jv_data = jointVelocities(Vc,dp_actual);
var dp_actual = jv_data[0];
var nbr_clks = jv_data[1];
var sgn = jv_data[2];
*/
//dp_click[][]:
//      left/right:  revolute, left/right = (pi/2)/20 = 0.0785 rad/click
//         up/down: prismatic,         up = 0.135/45  = 0.003    m/click,     down = 0.135/28 = 0.0048  m/click
//forward/backward: prismatic,    forward = 0.110/30  = 0.00367  m/click, backward = 0.110/31 = 0.00355 m/click
//var motor_parameters = [
//   //link, joint,        type, motor,    cw,  ccw,          dp_click cw,         dp_click ccw,         cw,        ccw
//    [   0,     1,  'revolute',     1,   '-',  '+', ((Math.PI/2.0)/20.0), ((Math.PI/2.0)/20.0),     'left',    'right'],
//    [   1,     2, 'prismatic',     3,   '-',  '+',             0.135/28,             0.135/45,     'down',       'up'],
//    [   2,     3, 'prismatic',     2,   '-',  '+',             0.110/30,             0.110/31,  'forward', 'backward']
//];
//rob3
var motor_parameters = [
   //link, joint,        type, motor,   ccw,   cw,         dp_click ccw,          dp_click cw,             ccw,             cw
    [   0,     1,  'revolute',     1,   '-',  '+', ((Math.PI/2.0)/20.0), ((Math.PI/2.0)/20.0),  'z0 neg. rot.', 'z0 pos. rot.'],
    [   3,     4, 'prismatic',     3,   '-',  '+',             0.135/45,             0.135/28, 'z2 neg. disp.','z2 pos. disp.'],
    [   5,     6, 'prismatic',     2,   '-',  '+',             0.110/31,             0.110/30, 'z4 neg. disp.','z4 pos. disp.']
];
function jointVelocities(Vc,q,callback){
    //ref: industry_robots_rob3.js
    //   - Convert the Denavit-Hartenberg parameters to the homogenous transformation matrix.
    //   - Calculate the Jacobian matrix.
    //      - Assemble the Jacobian matrix.
    //      - Simplify the Jacobian matrix. N<6. Under-actuated robot.
    //   - Jacobian Pseudo inverse (J* (Jstar)).
    //   - Joint velocity ('q_dot_star').
    //     var qd = hlao.matrix_multiplication(Jstar,v_star);
    //   ---> use IR_rob3(q,RRMC,v_star) to calc. above ref: industry_robots_rob3.js
    //      - 'q' generalised coordinates - current position. A column vector [[v1],[d2],[d3]]
    //      - 'RRMC' Resolved-Rate Motion Control - discrete time parameters. A row vector [dt,npts].
    //      - 'v_star' end-effector velocity.
    var data = fir3.IR_rob3(q,[.1,1],[[Vc[0][0]], [Vc[1][0]], [Vc[2][0]]]); //specified end-effector velocity
    var qd = data[0];
    var T0cam = data[1];
    //Update the joint coordinates ('q_star').
    //    links[0][3] = links[0][3] + dt*qd[0][0]; //revolute
    //    links[1][2] = links[1][2] + dt*qd[1][0]; //prismatic
    //    links[2][2] = links[2][2] + dt*qd[2][0]; //prismatic
    //
    var nbr_motors = motor_parameters.length;
    var dp_desired = [[0.0],[0.0],[0.0]]; //dummy data
    var sgn = [];
    var nbr_clks = [];
    var dp_actual = [[0.0],[0.0],[0.0]]; //dummy data
    var dt = 1.0;
    var Kp = [5.0,1.0,5.0]; //gain
    
    for(var k=0;k<nbr_motors;k=k+1){
        //1. Calculate the required change in postion ('dp_desired' a column vector) (magnitude and direction):
        dp_desired[k][0] = dt*qd[k][0]*Kp[k];
        //2. Determine the direction ('sgn' a row vetor):
        if(Math.sign(dp_desired[k][0]) < 0) sgn[k] = 0; //sgn[k] = 0 if '-'.
        else sgn[k] = 1; //, sgn[k] = 1 if '+' or '0'.
        //3. Calculate the number of clicks ('nbr_clks' a row vector):
        nbr_clks[k] = ~~(Math.abs(dp_desired[k][0])/(motor_parameters[k][6 + sgn[k]])); //IMPORTANT: 6 refers to 'dp_click cw' column.
        //4. Calculate the actual ('dp_actual' a column vector) change in position:
        dp_actual[k][0] = nbr_clks[k] * motor_parameters[k][6 + sgn[k]];
    }
    
    console.log('dp_desired[]:');
    fir3.print_multi_array(dp_desired);
    
    if(typeof callback != 'undefined') callback([dp_actual,nbr_clks,sgn]);
    else return([dp_actual,nbr_clks,sgn]);
}

/*
//5. Update Denavit-Hartenberg parameters:
links[0][3] = links[0][3] + dp_actual[0][0]; //revolute
links[1][2] = links[1][2] + dp_actual[1][0]; //prismatic
links[2][2] = links[2][2] + dp_actual[2][0]; //prismatic
*/

//Run:
/*
snap();
imageProcess();
var Vc = cameraVelocity();
//var dp_actual = [[0.0],[0.0],[0.0]]; //initialization only (home)
var jv_data = jointVelocities(Vc,dp_actual);
var dp_actual = jv_data[0];
var nbr_clks = jv_data[1];
var sgn = jv_data[2];
var rob3_packets = buildCommandPackage(nbr_clks,sgn);
*/
//Build the position command package for the industrial robot.
function buildCommandPackage(nbr_clks,sgn,callback){
    //var sgn = [0,0,0]; //For testing.
    //var nbr_clks = [20,15,5]; //For testing.
    var nbr_motors = motor_parameters.length;
    var ccw = [0x01,0x10,0x04]; //ccw '-' (IMPORTANT: motor 1, motor 3, motor 2)
    var cw  = [0x02,0x20,0x08]; // cw '+' (IMPORTANT: motor 1, motor 3, motor 2)
    var packets = [];
    var max_clks = Math.max.apply(null, nbr_clks); //ref: https://stackoverflow.com/questions/1669190/find-the-min-max-element-of-an-array-in-javascript
    console.log("'max_clks':");
    console.log(max_clks);
    for(var i=1;i<=max_clks;i=i+1){
        var command = 0x00; //All motors off.
        for(var k=0;k<nbr_motors;k=k+1){
            if(nbr_clks[k] >= i){
                if(sgn[k] == 1) command = command | cw[k]; //cw '+'
                else command = command | ccw[k]; //ccw '-'
            }
        }
        packets.push([command]);
    }
    console.log("packets:");
    console.log(packets);
    
    if(typeof callback != 'undefined') callback(packets);
    else return(packets);
}

//    Open (30402 (Python server)):
//       Anaconda2 console.
//    Run:
//       [Anaconda2] C:\Users\cruncher>python websocket30402.py
//       I:\code\spatial_v2\js\FischerTechnik\30402.html
//    open WebSocket.
//       II30402();
//
//Send position command package to industrial robot:
//var rob3_packets = [[],[]];
//sendPackage(rob3_packets);
function sendPackage(rob3_packets,callback){
    if(typeof sendPackage.state == 'undefined'){
        sendPackage.timer = setInterval(function(){ sendPackage() }, 100);
        sendPackage.state = 0;
        sendPackage.rob3_packets = rob3_packets;
        sendPackage.callback = callback;
    }
    
    switch(sendPackage.state){
        case 0: //initialize
            sendPackage.cnt = rob3_packets.length; //Get the number of packets to send.
            if(sendPackage.cnt > 0){
                sendPackage.packetID = 0;
                sendPackage.state = 2;
            } else sendPackage.state = 4;
            break;
        case 1: //Update packet count.
            if(sendPackage.packetID < (sendPackage.cnt-1)){
                sendPackage.packetID = sendPackage.packetID + 1;
                sendPackage.state = 2;
            } else sendPackage.state = 4;
            break;
        case 2: //send packet
            sendPackage.state = 3;
            //II30402.messageData = []; //clear
            rcim.clearMessageData();
            console.log('Sending packet [' + sendPackage.packetID + '].');
            rcim.II30402.packetSend([0xC1,sendPackage.rob3_packets[sendPackage.packetID][0]]); //0xC1 = 193 dec (193 dec: get E1 - E8 inputs. See '30402.js').
            break;
        case 3: //get response
            if(rcim.II30402.messageData.length > 0) sendPackage.state = 1; 
            break;
        case 4:
            clearInterval(sendPackage.timer);
            delete sendPackage.state;
            sendPackage.callback();
            break;
        default:
            console.log('WARNING: unknown state within function "sendPackage()".');
            break;
    }
}

//Home.
//    Open (30402 (Python server)):
//       Anaconda2 console.
//    Run:
//       [Anaconda2] C:\Users\cruncher>python websocket30402.py
//       I:\code\spatial_v2\js\FischerTechnik\30402.html
//    open WebSocket.
//       II30402();
/*
var nbr_motors = motor_parameters.length;
var ccw = [0x01,0x10,0x04]; //ccw '+' (IMPORTANT: motor 1, motor 3, motor 2)
*/
function rob3Home(){
    if(typeof rob3Home.state == 'undefined'){
        rob3Home.timer = setInterval(function(){ rob3Home() }, 100);
        rob3Home.state = 0;
        rob3Home.retries = 10; //Number of retries to send command.
        rob3Home.prode = 1; //Check input states only - don't send motor commands.
    }
    
    switch(rob3Home.state){
        case 0: //initialize
            rob3Home.state = 1;
            rob3Home.command = 0x00; //All motors off.
            break;
        case 1: //send packet
            rob3Home.state = 2;
            rob3Home.retryCnt = 0;
            //II30402.messageData = []; //clear
            rcim.clearMessageData();
            rcim.II30402.packetSend([0xC1,rob3Home.command]);
            break;
        case 2: //get response
            if(II30402.messageData.length > 0) rob3Home.state = 3;
            else {
                if(rob3Home.retryCnt == rob3Home.retries){
                    rob3Home.state = 1; //resend command
                } else rob3Home.retryCnt = rob3Home.retryCnt + 1;
            }
            break;
        case 3:
            if(rob3Home.prode){
                rob3Home.state = 1;
                rob3Home.command = 0x00; //All motors off.
                rob3Home.prode = 0;
            } else {
                rob3Home.prode = 1;
                rob3Home.command = 0x00; //All motors off.
                var E = rcim.II30402.messageData[0].charCodeAt(0); //Get the first element.
                var flags = [0b00000001,0b00010000,0b00000100]; //IMPORTANT: motor 1, motor 3, motor 2.
                for(var k=0;k<nbr_motors;k=k+1){
                    if((E & flags[k]) != flags[k]) rob3Home.command = rob3Home.command | ccw[k]; //ccw '+'
                }
                if(rob3Home.command == 0x00) rob3Home.state = 4;
                else rob3Home.state = 1;
            }
            break;
        case 4:
            clearInterval(rob3Home.timer);
            delete rob3Home.state;
            break;
        default:
            console.log('WARNING: unknown state within function "rob3Home()".');
            break;
    }
}

//Home.
//    Open (30402 (Python server)):
//       Anaconda2 console.
//    Run:
//       [Anaconda2] C:\Users\cruncher>python websocket30402.py
//       I:\code\spatial_v2\js\FischerTechnik\30402.html
//    open WebSocket.
//       II30402();
//    For tracker go home: II30402.packetSend([90,75]);
function IBVS(){
    if(typeof IBVS.state == 'undefined'){
        IBVS.timer = setInterval(function(){ IBVS() }, 2000);
        IBVS.state = 0;
        IBVS.repeats = 500;
    }
    
    switch(IBVS.state){
        case 0: //initialization
            IBVS.state = 1;
            IBVS.dp_actual = [[0.0],[0.0],[0.0]]; //initialization only (home) - rob3
            //IBVS.dp_actual = [[0.0],[0.0]]; //initialization only (home) - tracker
            IBVS.cnt = 0;
            break;
        case 1:
            snap(
                function(){
                    IBVS.state = 2;
                    console.log('"snap()" completed.');
                    }
                );
            break;
        case 2:
            imageProcess(
                function(){
                        IBVS.state = 3;
                        console.log('"imageProcess()" completed.');
                    }
                );
            break;
        case 3:
            cameraVelocity(
                function(Vc){
                        IBVS.state = 4;
                        console.log('"cameraVelocity()" completed.');
                        IBVS.Vc = Vc;
                    }
                );
            break;
        case 4:
            jointVelocities(IBVS.Vc,IBVS.dp_actual, //rob3
            //jointVelocities_tracker(IBVS.Vc,IBVS.dp_actual, //tracker (tracking_camer.js)
                function(jv_data){
                        IBVS.state = 5;
                        console.log('"jointVelocities()" completed.');
                        IBVS.dp_actual = jv_data[0]; //'q_desired' for tracker.
                        IBVS.nbr_clks = jv_data[1]; //'servos' for tracker.
                        IBVS.sgn = jv_data[2]; //'undefined' for tracker.
                        console.log('Actual data:');
                        console.log(IBVS.dp_actual);
                        console.log('Servo data:');
                        console.log(IBVS.nbr_clks);
                        if((IBVS.nbr_clks[0] === 0.0)&&(IBVS.nbr_clks[1] === 0.0)&&(IBVS.nbr_clks[2] === 0.0)) IBVS.state = 8;
                    }
                );
            break;
        case 5:
            buildCommandPackage(IBVS.nbr_clks,IBVS.sgn, //rob3
            //buildCommandPackage_tracker(IBVS.nbr_clks, //tracker
                function(rob3_packets){
                        IBVS.state = 6;
                        console.log('"buildCommandPackage()" completed.');
                        IBVS.rob3_packets = rob3_packets;
                    }
                );
            break;
        case 6:
            sendPackage(IBVS.rob3_packets, //rob3
            //sendPackage_tracker(IBVS.rob3_packets, //tracker
                function(){
                        IBVS.state = 7;
                        console.log('"sendPackage()" completed.');
                    }
                );
            break;
        case 7:
            if(IBVS.cnt == IBVS.repeats) IBVS.state = 8;
            else {
                IBVS.state = 1;
                IBVS.cnt = IBVS.cnt + 1;
                console.log('LOOP cnt = ' + IBVS.cnt + '.');
            }
            break;
        case 8:
            console.log('Clearing interval timer for "IBVS()".');
            console.log('Job complete --> target acquired.');
            clearInterval(IBVS.timer);
            delete IBVS.state;
            break;
        default:
            break;
            
    }
}

export {
    snap,
    imageProcess,
    boundingBox,
    cameraVelocity,
    motor_parameters,
    jointVelocities,
    buildCommandPackage,
    sendPackage,
    rob3Home,
    IBVS
};