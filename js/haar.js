let isFaceDetection = true; // Flag to indicate whether face detection is enabled

function switchDetection() {
    isFaceDetection = !isFaceDetection; // Toggle the flag
}

function addNavigationButtons() {
    // Create a button for switching detection
    let switchButton = document.createElement('button');
    switchButton.textContent = 'Switch Detection';
    switchButton.addEventListener('click', switchDetection);

    // Append the button to the body
    // Get the button container element
    let buttonContainer = document.getElementById('buttonContainer');

    // Append the button to the button container
    buttonContainer.appendChild(switchButton);
}

function openCvReady() {
    cv['onRuntimeInitialized'] = () => {
        let video = document.getElementById("cam_input"); // video is the id of video tag
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            video.srcObject = stream;
            video.play();
        })
        .catch(function(err) {
            console.log("An error occurred! " + err);
        });
        let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
        let gray = new cv.Mat();
        let cap = new cv.VideoCapture(cam_input);
        let faces = new cv.RectVector();
        let eyes = new cv.RectVector();
        let faceClassifier = new cv.CascadeClassifier();
        let eyeClassifier = new cv.CascadeClassifier();
        let utils = new Utils('errorMessage');
        let faceCascadeFile = 'haarcascade_frontalface_default.xml'; // path to face cascade xml
        let eyeCascadeFile = 'haarcascade_eye.xml'; // path to eye cascade xml
        utils.createFileFromUrl(faceCascadeFile, faceCascadeFile, () => {
            faceClassifier.load(faceCascadeFile); // in the callback, load the face cascade from file
        });
        utils.createFileFromUrl(eyeCascadeFile, eyeCascadeFile, () => {
            eyeClassifier.load(eyeCascadeFile); // in the callback, load the eye cascade from file
        });
        const FPS = 24;

        function processVideo() {
            let begin = Date.now();
            cap.read(src);
            src.copyTo(dst);
            cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);

            if (isFaceDetection) {
                try {
                    faceClassifier.detectMultiScale(gray, faces, 1.1, 3, 0);
                    console.log(faces.size());
                } catch (err) {
                    console.log(err);
                }
                for (let i = 0; i < faces.size(); ++i) {
                    let face = faces.get(i);
                    let point1 = new cv.Point(face.x, face.y);
                    let point2 = new cv.Point(face.x + face.width, face.y + face.height);
                    cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
                }
            } else {
                try {
                    faceClassifier.detectMultiScale(gray, faces, 1.1, 3, 0);
                    eyeClassifier.detectMultiScale(gray, eyes, 1.1, 3, 0);
                    console.log(eyes.size());
                } catch (err) {
                    console.log(err);
                }
                for (let i = 0; i < faces.size(); ++i) {
                    let face = faces.get(i);
                    let point1 = new cv.Point(face.x, face.y);
                    let point2 = new cv.Point(face.x + face.width, face.y + face.height);
                    cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
                }
                for (let i = 0; i < eyes.size(); ++i) {
                    let eye = eyes.get(i);
                    let point1 = new cv.Point(eye.x, eye.y);
                    let point2 = new cv.Point(eye.x + eye.width, eye.y + eye.height);
                    cv.rectangle(dst, point1, point2, [0, 255, 0, 255]);
                }
            }

            cv.imshow("canvas_output", dst);

            // schedule next one.
            let delay = 1000 / FPS - (Date.now() - begin);
            setTimeout(processVideo, delay);
        }

        // Add navigation buttons
        addNavigationButtons();

        // schedule first one.
        setTimeout(processVideo, 0);
    };
}
