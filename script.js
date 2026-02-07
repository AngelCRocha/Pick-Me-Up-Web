const stage = document.getElementById("stage");
const card = document.getElementById("card");

const messageText = document.getElementById("messageText");
const composer = document.getElementById("composer");
const messageInput = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");

const submitBtn = document.getElementById("submitBtn");

let isDragging = false;
let isAnimating = false;
let startX = 0;
let currentX = 0;

const SWIPE_THRESHOLD = 100;
const MAX_CHARS = 200;

let isSubmitMode = false;

// Demo messages (we'll also save user submissions to localStorage)
let messages = [
  "You are doing great today 🌟",
  "Take a breath — you’ve got this 💙",
  "Small progress is still progress.",
  "You matter more than you know.",
  "Be proud of yourself for trying.",
  "Your effort counts, even when it’s quiet."
];

// Load saved user messages (optional)
try {
  const saved = JSON.parse(localStorage.getItem("pickMeUpMessages") || "[]");
  if (Array.isArray(saved) && saved.length) {
    messages = [...saved, ...messages];
  }
} catch (_) {}

function saveUserMessage(msg) {
  try {
    const saved = JSON.parse(localStorage.getItem("pickMeUpMessages") || "[]");
    saved.unshift(msg);
    localStorage.setItem("pickMeUpMessages", JSON.stringify(saved.slice(0, 50)));
  } catch (_) {}
}

function getClientX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX;
}

function getNextMessage(current) {
  if (messages.length === 1) return messages[0];
  let next = current;
  while (next === current) {
    next = messages[Math.floor(Math.random() * messages.length)];
  }
  return next;
}

function resetInline() {
  card.style.transform = "";
  card.style.opacity = "";
}

function animateNextCard() {
  isAnimating = true;
  resetInline();
  card.classList.add("exit-left");

  setTimeout(() => {
    messageText.textContent = getNextMessage(messageText.textContent);

    card.classList.remove("exit-left");
    card.classList.add("enter-right");

    requestAnimationFrame(() => {
      card.classList.add("enter-center");
    });

    setTimeout(() => {
      card.classList.remove("enter-right", "enter-center");
      isAnimating = false;
    }, 320);
  }, 320);
}

/* ---------------------------
   Swipe handlers (VIEW MODE ONLY)
---------------------------- */
function onStart(e) {
  if (isSubmitMode || isAnimating) return;

  isDragging = true;
  startX = getClientX(e);
  currentX = startX;
  card.classList.add("dragging");
}

function onMove(e) {
  if (!isDragging || isSubmitMode || isAnimating) return;

  currentX = getClientX(e);
  const dx = Math.min(0, currentX - startX); // only left
  card.style.transform = `translateX(${dx}px)`;
  card.style.opacity = String(1 - Math.abs(dx) / 300);

  if (Math.abs(dx) > 10 && e.cancelable) e.preventDefault();
}

function onEnd() {
  if (!isDragging || isSubmitMode || isAnimating) return;

  isDragging = false;
  card.classList.remove("dragging");

  const dx = currentX - startX;

  if (dx < -SWIPE_THRESHOLD) {
    animateNextCard();
  } else {
    card.style.transform = "translateX(0)";
    card.style.opacity = "1";
    setTimeout(resetInline, 300);
  }
}

/* Touch */
stage.addEventListener("touchstart", onStart, { passive: true });
stage.addEventListener("touchmove", onMove, { passive: false });
stage.addEventListener("touchend", onEnd, { passive: true });

/* Mouse */
stage.addEventListener("mousedown", onStart);
window.addEventListener("mousemove", onMove);
window.addEventListener("mouseup", onEnd);

/* ---------------------------
   Submit Mode toggle
---------------------------- */
function updateCharCount() {
  const count = messageInput.value.length;
  charCount.textContent = `${count}/${MAX_CHARS}`;
}

messageInput.addEventListener("input", updateCharCount);

function enterSubmitMode() {
  isSubmitMode = true;

  // Hide message, show composer
  messageText.classList.add("hidden");
  composer.classList.remove("hidden");

  // Update button label
  submitBtn.textContent = "Post Pick Me Up";

  card.classList.add("submit-mode");

  // Reset textarea
  messageInput.value = "";
  updateCharCount();

  // Focus cursor into textarea
  setTimeout(() => messageInput.focus(), 0);
}

function exitSubmitMode() {
  isSubmitMode = false;

  composer.classList.add("hidden");
  messageText.classList.remove("hidden");

  submitBtn.textContent = "Submit Pick Me Up";

  card.classList.remove("submit-mode");
}

submitBtn.addEventListener("click", () => {
  if (isAnimating) return;

  // First click: go into submit mode
  if (!isSubmitMode) {
    enterSubmitMode();
    return;
  }

  // Second click: submit message and return to normal
  const text = messageInput.value.trim();

  // If empty, just exit (or you can require a message)
  if (!text) {
    exitSubmitMode();
    return;
  }

  // Save locally for now
  saveUserMessage(text);

  // Add to message pool so it can show up when swiping
  messages.unshift(text);

  // Return to regular message view
  exitSubmitMode();

  // Optional: show the newly submitted message immediately
  messageText.textContent = text;
});
