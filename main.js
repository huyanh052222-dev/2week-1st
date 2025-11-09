const book = document.getElementById('book');
const prevBtn = document.getElementById('prev-page-btn');
const nextBtn = document.getElementById('next-page-btn');
const addPageSidebarBtn = document.getElementById('add-page-sidebar-btn');

const floatingMenu = document.getElementById('floating-menu');
const toggleToolbarMenu = document.getElementById('toggle-toolbar-menu');
const addPagePanelBtn = document.getElementById('add-page-panel-btn');

const insertImageBtn = document.getElementById('insert-image-btn');
const imageUploadInput = document.getElementById('image-upload-input');
const musicToggle = document.getElementById('music-toggle');
const bgMusic = document.getElementById('bgMusic');

let pages = [], currentPage = 0;
let savedRange = null;

// Các Layout mẫu (Code 2)
const Layouts = {
    COVER: `
        <div class="front book-cover">
            <div class="cover-title-main">NoteCloud</div>
            <div class="cover-title-sub">Nơi lưu giữ kỉ niệm</div>
            <div class="cover-image-placeholder">Ảnh</div>
            <button class="cover-start-btn" id="start-btn">Bắt đầu</button>
        </div>
        <div class="back"></div>
    `,
    
    PAGE_1_LAYOUT: `
        <div class="front layout-container layout-front-2">
            <div class="block-top"></div>
            <div class="block-mid-group">
                <div class="block-mid-left"></div>
                <div class="block-mid-right"></div>
            </div>
            <div class="block-large-mid"></div>
            <div class="block-bottom"></div>
            <div class="footer-dots"><div class="dot active"></div><div class="dot"></div></div>
        </div>
        <div class="back layout-container layout-back-2">
            <div class="block-top-group">
                <div class="block-left"></div>
                <div class="block-right"></div>
            </div>
            <div class="block-bottom">Frame 41</div>
            <div class="footer-dots"><div class="dot"></div><div class="dot active"></div></div>
        </div>
    `,
    
    PAGE_BLANK: `
        <div class="front content"></div>
        <div class="back content"></div>
    `
};

// --- CHỨC NĂNG LƯU/KHÔI PHỤC CON TRỎ (QUAN TRỌNG CHO VIỆC CHÈN ẢNH) ---
function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Đảm bảo chỉ lưu range nếu nó nằm trong một vùng contenteditable
        const container = range.commonAncestorContainer.closest('[contenteditable="true"]');
        if (container) {
            savedRange = range.cloneRange();
        }
    }
}

function restoreSelection() {
    if (savedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
    }
}

// --- CHỨC NĂNG TẠO/THÊM TRANG ---
function createPage(contentTemplate, isEditable = true) {
    const page = document.createElement('div');
    page.className = 'paper';
    page.innerHTML = contentTemplate;
    page.style.zIndex = 100 - pages.length;
    book.appendChild(page);
    pages.push(page);
    
    if (isEditable) {
        page.querySelectorAll('.front, .back').forEach(el => {
            el.setAttribute('contenteditable', 'true');
            el.addEventListener('mouseup', saveSelection);
            el.addEventListener('keyup', saveSelection);
        });
    }
    return page;
}

function addNewPage() {
    // Luôn đảm bảo có trang cuối cùng không lật để che phía sau
    const lastPage = pages.pop();
    if (lastPage) {
        book.removeChild(lastPage);
    }
    
    // Thêm trang mới có thể chỉnh sửa
    createPage(Layouts.PAGE_BLANK, true);

    // Thêm lại trang cuối cùng không lật
    createPage(Layouts.PAGE_BLANK, false); 
    
    currentPage = pages.length - 2; // Lùi về trang vừa thêm
    updatePages();
}

function updatePages() {
    pages.forEach((p, i) => {
        if (i < currentPage) {
            p.classList.add('flipped');
            p.style.zIndex = i; 
        } else {
            p.classList.remove('flipped');
            p.style.zIndex = pages.length - i; 
        }
    });

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === pages.length - 1;
}


// --- CHỨC NĂNG CÔNG CỤ CHỈNH SỬA ---
floatingMenu.querySelectorAll('button[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
        restoreSelection();
        const cmd = btn.dataset.cmd;
        if (cmd === 'createLink') {
            const url = prompt("Nhập URL:");
            if (url) document.execCommand(cmd, false, url);
        } else if (cmd.startsWith('justify')) {
            // Cập nhật trạng thái active cho nút căn lề
            floatingMenu.querySelectorAll('.align-buttons .align-btn').forEach(b => b.classList.remove('active-align'));
            btn.classList.add('active-align');
            document.execCommand(cmd, false, null);
        } else {
            document.execCommand(cmd, false, null);
        }
    });
});

document.getElementById('font-family').addEventListener('change', e => {
    restoreSelection();
    document.execCommand('fontName', false, e.target.value);
});

document.getElementById('font-size').addEventListener('change', e => {
    restoreSelection();
    // Chuyển size: 14px -> 3, 16px -> 4, 18px -> 5, 24px -> 6 (Do execCommand chỉ chấp nhận size 1-7)
    let sizeValue = '4';
    switch(e.target.value) {
        case '14px': sizeValue = '3'; break; 
        case '18px': sizeValue = '5'; break; 
        case '24px': sizeValue = '6'; break; 
    }
    document.execCommand('fontSize', false, sizeValue);
});

document.getElementById('color').addEventListener('change', e => {
    restoreSelection();
    document.execCommand('foreColor', false, e.target.value);
});

// --- LOGIC TẢI ẢNH LÊN ---
insertImageBtn.addEventListener('click', () => {
    imageUploadInput.click();
});

imageUploadInput.addEventListener('change', function(event) {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            restoreSelection(); 
            if (savedRange && savedRange.commonAncestorContainer.closest('[contenteditable="true"]')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = 'Uploaded Image';
                
                // Chèn ảnh vào vị trí con trỏ
                savedRange.deleteContents();
                savedRange.insertNode(img);
                
                // Đặt lại con trỏ sau ảnh
                savedRange.setEndAfter(img);
                savedRange.collapse(false);
                
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(savedRange);

                // Thêm dòng mới sau ảnh để dễ soạn thảo tiếp
                document.execCommand('insertHTML', false, '<br><br>');

            } else {
                alert('Vui lòng click vào vị trí bạn muốn chèn ảnh trước khi nhấn nút "Thêm ảnh".');
            }
        };

        reader.readAsDataURL(file);
    }
    event.target.value = ''; 
});

// --- KHỞI TẠO VÀ SỰ KIỆN CHUNG ---
prevBtn.addEventListener('click', () => {
    if (currentPage > 0) currentPage--;
    updatePages();
});

nextBtn.addEventListener('click', () => {
    if (currentPage < pages.length - 1) currentPage++;
    updatePages();
});

addPageSidebarBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addNewPage();
});

addPagePanelBtn.addEventListener('click', addNewPage);

toggleToolbarMenu.addEventListener('click', () => {
    floatingMenu.classList.toggle('show');
});

musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) { bgMusic.play(); musicToggle.textContent = '🔊'; }
    else { bgMusic.pause(); musicToggle.textContent = '🔇'; }
});


function initBook() {
    book.innerHTML = '';
    pages = [];
    currentPage = 0;

    // Bìa
    createPage(Layouts.COVER, false);
    
    // Trang mẫu 1
    createPage(Layouts.PAGE_1_LAYOUT, true);

    // Thêm trang trắng có thể chỉnh sửa
    createPage(Layouts.PAGE_BLANK, true);

    // Trang cuối cùng (không lật)
    createPage(Layouts.PAGE_BLANK, false);

    updatePages();
    
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            currentPage = 1; 
            updatePages();
        });
    }
}

initBook();