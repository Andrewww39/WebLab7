const work = document.getElementById('work');
const anim = document.getElementById('anim');
const ball1 = document.getElementById('ballBlue');
const ball2 = document.getElementById('ballOrange');
const btnStart = document.getElementById('btnStart');
const msgBox = document.getElementById('msgBox');
const btnContainer = document.getElementById('gameBtnContainer');

let isAnimating = false;
let animationId;
let eventId = 0;
let localStorageData = [];
let serverResponses = {};

let b1 = { x: 0, y: 0, dx: 0, dy: 0, r: 10, el: ball1, color: 'Blue' };
let b2 = { x: 0, y: 0, dx: 0, dy: 0, r: 10, el: ball2, color: 'Orange' };

document.getElementById('btnPlay').onclick = () => {
    work.style.display = 'block';
    resetPositions();
    eventId = 0;
    localStorageData = [];
    serverResponses = {};
    document.querySelector('#resultsTable tbody').innerHTML = "";
    logEvent("Window Opened");
};

document.getElementById('btnClose').onclick = async () => {
    stopAnimation();
    work.style.display = 'none';
    await logEvent("Window Closed");
    showResults();
};

btnStart.onclick = () => {
    if (btnStart.innerText === 'START') {
        logEvent("Button START clicked");
        startAnimation();
        btnStart.disabled = true;
        btnStart.style.opacity = "0.5";
    } else {
        logEvent("Button RELOAD clicked");
        resetPositions();
        btnStart.innerText = 'START';
        btnStart.disabled = false;
        btnStart.style.opacity = "1";
    }
};

function resetPositions() {
    let w = anim.clientWidth;
    let h = anim.clientHeight;
    
    b1.x = Math.random() * (w - 40) + 10;
    b2.x = Math.random() * (w - 40) + 10;
    
    b1.y = 5;
    b2.y = h - 25;
    
    let speed = 2;
    b1.dx = (Math.random() > 0.5 ? 1 : -1) * speed;
    b1.dy = speed;
    b2.dx = (Math.random() > 0.5 ? 1 : -1) * speed;
    b2.dy = -speed;

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
    
    moveAndCheck(b1);
    moveAndCheck(b2);

    checkCollisions();
    checkStopCondition();

    animationId = requestAnimationFrame(loop);
}

function moveAndCheck(b) {
    let w = anim.clientWidth;
    let h = anim.clientHeight;
    
    b.x += b.dx;
    b.y += b.dy;
    
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
    let dx = (b1.x + 10) - (b2.x + 10);
    let dy = (b1.y + 10) - (b2.y + 10);
    let distance = Math.sqrt(dx*dx + dy*dy);

    if (distance < 20) {
        let tempDx = b1.dx; let tempDy = b1.dy;
        b1.dx = b2.dx; b1.dy = b2.dy;
        b2.dx = tempDx; b2.dy = tempDy;
        
        b1.x += b1.dx * 2; b1.y += b1.dy * 2;

        logEvent("Collision between balls");
    }
}

function checkStopCondition() {
    let h = anim.clientHeight;
    let mid = h / 2;
    
    let b1Top = (b1.y + 10) < mid;
    let b2Top = (b2.y + 10) < mid;

    if (b1Top === b2Top) {
        stopAnimation();
        logEvent("Stop condition: Both in same half");
        
        btnStart.innerText = "RELOAD";
        btnStart.disabled = false;
        btnStart.style.opacity = "1";
    }
}

function logEvent(text) {
    eventId++;
    msgBox.innerText = text;

    let now = new Date();
    let timeStr = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "." + now.getMilliseconds();
    
    let eventObj = {
        id: eventId,
        text: text,
        clientTime: timeStr,
        method: 'immediate'
    };
    
    let lsObj = {...eventObj, method: 'bulk'};
    localStorageData.push(lsObj);
    localStorage.setItem('lab7_data', JSON.stringify(localStorageData));
    
    return fetch('server_lab7.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(eventObj)
    })
        .then(res => res.json())
        .then(data => {
            serverResponses[eventObj.id] = data.serverTime;
        })
        .catch(err => console.error("Server error"));
}

function showResults() {
    let logs = JSON.parse(localStorage.getItem('lab7_data')) || [];
    let tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = "";

    logs.forEach(log => {
        let tr = document.createElement('tr');
        
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