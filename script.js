document.addEventListener("DOMContentLoaded", () => {
  // GLOBALNE ZMIENNE
  let username = "";
  let level = 1;
  let moves = 100;
  let mismatchDelay = 1000; // czas w milisekundach
  let flippedTiles = [];
  
  const board = document.getElementById("board");
  const userNameDisplay = document.getElementById("user-name");
  const levelInfoDisplay = document.getElementById("level-info");
  const moveCounterDisplay = document.getElementById("move-counter");
  const usernameModal = document.getElementById("username-modal");
  // Modal reklamy został usunięty – wykorzystujemy standardowy dialog potwierdzenia

  const flipSound = document.getElementById("flip-sound");
  const matchSound = document.getElementById("match-sound");
  const mismatchSound = document.getElementById("mismatch-sound");

  // Lista emoji – przykładowa pula
  const allEmojis = [
    "🍎", "🍌", "🍇", "🍒", "🍉", "🍍", "🥝", "🍓", "🍑",
    "🍈", "🍋", "🍏", "🍐", "🍊", "🥭", "🍅", "🥥", "🍆",
    "🌽", "🥕", "🥑", "🍄", "🥦", "🍠", "🥔", "🌱", "🌿", "🍀", "🌾",
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🚚", "🚛", "🚜", "🛻", "🚲", "🛵", "🏍️", "🛴", "🚀", "✈️", "🛸", "🚁", "⛵", "🚤", "🛳️", "⛴️", "🚢",
    "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "💽", "💾", "💿", "📀", "📷", "📸", "📹", "🎥", "📼", "🔍", "🔎", "📡", "📺", "📻", "🎙️", "🎚️", "🎛️", "🕹️",
    "🇦🇫", "🇦🇱", "🇩🇿", "🇦🇩", "🇦🇴", "🇦🇮", "🇦🇶", "🇦🇬", "🇦🇷", "🇦🇲", "🇦🇺", "🇦🇹", "🇦🇿", "🇧🇸", "🇧🇭", "🇧🇩", "🇧🇧", "🇧🇾", "🇧🇪", "🇧🇿", "🇧🇯", "🇧🇹", "🇧🇴", "🇧🇦", "🇧🇼", "🇧🇷"
  ];
  let usedEmojiSet = []; // śledzenie użytych emoji

  // ---------------- Ranking ----------------
  function updateRanking() {
    const scoreEntry = {
      username,
      level,
      date: new Date().toLocaleString()
    };

    let ranking = JSON.parse(localStorage.getItem("memoryGameRanking")) || [];
    const index = ranking.findIndex(entry => entry.username === username);
    if (index !== -1) {
      ranking[index] = scoreEntry;
    } else {
      ranking.push(scoreEntry);
    }
    ranking.sort((a, b) => b.level - a.level);
    localStorage.setItem("memoryGameRanking", JSON.stringify(ranking));
  }

  function showRanking() {
    const rankingModal = document.getElementById("ranking-modal");
    const rankingTableBody = document.querySelector("#ranking-table tbody");
    rankingTableBody.innerHTML = "";

    let ranking = JSON.parse(localStorage.getItem("memoryGameRanking")) || [];
    ranking.forEach((entry, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.username}</td>
        <td>${entry.level}</td>
        <td>${entry.date}</td>
      `;
      rankingTableBody.appendChild(row);
    });

    rankingModal.classList.remove("hidden");
  }

  document.getElementById("close-ranking-btn").addEventListener("click", () => {
    document.getElementById("ranking-modal").classList.add("hidden");
  });

  document.getElementById("ranking-btn").addEventListener("click", showRanking);
  // ---------------- Koniec sekcji Ranking ----------------

  document.getElementById("start-btn").addEventListener("click", () => {
    const input = document.getElementById("username-input").value.trim();
    if (input !== "") {
      username = input;
      usernameModal.classList.add("hidden");
      document.getElementById("info-bar").classList.remove("hidden");
      userNameDisplay.innerText = `Gracz: ${username}`;
      levelInfoDisplay.innerText = ` | Poziom: ${level}`;
      updateMoveDisplay();
      saveGameState();
      startLevel();
    }
  });

  // Listener przycisku podpowiedzi – wyświetla potwierdzenie
  document.getElementById("hint-btn").addEventListener("click", () => {
    if (confirm("Czy chcesz obejrzeć reklamę, aby otrzymać podpowiedź?")) {
      show_9093525().then(() => {
        useHint();
      }).catch((err) => {
        console.error("Błąd podczas wyświetlania reklamy:", err);
      });
    }
  });

  function updateMoveDisplay() {
    moveCounterDisplay.innerText = ` | Ruchy: ${moves}`;
  }

  function saveGameState() {
    const state = { username, level, moves, mismatchDelay };
    localStorage.setItem("memoryGameState", JSON.stringify(state));
  }

  function loadGameState() {
    const savedState = localStorage.getItem("memoryGameState");
    if (savedState) {
      const state = JSON.parse(savedState);
      username = state.username;
      level = state.level;
      moves = state.moves;
      mismatchDelay = state.mismatchDelay;
      userNameDisplay.innerText = `Gracz: ${username}`;
      levelInfoDisplay.innerText = ` | Poziom: ${level}`;
      updateMoveDisplay();
      usernameModal.classList.add("hidden");
      document.getElementById("info-bar").classList.remove("hidden");
      startLevel();
    }
  }

  if (localStorage.getItem("memoryGameState")) {
    loadGameState();
  }

  function getUniqueEmojiSet() {
    let available = allEmojis.filter(emoji => !usedEmojiSet.includes(emoji));
    if (available.length < 18) {
      usedEmojiSet = [];
      available = allEmojis.slice();
    }
    available = shuffle(available);
    const selected = available.slice(0, 18);
    usedEmojiSet = usedEmojiSet.concat(selected);
    return selected;
  }

  function startLevel() {
    board.innerHTML = "";
    flippedTiles = [];
    levelInfoDisplay.innerText = ` | Poziom: ${level}`;
    board.style.background = "rgba(255, 255, 255, 0.2)";
    saveGameState();

    const selectedEmojis = getUniqueEmojiSet();
    let emojiPairs = [];
    selectedEmojis.forEach(emoji => {
      emojiPairs.push(emoji, emoji);
    });
    emojiPairs = shuffle(emojiPairs);
    emojiPairs.forEach((emoji) => {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.dataset.emoji = emoji;
      tile.dataset.flipped = "false";
      tile.innerHTML = `
        <div class="flip-card-inner">
          <div class="flip-card-front"></div>
          <div class="flip-card-back">${emoji}</div>
        </div>
      `;
      tile.addEventListener("click", flipTile);
      board.appendChild(tile);
    });
  }

  function flipTile() {
    if (moves <= 0) {
      if (confirm("Obejrzyj reklamę, aby otrzymać 100 ruchów!")) {
        show_9093525().then(() => {
          moves += 100;
          updateMoveDisplay();
          saveGameState();
        }).catch((err) => {
          console.error("Błąd podczas wyświetlania reklamy:", err);
        });
      }
      return;
    }
    if (this.dataset.flipped === "true" || this.classList.contains("matched") || flippedTiles.length === 2) return;

    flipSound.currentTime = 0;
    flipSound.play();

    this.classList.add("flipped");
    this.dataset.flipped = "true";
    flippedTiles.push(this);

    if (flippedTiles.length === 2) {
      moves--;
      updateMoveDisplay();
      saveGameState();
      checkMatch();
    }
  }

  function checkMatch() {
    const [tile1, tile2] = flippedTiles;
    if (tile1.dataset.emoji === tile2.dataset.emoji) {
      setTimeout(() => {
        [tile1, tile2].forEach(tile => {
          const star = document.createElement("div");
          star.classList.add("starburst");
          tile.appendChild(star);
          setTimeout(() => star.remove(), 600);
        });
        tile1.classList.add("matched");
        tile2.classList.add("matched");
        tile1.removeEventListener("click", flipTile);
        tile2.removeEventListener("click", flipTile);
        matchSound.currentTime = 0;
        matchSound.play();
        flippedTiles = [];
        saveGameState();
        if (document.querySelectorAll(".tile.matched").length === 36) {
          board.style.background = "linear-gradient(135deg, #f6d365, #fda085)";
          showConfetti();
          setTimeout(nextLevel, 3000);
        }
      }, 300);
    } else {
      setTimeout(() => {
        tile1.classList.remove("flipped");
        tile2.classList.remove("flipped");
        tile1.dataset.flipped = "false";
        tile2.dataset.flipped = "false";
        mismatchSound.currentTime = 0;
        mismatchSound.play();
        flippedTiles = [];
        saveGameState();
      }, mismatchDelay);
    }
  }

  function nextLevel() {
    updateRanking();
    level++;

    // Wyświetl reklamę co 3 poziomy
    if (level % 3 === 0) {
      show_9093525({ 
        type: 'inApp', 
        inAppSettings: { 
          frequency: 1, 
          capping: 0, 
          interval: 30, 
          timeout: 1, 
          everyPage: false 
        } 
      });
    }

    if (mismatchDelay > 400) {
      mismatchDelay -= 50;
    }
    saveGameState();
    startLevel();
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Funkcja przydzielająca podpowiedź – znajduje parę takich samych emoji
  function useHint() {
    const tiles = Array.from(document.querySelectorAll(".tile")).filter(tile => tile.dataset.flipped === "false" && !tile.classList.contains("matched"));
    const groups = {};
    tiles.forEach(tile => {
      const emoji = tile.dataset.emoji;
      if (!groups[emoji]) groups[emoji] = [];
      groups[emoji].push(tile);
    });
    const matchingGroups = Object.keys(groups).filter(key => groups[key].length >= 2);
    if (matchingGroups.length === 0) return;
    const randomKey = matchingGroups[Math.floor(Math.random() * matchingGroups.length)];
    const pair = groups[randomKey].slice(0, 2);
    pair.forEach(tile => {
      tile.classList.add("flipped", "matched");
      tile.dataset.flipped = "true";
      tile.removeEventListener("click", flipTile);
    });
    if (document.querySelectorAll(".tile.matched").length === 36) {
      showConfetti();
      setTimeout(nextLevel, 3000);
    }
    saveGameState();
  }

  function showConfetti() {
    const confettiCount = 50;
    const shapes = ['circle', 'triangle', 'star'];
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      confetti.classList.add(shape);
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      confetti.style.left = Math.random() * window.innerWidth + "px";
      confetti.style.top = "-20px";
      const size = Math.random() * 10 + 5;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      board.appendChild(confetti);
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }
  }

  // ---------------- Mechanizm zabezpieczający przed wyświetlaniem odsłoniętych emoji ----------------
  let coverOverlay = null;

  function addCoverOverlay() {
    if (!coverOverlay) {
      coverOverlay = document.createElement("div");
      coverOverlay.style.position = "absolute";
      coverOverlay.style.top = 0;
      coverOverlay.style.left = 0;
      coverOverlay.style.width = "100%";
      coverOverlay.style.height = "100%";
      coverOverlay.style.backgroundColor = "#fff";
      coverOverlay.style.zIndex = "9999";
      board.appendChild(coverOverlay);
    }
  }

  function removeCoverOverlay() {
    if (coverOverlay) {
      board.removeChild(coverOverlay);
      coverOverlay = null;
    }
  }

  function hideUnmatchedTiles() {
    const tiles = document.querySelectorAll(".tile");
    tiles.forEach(tile => {
      if (!tile.classList.contains("matched") && tile.dataset.flipped === "true") {
        tile.classList.remove("flipped");
        tile.dataset.flipped = "false";
      }
    });
    flippedTiles = [];
    saveGameState();
  }

  window.addEventListener("pageshow", () => {
    setTimeout(() => {
      hideUnmatchedTiles();
      removeCoverOverlay();
    }, 10);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      addCoverOverlay();
    } else if (document.visibilityState === "visible") {
      setTimeout(() => {
        hideUnmatchedTiles();
        removeCoverOverlay();
      }, 10);
    }
  });

  window.addEventListener("focus", () => {
    setTimeout(() => {
      hideUnmatchedTiles();
      removeCoverOverlay();
    }, 10);
  });
  // ---------------- Koniec zabezpieczenia ----------------
});
