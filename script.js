/*
  Moonie's Very Serious Date Proposal
  ----------------------------------------------------
  Quick edits:
  - Music: replace assets/music.mp3
  - Personal letter: edit PERSONAL_LETTER below
  - Names/text: edit CONFIG or the HTML copy
  - Photos: replace the files in /assets using the same filenames

  Everything stays inside this website. There is no email, webhook,
  form submission, or database connection in this version.
*/

const CONFIG = {
  recipientName: "Charms",
  senderName: "Caloy",
  catName: "Moonie",
  musicFile: "assets/music.mp3"
};

// ================================================================
// ✍️ EDIT ONLY THIS BLOCK WHEN YOU ARE READY TO WRITE YOUR LETTER.
// Keep the blank lines — they become paragraph breaks on the page.
// ================================================================
const PERSONAL_LETTER = `For Charms,

I could've just asked you through chat, but I wanted to make this a little more special. Something that would hopefully make you smile even before our date begins. 😊

I also want to thank you for respecting my decision last time and for giving me the space I needed. But somewhere along the way, I realized it had already been too long, and I missed you more than I expected.

I'm okay now. Okay enough to finally go out again with my future wife. ❤️

Thank you for staying, for understanding me, and most especially, for saying yes to this date. Babawi ako sa date natin. I've really missed spending time with you, and of course, seeing your ever-loving, beautiful face again.

So thank you for saying yes, Kulakatching.

I'm really happy you did. ❤️

And no, it's not “see you when I see you” this time. I can't wait to see you again. ♡

Ikaw pa rin ang pipiliin ko sa araw-araw. Mahal na mahal kita, Charms Yacap Arzaga.

Sincerely yours,

Caloy`;

const MOONIE_MOODS = {
  neutral: { src: "assets/moonie-neutral.mp4", poster: "assets/moonie-neutral-poster.webp" },
  begging: { src: "assets/moonie-begging.mp4", poster: "assets/moonie-begging-poster.webp" },
  annoyed: { src: "assets/moonie-annoyed.mp4", poster: "assets/moonie-annoyed-poster.webp" },
  shocked: { src: "assets/moonie-shocked.mp4", poster: "assets/moonie-shocked-poster.webp" },
  happy: { src: "assets/moonie-happy.mp4", poster: "assets/moonie-happy-poster.webp" }
};

const state = {
  currentScene: "opening",
  day: "",
  food: "",
  activity: "",
  vibe: "",
  icecream: "",
  decision: "pending",
  noAttempts: 0,
  pokes: 0,
  achievements: new Set(),
};

const SCENE_ORDER = ["opening", "intro", "memory", "question", "celebration", "day", "food", "activity", "vibe", "icecream", "review", "ticket", "letter", "finale"];
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const app = $("#app");
const bgMusic = $("#bgMusic");
const musicBtn = $("#musicBtn");
const musicIcon = $("#musicIcon");
const fxCanvas = $("#fxCanvas");
const ctx = fxCanvas.getContext("2d");
const cursorGlow = $("#cursorGlow");
const introMoonieVideo = $("#introMoonieVideo");
const reactionVideo = $("#reactionVideo");
const celebrationMoonieVideo = $("#celebrationMoonieVideo");
const builderMoonieVideo = $("#builderMoonieVideo");
const moonieCompanion = $("#moonieCompanion");
const builderMoonieCaption = $("#builderMoonieCaption");
const maybeMoonieVideo = $("#maybeMoonieVideo");
const finaleMoonieVideo = $("#finaleMoonieVideo");
const letterMoonieVideo = $("#letterMoonieVideo");
const moonieVideos = [introMoonieVideo, reactionVideo, celebrationMoonieVideo, builderMoonieVideo, maybeMoonieVideo, finaleMoonieVideo, letterMoonieVideo].filter(Boolean);

let musicStarted = false;
let particles = [];
let fxRaf = 0;
let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
let pointerRaf = 0;
let reactionResetTimer = 0;
let celebrationTimers = [];

function resizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 1.25);
  fxCanvas.width = innerWidth * dpr;
  fxCanvas.height = innerHeight * dpr;
  fxCanvas.style.width = `${innerWidth}px`;
  fxCanvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function safePlay(video) {
  if (!video) return;
  const promise = video.play();
  if (promise && typeof promise.catch === "function") promise.catch(() => {});
}

function setMoonieVideo(video, mood, { loop = true, restart = true, onEnded = null } = {}) {
  if (!video || !MOONIE_MOODS[mood]) return;
  const media = MOONIE_MOODS[mood];
  video.onended = null;
  video.loop = loop;
  video.muted = true;
  video.playsInline = true;

  if (video.dataset.mood !== mood) {
    video.pause();
    video.src = media.src;
    video.poster = media.poster;
    video.dataset.mood = mood;
    video.load();
  }

  if (restart) {
    try { video.currentTime = 0; } catch (_) {}
  }
  if (onEnded) video.onended = onEnded;
  safePlay(video);
}

function pauseMoonieVideos(except = []) {
  const keep = new Set(Array.isArray(except) ? except : [except]);
  moonieVideos.forEach(video => {
    if (!keep.has(video)) {
      video.pause();
      video.onended = null;
    }
  });
}

function showBuilderMoonie(mood = "neutral", caption = "Moonie is supervising.", loop = true) {
  if (!moonieCompanion || !builderMoonieVideo) return;
  moonieCompanion.classList.add("show");
  moonieCompanion.setAttribute("aria-hidden", "false");
  if (builderMoonieCaption) builderMoonieCaption.textContent = caption;
  setMoonieVideo(builderMoonieVideo, mood, { loop });
}

function hideBuilderMoonie() {
  if (!moonieCompanion) return;
  moonieCompanion.classList.remove("show");
  moonieCompanion.setAttribute("aria-hidden", "true");
  builderMoonieVideo?.pause();
}

function syncSceneMoonie(name) {
  clearTimeout(reactionResetTimer);
  celebrationTimers.forEach(clearTimeout);
  celebrationTimers = [];
  hideBuilderMoonie();
  pauseMoonieVideos();

  if (name === "intro") setMoonieVideo(introMoonieVideo, "neutral", { loop: true });
  if (name === "question") setMoonieVideo(reactionVideo, "neutral", { loop: true });
  if (["day", "food", "activity", "vibe", "icecream"].includes(name)) {
    showBuilderMoonie("neutral", name === "icecream" ? "Moonie is judging silently. 👀" : "Moonie is supervising.");
  }
  if (name === "maybe") setMoonieVideo(maybeMoonieVideo, "begging", { loop: true });
  if (name === "letter") setMoonieVideo(letterMoonieVideo, "neutral", { loop: true });
  if (name === "finale") setMoonieVideo(finaleMoonieVideo, "happy", { loop: true });
}

function playQuestionMood(mood, { loop = false, resetAfter = 0, holdLastFrame = false } = {}) {
  clearTimeout(reactionResetTimer);

  const onEnded = holdLastFrame ? () => {
    // Keep Moonie's final reaction visible until the next interaction.
    // Re-entering YES/NO restarts the selected clip from the beginning.
    if (state.currentScene !== "question" || reactionVideo.dataset.mood !== mood) return;
    reactionVideo.pause();
    try {
      if (Number.isFinite(reactionVideo.duration) && reactionVideo.duration > 0) {
        reactionVideo.currentTime = Math.max(0, reactionVideo.duration - 0.04);
      }
    } catch (_) {}
  } : null;

  setMoonieVideo(reactionVideo, mood, {
    loop: holdLastFrame ? false : loop,
    restart: true,
    onEnded
  });

  if (resetAfter && !holdLastFrame) {
    reactionResetTimer = setTimeout(() => {
      if (state.currentScene === "question") setMoonieVideo(reactionVideo, "neutral", { loop: true });
    }, resetAfter);
  }
}

function goToScene(name) {
  const current = $(`.scene[data-scene="${state.currentScene}"]`);
  const next = $(`.scene[data-scene="${name}"]`);
  if (!next || current === next) return;

  if (current) {
    current.classList.add("leaving");
    setTimeout(() => {
      current.classList.remove("active", "leaving");
    }, 420);
  }
  next.scrollTop = 0;
  next.classList.add("active");
  state.currentScene = name;
  syncSceneMoonie(name);

  if (name === "review") updateReview();
  if (name === "ticket") updateTicket();
  if (name === "letter") resetLetterScene();
  if (name === "celebration") runCelebration();
}

$$('[data-next]').forEach(btn => btn.addEventListener('click', () => goToScene(btn.dataset.next)));

function startMusic() {
  if (musicStarted) return;
  musicStarted = true;
  bgMusic.volume = 0.35;
  bgMusic.play().then(() => {
    musicBtn.classList.add("active");
    musicBtn.setAttribute("aria-pressed", "true");
    musicIcon.textContent = "♫";
  }).catch(() => {
    // Browsers may reject if there was no user gesture. User can still press the music button.
    musicBtn.classList.remove("active");
  });
}

$("#openGiftBtn").addEventListener("click", () => {
  startMusic();
  burst(innerWidth * .72, innerHeight * .46, 10, ["♡", "✦"]);
});

musicBtn.addEventListener("click", async () => {
  if (bgMusic.paused) {
    try {
      await bgMusic.play();
      musicStarted = true;
      musicBtn.classList.add("active");
      musicBtn.setAttribute("aria-pressed", "true");
      toast("Music on ♫");
    } catch {
      toast("Replace assets/music.mp3 with your song first.");
    }
  } else {
    bgMusic.pause();
    musicBtn.classList.remove("active");
    musicBtn.setAttribute("aria-pressed", "false");
    toast("Music paused");
  }
});

// Cursor and Moonie's eyes are updated at most once per animation frame.
// The old cursor-heart trail was intentionally removed because it created a lot
// of short-lived DOM nodes and could feel laggy on lower-powered phones/laptops.
window.addEventListener("pointermove", (e) => {
  pointer = { x: e.clientX, y: e.clientY };
  if (pointerRaf) return;

  pointerRaf = requestAnimationFrame(() => {
    pointerRaf = 0;
    cursorGlow.style.transform = `translate3d(${pointer.x - 85}px, ${pointer.y - 85}px, 0)`;

  });
}, { passive: true });

// Lightweight 3D tilt.
$$('[data-tilt]').forEach(card => {
  card.addEventListener('pointermove', e => {
    if (matchMedia('(hover: none)').matches) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 6}deg) translateZ(0)`;
  });
  card.addEventListener('pointerleave', () => card.style.transform = '');
});

// Moonie secret pokes.
$("#brandBtn").addEventListener("click", () => {
  state.pokes += 1;
  const lines = [
    "Moonie: why did you poke me?",
    "Moonie: seriously.",
    "Moonie: I am working.",
    "Moonie: I'm telling Caloy.",
    "Moonie: okay, now you're just being nosy."
  ];
  toast(lines[Math.min(state.pokes - 1, lines.length - 1)]);
  if (state.pokes === 5) unlockAchievement("Certified Kulakatching", "Successfully annoyed Moonie.");
});

// Choice-card handling.
$$('[data-choice-group]').forEach(group => {
  const key = group.dataset.choiceGroup;
  group.addEventListener('click', e => {
    const card = e.target.closest('.choice-card');
    if (!card) return;

    // The ice-cream question is a playful "final boss": only Cheese unlocks the next scene.
    if (key === 'icecream') {
      const reaction = $("#icecreamReaction");
      $$('.choice-card', group).forEach(c => c.classList.remove('selected', 'wrong'));

      if (card.dataset.value !== 'Cheese') {
        state.icecream = '';
        card.classList.add('wrong');
        reaction.classList.remove('is-correct');
        reaction.classList.add('is-wrong');
        reaction.textContent = 'Moonie: Hmm... not that one. Try another flavor. 👀';
        showBuilderMoonie('annoyed', 'Moonie disagrees. Try again. 😐', true);
        toast('Moonie says: not that one. 🐾');
        return;
      }

      card.classList.add('selected');
      state.icecream = 'Cheese';
      reaction.classList.remove('is-wrong');
      reaction.classList.add('is-correct');
      reaction.textContent = 'That’s the one. Moonie approves. 🧀';
      showBuilderMoonie('happy', 'Correct. Moonie approves. 🧀', true);
      unlockAchievement('Correct Answer', 'Moonie approves your dessert choice.');
      burst(innerWidth/2, innerHeight/2, 8, ["🧀", "♡"]);
      setTimeout(() => goToScene('review'), 720);
      return;
    }

    $$('.choice-card', group).forEach(c => c.classList.remove('selected', 'wrong'));
    card.classList.add('selected');
    state[key] = card.dataset.value;
    showBuilderMoonie('happy', 'Choice logged. Moonie approves. 🐾', true);

    if (key === 'food') {
      $("#foodReaction").textContent = card.dataset.reaction || "Moonie approves.";
    }

    // Tiny tactile pause, then progress.
    setTimeout(() => {
      const nextMap = { day: 'food', food: 'activity', activity: 'vibe', vibe: 'icecream' };
      if (nextMap[key]) goToScene(nextMap[key]);
    }, 560);
  });
});

// YES/NO interactions.
const yesBtn = $("#yesBtn");
const noBtn = $("#noBtn");
const maybeLaterBtn = $("#maybeLaterBtn");
const reactionHeadline = $("#reactionHeadline");
const reactionMessage = $("#reactionMessage");
const pawPointer = $("#pawPointer");

yesBtn.addEventListener("pointerenter", () => {
  reactionHeadline.textContent = "YES? YES?!";
  reactionMessage.textContent = "Moonie is trying very hard to act normal.";
  reactionMessage.classList.add("yes-one-line");
  playQuestionMood("happy", { holdLastFrame: true });
  burst(pointer.x, pointer.y, 5, ["♡"]);
});
yesBtn.addEventListener("pointerleave", () => {
  reactionHeadline.textContent = "Calm. Totally calm.";
  reactionMessage.textContent = "No pressure. Probably.";
  reactionMessage.classList.remove("yes-one-line");
  // Intentionally keep the final happy frame visible. Hovering YES again
  // restarts the happy clip from frame one.
});
yesBtn.addEventListener("click", () => {
  state.decision = "yes";
  reactionHeadline.textContent = "WAIT...";
  reactionMessage.textContent = "SHE ACTUALLY SAID YES.";
  goToScene("celebration");
});

const MAX_NO_ATTEMPTS = 500;

const noButtonLabels = [
  "No.",
  "Nope.",
  "Still no.",
  "Nice try.",
  "Not today.",
  "Absolutely not.",
  "Try again.",
  "Too slow.",
  "Moonie says no.",
  "Still trying?"
];

function getNoReaction(attempt) {
  const milestones = {
    1: ["Hmm.", "Interesting cursor movement."],
    2: ["Nice try.", "Moonie saw that coming."],
    3: ["You're persistent.", "Moonie has concerns."],
    5: ["Really?", "We are doing this now?"],
    10: ["Ten already?!", "Moonie has officially started keeping score."],
    25: ["Twenty-five NOs.", "This button is getting suspiciously good cardio."],
    50: ["Fifty.", "Charms... this has become a side quest."],
    75: ["Seventy-five?!", "Moonie respects the dedication. Not the choice."],
    100: ["ONE HUNDRED.", "And somehow... the chase is still going."],
    101: ["Plot twist. 😌", "You thought 101 was the end? Moonie has other plans."],
    125: ["One hundred twenty-five.", "Quarterway there. Yes, Moonie did the math."],
    150: ["One-fifty.", "The No button would like paid leave."],
    175: ["One seventy-five.", "This is no longer a button. It is an athlete."],
    200: ["TWO HUNDRED.", "Caloy may have overengineered this part."],
    225: ["Two twenty-five.", "Moonie remains completely unconvinced."],
    250: ["HALFWAY. 😭", "250 NOs. This is officially ridiculous."],
    275: ["Two seventy-five.", "Moonie is starting to admire the commitment."],
    300: ["THREE HUNDRED.", "The No button has unlocked legendary stamina."],
    325: ["Three twenty-five.", "Still chasing? Incredible scenes."],
    350: ["Three-fifty.", "Moonie has run out of paperwork for these complaints."],
    375: ["Three seventy-five.", "At this point, you and No have a rivalry."],
    400: ["FOUR HUNDRED.", "Only 100 more. Moonie cannot believe that sentence."],
    425: ["Four twenty-five.", "The finish line is technically visible now."],
    450: ["FOUR-FIFTY.", "Okay... now Moonie is watching very closely."],
    475: ["Twenty-five left.", "Surely you are not actually doing all 500?"],
    480: ["Twenty left.", "Moonie is preparing the final paperwork."],
    490: ["TEN LEFT.", "This has gone way too far. Keep going. 😂"],
    495: ["FIVE LEFT.", "Moonie is standing by."],
    496: ["Four left.", "No backing out of the No challenge now."],
    497: ["Three left.", "Moonie is counting out loud."],
    498: ["Two left.", "The No button looks nervous."],
    499: ["ONE MORE.", "Surely this is the last No... right?"],
    500: ["Okay, THAT'S enough. 😌", "Five hundred NOs. Moonie is confiscating the button forever."]
  };
  if (milestones[attempt]) return milestones[attempt];

  const filler = [
    ["Nope.", "That button is getting cardio."],
    ["Again?", "Moonie remains unconvinced."],
    ["Bold move.", "Questionable outcome."],
    ["Not happening.", "The No continues its escape."],
    ["Still no.", "You almost had it. Almost."],
    ["Persistent.", "Moonie respects the effort. Not the choice."],
    ["Too slow.", "The No button lives another day."],
    ["Hmm...", "Moonie saw that cursor coming."],
    ["Denied.", "Please redirect all complaints to Moonie."],
    ["No chance.", "The chase continues."],
    ["Nice attempt.", "Moonie has reviewed and rejected it."],
    ["Still here?", "The No button is developing trust issues."],
    ["Almost.", "Actually... not even close."],
    ["Keep trying.", "Moonie is weirdly entertained now."],
    ["Rejected.", "Please take a number. There are several hundred."],
    ["Not today.", "The escape route remains operational."]
  ];
  return filler[(attempt - 1) % filler.length];
}

function getNoButtonLabel(attempt) {
  const milestoneLabels = {
    25: "No #25.",
    50: "No #50.",
    75: "No #75.",
    100: "No #100.",
    101: "Plot twist.",
    125: "No #125.",
    150: "No #150.",
    200: "No #200.",
    250: "HALFWAY.",
    300: "No #300.",
    350: "No #350.",
    400: "No #400.",
    450: "No #450.",
    475: "25 left.",
    490: "10 left.",
    495: "5 left.",
    496: "4 left.",
    497: "3 left.",
    498: "2 left.",
    499: "LAST ONE?",
    500: "NO #500."
  };
  if (milestoneLabels[attempt]) return milestoneLabels[attempt];
  return noButtonLabels[(attempt - 1) % noButtonLabels.length];
}

let noMoveLocked = false;

function evadeNo(e) {
  e?.preventDefault?.();
  if (state.noAttempts >= MAX_NO_ATTEMPTS || noMoveLocked) return;

  state.noAttempts += 1;
  noMoveLocked = true;
  setTimeout(() => { noMoveLocked = false; }, 520);

  const [head, msg] = getNoReaction(state.noAttempts);
  reactionMessage.classList.remove("yes-one-line");
  reactionHeadline.textContent = head;
  reactionMessage.textContent = msg;
  noBtn.textContent = getNoButtonLabel(state.noAttempts);

  // Every fresh attempt at NO replays the annoyed reaction exactly once,
  // then Moonie stays frozen on the final frame until the next interaction.
  playQuestionMood("annoyed", { holdLastFrame: true });

  if (state.noAttempts === 3) {
    unlockAchievement("NOPE.", "Attempted to click No 3 times.");
  }

  if (state.noAttempts % 25 === 0 || [3, 10, 50, 100, 101, 200, 250, 300, 400, 450, 475, 490, 495, 499].includes(state.noAttempts)) {
    showPaw();
  }

  if (state.noAttempts < MAX_NO_ATTEMPTS) {
    moveNoButton();
    return;
  }

  // No #500: Moonie permanently removes the button, then reveals the gentle fallback.
  noBtn.disabled = true;
  noBtn.setAttribute("aria-disabled", "true");
  noBtn.tabIndex = -1;
  noBtn.classList.add("yeet");
  showPaw();
  burst(innerWidth * .72, innerHeight * .52, 8, ["🐾", "💨"]);
  setTimeout(() => {
    maybeLaterBtn.classList.remove("hidden");
    noBtn.setAttribute("aria-hidden", "true");
  }, 850);
}

function moveNoButton() {
  const r = noBtn.getBoundingClientRect();
  const marginX = Math.max(48, Math.round(innerWidth * 0.055));
  const topSafe = Math.max(105, Math.round(innerHeight * 0.14));
  const bottomSafe = Math.max(40, Math.round(innerHeight * 0.07));
  const maxLeft = Math.max(marginX, innerWidth - r.width - marginX);
  const maxTop = Math.max(topSafe, innerHeight - r.height - bottomSafe);

  // Lock in the current screen position before switching to fixed positioning,
  // so the button visibly GLIDES from wherever it currently is.
  if (!noBtn.classList.contains("fleeing")) {
    noBtn.style.left = `${r.left}px`;
    noBtn.style.top = `${r.top}px`;
    noBtn.classList.add("fleeing");
    void noBtn.offsetWidth;
  }

  const cursorX = Number.isFinite(pointer.x) ? pointer.x : r.left + r.width / 2;
  const cursorY = Number.isFinite(pointer.y) ? pointer.y : r.top + r.height / 2;
  const currentX = r.left + r.width / 2;
  const currentY = r.top + r.height / 2;
  const diag = Math.hypot(innerWidth, innerHeight);
  const minCursorDistance = Math.min(diag * 0.38, 520);
  const minTravelDistance = Math.min(diag * 0.28, 360);

  // Generate many random positions across the usable viewport, then keep only
  // genuinely far-away options. This avoids the repetitive four-corners look.
  const candidates = [];
  for (let i = 0; i < 34; i++) {
    const left = marginX + Math.random() * Math.max(1, maxLeft - marginX);
    const top = topSafe + Math.random() * Math.max(1, maxTop - topSafe);
    const cx = left + r.width / 2;
    const cy = top + r.height / 2;
    const fromCursor = Math.hypot(cx - cursorX, cy - cursorY);
    const fromCurrent = Math.hypot(cx - currentX, cy - currentY);

    // Avoid hugging the exact corners/edges, but allow all the interesting
    // in-between positions across the page.
    const edgePenalty = Math.min(
      (left - marginX) / Math.max(1, maxLeft - marginX),
      (maxLeft - left) / Math.max(1, maxLeft - marginX),
      (top - topSafe) / Math.max(1, maxTop - topSafe),
      (maxTop - top) / Math.max(1, maxTop - topSafe)
    );

    if (fromCursor >= minCursorDistance && fromCurrent >= minTravelDistance) {
      candidates.push({ left, top, score: fromCursor + fromCurrent + edgePenalty * 120 });
    }
  }

  let target;
  if (candidates.length) {
    const pool = candidates.sort((a, b) => b.score - a.score).slice(0, Math.min(8, candidates.length));
    target = pool[Math.floor(Math.random() * pool.length)];
  } else {
    // Very small viewport fallback: choose the random point farthest away.
    const fallback = [];
    for (let i = 0; i < 18; i++) {
      const left = marginX + Math.random() * Math.max(1, maxLeft - marginX);
      const top = topSafe + Math.random() * Math.max(1, maxTop - topSafe);
      const cx = left + r.width / 2;
      const cy = top + r.height / 2;
      fallback.push({ left, top, score: Math.hypot(cx - cursorX, cy - cursorY) + Math.hypot(cx - currentX, cy - currentY) });
    }
    target = fallback.sort((a, b) => b.score - a.score)[0];
  }

  requestAnimationFrame(() => {
    noBtn.style.left = `${Math.round(target.left)}px`;
    noBtn.style.top = `${Math.round(target.top)}px`;
  });
}

function showPaw() {
  pawPointer.style.left = `${Math.min(innerWidth - 80, pointer.x + 24)}px`;
  pawPointer.style.top = `${Math.min(innerHeight - 80, pointer.y - 30)}px`;
  pawPointer.classList.remove("show");
  void pawPointer.offsetWidth;
  pawPointer.classList.add("show");
  setTimeout(() => pawPointer.classList.remove("show"), 650);
}

// The No button is never directly clickable. Instead, Moonie reacts when the
// pointer gets CLOSE to it, so the button starts gliding away before the cursor
// can actually land on top of it. This makes every chase step feel intentional.
function noButtonProximityCheck(clientX, clientY, event) {
  if (state.currentScene !== "question") return;
  if (state.noAttempts >= MAX_NO_ATTEMPTS || noMoveLocked || noBtn.classList.contains("yeet")) return;

  const r = noBtn.getBoundingClientRect();
  const closestX = Math.max(r.left, Math.min(clientX, r.right));
  const closestY = Math.max(r.top, Math.min(clientY, r.bottom));
  const distance = Math.hypot(clientX - closestX, clientY - closestY);

  // Trigger before the pointer actually reaches the button. The threshold scales
  // slightly with viewport size so it still feels natural on smaller screens.
  const triggerDistance = Math.max(72, Math.min(118, Math.min(innerWidth, innerHeight) * 0.12));
  if (distance <= triggerDistance) evadeNo();
}

window.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  noButtonProximityCheck(e.clientX, e.clientY, e);
}, { passive: true });

// Touch has no hover, so a tap near No makes it flee before anything can be
// activated. Because the button itself ignores pointer events, it cannot be clicked.
window.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch" || matchMedia('(hover:none)').matches) {
    noButtonProximityCheck(e.clientX, e.clientY, e);
  }
}, { passive: false });

maybeLaterBtn.addEventListener("pointerenter", () => {
  if (state.currentScene !== "question") return;
  reactionHeadline.textContent = "Oh...";
  reactionMessage.textContent = "Moonie suddenly looks very sad.";
  playQuestionMood("begging", { loop: true });
});
maybeLaterBtn.addEventListener("pointerleave", () => {
  if (state.currentScene !== "question") return;
  reactionHeadline.textContent = state.noAttempts >= MAX_NO_ATTEMPTS ? "Fixed. 😌" : "Calm. Totally calm.";
  reactionMessage.textContent = state.noAttempts >= MAX_NO_ATTEMPTS ? "The No button has left the building." : "No pressure. Probably.";
  playQuestionMood(state.noAttempts >= MAX_NO_ATTEMPTS ? "annoyed" : "neutral", { loop: true });
});
maybeLaterBtn.addEventListener("focus", () => {
  if (state.currentScene !== "question") return;
  reactionHeadline.textContent = "Oh...";
  reactionMessage.textContent = "Moonie suddenly looks very sad.";
  playQuestionMood("begging", { loop: true });
});
maybeLaterBtn.addEventListener("blur", () => {
  if (state.currentScene !== "question") return;
  reactionHeadline.textContent = state.noAttempts >= MAX_NO_ATTEMPTS ? "Fixed. 😌" : "Calm. Totally calm.";
  reactionMessage.textContent = state.noAttempts >= MAX_NO_ATTEMPTS ? "The No button has left the building." : "No pressure. Probably.";
  playQuestionMood(state.noAttempts >= MAX_NO_ATTEMPTS ? "annoyed" : "neutral", { loop: true });
});
maybeLaterBtn.addEventListener("click", () => {
  state.decision = "maybe_another_day";
  goToScene("maybe");
});

function runCelebration() {
  const title = $("#celebrationTitle");
  const copy = $("#celebrationCopy");
  const continueBtn = $("#celebrationContinue");
  celebrationTimers.forEach(clearTimeout);
  celebrationTimers = [];

  continueBtn.classList.add("hidden");
  title.textContent = "...wait.";
  copy.textContent = "You said yes?";
  setMoonieVideo(celebrationMoonieVideo, "shocked", { loop: false, restart: true });
  burst(innerWidth / 2, innerHeight / 2, 5, ["♡"]);

  celebrationTimers.push(setTimeout(() => {
    title.textContent = "YOU SAID YES?!";
    copy.textContent = "Moonie needs a second.";
    burst(innerWidth/2, innerHeight*.48, 7, ["♡", "✦", "🌹"]);
  }, 650));

  celebrationTimers.push(setTimeout(() => {
    setMoonieVideo(celebrationMoonieVideo, "happy", { loop: true, restart: true });
    copy.textContent = "Okay okay okay. Act normal.";
  }, 2050));

  celebrationTimers.push(setTimeout(() => {
    copy.textContent = "Now we actually have to plan the date.";
    continueBtn.classList.remove("hidden");
  }, 3000));
}

function updateReview() {
  $("#reviewDay").textContent = state.day || "Choose a weekend";
  $("#reviewFood").textContent = state.food || "Choose food";
  $("#reviewActivity").textContent = state.activity || "Choose an activity";
  $("#reviewVibe").textContent = state.vibe || "Choose a vibe";
  $("#reviewIcecream").textContent = state.icecream || "Pending important verdict";
}

function updateTicket() {
  $("#ticketDay").textContent = state.day;
  $("#ticketFood").textContent = state.food;
  $("#ticketActivity").textContent = state.activity;
  $("#ticketVibe").textContent = state.vibe;
  $("#finalMoonieLine").textContent = "I can’t wait to see you again, Charms.";
}

$("#confirmBtn").addEventListener("click", () => {
  if (![state.day, state.food, state.activity, state.vibe, state.icecream].every(Boolean)) {
    toast("Moonie's clipboard is missing something. Please complete the choices first.");
    return;
  }
  state.decision = "yes";
  goToScene("ticket");
  setTimeout(() => burst(innerWidth / 2, innerHeight / 2, 10, ["♡", "✦", "🌹", "🐾"]), 500);
});

// Ticket download without external libraries.
$("#downloadTicketBtn").addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1400; canvas.height = 900;
  const c = canvas.getContext("2d");
  const bg = c.createLinearGradient(0,0,1400,900);
  bg.addColorStop(0, "#fffdf8"); bg.addColorStop(1, "#f4e7e3");
  c.fillStyle = bg; c.fillRect(0,0,1400,900);
  c.strokeStyle = "#d9c2c8"; c.lineWidth = 4; roundRect(c, 50, 50, 1300, 800, 48); c.stroke();

  c.fillStyle = "#a7364c"; c.font = "700 24px Arial"; c.fillText("♡ OFFICIAL DATE PASS ♡", 100, 125);
  c.fillStyle = "#482331"; c.font = "700 74px Georgia"; c.fillText("CHARMS × CALOY", 100, 225);
  c.fillStyle = "#8c6d78"; c.font = "28px Arial"; c.fillText("Admit two · supervised by Moonie", 102, 272);

  drawTicketField(c, "WHEN", state.day, 100, 350);
  drawTicketField(c, "FOOD", state.food, 720, 350);
  drawTicketField(c, "ACTIVITY", state.activity, 100, 510);
  drawTicketField(c, "DATE MOOD", state.vibe, 720, 510);

  c.fillStyle = "#482331"; roundRect(c, 100, 675, 1200, 110, 26); c.fill();
  c.fillStyle = "#d9bbc4"; c.font = "700 18px Arial"; c.textAlign = "center"; c.fillText("STATUS", 700, 713);
  c.fillStyle = "#fff"; c.font = "700 42px Arial"; c.fillText("✓ SHE SAID YES", 700, 762); c.textAlign = "left";
  c.fillStyle = "#8c6d78"; c.font = "20px Arial"; c.fillText("Issued by Moonie Date Coordination Services", 100, 830);
  c.textAlign = "right"; c.fillText("MOONIE-CHRM-CALOY-001", 1300, 830); c.textAlign = "left";

  const link = document.createElement("a");
  link.download = `Charms-Caloy-Date-Ticket-${state.day}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  unlockAchievement("Ticket Collector", "Saved the official proof.");
});

function drawTicketField(c, label, value, x, y) {
  c.fillStyle = "rgba(255,255,255,.68)"; roundRect(c, x, y, 580, 120, 24); c.fill();
  c.fillStyle = "#8c6d78"; c.font = "700 18px Arial"; c.fillText(label, x+28, y+38);
  c.fillStyle = "#482331"; c.font = "700 34px Georgia"; c.fillText(value, x+28, y+85);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath();
}

$("#finishBtn").addEventListener("click", () => goToScene("letter"));

function renderPersonalLetter() {
  const target = $("#personalLetterText");
  if (!target) return;
  target.innerHTML = "";
  const paragraphs = PERSONAL_LETTER.trim().split(/\n\s*\n/);
  paragraphs.forEach((paragraph, index) => {
    const p = document.createElement("p");
    p.textContent = paragraph.trim();
    if (index === 0) p.classList.add("letter-salutation");
    if (index === paragraphs.length - 1) p.classList.add("letter-signature");
    target.appendChild(p);
  });
}

function fitLetterText() {
  const target = $("#personalLetterText");
  const card = $("#personalLetterCard");
  if (!target || !card || card.classList.contains("hidden")) return;
  let size = Math.min(18, Math.max(12, innerHeight * 0.019));
  target.style.fontSize = `${size}px`;
  let guard = 0;
  while (card.scrollHeight > card.clientHeight && size > 10.5 && guard < 24) {
    size -= 0.35;
    target.style.fontSize = `${size}px`;
    guard += 1;
  }
}

function resetLetterScene() {
  renderPersonalLetter();
  const delivery = $("#letterDelivery");
  const card = $("#personalLetterCard");
  const actions = $("#letterActions");
  delivery?.classList.remove("hidden", "is-opening");
  card?.classList.add("hidden");
  actions?.classList.add("hidden");
  setMoonieVideo(letterMoonieVideo, "neutral", { loop: true, restart: true });
}

$("#openLetterBtn").addEventListener("click", () => {
  const delivery = $("#letterDelivery");
  const card = $("#personalLetterCard");
  const actions = $("#letterActions");
  delivery.classList.add("is-opening");
  setMoonieVideo(letterMoonieVideo, "happy", { loop: true, restart: true });
  burst(innerWidth / 2, innerHeight * 0.52, 6, ["♡", "✦"]);
  setTimeout(() => {
    delivery.classList.add("hidden");
    card.classList.remove("hidden");
    actions.classList.remove("hidden");
    fitLetterText();
  }, 520);
});

$("#letterContinueBtn").addEventListener("click", () => goToScene("finale"));

$("#saveLetterBtn").addEventListener("click", savePersonalLetter);

async function savePersonalLetter() {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 2000;
  const c = canvas.getContext("2d");

  const bg = c.createLinearGradient(0, 0, 1600, 2000);
  bg.addColorStop(0, "#fffdf8");
  bg.addColorStop(1, "#f5e8e4");
  c.fillStyle = bg;
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.strokeStyle = "#d9c2c8";
  c.lineWidth = 3;
  roundRect(c, 92, 92, 1416, 1816, 54);
  c.stroke();

  c.fillStyle = "rgba(167,54,76,.055)";
  c.beginPath();
  c.arc(1330, 265, 230, 0, Math.PI * 2);
  c.fill();

  c.textAlign = "left";
  c.fillStyle = "#a7364c";
  c.font = "700 24px Arial";
  c.fillText("A LITTLE NOTE FOR CHARMS", 180, 190);

  c.fillStyle = "#482331";
  c.font = "700 64px Georgia";
  c.fillText("Something to keep. ♡", 180, 285);

  c.strokeStyle = "rgba(72,35,49,.15)";
  c.setLineDash([10, 12]);
  c.beginPath(); c.moveTo(180, 330); c.lineTo(1420, 330); c.stroke();
  c.setLineDash([]);

  const paragraphs = PERSONAL_LETTER.trim().split(/\n\s*\n/);
  const maxWidth = 1240;
  const maxTextHeight = 1300;
  const startY = 430;
  let fontSize = 38;
  let layout = null;

  while (fontSize >= 25) {
    c.font = `${fontSize}px Georgia`;
    layout = layoutLetterCanvas(c, paragraphs, maxWidth, fontSize * 1.58);
    if (layout.height <= maxTextHeight) break;
    fontSize -= 1;
  }

  let y = startY;
  c.fillStyle = "#5b3442";
  c.font = `${fontSize}px Georgia`;
  for (const para of layout.paragraphs) {
    for (const line of para) {
      c.fillText(line, 180, y);
      y += fontSize * 1.58;
    }
    y += fontSize * 0.68;
  }

  c.strokeStyle = "rgba(72,35,49,.15)";
  c.beginPath(); c.moveTo(180, 1750); c.lineTo(1420, 1750); c.stroke();
  c.fillStyle = "#8c6d78";
  c.font = "24px Arial";
  c.fillText("Delivered under the supervision of Moonie.", 180, 1825);
  c.textAlign = "right";
  c.fillStyle = "#a7364c";
  c.font = "48px Georgia";
  c.fillText("♡", 1420, 1836);
  c.textAlign = "left";

  const link = document.createElement("a");
  link.download = "A-Letter-For-Charms-From-Caloy.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  toast("Saved for later. ♡");
}

function layoutLetterCanvas(c, paragraphs, maxWidth, lineHeight) {
  const result = [];
  let totalLines = 0;
  paragraphs.forEach(paragraph => {
    const words = paragraph.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (c.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    result.push(lines);
    totalLines += lines.length;
  });
  return { paragraphs: result, height: totalLines * lineHeight + (paragraphs.length - 1) * lineHeight * 0.43 };
}

window.addEventListener("resize", () => {
  if (state.currentScene === "letter") requestAnimationFrame(fitLetterText);
}, { passive: true });

$("#restartBtn").addEventListener("click", resetExperience);

function resetExperience({ silent = false } = {}) {
  noMoveLocked = false;
  Object.assign(state, { currentScene: "opening", day:"", food:"", activity:"", vibe:"", icecream:"", decision:"pending", noAttempts:0, pokes:0 });
  state.achievements.clear();
  $$('.choice-card').forEach(c => c.classList.remove('selected', 'wrong'));
  noBtn.className = "no-btn";
  noBtn.textContent = "No";
  noBtn.style.left = ""; noBtn.style.top = "";
  noBtn.disabled = false;
  noBtn.removeAttribute("aria-disabled");
  noBtn.removeAttribute("aria-hidden");
  noBtn.tabIndex = -1;
  maybeLaterBtn.classList.add("hidden");
  const iceReaction = $("#icecreamReaction");
  if (iceReaction) {
    iceReaction.classList.remove('is-wrong', 'is-correct');
    iceReaction.textContent = 'Moonie is taking this answer very seriously. 👀';
  }
  $$('.scene').forEach(s => s.classList.remove('active','leaving'));
  $('.scene[data-scene="opening"]').classList.add('active');
  resetLetterScene();
  hideBuilderMoonie();
  pauseMoonieVideos();
  setMoonieVideo(reactionVideo, "neutral", { loop: true, restart: true });
  reactionVideo.pause();
  reactionHeadline.textContent = "Calm. Totally calm.";
  reactionMessage.textContent = "No pressure. Probably.";
  if (!silent) burst(innerWidth/2, innerHeight/2, 8, ["↻", "♡"]);
}

// Achievements and toasts.
function unlockAchievement() {
  // Achievements were intentionally removed from the experience.
  return;
}

function toast(message) {
  const stack = $("#toastStack");
  // One elegant notification at a time; repeated wrong answers should not build a wall of toasts.
  [...stack.children].forEach(child => child.remove());
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

// Lightweight micro-bursts. The canvas sleeps completely when nothing is animating.
// This replaces the old always-running confetti loop and caps particles aggressively.
function burst(x, y, count = 8, glyphs = ["♡", "✦"]) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const room = Math.max(0, 20 - particles.length);
  const safeCount = Math.min(count, 10, room);
  if (!safeCount) return;

  for (let i = 0; i < safeCount; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - .5) * (3 + Math.random() * 2.5),
      vy: -1.7 - Math.random() * 3.2,
      g: .09 + Math.random() * .05,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - .5) * .11,
      life: 38 + Math.random() * 24,
      size: 11 + Math.random() * 10,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)]
    });
  }

  if (!fxRaf) fxRaf = requestAnimationFrame(animateFx);
}

function animateFx() {
  ctx.clearRect(0,0,innerWidth,innerHeight);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
    if (p.life <= 0) { particles.splice(i,1); continue; }
    const alpha = Math.min(1, p.life / 18);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x,p.y);
    ctx.rotate(p.rot);
    ctx.font = `700 ${p.size}px Georgia`;
    ctx.textAlign = "center";
    ctx.fillStyle = p.glyph === "🌹" ? "#fff" : "#b54459";
    ctx.fillText(p.glyph,0,0);
    ctx.restore();
  }

  if (particles.length) {
    fxRaf = requestAnimationFrame(animateFx);
  } else {
    fxRaf = 0;
    ctx.clearRect(0,0,innerWidth,innerHeight);
  }
}

// Keyboard easter egg: M O O N I E
let moonieCode = "";
window.addEventListener("keydown", e => {
  if (e.key.length !== 1) return;
  moonieCode = (moonieCode + e.key.toLowerCase()).slice(-6);
  if (moonieCode === "moonie") {
    unlockAchievement("Moonie Mode", "You found the secret supervisor console.");
    burst(innerWidth/2, innerHeight/2, 12, ["🐾", "♡"]);
    toast("Moonie says: Lechon? Sinanglaw? Bulalo?? Okay, I'm hungry now.");
  }
});

// Auto-moving memory carousel. It glides on its own, pauses on hover/focus,
// and the mouse wheel/trackpad can browse it manually without scrolling the page.
const memoryCarousel = $("#memoryCarousel");
const memoryTrack = $("#memoryTrack");
let memoryPaused = false;
let memorySliding = false;
let memoryIndex = 0;
let lastWheelAt = 0;

function updateMemoryDots() {
  const dots = $$(".carousel-status span", memoryCarousel || document);
  dots.forEach((dot, i) => {
    dot.style.width = i === memoryIndex ? "18px" : "5px";
    dot.style.background = i === memoryIndex ? "var(--deep-red)" : "rgba(72,35,49,.2)";
  });
}

function memoryStep() {
  const cards = memoryTrack?.querySelectorAll(".memory-card");
  if (!cards || cards.length < 2) return 0;
  return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
}

function slideMemory(direction = 1, manual = false) {
  if (!memoryTrack || memorySliding || state.currentScene !== "memory") return;
  if (memoryPaused && !manual) return;

  const cards = [...memoryTrack.querySelectorAll(".memory-card")];
  if (cards.length < 2) return;
  const step = memoryStep();
  if (!step) return;

  memorySliding = true;
  const duration = 620;

  if (direction > 0) {
    // Conventional "next": cards travel left and the next memory enters from the right.
    memoryTrack.style.transition = `transform ${duration}ms cubic-bezier(.22,.75,.25,1)`;
    memoryTrack.style.transform = `translate3d(${-step}px,0,0)`;
    setTimeout(() => {
      const first = memoryTrack.querySelector('.memory-card');
      if (first) memoryTrack.appendChild(first);
      memoryTrack.style.transition = 'none';
      memoryTrack.style.transform = 'translate3d(0,0,0)';
      void memoryTrack.offsetWidth;
      memoryIndex = (memoryIndex + 1) % 5;
      updateMemoryDots();
      memorySliding = false;
    }, duration + 20);
  } else {
    // Previous: preload the last card to the left, then glide it into view.
    const last = cards[cards.length - 1];
    memoryTrack.style.transition = 'none';
    memoryTrack.insertBefore(last, cards[0]);
    memoryTrack.style.transform = `translate3d(${-step}px,0,0)`;
    void memoryTrack.offsetWidth;
    memoryTrack.style.transition = `transform ${duration}ms cubic-bezier(.22,.75,.25,1)`;
    memoryTrack.style.transform = 'translate3d(0,0,0)';
    memoryIndex = (memoryIndex + 4) % 5;
    updateMemoryDots();
    setTimeout(() => { memorySliding = false; }, duration + 20);
  }
}

if (memoryCarousel && memoryTrack) {
  memoryCarousel.addEventListener("pointerenter", () => { memoryPaused = true; });
  memoryCarousel.addEventListener("pointerleave", () => { memoryPaused = false; });
  memoryCarousel.addEventListener("focusin", () => { memoryPaused = true; });
  memoryCarousel.addEventListener("focusout", () => { memoryPaused = false; });

  memoryCarousel.addEventListener("wheel", e => {
    if (state.currentScene !== "memory") return;
    e.preventDefault();
    const now = performance.now();
    if (now - lastWheelAt < 180 || memorySliding) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 4) return;
    lastWheelAt = now;
    slideMemory(delta > 0 ? 1 : -1, true);
  }, { passive: false });

  updateMemoryDots();
  setInterval(() => slideMemory(1, false), 3100);
}

// Never carry answers across a reload/back-forward restore.
function clearTransientSelections() {
  state.day = "";
  state.food = "";
  state.activity = "";
  state.vibe = "";
  state.icecream = "";
  state.decision = "pending";
  $$('.choice-card').forEach(card => card.classList.remove('selected', 'wrong'));
  const ice = $("#icecreamReaction");
  if (ice) {
    ice.classList.remove('is-wrong', 'is-correct');
    ice.textContent = 'Moonie is taking this answer very seriously. 👀';
  }
}

clearTransientSelections();
// Always start from a clean invitation. Browsers may restore DOM/form state after
// refresh or back-forward navigation, so explicitly wipe prior selections each time.
window.addEventListener('pageshow', () => resetExperience({ silent: true }));

// Keep the original music path easy to replace.
bgMusic.src = CONFIG.musicFile;
moonieVideos.forEach(video => {
  if (!video.dataset.mood) video.dataset.mood = "neutral";
});
pauseMoonieVideos();
