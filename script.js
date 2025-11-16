const title = document.getElementById("title");

//toast
function showSuccessToast(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "bottom",
    position: "center",
    backgroundColor: "linear-gradient(to right, #22c55e, #16a34a)",
    stopOnFocus: true,
  }).showToast();
}

function showErrorToast(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "bottom",
    position: "center",
    backgroundColor: "linear-gradient(to right, #ef4444, #dc2626)",
    stopOnFocus: true,
  }).showToast();
}

function showInfoToast(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "bottom",
    position: "center",
    backgroundColor: "linear-gradient(to right, #3b82f6, #2563eb)",
    stopOnFocus: true,
  }).showToast();
}

function showWarningToast(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: "linear-gradient(to right, #f59e0b, #d97706)",
    stopOnFocus: true,
  }).showToast();
}
let gameState = {
  difficulty: "medium",
  words: [],
  currentWordIndex: 0,
  wordsTyped: 0,
  errors: 0,
  playerProgress: 0,
  botProgress: 0,
  timeLeft: 90,
  startTime: null,
  gameTimer: null,
  botTimer: null,
  raceFinished: false,
};

const botSpeeds = { easy: 35, medium: 55, hard: 85 };
const botNames = {
  easy: "Slow-King Bot",
  medium: "Speeder Bot",
  hard: "Sonic Speeder",
};

const fallbackWords = {
  easy: [
    "cat",
    "dog",
    "run",
    "jump",
    "play",
    "fun",
    "sun",
    "car",
    "book",
    "tree",
    "fish",
    "bird",
    "star",
    "moon",
    "rain",
    "blue",
    "red",
    "big",
    "fast",
    "slow",
  ],
  medium: [
    "computer",
    "keyboard",
    "racing",
    "victory",
    "champion",
    "typing",
    "speed",
    "challenge",
    "battle",
    "winner",
    "master",
    "expert",
    "dragon",
    "castle",
    "mountain",
  ],
  hard: [
    "extraordinary",
    "championship",
    "programming",
    "development",
    "technology",
    "acceleration",
    "determination",
    "competitive",
    "performance",
    "exhibition",
    "spectacular",
    "achievement",
  ],
};

async function fetchRandomWords(difficulty, count = 20) {
  const lengthParams = {
    easy: { min: 3, max: 5 },
    medium: { min: 6, max: 8 },
    hard: { min: 9, max: 15 },
  };

  const params = lengthParams[difficulty];
  const words = [];

  try {
    for (let i = 0; i < count; i++) {
      const response = await fetch(
        `https://random-word-api.herokuapp.com/word?length=${
          Math.floor(Math.random() * (params.max - params.min + 1)) + params.min
        }`
      );

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      if (data && data[0]) {
        words.push(data[0].toLowerCase());
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return words;
  } catch (error) {
    console.error("Error fetching words:", error);

    return getFallbackWords(difficulty, count);
  }
}

function getFallbackWords(difficulty, count) {
  const words = [];
  const wordList = fallbackWords[difficulty];
  for (let i = 0; i < count; i++) {
    words.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }
  return words;
}

async function startGame(difficulty) {
  document.querySelectorAll(".difficulty-card").forEach((card) => {
    card.classList.add("disabled");
    card.onclick = null;
  });

  document.getElementById("menu-screen").classList.add("hidden");
  document.getElementById("loading-screen").classList.remove("hidden");

  try {
    const words = await fetchRandomWords(difficulty, 20);

    if (words.length < 20) {
      throw new Error("Not enough words fetched");
    }
    title.innerText = difficulty + " mode";
    gameState.difficulty = difficulty;
    gameState.words = words;
    gameState.currentWordIndex = 0;
    gameState.wordsTyped = 0;
    gameState.errors = 0;
    gameState.playerProgress = 0;
    gameState.botProgress = 0;
    gameState.timeLeft = 90;
    gameState.startTime = Date.now();
    gameState.raceFinished = false;

    document.getElementById("loading-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");

    document.getElementById("bot-name").textContent = botNames[difficulty];
    updateWordDisplay();
    updateStats();

    document.getElementById("typing-input").value = "";
    document.getElementById("typing-input").focus();

    startGameTimer();
    startBotTimer();
  } catch (error) {
    console.error("Error starting game:", error);
    showError("Failed to load words. Please try again.");

    document.getElementById("loading-screen").classList.add("hidden");
    document.getElementById("menu-screen").classList.remove("hidden");
    enableDifficultyCards();
  }
}

function enableDifficultyCards() {
  const easyCard = document.getElementById("easy-card");
  const mediumCard = document.getElementById("medium-card");
  const hardCard = document.getElementById("hard-card");

  if (easyCard) easyCard.onclick = () => startGame("easy");
  if (mediumCard) mediumCard.onclick = () => startGame("medium");
  if (hardCard) hardCard.onclick = () => startGame("hard");

  document.querySelectorAll(".difficulty-card").forEach((card) => {
    card.classList.remove("disabled");
  });
}

function showError(message) {
  const errorContainer = document.getElementById("error-container");
  errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
  setTimeout(() => {
    errorContainer.innerHTML = "";
  }, 5000);
}

function updateWordDisplayWithColors(typedValue) {
  const currentWord = gameState.words[gameState.currentWordIndex] || "";
  let displayHTML = "";

  for (let i = 0; i < currentWord.length; i++) {
    if (i < typedValue.length) {
      if (typedValue[i] === currentWord[i]) {
        displayHTML += `<span class="correct">${currentWord[i]}</span>`;
      } else {
        displayHTML += `<span class="incorrect">${currentWord[i]}</span>`;
      }
    } else {
      displayHTML += `<span class="pending">${currentWord[i]}</span>`;
    }
  }
  document.getElementById("current-word").innerHTML = displayHTML;
}

function updateWordDisplay() {
  const prev = gameState.words
    .slice(
      Math.max(0, gameState.currentWordIndex - 2),
      gameState.currentWordIndex
    )
    .join(" ");
  const current = gameState.words[gameState.currentWordIndex] || "";
  const next = gameState.words
    .slice(gameState.currentWordIndex + 1, gameState.currentWordIndex + 3)
    .join(" ");

  document.getElementById("previous-words").textContent = prev;
  document.getElementById("current-word").textContent = current;
  document.getElementById("next-words").textContent = next;
}

function updateStats() {
  document.getElementById("timer").textContent = gameState.timeLeft + "s";
  document.getElementById(
    "progress"
  ).textContent = `${gameState.wordsTyped}/${gameState.words.length}`;
  document.getElementById("errors").textContent = gameState.errors;

  if (gameState.startTime) {
    const timeElapsed = (Date.now() - gameState.startTime) / 1000 / 60;
    const wpm = Math.round(gameState.wordsTyped / timeElapsed) || 0;
    document.getElementById("wpm").textContent = wpm + " WPM";
  }

  document.getElementById("player-percent").textContent =
    Math.round(gameState.playerProgress) + "%";
  document.getElementById("bot-percent").textContent =
    Math.round(gameState.botProgress) + "%";

  document.getElementById("player-bar").style.width =
    gameState.playerProgress + "%";
  document.getElementById("bot-bar").style.width = gameState.botProgress + "%";

  document.getElementById("player-car").style.left =
    gameState.playerProgress + "%";
  document.getElementById("bot-car").style.left = gameState.botProgress + "%";
}

function startGameTimer() {
  gameState.gameTimer = setInterval(() => {
    if (gameState.wordsTyped > 0) {
      gameState.timeLeft--;
      updateStats();

      if (gameState.timeLeft <= 0) {
        endGame("timeout");
      }
    }
  }, 1000);
}

function startBotTimer() {
  const botSpeed = botSpeeds[gameState.difficulty];
  const charsPerSecond = (botSpeed * 5) / 60;
  const totalChars = gameState.words.join(" ").length;

  gameState.botTimer = setInterval(() => {
    if (gameState.raceFinished) return;

    if (gameState.wordsTyped > 0) {
      gameState.botProgress += ((charsPerSecond * 0.1) / totalChars) * 100;

      if (gameState.botProgress >= 100) {
        gameState.botProgress = 100;
        endGame("bot");
      }

      updateStats();
    }
  }, 100);
}

document.getElementById("typing-input").addEventListener("input", (e) => {
  const value = e.target.value;

  updateWordDisplayWithColors(value);

  if (value.endsWith(" ")) {
    const typedWord = value.trim();
    const currentWord = gameState.words[gameState.currentWordIndex];

    if (typedWord === currentWord) {
      showSuccessToast("✅ Correct!");

      if (gameState.wordsTyped === 0) {
        gameState.startTime = Date.now();
      }

      gameState.wordsTyped++;
      gameState.currentWordIndex++;
      gameState.playerProgress =
        (gameState.wordsTyped / gameState.words.length) * 100;

      if (gameState.playerProgress >= 100) {
        endGame("player");
      }

      updateWordDisplay();
      updateStats();
    } else {
      showErrorToast("❌ Wrong! Try again");

      gameState.errors++;
      updateStats();
    }

    e.target.value = "";

    updateWordDisplay();
  }
});

document.getElementById("typing-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const typedWord = e.target.value.trim();
    const currentWord = gameState.words[gameState.currentWordIndex];

    if (typedWord === currentWord) {
      showSuccessToast("✅ Correct!");

      if (gameState.wordsTyped === 0) {
        gameState.startTime = Date.now();
      }

      gameState.wordsTyped++;
      gameState.currentWordIndex++;
      gameState.playerProgress =
        (gameState.wordsTyped / gameState.words.length) * 100;

      if (gameState.playerProgress >= 100) {
        endGame("player");
      }

      updateWordDisplay();
      updateStats();
    } else if (typedWord !== "") {
      showErrorToast("❌ Wrong! Try again");

      gameState.errors++;
      updateStats();
    }

    e.target.value = "";

    updateWordDisplay();
  }
});
function endGame(winner) {
  if (gameState.raceFinished) return;
  gameState.raceFinished = true;

  clearInterval(gameState.gameTimer);
  clearInterval(gameState.botTimer);

  const timeElapsed = (Date.now() - gameState.startTime) / 1000 / 60;
  const finalWpm = Math.round(gameState.wordsTyped / timeElapsed) || 0;
  const accuracy =
    gameState.wordsTyped > 0
      ? Math.round(
          (gameState.wordsTyped / (gameState.wordsTyped + gameState.errors)) *
            100
        )
      : 0;

  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.remove("hidden");

  if (winner === "player") {
    document.getElementById("result-emoji").textContent = "🏆";
    document.getElementById("result-title").textContent = "YOU WIN!";
    document.getElementById("result-title").className = "result-title win";
    document.getElementById("result-message").textContent = `You beat ${
      botNames[gameState.difficulty]
    }!`;
  } else if (winner === "bot") {
    document.getElementById("result-emoji").textContent = "😅";
    document.getElementById("result-title").textContent = "Bot Wins!";
    document.getElementById("result-title").className = "result-title lose";
    document.getElementById("result-message").textContent = `${
      botNames[gameState.difficulty]
    } was faster this time!`;
  } else {
    document.getElementById("result-emoji").textContent = "⏰";
    document.getElementById("result-title").textContent = "Time's Up!";
    document.getElementById("result-title").className = "result-title timeout";
    document.getElementById("result-message").textContent =
      "Better luck next time!";
  }

  document.getElementById("final-wpm").textContent = finalWpm + " WPM";
  document.getElementById("final-words").textContent = gameState.wordsTyped;
  document.getElementById("final-accuracy").textContent = accuracy + "%";
  document.getElementById("final-errors").textContent = gameState.errors;
}

function raceAgain() {
  document.getElementById("result-screen").classList.add("hidden");
  startGame(gameState.difficulty);
}

function backToMenu() {
  document.getElementById("result-screen").classList.add("hidden");
  document.getElementById("menu-screen").classList.remove("hidden");
  enableDifficultyCards();
}
