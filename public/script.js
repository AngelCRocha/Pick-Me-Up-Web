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

// Default messages (shown until the server responds)
let messages = [
  "You are doing great today 🌟",
  "Take a breath — you've got this 💙",
  "Small progress is still progress.",
  "You matter more than you know.",
  "Be proud of yourself for trying.",
  "Your effort counts, even when it's quiet."
];

// Load messages from the server
fetch("/api/messages")
  .then((res) => res.json())
  .then((data) => {
    if (Array.isArray(data) && data.length) {
      messages = data;
    }
  })
  .catch(() => {});

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

  // If empty, just exit
  if (!text) {
    exitSubmitMode();
    return;
  }

  // Disable button while submitting
  submitBtn.disabled = true;

  fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) {
        alert(data.error || "Could not submit message.");
        return;
      }
      // Add to message pool and show it immediately
      messages.unshift(text);
      exitSubmitMode();
      messageText.textContent = text;
    })
    .catch(() => {
      alert("Something went wrong. Please try again.");
    })
    .finally(() => {
      submitBtn.disabled = false;
    });
});
