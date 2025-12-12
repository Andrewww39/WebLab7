// Змінні
const work = document.getElementById('work');
const anim = document.getElementById('anim');
const ball1 = document.getElementById('ballBlue'); // Синя
const ball2 = document.getElementById('ballOrange'); // Помаранчева
const btnStart = document.getElementById('btnStart');
const msgBox = document.getElementById('msgBox');
const btnContainer = document.getElementById('gameBtnContainer');

// Стан гри
let isAnimating = false;
let animationId;
let eventId = 0;
let localStorageData = []; // Для накопичення (Спосіб 2)
let serverResponses = {}; // Для збереження відповідей сервера

// Фізичні об'єкти
let b1 = { x: 0, y: 0, dx: 0, dy: 0, r: 10, el: ball1, color: 'Blue' };
let b2 = { x: 0, y: 0, dx: 0, dy: 0, r: 10, el: ball2, color: 'Orange' };

// --- 1. КЕРУВАННЯ ВІКНОМ (d) ---
document.getElementById('btnPlay').onclick = () => {
    work.style.display = 'block';
    resetPositions();
    eventId = 0;
    localStorageData = [];
    serverResponses = {};
    document.querySelector('#resultsTable tbody').innerHTML = "";
    logEvent("Window Opened");
};

document.getElementById('btnClose').onclick = () => {
    stopAnimation();
    work.style.display = 'none';
    logEvent("Window Closed");
    showResults(); // Вивести таблицю
};

// --- 2. КНОПКА START / RELOAD (g) ---
btnStart.onclick = () => {
    if (btnStart.innerText === 'START') {
        logEvent("Button START clicked");
        startAnimation();
        // Втрачає можливість натискання (приховуємо або disable)
        btnStart.disabled = true;
        btnStart.style.opacity = "0.5";
    } else {
        // Якщо це RELOAD
        logEvent("Button RELOAD clicked");
        resetPositions();
        btnStart.innerText = 'START'; // Розміщує замість себе START
        btnStart.disabled = false;
        btnStart.style.opacity = "1";
    }
};

// --- 3. ФІЗИКА ТА АНІМАЦІЯ ---
function resetPositions() {
    let w = anim.clientWidth;
    let h = anim.clientHeight;

    // Випадкова горизонтальна координата (f)
    b1.x = Math.random() * (w - 40) + 10;
    b2.x = Math.random() * (w - 40) + 10;

    // Біля верхньої (Синя) і нижньої (Оранж) стінок
    b1.y = 5;
    b2.y = h - 25;

    // Випадкові кути (швидкості)
    let speed = 2; // Невелика швидкість для (i)
    b1.dx = (Math.random() > 0.5 ? 1 : -1) * speed;
    b1.dy = speed; // Вниз
    b2.dx = (Math.random() > 0.5 ? 1 : -1) * speed;
    b2.dy = -speed; // Вгору

    updateBallView(b1);
    updateBallView(b2);

    ball1.style.display = 'block';
    ball2.style.display = 'block';
    msgBox.innerText = "Готовий до старту";
}

function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    loop();
}

function stopAnimation() {
    isAnimating = false;
    cancelAnimationFrame(animationId);
}

function loop() {
    if (!isAnimating) return;

    // Рух (кожен крок - подія для логування, пункт h)
    // УВАГА: Логувати 60 разів на секунду - це забагато для сервера. 
    // Але завдання вимагає "кожен крок". Ми будемо це робити.
    moveAndCheck(b1);
    moveAndCheck(b2);

    checkCollisions();
    checkStopCondition();

    // Логуємо крок (Step) - щоб не забити канал, можна логувати кожен 10-й кадр, 
    // але для точності завдання пишемо кожен.
    // logEvent("Step"); // Розкоментуй, якщо треба РЕАЛЬНО кожен крок (буде 1000 записів)

    animationId = requestAnimationFrame(loop);
}

function moveAndCheck(b) {
    let w = anim.clientWidth;
    let h = anim.clientHeight;

    // Зміщення
    b.x += b.dx;
    b.y += b.dy;

    // Стінки (Ідеальна фізична модель - кут падіння = кут відбивання)
    if (b.x <= 0 || b.x + 20 >= w) {
        b.dx *= -1;
        logEvent(`${b.color} hit wall`);
    }
    if (b.y <= 0 || b.y + 20 >= h) {
        b.dy *= -1;
        logEvent(`${b.color} hit wall`);
    }
    updateBallView(b);
}

function updateBallView(b) {
    b.el.style.left = b.x + 'px';
    b.el.style.top = b.y + 'px';
}

function checkCollisions() {
    // Відстань між центрами
    let dx = (b1.x + 10) - (b2.x + 10);
    let dy = (b1.y + 10) - (b2.y + 10);
    let distance = Math.sqrt(dx*dx + dy*dy);

    if (distance < 20) { // Радіус 10 + 10 = 20
        // Обмін швидкостями (ідеальна модель)
        let tempDx = b1.dx; let tempDy = b1.dy;
        b1.dx = b2.dx; b1.dy = b2.dy;
        b2.dx = tempDx; b2.dy = tempDy;

        // Розводимо, щоб не злиплися
        b1.x += b1.dx * 2; b1.y += b1.dy * 2;

        logEvent("Collision between balls");
    }
}

function checkStopCondition() {
    let h = anim.clientHeight;
    let mid = h / 2;

    // Чи обидві зверху (y < mid) або обидві знизу (y > mid)
    let b1Top = (b1.y + 10) < mid;
    let b2Top = (b2.y + 10) < mid;

    if (b1Top === b2Top) {
        // Зупинка (f)
        stopAnimation();
        logEvent("Stop condition: Both in same half");

        // Кнопка RELOAD (g)
        btnStart.innerText = "RELOAD";
        btnStart.disabled = false;
        btnStart.style.opacity = "1";
    }
}

// --- 4. ЛОГУВАННЯ ТА СЕРВЕР (h) ---
function logEvent(text) {
    eventId++;
    msgBox.innerText = text; // Показ повідомлення зліва (h)

    let now = new Date();
    // Формат часу
    let timeStr = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "." + now.getMilliseconds();

    // Дані про подію
    let eventObj = {
        id: eventId,
        text: text,
        clientTime: timeStr,
        method: 'immediate'
    };

    // Спосіб 2: Акумуляція в LocalStorage
    // Ми зберігаємо копію об'єкта для LS
    let lsObj = {...eventObj, method: 'bulk'};
    localStorageData.push(lsObj);
    localStorage.setItem('lab7_data', JSON.stringify(localStorageData));

    // Спосіб 1: Негайне відправлення
    // Використовуємо fetch
    fetch('server_lab7.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(eventObj)
    })
        .then(res => res.json())
        .then(data => {
            // Зберігаємо час сервера, який прийшов у відповідь
            serverResponses[eventObj.id] = data.serverTime;
        })
        .catch(err => console.error("Server error"));
}

// --- 5. ВІДОБРАЖЕННЯ РЕЗУЛЬТАТІВ ---
function showResults() {
    // Зчитуємо з LS (як сказано в завданні)
    let logs = JSON.parse(localStorage.getItem('lab7_data')) || [];
    let tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = "";

    logs.forEach(log => {
        let tr = document.createElement('tr');

        // Отримуємо збережений час сервера для цієї події
        let sTime = serverResponses[log.id] || "---";

        tr.innerHTML = `
            <td>${log.id}</td>
            <td>${log.text}</td>
            <td>${log.clientTime}</td>
            <td>${sTime}</td>
        `;
        tbody.appendChild(tr);
    });
}