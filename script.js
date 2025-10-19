// script.js
// Gamified quiz app with levels, badges, streaks, review summary, and confetti animation 🎊

const state = {
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: {},
  streak: 0,
  bestStreak: 0,
  level: "Bronze",
  badge: "None"
};

// DOM elements
const quizArea = document.getElementById("quizArea");
const progressBar = document.getElementById("progressBar");
const counterEl = document.getElementById("counter");
const scoreEl = document.getElementById("score");
const levelText = document.getElementById("levelText");
const streakCount = document.getElementById("streakCount");
const badgeText = document.getElementById("badgeText");

// Load questions
async function loadQuestions() {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();
    state.questions = data;
    if (!Array.isArray(data) || data.length === 0) throw new Error("No questions found");
    start();
  } catch (err) {
    console.error("Error loading questions.json:", err);
    quizArea.innerHTML = `<div class="card"><p class="small">Could not load questions. Make sure questions.json is present and you are running a local server (e.g. python -m http.server).</p></div>`;
  }
}

// Update gamification stats
function updateGamification() {
  const qNum = state.currentIndex + 1;

  // Levels
  if (qNum <= 3) state.level = "Bronze";
  else if (qNum <= 6) state.level = "Silver";
  else if (qNum <= 9) state.level = "Gold";
  else state.level = "Platinum";

  // Badges
  const percent = (state.score / state.questions.length) * 100;
  if (percent >= 100) state.badge = "Perfect!";
  else if (percent >= 80) state.badge = "Expert";
  else if (percent >= 50) state.badge = "Learner";
  else state.badge = "None";

  levelText.textContent = state.level;
  streakCount.textContent = state.streak;
  badgeText.textContent = state.badge;
}

// Render a question
function renderQuestion() {
  const q = state.questions[state.currentIndex];
  const total = state.questions.length;
  counterEl.textContent = `Question ${state.currentIndex + 1} of ${total}`;
  scoreEl.textContent = `Score: ${state.score}`;
  progressBar.style.width = `${Math.round((state.currentIndex / total) * 100)}%`;
  updateGamification();

  quizArea.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";

  const qEl = document.createElement("div");
  qEl.className = "question";
  qEl.innerHTML = q.question;
  card.appendChild(qEl);

  const opts = document.createElement("div");
  opts.className = "options";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.type = "button";
    btn.setAttribute("data-index", i);
    btn.innerHTML = `<div class="option-label">${String.fromCharCode(65 + i)}</div><div class="option-text">${opt}</div>`;
    btn.addEventListener("click", () => onSelectOption(q, i));
    opts.appendChild(btn);
  });
  card.appendChild(opts);

  const controls = document.createElement("div");
  controls.className = "controls";

  const skip = document.createElement("button");
  skip.className = "btn secondary";
  skip.textContent = "Skip";
  skip.addEventListener("click", onSkip);

  const next = document.createElement("button");
  next.className = "btn";
  next.textContent = state.currentIndex === total - 1 ? "Finish" : "Next";
  next.addEventListener("click", onNext);

  controls.appendChild(skip);
  controls.appendChild(next);
  card.appendChild(controls);

  quizArea.appendChild(card);
}

// Handle selection
function onSelectOption(qObj, selectedIndex) {
  if (state.answered[qObj.id]) return;

  const correctIndex = qObj.answerIndex;
  const isCorrect = selectedIndex === correctIndex;
  state.answered[qObj.id] = { selectedIndex, correct: isCorrect };

  const optionButtons = document.querySelectorAll(".option-btn");
  optionButtons.forEach((b) => {
    const idx = parseInt(b.getAttribute("data-index"), 10);
    b.disabled = true;
    if (idx === correctIndex) b.classList.add("correct");
    if (idx === selectedIndex && !isCorrect) b.classList.add("incorrect");
  });

  if (isCorrect) {
    state.score++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
  } else {
    state.streak = 0;
  }

  scoreEl.textContent = `Score: ${state.score}`;
  updateGamification();

  const feedback = document.createElement("div");
  feedback.className = "feedback";
  feedback.innerHTML = `${isCorrect ? "✅ Correct!" : "❌ Incorrect."}<br>Explanation: ${qObj.explanation}`;
  quizArea.appendChild(feedback);
}

// Navigation
function onNext() {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
  } else {
    showSummary();
  }
}

function onSkip() {
  const qObj = state.questions[state.currentIndex];
  state.answered[qObj.id] = { selectedIndex: null, correct: false };
  state.streak = 0;
  onNext();
}

// 🎉 Confetti Animation
function launchConfetti() {
  const confettiContainer = document.createElement("canvas");
  confettiContainer.id = "confettiCanvas";
  confettiContainer.style.position = "fixed";
  confettiContainer.style.top = "0";
  confettiContainer.style.left = "0";
  confettiContainer.style.width = "100%";
  confettiContainer.style.height = "100%";
  confettiContainer.style.pointerEvents = "none";
  confettiContainer.style.zIndex = "9999";
  document.body.appendChild(confettiContainer);

  const ctx = confettiContainer.getContext("2d");
  const confettiPieces = [];
  const colors = ["#EC265F", "#26ECB4", "#FFD700", "#FF69B4"];

  for (let i = 0; i < 120; i++) {
    confettiPieces.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight - window.innerHeight,
      r: Math.random() * 8 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 2
    });
  }

  function drawConfetti() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiPieces.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
  }

  function updateConfetti() {
    confettiPieces.forEach((p) => {
      p.y += p.speed;
      if (p.y > window.innerHeight) {
        p.y = -10;
        p.x = Math.random() * window.innerWidth;
      }
    });
  }

  function animate() {
    drawConfetti();
    updateConfetti();
    requestAnimationFrame(animate);
  }

  animate();

  // Remove after 5 seconds
  setTimeout(() => {
    document.body.removeChild(confettiContainer);
  }, 5000);
}

// Summary page with confetti if Perfect!
function showSummary() {
  const total = state.questions.length;
  progressBar.style.width = "100%";
  counterEl.textContent = "Completed";

  quizArea.innerHTML = `
    <div class="card summary">
      <h2>🎉 Quiz Summary</h2>
      <p style="font-size:18px">Total Score: <strong>${state.score} / ${total}</strong></p>
      <p>Final Level: <strong>${state.level}</strong></p>
      <p>Badge Earned: 🏅 <strong>${state.badge}</strong></p>
      <p>Longest Streak: 🔥 <strong>${state.bestStreak}</strong></p>
      <hr style="margin:14px 0">
      <h3>Review</h3>
      <div id="reviewList" style="margin-top:10px"></div>
      <button class="btn" style="margin-top:14px" onclick="restartQuiz()">Restart Quiz</button>
    </div>
  `;

  // Create review list
  const reviewList = document.getElementById("reviewList");
  state.questions.forEach((q, idx) => {
    const yourAnswer = state.answered[q.id] ? state.answered[q.id].selectedIndex : null;
    const correctIdx = q.answerIndex;

    const reviewItem = document.createElement("div");
    reviewItem.style.borderTop = "1px solid #eee";
    reviewItem.style.padding = "10px 0";
    reviewItem.innerHTML = `
      <div style="font-weight:600; margin-bottom:4px;">${idx + 1}. ${q.question}</div>
      <div>Your answer: ${yourAnswer === null ? "<em>Not answered</em>" : q.options[yourAnswer]}</div>
      <div>Correct answer: <strong>${q.options[correctIdx]}</strong></div>
      <div style="color:var(--muted); margin-top:4px;">Explanation: ${q.explanation}</div>
    `;
    reviewList.appendChild(reviewItem);
  });

  // 🎊 Launch confetti if perfect
  if (state.badge === "Perfect!") {
    launchConfetti();
  }
}

// Restart
function restartQuiz() {
  state.currentIndex = 0;
  state.score = 0;
  state.answered = {};
  state.streak = 0;
  state.bestStreak = 0;
  state.level = "Bronze";
  state.badge = "None";
  renderQuestion();
}

// Start quiz
function start() {
  document.title = "Gamified Quiz";
  renderQuestion();
}

// Initialize
loadQuestions();
