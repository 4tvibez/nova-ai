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
let voiceEnabled = localStorage.getItem("novaVoice") !== "off";
let conversation = JSON.parse(localStorage.getItem("novaConversation") || "[]");
let savedProjects = JSON.parse(localStorage.getItem("novaProjects") || "[]");

function addMessage(text, type, persist = true) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  messages.appendChild(message);
  message.scrollIntoView({ behavior: "smooth", block: "end" });
  if (persist) saveHistory();
}

function updateNovaEmotion(emotion) {
  if (!emotion) return;
  const mood = emotion.mood || "calm";
  document.body.classList.remove("mood-calm","mood-happy","mood-sad","mood-angry","mood-furious","mood-hurt","mood-excited","mood-annoyed");
  document.body.classList.add(`mood-${mood}`);
  const orb = document.querySelector(".nova-orb");
  if (orb) orb.textContent = getMoodEmoji(mood);
  const status = document.querySelector(".topbar p");
  if (status) status.innerHTML = `<span class="status-dot"></span> ${capitalize(mood)}`;
}

function getMoodEmoji(mood) {
  return { calm:"✦", happy:"😊", sad:"😢", angry:"😠", furious:"🤬", hurt:"💔", excited:"⚡", annoyed:"😑" }[mood] || "✦";
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

async function getNovaResponse(question) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question, history: localStorage.getItem("novaMemory") === "off" ? [] : conversation.slice(0, -1).slice(-12) })
    });
    if (!response.ok) throw new Error("Server error");
    const data = await response.json();
    updateNovaEmotion(data.emotion);
    return data.reply;
  } catch (error) {
    console.error("NOVA error:", error);
    return "I couldn't connect to my AI backend. Please try again.";
  }
}

function speak(text) {
  if (!voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text);
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}

function saveHistory() {
  localStorage.setItem("novaHistory", messages.innerHTML);
  localStorage.setItem("novaConversation", JSON.stringify(conversation.slice(-30)));
}

function loadHistory() {
  const saved = localStorage.getItem("novaHistory");
  if (saved) {
    messages.innerHTML = saved;
    welcome.style.display = "none";
  }
}

async function sendMessage(customQuestion = null) {
  const question = (customQuestion || userInput.value).trim();
  if (!question) return;

  welcome.style.display = "none";
  closePanels(false);

  let finalQuestion = question;
  if (selectedFile) finalQuestion += `\n\nAttached file: ${selectedFile.name}`;

  addMessage(question, "user-message");
  conversation.push({ role: "user", content: question });

  if (selectedFile) {
    addMessage(`📎 ${selectedFile.name}`, "user-message");
    selectedFile = null;
    fileInput.value = "";
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
  conversation.push({ role: "assistant", content: response });
  saveHistory();
  speak(response);
}

sendBtn.addEventListener("click", () => sendMessage());
userInput.addEventListener("keydown", event => {
  if (event.key === "Enter") sendMessage();
});

newChatBtn.addEventListener("click", () => {
  if (conversation.length) {
    const sessions = JSON.parse(localStorage.getItem("novaSessions") || "[]");
    sessions.unshift({ date: new Date().toLocaleString(), conversation: conversation.slice(-30), html: messages.innerHTML });
    localStorage.setItem("novaSessions", JSON.stringify(sessions.slice(0, 20)));
  }
  messages.innerHTML = "";
  conversation = [];
  welcome.style.display = "block";
  localStorage.removeItem("novaHistory");
  localStorage.removeItem("novaConversation");
  updateNovaEmotion({ mood: "calm" });
  setActive(chatNav);
  userInput.focus();
});

attachBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (!fileInput.files.length) return;
  selectedFile = fileInput.files[0];
  addMessage(`📎 Selected: ${selectedFile.name}`, "user-message");
  userInput.focus();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";
  recognition.onstart = () => micBtn.textContent = "🔴";
  recognition.onend = () => micBtn.textContent = "🎤";
  recognition.onresult = event => {
    userInput.value = event.results[0][0].transcript;
    userInput.focus();
  };
  recognition.onerror = () => micBtn.textContent = "🎤";
}

micBtn.addEventListener("click", () => {
  if (!recognition) {
    addMessage("🎤 Voice input is not supported by this browser.", "ai-message");
    return;
  }
  recognition.start();
});

chatNav.addEventListener("click", event => {
  event.preventDefault();
  closePanels();
  setActive(chatNav);
});

projectsNav.addEventListener("click", event => {
  event.preventDefault();
  setActive(projectsNav);
  showProjects();
});

historyNav.addEventListener("click", event => {
  event.preventDefault();
  setActive(historyNav);
  showHistory();
});

settingsNav.addEventListener("click", event => {
  event.preventDefault();
  setActive(settingsNav);
  showSettings();
});

function setActive(element) {
  document.querySelectorAll(".sidebar nav a, .sidebar-bottom a").forEach(link => link.classList.remove("active"));
  element.classList.add("active");
}

function closePanels(hideWelcome = true) {
  document.querySelectorAll(".nova-panel").forEach(panel => panel.remove());
  if (hideWelcome) welcome.style.display = "none";
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
    </div>`;
  document.querySelector(".chat").appendChild(panel);
  panel.querySelector(".panel-close").addEventListener("click", () => {
    panel.remove();
    setActive(chatNav);
  });
  return panel;
}

function showProjects() {
  const cards = savedProjects.length
    ? savedProjects.map((p, i) => `
      <div class="project-card">
        <strong>${escapeHtml(p.name)}</strong>
        <span>${escapeHtml(p.description || "Saved NOVA project")}</span>
        <button class="open-project" data-index="${i}">Open</button>
      </div>`).join("")
    : "<p>No saved projects yet. Ask NOVA to build one.</p>";

  const panel = createPanel("📁 Projects", `
    <p>Save generated projects here on this device.</p>
    <button class="project-action" id="newProjectBtn">＋ New Project</button>
    <div id="projectList">${cards}</div>`);

  panel.querySelector("#newProjectBtn").addEventListener("click", () => {
    userInput.value = "Build me a responsive HTML, CSS and JavaScript project for ";
    panel.remove();
    setActive(chatNav);
    userInput.focus();
  });

  panel.querySelectorAll(".open-project").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = savedProjects[Number(btn.dataset.index)];
      sendMessage(`Open my saved project named "${p.name}". Here is its saved AI output:\n\n${p.content}`);
    });
  });
}

function showHistory() {
  const sessions = JSON.parse(localStorage.getItem("novaSessions") || "[]");
  const content = sessions.length
    ? sessions.map((s, i) => `
      <div class="project-card">
        <strong>Conversation ${i + 1}</strong>
        <span>${escapeHtml(s.date)}</span>
        <button class="restore-session" data-index="${i}">Restore</button>
      </div>`).join("")
    : "<p>No previous conversations yet.</p>";

  const panel = createPanel("🕘 History", content);
  panel.querySelectorAll(".restore-session").forEach(btn => {
    btn.addEventListener("click", () => {
      const s = sessions[Number(btn.dataset.index)];
      messages.innerHTML = s.html || "";
      conversation = s.conversation || [];
      saveHistory();
      panel.remove();
      welcome.style.display = "none";
      setActive(chatNav);
    });
  });
}

function showSettings() {
  const panel = createPanel("⚙️ Settings", `
    <label class="setting-row"><span>🔊 Voice responses</span><input type="checkbox" id="voiceToggle" ${voiceEnabled ? "checked" : ""}></label>
    <label class="setting-row"><span>🌙 Dark mode</span><input type="checkbox" id="darkToggle" ${!document.body.classList.contains("light-mode") ? "checked" : ""}></label>
    <label class="setting-row"><span>🧠 Remember conversation</span><input type="checkbox" id="memoryToggle" ${localStorage.getItem("novaMemory") !== "off" ? "checked" : ""}></label>
    <button class="project-action" id="clearMemory">Clear NOVA memory</button>
  `);

  panel.querySelector("#voiceToggle").addEventListener("change", e => {
    voiceEnabled = e.target.checked;
    localStorage.setItem("novaVoice", voiceEnabled ? "on" : "off");
  });

  panel.querySelector("#darkToggle").addEventListener("change", e => {
    document.body.classList.toggle("light-mode", !e.target.checked);
    localStorage.setItem("novaTheme", e.target.checked ? "dark" : "light");
  });

  panel.querySelector("#memoryToggle").addEventListener("change", e => {
    localStorage.setItem("novaMemory", e.target.checked ? "on" : "off");
    if (!e.target.checked) {
      conversation = [];
      localStorage.removeItem("novaConversation");
    }
  });

  panel.querySelector("#clearMemory").addEventListener("click", () => {
    conversation = [];
    messages.innerHTML = "";
    localStorage.removeItem("novaConversation");
    localStorage.removeItem("novaHistory");
    welcome.style.display = "block";
    panel.remove();
    setActive(chatNav);
  });
}

function quickAction(type) {
  const prompts = {
    code: "Build me a small responsive HTML, CSS and JavaScript project. Explain the features and provide complete code.",
    cv: "Help me create a professional junior frontend developer CV. Ask me for any missing information, then produce a polished CV.",
    cover: "Help me write a professional cover letter for a remote junior frontend developer job. Ask for the company/job details if needed.",
    linkedin: "Write a short professional LinkedIn post about my latest web project. Make it confident, humble, and focused on learning and teamwork."
  };
  sendMessage(prompts[type]);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char]));
}

document.querySelectorAll(".quick-actions button").forEach(button => {
  button.addEventListener("click", () => quickAction(button.dataset.action));
});

menuBtn.addEventListener("click", () => sidebar.classList.toggle("sidebar-open"));

const savedTheme = localStorage.getItem("novaTheme");
if (savedTheme === "light") document.body.classList.add("light-mode");

loadHistory();


function quickAction(type) {
  const prompts = {
    code: "Build me a small responsive HTML, CSS and JavaScript project. Explain the features and provide complete code.",
    cv: "Help me create a professional junior frontend developer CV. Ask me for any missing information, then produce a polished CV.",
    cover: "Help me write a professional cover letter for a remote junior frontend developer job. Ask for company and job details if needed.",
    linkedin: "Write a short professional LinkedIn post about my latest web project. Make it confident, humble, and focused on learning and teamwork."
  };
  sendMessage(prompts[type]);
}

document.querySelectorAll(".quick-actions button").forEach(button => {
  button.addEventListener("click", () => quickAction(button.dataset.action));
});

const savedTheme = localStorage.getItem("novaTheme");
if (savedTheme === "light") document.body.classList.add("light-mode");
