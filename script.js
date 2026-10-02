const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const welcome = document.querySelector(".welcome");
const newChatBtn = document.querySelector(".new-chat");

const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");
const micBtn = document.getElementById("micBtn");

const projectsNav = document.getElementById("projectsNav");
const historyNav = document.getElementById("historyNav");
const settingsNav = document.getElementById("settingsNav");
const chatNav = document.getElementById("chatNav");
const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector(".sidebar");

let selectedFile = null;
let voiceEnabled = true;

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  messages.appendChild(message);
  message.scrollIntoView({ behavior: "smooth", block: "end" });
}

function updateNovaEmotion(emotion) {
  if (!emotion) return;

  const mood = emotion.mood || "calm";

  document.body.classList.remove(
    "mood-calm",
    "mood-happy",
    "mood-sad",
    "mood-angry",
    "mood-furious",
    "mood-hurt",
    "mood-excited",
    "mood-annoyed"
  );

  document.body.classList.add(`mood-${mood}`);

  const orb = document.querySelector(".nova-orb");

  if (orb) {
    orb.textContent = getMoodEmoji(mood);
  }

  const status = document.querySelector(".topbar p");

  if (status) {
    status.innerHTML =
      `<span class="status-dot"></span> ${capitalize(mood)}`;
  }
}

function getMoodEmoji(mood) {
  const emojis = {
    calm: "✦",
    happy: "😊",
    sad: "😢",
    angry: "😠",
    furious: "🤬",
    hurt: "💔",
    excited: "⚡",
    annoyed: "😑"
  };

  return emojis[mood] || "✦";
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

async function getNovaResponse(question) {
  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: question
      })
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    updateNovaEmotion(data.emotion);

    return data.reply;

  } catch (error) {
    console.error("NOVA error:", error);

    return "I couldn't connect to my AI backend. Please make sure the server is running.";
  }
}

function speak(text) {
  if (!voiceEnabled) return;

  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
}

function saveHistory() {
  localStorage.setItem(
    "novaHistory",
    messages.innerHTML
  );
}

function loadHistory() {
  const saved = localStorage.getItem("novaHistory");

  if (saved) {
    messages.innerHTML = saved;
    welcome.style.display = "none";
  }
}

async function sendMessage() {
  const question = userInput.value.trim();

  if (question === "") return;

  welcome.style.display = "none";

  let finalQuestion = question;

  if (selectedFile) {
    finalQuestion += `\n\nAttached file: ${selectedFile.name}`;
  }

  addMessage(question, "user-message");

  if (selectedFile) {
    addMessage(`📎 ${selectedFile.name}`, "user-message");
    selectedFile = null;
  }

  userInput.value = "";

  const thinking = document.createElement("div");

  thinking.className = "message ai-message";
  thinking.textContent = "NOVA is thinking...";
  thinking.id = "thinking";

  messages.appendChild(thinking);

  const response = await getNovaResponse(finalQuestion);

  thinking.remove();

  addMessage(response, "ai-message");

  speak(response);

  saveHistory();
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

/* NEW CHAT */

newChatBtn.addEventListener("click", function() {
  messages.innerHTML = "";

  welcome.style.display = "block";

  userInput.value = "";

  localStorage.removeItem("novaHistory");

  updateNovaEmotion({
    mood: "calm"
  });

  userInput.focus();
});

/* ADD FILE */

attachBtn.addEventListener("click", function() {
  fileInput.click();
});

fileInput.addEventListener("change", function() {
  if (!fileInput.files.length) return;

  selectedFile = fileInput.files[0];

  addMessage(
    `📎 Selected: ${selectedFile.name}`,
    "user-message"
  );

  userInput.focus();
});

/* MICROPHONE */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {

  recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = function() {
    micBtn.textContent = "🔴";
  };

  recognition.onend = function() {
    micBtn.textContent = "🎤";
  };

  recognition.onresult = function(event) {

    const transcript =
      event.results[0][0].transcript;

    userInput.value = transcript;

    userInput.focus();
  };

  recognition.onerror = function() {
    micBtn.textContent = "🎤";
  };
}

micBtn.addEventListener("click", function() {

  if (!recognition) {

    addMessage(
      "🎤 Voice input is not supported by this browser.",
      "ai-message"
    );

    return;
  }

  recognition.start();
});

/* CHAT NAV */

chatNav.addEventListener("click", function(event) {
  event.preventDefault();

  closePanels();

  setActive(chatNav);
});

/* PROJECTS */

projectsNav.addEventListener("click", function(event) {
  event.preventDefault();

  setActive(projectsNav);

  showProjects();
});

/* HISTORY */

historyNav.addEventListener("click", function(event) {
  event.preventDefault();

  setActive(historyNav);

  showHistory();
});

/* SETTINGS */

settingsNav.addEventListener("click", function(event) {
  event.preventDefault();

  setActive(settingsNav);

  showSettings();
});

/* ACTIVE NAV */

function setActive(element) {

  document.querySelectorAll(".sidebar nav a, .sidebar-bottom a")
    .forEach(link => {
      link.classList.remove("active");
    });

  element.classList.add("active");
}

/* PANELS */

function closePanels() {

  document.querySelectorAll(".nova-panel")
    .forEach(panel => panel.remove());

  welcome.style.display = "none";
}

function createPanel(title, content) {

  closePanels();

  const panel = document.createElement("div");

  panel.className = "nova-panel";

  panel.innerHTML = `
    <div class="nova-panel-box">
      <h2>${title}</h2>
      ${content}
      <button class="panel-close">Close</button>
    </div>
  `;

  document.querySelector(".chat").appendChild(panel);

  panel.querySelector(".panel-close").addEventListener(
    "click",
    function() {
      panel.remove();
      setActive(chatNav);
    }
  );

  return panel;
}

/* PROJECTS PANEL */

function showProjects() {

  createPanel(
    "📁 Projects",
    `
      <p>Your NOVA projects will appear here.</p>

      <div class="project-card">
        <strong>NOVA AI</strong>
        <span>AI Web Assistant</span>
      </div>

      <div class="project-card">
        <strong>Head of State Award</strong>
        <span>Online registration website</span>
      </div>

      <div class="project-card">
        <strong>Emotional AI</strong>
        <span>AI conversation project</span>
      </div>
    `
  );
}

/* HISTORY PANEL */

function showHistory() {

  const saved = localStorage.getItem("novaHistory");

  createPanel(
    "🕘 History",
    saved
      ? `
        <p>Your previous conversation is saved on this device.</p>
        <button class="restore-history">Restore Conversation</button>
      `
      : `
        <p>No conversation history yet.</p>
      `
  );

  const restore = document.querySelector(".restore-history");

  if (restore) {

    restore.addEventListener("click", function() {

      messages.innerHTML = saved;

      document.querySelector(".nova-panel").remove();

      welcome.style.display = "none";

      setActive(chatNav);
    });
  }
}

/* SETTINGS PANEL */

function showSettings() {

  const panel = createPanel(
    "⚙️ Settings",
    `
      <label class="setting-row">
        <span>🔊 Voice responses</span>
        <input
          type="checkbox"
          id="voiceToggle"
          ${voiceEnabled ? "checked" : ""}
        >
      </label>

      <label class="setting-row">
        <span>🌙 Dark mode</span>
        <input
          type="checkbox"
          id="darkToggle"
          checked
        >
      </label>
    `
  );

  panel.querySelector("#voiceToggle")
    .addEventListener("change", function(event) {

      voiceEnabled = event.target.checked;

    });

  panel.querySelector("#darkToggle")
    .addEventListener("change", function(event) {

      document.body.classList.toggle(
        "light-mode",
        !event.target.checked
      );

    });
}

/* MOBILE MENU */

menuBtn.addEventListener("click", function() {

  sidebar.classList.toggle("sidebar-open");

});

/* LOAD SAVED CHAT */

loadHistory();

