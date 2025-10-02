// ===================================
//      CÀI ĐẶT CHUNG VÀ THƯ VIỆN ẢNH
// ===================================
const imageFiles = ["image01.jpg", "image02.png", "image03.png", "image04.png", "image05.png", "image06.png", "image07.png", "image08.jpg", "image09.jpg", "image10.jpg", "image11.jpg", "image12.jpg", "image13.jpg", "image14.jpg", "image15.jpg", "image16.png", "image17.png", "image18.png", "image19.png"];
let imageDetails = new Map();
let descriptionDisplay;
let loadedImages = {};
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
let imageModal, modalImage, closeModalButton;

// Kích thước tối đa cho canvas
const maxCanvasSize = 600;

// Biến cho đồng hồ
let startTime = 0;
let timerInterval;

// ===================================
//      CÁC HÀM CỦA P5.JS
// ===================================

function preload() {
    // Tải ảnh vào một object
    for (let filename of imageFiles) {
        loadedImages[filename] = loadImage(`images/${filename}`);
    }

    // Tải file details.txt và chỉ định hàm parseDetails sẽ xử lý nó SAU KHI tải xong
    loadStrings('images/details.txt', parseDetails);
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
    descriptionDisplay = select('#image-description');

    // Kết nối tới các element của modal
    imageModal = select('#image-modal');
    modalImage = select('.modal-content');
    closeModalButton = select('.modal-close-button');

    // Gán sự kiện cho ảnh preview
    // Thay vì dùng .parent(), chúng ta sẽ select trực tiếp container
    const previewContainer = select('#preview-container');
    if (previewContainer) { // Kiểm tra xem có tồn tại không để tránh lỗi
        previewContainer.elt.addEventListener('click', openImageModal);
    }

    // Gán sự kiện click để đóng modal
    if (imageModal) {
        imageModal.elt.addEventListener('click', (event) => {
            if (event.target === imageModal.elt) {
                closeImageModal();
            }
        });
    }
    if (closeModalButton) {
        closeModalButton.elt.addEventListener('click', closeImageModal);
    }
    
    // Gán sự kiện cho các radio button 
    for (let radio of levelRadios) {
        radio.changed(updateGridSize);
    }

    // Hiển thị thông báo ban đầu (sẽ xuất hiện trở lại)
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
    updateGridSize();

    // 1. Chọn một tên file ngẫu nhiên từ thư viện
    const selectedFilename = random(imageFiles);

    // 2. Dùng tên file để lấy ảnh đã tải
    source = loadedImages[selectedFilename];

    // 3. Lấy mô tả tương ứng và hiển thị
    const description = imageDetails.get(selectedFilename) || ""; // Lấy mô tả, hoặc chuỗi rỗng nếu không có
    console.log("File được chọn ngẫu nhiên:", selectedFilename);
    console.log("Mô tả tìm thấy:", description);
    descriptionDisplay.html(description);

    previewImage.style('display', 'block');
    previewImage.attribute('src', source.canvas.toDataURL());
    previewPlaceholder.style('display', 'none');

    let ar = source.width / source.height;
    let canvasW = (source.width > source.height) ? maxCanvasSize : maxCanvasSize * ar;
    let canvasH = (source.width > source.height) ? maxCanvasSize / ar : maxCanvasSize;
    resizeCanvas(canvasW, canvasH);
    source.resize(canvasW, canvasH);

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

    const lastTile = tiles[tiles.length - 1];
    lastPieceImage = lastTile.img;

    tiles.pop();
    board.pop();
    board.push(-1);

    simpleShuffle(board);

    clearInterval(timerInterval);
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


// Các hàm di chuyển
function simpleShuffle(arr) {
    // Xáo trộn ngẫu nhiên là đủ 
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

// Hàm để mở khung xem ảnh
function openImageModal() {
    // Chỉ mở khi đã có ảnh (game đã bắt đầu)
    if (source) {
        const currentImageSrc = previewImage.attribute('src');
        modalImage.attribute('src', currentImageSrc);
        imageModal.style('display', 'flex');
    }
}

// Hàm để đóng khung xem ảnh
function closeImageModal() {
    imageModal.style('display', 'none');
}

// Hàm này sẽ chỉ được gọi sau khi file details.txt đã được tải xong
function parseDetails(lines) {
    console.log("File details.txt đã được tải. Bắt đầu xử lý...");
    for (let line of lines) {
        if (line.trim() === "") continue; // Bỏ qua dòng trống
        try {
            // Tách dòng thành 2 phần dựa trên dấu phẩy
            const parts = line.match(/"(.*?)"/g).map(part => part.replace(/"/g, ''));
            if (parts.length === 2) {
                const filename = parts[0];
                const description = parts[1];
                imageDetails.set(filename, description);
            } else {
                // Thêm cảnh báo nếu định dạng dòng bị sai
                console.warn("Dòng này trong details.txt không đúng định dạng và sẽ được bỏ qua:", line);
            }
        } catch (e) {
            console.error("Không thể xử lý dòng này:", line, e);
        }
    }
    // Dòng log này giờ sẽ hiển thị đúng kết quả
    console.log("Đã xử lý xong file details.txt:", imageDetails);
}