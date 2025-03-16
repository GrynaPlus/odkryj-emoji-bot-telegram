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
  const adModal = document.getElementById("ad-modal");

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
  // Funkcja aktualizująca ranking użytkownika.
  // Jeśli wpis dla danego użytkownika już istnieje, zostaje zaktualizowany; w przeciwnym razie dodany.
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
    // Sortowanie rankingu wg poziomu malejąco
    ranking.sort((a, b) => b.level - a.level);
    localStorage.setItem("memoryGameRanking", JSON.stringify(ranking));
  }

  // Funkcja wyświetlająca ranking
  function showRanking() {
    const rankingModal = document.getElementById("ranking-modal");
    const rankingTableBody = document.querySelector("#ranking-table tbody");
    rankingTableBody.innerHTML = ""; // czyścimy poprzednie wpisy

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

  // Zamykanie modalu rankingu
  document.getElementById("close-ranking-btn").addEventListener("click", () => {
    document.getElementById("ranking-modal").classList.add("hidden");
  });

  // Event listener dla przycisku Ranking
  document.getElementById("ranking-btn").addEventListener("click", showRanking);
  // ---------------- Koniec sekcji Ranking ----------------

  // Obsługa przycisku start
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

  // Obsługa przycisku "Obejrzyj reklamę"
  document.getElementById("watch-ad-btn").addEventListener("click", () => {
    document.getElementById("watch-ad-btn").disabled = true;
    setTimeout(() => {
      moves += 100;
      updateMoveDisplay();
      adModal.classList.add("hidden");
      document.getElementById("watch-ad-btn").disabled = false;
      saveGameState();
    }, 3000);
  });

  // Obsługa przycisku "Podpowiedź"
  document.getElementById("hint-btn").addEventListener("click", useHint);

  // Aktualizacja wyświetlania ruchów
  function updateMoveDisplay() {
    moveCounterDisplay.innerText = ` | Ruchy: ${moves}`;
  }

  // Zapis stanu gry do localStorage
  function saveGameState() {
    const state = { username, level, moves, mismatchDelay };
    localStorage.setItem("memoryGameState", JSON.stringify(state));
  }

  // Ładowanie stanu gry z localStorage
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

  // Funkcja zwracająca 18 unikalnych emoji
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

  // Rozpoczęcie poziomu
  function startLevel() {
    board.innerHTML = "";
    flippedTiles = [];
    levelInfoDisplay.innerText = ` | Poziom: ${level}`;
    // Przywrócenie domyślnego tła planszy
    board.style.background = "rgba(255, 255, 255, 0.2)";
    saveGameState();

    // Przygotowanie par emoji
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

  // Obsługa kliknięcia kafelka
  function flipTile() {
    if (moves <= 0) {
      adModal.classList.remove("hidden");
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

  // Sprawdzenie dopasowania odsłoniętych kafelków
  function checkMatch() {
    const [tile1, tile2] = flippedTiles;
    if (tile1.dataset.emoji === tile2.dataset.emoji) {
      setTimeout(() => {
        // Dodaj efekt starburst do obu dopasowanych kafelków
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
          // Dynamiczna zmiana tła przy ukończeniu poziomu
          board.style.background = "linear-gradient(135deg, #f6d365, #fda085)";
          showConfetti();
          // Aktualizujemy ranking automatycznie po ukończeniu poziomu
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

  // Przejście do kolejnego poziomu
  function nextLevel() {
    // Zaktualizuj ranking użytkownika przed przejściem do następnego poziomu
    updateRanking();
    level++;
    if (mismatchDelay > 400) {
      mismatchDelay -= 50;
    }
    saveGameState();
    startLevel();
  }

  // Funkcja tasująca (algorytm Fisher-Yates)
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Funkcja podpowiedzi
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

  // Funkcja wyświetlająca konfetti przy ukończeniu poziomu
  function showConfetti() {
    const confettiCount = 50;
    const shapes = ['circle', 'triangle', 'star'];
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      // Losowy wybór kształtu
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      confetti.classList.add(shape);
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      confetti.style.left = Math.random() * window.innerWidth + "px";
      confetti.style.top = "-20px";
      const size = Math.random() * 10 + 5; // rozmiar od 5 do 15px
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      board.appendChild(confetti);
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }
  }

  // ---------------- Zapobieganie wyświetlaniu odsłoniętych kafelków ----------------
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // Przy powrocie do gry zakrywamy wszystkie niezapisane (nie dopasowane) kafelki
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
  });
});
