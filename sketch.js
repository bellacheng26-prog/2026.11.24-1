let walkImg, jumpImg, fallImg;
let walkFrames = [];
let jumpFrames = [];
let fallFrames = [];

// === 蘑菇變數 ===
let mushroomWalkVideo;   // 走路影片 (.webm)
let mushroomIdleImg;     // 待機圖片 (.gif)
let mushroomX, mushroomY;
let mushroomState = 'idle'; // 'walk' 或 'idle'（預設直接待機，方便確認圖片）
let mushroomFacing = 1;
let mushroomSize = 100;       // 蘑菇顯示大小（與角色差不多，較大方便確認）
let mushroomPatrolRange = 120; // 巡邏範圍
let mushroomPatrolStartX = 0;  // 巡邏起點
let mushroomPatrolDir = 1;     // 巡邏方向（1 向右，-1 向左）
let mushroomPatrolSpeed = 1.5; // 巡邏速度
let touchCount = 0;           // 已觸碰蘑菇次數（目前為 1 次即出題）
let touchThreshold = 1;       // 碰到 1 次即觸發數學題
let touchCooldownTimer = 0;   // 觸碰冷卻計時器（避免連續觸發）

// === 問答題變數 ===
let showMathQuestion = false;
let questionText = '';        // 問題內容
let userAnswer = '';          // 玩家輸入的回答
let mathFeedback = '';
let mathFeedbackTimer = 0;    // 回饋訊息顯示計時器

let questionList = [
  '你今天心情如何？',
  '你吃了什麼？',
  '你最喜歡什麼顏色？',
  '你想去哪裡旅遊？',
  '你喜歡什麼動物？',
  '你今天幾點起床？',
  '你喜歡吃水果嗎？',
  '你最喜歡的季節是？'
];

let bgImg;             // 背景圖片
let bgX = 0;           // 背景滾動偏移量
let bgScrollSpeed = 1; // 背景滾動速度

let x, y;          // 角色的座標
let groundY = 380; // 地面高度
let vy = 0;        // 垂直速度（重力用）
let gravity = 0.6; // 重力加速度
let jumpForce = -11; // 跳躍初始速度
let speed = 4;     // 移動速度

let currentFrame = 0;
let animSpeed = 0.2; // 動畫播放速度
let frameCounter = 0;
let jumpFrameCounter = 0;
let fallFrameCounter = 0;

let facing = 1;    // 原始圖片朝左，-1 表示水平翻轉朝右
let state = 'idle'; // 當前狀態：'idle'(靜止), 'walk'(走路), 'jump'(跳躍), 'fall'(跌倒中), 'fallen'(已倒地)

// 用於 v5 預覽面板的鍵盤狀態追蹤
let keys = {};

function preload() {
  walkImg = loadImage('角色資料/走.png', () => {
    console.log('走路角色圖片載入成功');
  }, (error) => {
    console.error('走路角色圖片載入失敗，將使用內建角色圖形。', error);
  });
  jumpImg = loadImage('角色資料/跳.png', () => {
    console.log('跳躍角色圖片載入成功');
  }, (error) => {
    console.error('跳躍角色圖片載入失敗，將使用內建角色圖形。', error);
  });
  fallImg = loadImage('角色資料/跌倒.png', () => {
    console.log('跌倒角色圖片載入成功');
  }, (error) => {
    console.error('跌倒角色圖片載入失敗，將使用內建角色圖形。', error);
  });

  // === 載入蘑菇走路影片 (.webm) ===
  mushroomWalkVideo = createVideo('角色資料/蘑菇走路.webm', () => {
    console.log('蘑菇走路影片載入成功');
    mushroomWalkVideo.loop();      // 循環播放
    mushroomWalkVideo.hide();      // 隱藏原生影片元素，只在 canvas 中繪製
  }, (error) => {
    console.error('蘑菇走路影片載入失敗：', error);
  });

  // === 載入蘑菇待機圖片 (.gif) ===
  mushroomIdleImg = loadImage('角色資料/蘑菇待機.gif', () => {
    console.log('蘑菇待機圖片載入成功');
  }, (error) => {
    console.error('蘑菇待機圖片載入失敗：', error);
  });

  // 載入背景圖片
  bgImg = loadImage('背景/背景.png', () => {
    console.log('背景圖片載入成功');
  }, (error) => {
    console.error('背景圖片載入失敗，將使用預設繪製背景。', error);
  });
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.elt.focus(); // 強制讓畫布取得焦點，解決 v5 預覽面板吃掉按鍵的問題

  groundY = height * 0.76;
  x = width / 2;
  y = groundY;

  // 蘑菇初始位置（放在角色左側附近，方便碰到）
  mushroomX = x - 120;
  mushroomY = groundY;
  mushroomPatrolStartX = mushroomX;

  if (walkImg) {
    let wWidth = Math.floor(walkImg.width / 6);
    let wHeight = walkImg.height;
    for (let i = 0; i < 6; i++) {
      let img = walkImg.get(i * wWidth, 0, wWidth, wHeight);
      walkFrames.push(img);
    }
  }

  if (jumpImg) {
    let jWidth = Math.floor(jumpImg.width / 7);
    let jHeight = jumpImg.height;
    for (let i = 0; i < 7; i++) {
      let img = jumpImg.get(i * jWidth, 0, jWidth, jHeight);
      jumpFrames.push(img);
    }
  }

  if (fallImg) {
    let fWidth = Math.floor(fallImg.width / 7);
    let fHeight = fallImg.height;
    for (let i = 0; i < 7; i++) {
      let sx = i * fWidth;
      let sw = (i === 6) ? fallImg.width - sx : fWidth; // 最後一幀補齊剩餘寬度，避免切歪
      let img = fallImg.get(sx, 0, sw, fHeight);
      fallFrames.push(img);
    }
  }
}

function draw() {
  drawScene();

  // 倒地動畫播放時不移動，倒地後按左右鍵可起身
  if (state === 'fallen' && (keys[LEFT_ARROW] || keys[RIGHT_ARROW] || keys['a'] || keys['d'] || keys['A'] || keys['D'])) {
    state = 'idle';
    fallFrameCounter = 0;
  }

  // 處理鍵盤左右移動輸入（同時支援 keyIsDown 與自訂 keys 陣列）
  let isMoving = false;
  if (state !== 'fall') {
    if (keyIsDown(LEFT_ARROW) || keys[LEFT_ARROW] || keys['a'] || keys['A']) {
      x -= speed;
      facing = 1;
      isMoving = true;
    }
    if (keyIsDown(RIGHT_ARROW) || keys[RIGHT_ARROW] || keys['d'] || keys['D']) {
      x += speed;
      facing = -1;
      isMoving = true;
    }
  }

  // 背景滾動邏輯：當角色走到畫面中央偏右/偏左時，背景開始跟隨移動
  const centerX = width / 2;
  const deadZone = 120;
  if (x > centerX + deadZone) {
    const excess = x - centerX - deadZone;
    bgX += excess * bgScrollSpeed;
    x = centerX + deadZone;
  } else if (x < centerX - deadZone && bgX > 0) {
    // 只有背景還沒滾到最左邊時，才跟著滾背景並鎖定角色位置
    const excess = centerX - deadZone - x;
    bgX -= excess * bgScrollSpeed;
    x = centerX - deadZone;
  }
  bgX = Math.max(0, bgX);
  // 左邊不再強制限制，讓角色在背景到底時可繼續往左走
  x = constrain(x, 0, width - 24);

  // === 蘑菇觸碰冷卻計時器 ===
  if (touchCooldownTimer > 0) {
    touchCooldownTimer--;
  }

  // === 蘑菇碰撞偵測（碰到即出題，不阻擋角色，可直接穿過） ===
  if (!showMathQuestion && touchCooldownTimer === 0) {
    let hit = checkMushroomCollision();
    if (hit) {
      touchCount++;
      touchCooldownTimer = 60; // 約 1 秒冷卻，避免連續觸發
      mushroomState = 'idle';  // 確保顯示待機動畫
      generateMathQuestion();  // 碰到蘑菇就立刻跳出數學題
    }
  }

  // === 蘑菇左右巡邏移動（僅在 walk 狀態） ===
  if (mushroomState === 'walk') {
    mushroomX += mushroomPatrolDir * mushroomPatrolSpeed;
    // 碰到巡邏邊界則反向
    if (mushroomX > mushroomPatrolStartX + mushroomPatrolRange) {
      mushroomPatrolDir = -1;
      mushroomFacing = -1;
    } else if (mushroomX < mushroomPatrolStartX - mushroomPatrolRange) {
      mushroomPatrolDir = 1;
      mushroomFacing = 1;
    }
    // 防止跑出畫面左右邊緣
    mushroomX = constrain(mushroomX, 40, width - 40);
  }

  // === 數學題回饋計時器（只清除回饋文字，數學題必須答對才會消失） ===
  if (mathFeedbackTimer > 0) {
    mathFeedbackTimer--;
    if (mathFeedbackTimer === 0) {
      mathFeedback = '';
    }
  }

  // 處理跳躍與重力物理運算
  if (state === 'jump' || y < groundY) {
    vy += gravity;
    y += vy;
    if (y < groundY) {
      state = 'jump';
    } else {
      y = groundY;
      vy = 0;
      jumpFrameCounter = 0;
      state = isMoving ? 'walk' : 'idle';
    }
  } else if (state !== 'fall' && state !== 'fallen') {
    if (isMoving) {
      state = 'walk';
    } else {
      state = 'idle';
    }
  }

  // 處理動畫幀切換
  if (state === 'walk' && walkFrames.length > 0) {
    frameCounter += animSpeed;
    currentFrame = Math.floor(frameCounter) % walkFrames.length;
  } else if (state === 'jump' && jumpFrames.length > 0) {
    currentFrame = min(Math.floor(jumpFrameCounter), jumpFrames.length - 1);
    jumpFrameCounter += animSpeed;
  } else if (state === 'fall' && fallFrames.length > 0) {
    fallFrameCounter += animSpeed;
    currentFrame = min(Math.floor(fallFrameCounter), fallFrames.length - 1);
    if (fallFrameCounter >= fallFrames.length - 1) {
      state = 'fallen';
    }
  } else if (state === 'fallen' && fallFrames.length > 0) {
    currentFrame = fallFrames.length - 1; // 保持最後一個跌倒幀
  } else if (state === 'fall' || state === 'fallen') {
    if (state === 'fall') {
      fallFrameCounter += animSpeed;
      if (fallFrameCounter >= 7) {
        state = 'fallen';
      }
    }
  } else if (state === 'idle') {
    currentFrame = 0;
    frameCounter = 0;
  }

  // === 繪製蘑菇（在角色之前，讓角色可走在蘑菇前方） ===
  drawMushroom();

  // 顯示蘑菇狀態（左上角）
  fill(0);
  noStroke();
  textSize(18);
  textAlign(LEFT, TOP);
  text(`蘑菇狀態：${mushroomState === 'idle' ? '待機中' : '巡邏中'}`, 20, 20);

  if ((state === 'fall' || state === 'fallen') && fallFrames.length === 0 ||
      (state === 'jump' && jumpFrames.length === 0) ||
      (state !== 'jump' && walkFrames.length === 0)) {
    drawFallbackCharacter();
  } else {
    // 繪製角色
    push();
    translate(x, y);
    scale(facing, 1); // 透過 scale 實現水平鏡射翻轉
    imageMode(CENTER);

    if (state === 'jump') {
      image(jumpFrames[currentFrame], 0, 0);
    } else if (state === 'fall' || state === 'fallen') {
      // 跌倒圖片貼地：根據圖片高度向下偏移，讓圖片底部貼近地面
      let fallImg = fallFrames[currentFrame];
      let fallY = fallImg ? fallImg.height * 0.25 : 0;
      image(fallImg, 0, fallY);
    } else {
      image(walkFrames[currentFrame], 0, 0);
    }
    pop();
  }

  // === 繪製數學題彈出視窗 ===
  if (showMathQuestion) {
    drawMathQuestion();
  }
}

// === 檢查角色與蘑菇碰撞 ===
function checkMushroomCollision() {
  let playerW = 50;
  let playerH = 80;
  // 碰撞箱與顯示大小一致，稍微縮小一些讓碰撞更好判定
  let mW = mushroomSize * 0.7;
  let mH = mushroomSize * 0.9;
  return (
    x - playerW / 2 < mushroomX + mW / 2 &&
    x + playerW / 2 > mushroomX - mW / 2 &&
    y - playerH / 2 < mushroomY + mH / 2 &&
    y + playerH / 2 > mushroomY - mH / 2
  );
}

// === 產生隨機問答題 ===
function generateMathQuestion() {
  let idx = floor(random(questionList.length));
  questionText = questionList[idx];

  userAnswer = '';
  mathFeedback = '';
  mathFeedbackTimer = 180; // 顯示 3 秒（60fps）
  showMathQuestion = true;
}

// === 繪製蘑菇 ===
function drawMushroom() {
  push();
  translate(mushroomX, mushroomY);
  scale(mushroomFacing, 1);
  imageMode(CENTER);

  if (mushroomState === 'walk') {
    // 走路：播放 .webm 影片
    if (mushroomWalkVideo) {
      mushroomWalkVideo.loop(); // 確保持續循環播放
      image(mushroomWalkVideo, 0, 0, mushroomSize, mushroomSize);
    } else {
      drawFallbackMushroom();
    }
  } else {
    // 待機：顯示單一 .gif 圖片，不用輪播
    if (mushroomIdleImg) {
      image(mushroomIdleImg, 0, 0, mushroomSize, mushroomSize);
    } else {
      drawFallbackMushroom();
    }
  }
  pop();
}

// === 蘑菇內建備用圖形（若圖片載入失敗，請檢查路徑） ===
let mushroomMissingWarningShown = false;
function drawFallbackMushroom() {
  if (!mushroomMissingWarningShown && (!mushroomIdleImg || !mushroomWalkVideo)) {
    console.warn('⚠️ 蘑菇媒體檔案未載入成功，請確認檔案是否放在：');
    console.warn('   角色資料/蘑菇走路.webm   (走路影片)');
    console.warn('   角色資料/蘑菇待機.gif     (待機圖片)');
    mushroomMissingWarningShown = true;
  }
  noStroke();
  fill(255, 50, 50);
  ellipse(0, -20, 60, 60);      // 大菇蓋（紅色醒目）
  fill(160, 120, 80);
  rect(-14, 20, 28, 50, 6);     // 菇柄
  fill(255, 255, 255);
  ellipse(-12, -28, 8, 8);      // 菇斑點
  ellipse(12, -24, 7, 7);
  ellipse(0, -14, 9, 9);
  fill(0);
  textSize(14);
  textAlign(CENTER);
  text('🍄 蘑菇', 0, 55);
}

// === 繪製問答題彈出視窗 ===
function drawMathQuestion() {
  // 半透明遮罩
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  // 題目框
  fill(255);
  rect(width / 2 - 220, height / 2 - 140, 440, 280, 15);
  stroke(100);
  strokeWeight(2);
  rect(width / 2 - 220, height / 2 - 140, 440, 280, 15);
  noStroke();

  fill(0);
  textAlign(CENTER, CENTER);
  textSize(28);
  text('🍄 蘑菇待機中！請回答問題', width / 2, height / 2 - 80);

  textSize(32);
  text(questionText, width / 2, height / 2 - 20);

  textSize(24);
  text('回答：' + userAnswer, width / 2, height / 2 + 30);

  textSize(18);
  fill(100);
  text('輸入內容後按 Enter 提交', width / 2, height / 2 + 70);

  if (mathFeedback) {
    fill(mathFeedback === '回答完成！' ? '#4CAF50' : '#F44336');
    textSize(22);
    text(mathFeedback, width / 2, height / 2 + 115);
  }
}

function drawFallbackCharacter() {
  push();
  translate(x, y);
  scale(facing, 1);
  noStroke();

  if (state === 'fall' || state === 'fallen') {
    fill(247, 190, 83);
    ellipse(0, 8, 54, 28);
    fill(255, 231, 190);
    ellipse(-13, 1, 25, 24);
    fill(57, 64, 77);
    ellipse(-19, -2, 3, 4);
    fill(84, 146, 205);
    rect(-4, 12, 21, 8, 5);
  } else {
    const hop = state === 'jump' ? -8 : 0;
    fill(84, 146, 205);
    rect(-12, -34 + hop, 24, 30, 9);
    fill(255, 231, 190);
    ellipse(0, -43 + hop, 30, 30);
    fill(57, 64, 77);
    ellipse(6, -45 + hop, 3, 4);
    fill(247, 190, 83);
    arc(0, -49 + hop, 31, 23, PI, TWO_PI);
    fill(57, 64, 77);
    rect(-12, -5 + hop, 9, 17, 4);
    rect(3, -5 + hop, 9, 17, 4);
    fill(255, 231, 190);
    ellipse(-7, 12 + hop, 14, 6);
    ellipse(8, 12 + hop, 14, 6);
  }
  pop();
}

function drawScene() {
  // === 繪製背景圖片（支援隨角色移動平滑滾動） ===
  if (bgImg && bgImg.width > 0) {
    const bgWidth = bgImg.width;
    const scale = height / bgImg.height;  
    const scaledWidth = bgWidth * scale;

    let overlap = 8; 
    let startX = -bgX - scaledWidth - overlap;
    while (startX < width + overlap) {
      image(bgImg, startX, 0, scaledWidth + overlap * 2, height);
      startX += scaledWidth;
    }
  } else {
    // 備用背景（若圖片未成功載入時顯示漸層天空）
    const sky = drawingContext.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#78c9ec');
    sky.addColorStop(0.64, '#d7f2e7');
    drawingContext.fillStyle = sky;
    drawingContext.fillRect(0, 0, width, height);

    noStroke();
    fill(255, 224, 120);
    ellipse(width * 0.84, height * 0.17, 74, 74);
  }

  // 地面
  fill(103, 190, 99);
  rect(0, groundY + 25, width, height - groundY - 25);
  stroke(65, 145, 78);
  strokeWeight(3);
  line(0, groundY + 25, width, groundY + 25);
}

function windowResized() {
  const groundOffset = y - groundY;
  resizeCanvas(windowWidth, windowHeight);
  groundY = height * 0.76;
  y = groundY + groundOffset;
  x = constrain(x, 24, width - 24);
}

// === 鍵盤事件監聽（完美支援 v5 預覽面板與原生 p5 函式） ===
function keyPressed() {
  // 問答題彈出時的按鍵處理
  if (showMathQuestion) {
    if (keyCode === ENTER) {
      if (userAnswer.trim() !== '') {
        mathFeedback = '回答完成！';
        showMathQuestion = false; // 回答後關閉題目
        touchCount = 0;           // 重置觸碰次數
        mushroomState = 'walk';   // 答完後恢復走路，若再次碰觸蘑菇則題目繼續出現
        mushroomPatrolStartX = mushroomX;
      } else {
        mathFeedback = '請先輸入內容';
      }
      mathFeedbackTimer = 180;    // 顯示回饋訊息一段時間
    }
    if (keyCode === BACKSPACE) {
      userAnswer = userAnswer.slice(0, -1);
    }
    return; // 題目期間不處理其他鍵盤（移動、跳躍等）
  }

  if (keyCode === UP_ARROW && y === groundY && state !== 'fall') {
    vy = jumpForce;
    state = 'jump';
    jumpFrameCounter = 0;
  }
  if (keyCode === DOWN_ARROW && y === groundY && state !== 'jump' && state !== 'fall' && state !== 'fallen') {
    state = 'fall';
    fallFrameCounter = 0;
  }
}

// 文字輸入（僅在問答題顯示時啟用，支援中文與各種字元）
function keyTyped() {
  if (showMathQuestion) {
    if (key.length === 1) {
      userAnswer += key;
    }
    return false; // 防止預設行為
  }
}

// 同步監聽原生的按鍵狀態，確保 v5 預覽不會卡住
window.addEventListener('keydown', function(e) {
  keys[e.keyCode] = true;
  keys[e.key] = true;
  if ([37, 38, 39, 40, 32].includes(e.keyCode)) {
    e.preventDefault();
  }
}, false);

window.addEventListener('keyup', function(e) {
  keys[e.keyCode] = false;
  keys[e.key] = false;
}, false);