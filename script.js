// ----------------- Dark Mode Toggle -----------------
const toggleBtn = document.getElementById("toggleThemeBtn");
toggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  document.body.setAttribute(
    "data-theme",
    currentTheme === "dark" ? "light" : "dark"
  );
});

// ----------------- Firebase Setup -----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onDisconnect,
  set,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCJI2YgCLUyI0U9ufRfCujRjDDTeP-lNY",
  authDomain: "kalakkal1-d6e19.firebaseapp.com",
  databaseURL: "https://kalakkal1-d6e19-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kalakkal1-d6e19",
  storageBucket: "kalakkal1-d6e19.appspot.com",
  messagingSenderId: "979373423767",
  appId: "1:979373423767:web:52485a1a022670f2b6fdd2",
};

let app, database;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log("Firebase initialized successfully ✅");
} catch (err) {
  console.error("Firebase initialization error:", err);
}

// ----------------- References -----------------
const messagesRef = ref(database, "messages");
const presenceRef = ref(database, "presence");
const typingRef = ref(database, "typing");

// ----------------- DOM Elements -----------------
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const usernameModal = document.getElementById("usernameModal");
const usernameInput = document.getElementById("usernameInput");
const setNameBtn = document.getElementById("setNameBtn");
const typingIndicator = document.getElementById("typingIndicator");
const typingText = document.getElementById("typingText");
const onlineCount = document.getElementById("onlineCount");

// ----------------- Sound -----------------
const joinSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const adminDing = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

// ----------------- Username Setup + Admin Mode -----------------
let username = null;
let isAdmin = false;
let onlineUsersBefore = 0;

setNameBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Please enter a valid name");

  if (name === "MASTER") {
    isAdmin = true;
    username = "MASTER";
  } else {
    username = name;
  }

  usernameModal.style.display = "none";

  const userStatusRef = ref(database, `presence/${username}`);
  set(userStatusRef, true);
  onDisconnect(userStatusRef).remove();

  // Send welcome message
  push(messagesRef, {
    type: "system",
    text: `${username} joined the chat 🚀`,
    timestamp: Date.now()
  });
});

// ----------------- Typing Indicator -----------------
let typingTimeout;
input.addEventListener("input", () => {
  if (!username) return;
  set(ref(database, `typing/${username}`), true);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    set(ref(database, `typing/${username}`), false);
  }, 1500);
});

onValue(typingRef, (snapshot) => {
  const typingUsers = snapshot.val() || {};
  const others = Object.keys(typingUsers).filter((u) => typingUsers[u] && u !== username);

  if (others.length > 0) {
    typingText.textContent = `${others.join(", ")}: typing...`;
    typingIndicator.style.display = "block";
  } else {
    typingIndicator.style.display = "none";
  }
});

// ----------------- Online User Counter + Sound -----------------
onValue(presenceRef, (snapshot) => {
  const users = snapshot.val() || {};
  const count = Object.keys(users).length;
  onlineCount.textContent = `Online: [${count} Users]`;

  if (count > onlineUsersBefore && onlineUsersBefore !== 0) {
    joinSound.play().catch(() => {});
  }
  onlineUsersBefore = count;
});

// ----------------- Send Text Message -----------------
function sendMessage() {
  let msg = input.value.trim();
  if (msg === "" || !username) return;

  // Tagging highlight
  msg = msg.replace(/@(\w+)/g, "@$1");

  const messageRef = push(messagesRef, {
    type: "text",
    text: msg,
    sender: username,
    admin: isAdmin,
    timestamp: Date.now(),
  });

  input.value = "";
  set(ref(database, `typing/${username}`), false);

  // Admin ding
  if (isAdmin) adminDing.play().catch(() => {});

  // Auto-delete after 1 hour
  setTimeout(() => {
    remove(messageRef);
  }, 60 * 60 * 1000);
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ----------------- Listen for Messages -----------------
onChildAdded(messagesRef, (snapshot) => {
  const data = snapshot.val();
  const key = snapshot.key;
  if (!data) return;

  const div = document.createElement("div");
  div.className = "msg";
  div.id = `msg-${key}`;

  if (data.type === "system") {
    div.style.textAlign = "center";
    div.style.opacity = "0.8";
    div.textContent = data.text;
  } else {
    const nameSpan = document.createElement("span");
    nameSpan.className = "sender";
    nameSpan.textContent = `${data.sender}: `;
    if (data.admin) {
      nameSpan.style.color = "#FFD700"; // gold color for admin
      nameSpan.style.fontWeight = "bold";
    }
    div.appendChild(nameSpan);

    const textSpan = document.createElement("span");
    textSpan.className = "text";
    textSpan.style.fontWeight = data.admin ? "bold" : "normal";

    // Tagging styling
    let finalText = data.text.replace(/@(\w+)/g, '<span class="tagged">@$1</span>');
    textSpan.innerHTML = finalText;
    div.appendChild(textSpan);

    // Admin can delete any message by clicking
    if (isAdmin) {
      div.addEventListener("click", () => {
        if (confirm("Delete this message?")) {
          remove(ref(database, `messages/${key}`));
          div.remove();
        }
      });
    }
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Auto remove message after 1 hour (UI cleanup too)
  const timeLeft = 60 * 60 * 1000 - (Date.now() - data.timestamp);
  if (timeLeft > 0) {
    setTimeout(() => {
      remove(ref(database, `messages/${key}`));
      div.remove();
    }, timeLeft);
  }
});

// ----------------- Clear All Messages (Admin Only) -----------------
if (isAdmin) {
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear All Messages";
  clearBtn.style.background = "#FFD700";
  clearBtn.style.color = "#000";
  clearBtn.style.border = "none";
  clearBtn.style.padding = "5px 10px";
  clearBtn.style.margin = "5px";
  clearBtn.style.cursor = "pointer";
  clearBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all messages?")) {
      remove(messagesRef);
      chatBox.innerHTML = "";
    }
  });
  document.body.prepend(clearBtn);
});
