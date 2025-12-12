let work = document.getElementById('work');
let anim = document.getElementById('anim');
let c1 = document.getElementById('c1');
let c2 = document.getElementById('c2');
let btnStart = document.getElementById('btnStart');
let statusMsg = document.getElementById('statusMsg');

let animationId;
let isAnimating = false;
let eventCount = 0;

let localStorageLogs = [];
let serverResponses = {};

let ball1 = { el: c1, x: 0, y: 0, dx: 0, dy: 0, r: 10 };
let ball2 = { el: c2, x: 0, y: 0, dx: 0, dy: 0, r: 10 };

document.getElementById('btnPlay').onclick = () => {
    work.style.display = 'block';
    resetGame();
};

document.getElementById('btnClose').onclick = () => {
    stopAnimation();
    work.style.display = 'none';
    
    sendBulkDataToServer();
    
    renderLogs();
};

btnStart.onclick = () => {
    if (btnStart.innerText === 'START') {
        startAnimation();
        btnStart.disabled = true;
        logEvent("Start button clicked");
    } else {
        resetGame();
        startAnimation();
        btnStart.innerText = 'START';
        btnStart.disabled = true;
        logEvent("Reload button clicked");
    }
};

function resetGame() {
    let w = anim.clientWidth;
    ball1.x = Math.random() * (w - 40) + 10;
    ball2.x = Math.random() * (w - 40) + 10;
    
    ball1.y = 10;
    ball2.y = anim.clientHeight - 30;
    
    let speed = 3;
    ball1.dx = (Math.random() > 0.5 ? 1 : -1) * speed;
    ball1.dy = speed;

    ball2.dx = (Math.random() > 0.5 ? 1 : -1) * speed;
    ball2.dy = -speed;

    updateView();
    c1.style.display = 'block';
    c2.style.display = 'block';
    statusMsg.innerText = "";
}

function startAnimation() {
    isAnimating = true;
    loop();
}

function stopAnimation() {
    isAnimating = false;
    cancelAnimationFrame(animationId);
}

function loop() {
    if (!isAnimating) return;

    moveBall(ball1);
    moveBall(ball2);
    checkWallCollision(ball1);
    checkWallCollision(ball2);
    checkBallCollision(ball1, ball2);
    checkStopCondition();

    updateView();
    animationId = requestAnimationFrame(loop);
}

function moveBall(b) {
    b.x += b.dx;
    b.y += b.dy;
}

function updateView() {
    ball1.el.style.left = ball1.x + 'px';
    ball1.el.style.top = ball1.y + 'px';
    ball2.el.style.left = ball2.x + 'px';
    ball2.el.style.top = ball2.y + 'px';
}

function checkWallCollision(b) {
    let w = anim.clientWidth;
    let h = anim.clientHeight;
    
    if (b.x <= 0 || b.x + b.r * 2 >= w) {
        b.dx *= -1;
        logEvent("Wall collision");
    }
    if (b.y <= 0 || b.y + b.r * 2 >= h) {
        b.dy *= -1;
        logEvent("Wall collision");
    }
}

function checkBallCollision(b1, b2) {
    let dx = b1.x - b2.x;
    let dy = b1.y - b2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < b1.r + b2.r) {
        let tempDx = b1.dx; let tempDy = b1.dy;
        b1.dx = b2.dx; b1.dy = b2.dy;
        b2.dx = tempDx; b2.dy = tempDy;
        
        b1.x += b1.dx; b1.y += b1.dy;

        logEvent("Balls collision");
    }
}

function checkStopCondition() {
    let h = anim.clientHeight;
    let center = h / 2;

    let b1InTop = (ball1.y + 10) < center;
    let b2InTop = (ball2.y + 10) < center;
    
    if ((b1InTop && b2InTop) || (!b1InTop && !b2InTop)) {
        stopAnimation();
        btnStart.innerText = "RELOAD";
        btnStart.disabled = false;
        statusMsg.innerText = "Зупинено: Обидві кульки в одній половині!";
        logEvent("Stop condition met");
    }
}

function logEvent(msg) {
    eventCount++;
    let now = new Date();
    let timeString = now.toLocaleTimeString() + '.' + now.getMilliseconds();
    
    sendImmediate(eventCount, msg);
    
    let logRecord = {
        id: eventCount,
        event: msg,
        time: timeString
    };
    localStorageLogs.push(logRecord);
    
    localStorage.setItem('lab7_logs', JSON.stringify(localStorageLogs));
}

function sendImmediate(id, msg) {
    fetch('server_lab7.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            method: 'immediate',
            id: id,
            event: msg
        })
    })
        .then(res => res.json())
        .then(data => {
            serverResponses[id] = data.serverTime;
        })
        .catch(err => console.error(err));
}

function sendBulkDataToServer() {
    fetch('server_lab7.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            method: 'bulk',
            data: localStorageLogs
        })
    }).then(() => {
        console.log("Bulk data sent");
        localStorageLogs = [];
        localStorage.removeItem('lab7_logs');
    });
}

function renderLogs() {
    let tbody = document.getElementById('logBody');
    tbody.innerHTML = "";
    
    let logs = JSON.parse(localStorage.getItem('lab7_logs')) || localStorageLogs;

    logs.forEach(log => {
        let tr = document.createElement('tr');
        let serverTime = serverResponses[log.id] || "Pending...";

        tr.innerHTML = `
            <td>${log.id}</td>
            <td>${log.event}</td>
            <td>${log.time}</td>
            <td>${serverTime}</td>
        `;
        tbody.appendChild(tr);
    });
}