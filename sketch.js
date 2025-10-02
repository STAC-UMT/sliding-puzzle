// ===================================
//      CÀI ĐẶT CHUNG VÀ THƯ VIỆN ẢNH
// ===================================
const imageFiles = ["image1.jpg", "image2.jpg", "image3.jpg"];
let loadedImages = [];
let source;

// Cấu hình game
let tiles = [];
let board = [];
let cols = 3;
let rows = 3;
let w, h;
let gameWon = false;
let lastPieceImage = null;

// Các biến kết nối với HTML
let startButton, timerDisplay, previewImage, levelRadios;
let previewPlaceholder;
let eventsAssigned = false;

// Kích thước tối đa cho canvas
const maxCanvasSize = 600;

// Biến cho đồng hồ
let startTime = 0;
let timerInterval;

// ===================================
//      CÁC HÀM CỦA P5.JS
// ===================================

function preload() {
    for (let filename of imageFiles) {
        loadedImages.push(loadImage(`images/${filename}`));
    }
}

function setup() {
    // Tạo canvas và đặt nó vào trong container div
    let canvas = createCanvas(maxCanvasSize, maxCanvasSize);
    canvas.parent('canvas-container');
    
    // Kết nối tới các element trong HTML
    startButton = select('#startButton');
    timerDisplay = select('#timer');
    previewImage = select('#preview-image');
    previewPlaceholder = select('#preview-placeholder');
    levelRadios = selectAll('input[name="level"]');

    // Gán sự kiện cho nút bấm và lựa chọn level
    // startButton.elt.addEventListener('click', startGame);
    for (let radio of levelRadios) {
        radio.changed(updateGridSize);
    }

    // Hiển thị thông báo ban đầu
    background("#16213e");
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Chọn cấp độ và nhấn 'New Game' để bắt đầu!", width / 2, height / 2);
}

function draw() {
    if (startButton && !eventsAssigned) {
        startButton.elt.addEventListener('click', startGame);
        eventsAssigned = true; // Đánh dấu là đã gán rồi để không chạy lại
    }

    if (!source) return;

    background(0);

    // Vẽ các ô puzzle lên board
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let index = i + j * cols;
            let tileIndex = board[index];
            if (tileIndex > -1) {
                let img = tiles[tileIndex].img;
                image(img, i * w, j * h, w, h);
            }
        }
    }

    // Vẽ lưới
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            strokeWeight(2);
            stroke(0);
            noFill();
            rect(i * w, j * h, w, h);
        }
    }

    // Khi thắng, hiển thị mảnh ghép cuối cùng và thông báo
    if (gameWon) {
        // Tìm vị trí ô trống để vẽ mảnh cuối
        if (lastPieceImage) { // Kiểm tra xem ảnh đã được lưu chưa
            // Vị trí của ô trống khi thắng luôn là ở cuối cùng
            const lastIndex = cols * rows - 1;
            const finalX = (lastIndex % cols) * w;
            const finalY = Math.floor(lastIndex / cols) * h;
            
            // Dùng ảnh của mảnh cuối đã lưu chính xác
            image(lastPieceImage, finalX, finalY, w, h);
        }
        
        // Lớp phủ thông báo thắng cuộc
        fill(0, 255, 0, 150);
        rect(0, 0, width, height);
        fill(255);
        textSize(32);
        textAlign(CENTER, CENTER);
        text("YOU WON!", width / 2, height / 2);
    }
}

function mousePressed() {
    if (gameWon || !source) return;

    let i = floor(mouseX / w);
    let j = floor(mouseY / h);

    if (i >= 0 && i < cols && j >= 0 && j < rows) {
        move(i, j, board);
        checkIfSolved();
    }
}

// ===================================
//      CÁC HÀM LOGIC CỦA GAME
// ===================================

function updateGridSize() {
    let selectedLevel = 3; // Mặc định
    for (let radio of levelRadios) {
        if (radio.elt.checked) {
            selectedLevel = Number(radio.value());
            break;
        }
    }
    cols = selectedLevel;
    rows = selectedLevel;
}

function startGame() {
    gameWon = false;
    
    // Cập nhật kích thước lưới trước khi bắt đầu
    updateGridSize();

    // 1. Chọn ảnh ngẫu nhiên và cập nhật preview
    source = random(loadedImages);

    // Ẩn placeholder và hiện ảnh
    previewPlaceholder.style('display', 'none');
    previewImage.style('display', 'block');
    previewImage.attribute('src', source.canvas.toDataURL());

    // 2. Thay đổi kích thước canvas
    let ar = source.width / source.height;
    let canvasW = (source.width > source.height) ? maxCanvasSize : maxCanvasSize * ar;
    let canvasH = (source.width > source.height) ? maxCanvasSize / ar : maxCanvasSize;
    resizeCanvas(canvasW, canvasH);
    source.resize(canvasW, canvasH);

    // 3. Reset và chuẩn bị các ô puzzle
    tiles = [];
    board = [];
    w = width / cols;
    h = height / rows;
    
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            let x = i * w;
            let y = j * h;
            let img = createImage(w, h);
            img.copy(source, x, y, w, h, 0, 0, w, h);
            let index = i + j * cols;
            board.push(index);
            tiles.push(new Tile(index, img));
        }
    }
    
    const lastTile = tiles[tiles.length - 1]; // Lấy ra tile cuối cùng
    lastPieceImage = lastTile.img;

    tiles.pop(); // Bỏ ô cuối
    board.pop();
    board.push(-1);

    // 4. Xáo trộn
    simpleShuffle(board);

    // 5. Bắt đầu/Reset đồng hồ
    clearInterval(timerInterval); // Xóa đồng hồ cũ nếu có
    startTime = millis();
    timerInterval = setInterval(updateTimer, 1000);
    timerDisplay.html("00:00");
}

function updateTimer() {
    if (gameWon) {
        clearInterval(timerInterval);
        return;
    }
    let elapsed = millis() - startTime;
    let totalSeconds = floor(elapsed / 1000);
    let minutes = floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    timerDisplay.html(`${nf(minutes, 2)}:${nf(seconds, 2)}`);
}

function checkIfSolved() {
    for (let i = 0; i < board.length - 1; i++) {
        if (board[i] !== tiles[i].index) {
            return;
        }
    }
    gameWon = true;
    console.log("SOLVED!");
}


// Các hàm di chuyển, không thay đổi nhiều
function simpleShuffle(arr) {
    // Đảm bảo puzzle có thể giải được (sẽ bỏ qua logic phức tạp này, xáo trộn ngẫu nhiên là đủ cho game)
    for (let i = 0; i < 1000; i++) {
        randomMove(arr);
    }
}
function randomMove(arr) {
    let r1 = floor(random(cols));
    let r2 = floor(random(rows));
    move(r1, r2, arr);
}
function findBlank() {
    return board.indexOf(-1);
}
function move(i, j, arr) {
    let blank = findBlank();
    let blankCol = blank % cols;
    let blankRow = floor(blank / cols);
    if (isNeighbor(i, j, blankCol, blankRow)) {
        swap(blank, i + j * cols, arr);
    }
}
function isNeighbor(i, j, x, y) {
    if (i !== x && j !== y) return false;
    return abs(i - x) === 1 || abs(j - y) === 1;
}
function swap(i, j, arr) {
    [arr[i], arr[j]] = [arr[j], arr[i]]; // Cú pháp ES6 để hoán đổi
}