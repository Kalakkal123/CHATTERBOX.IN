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
  remove,
  update
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

// ----------------- Username Setup -----------------
let username = null;
let onlineUsersBefore = 0;

setNameBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Please enter a valid name");
  username = name;

  usernameModal.style.display = "none";

  const userStatusRef = ref(database, `presence/${username}`);
  set(userStatusRef, true);
  onDisconnect(userStatusRef).remove();
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
  const msg = input.value.trim();
  if (msg === "" || !username) return;

  const messageRef = push(messagesRef, {
    type: "text",
    text: msg,
    sender: username,
    timestamp: Date.now(),
  });

  input.value = "";
  set(ref(database, `typing/${username}`), false);

  // Auto-delete after 1 hour
  setTimeout(() => {
    remove(messageRef);
  }, 60 * 60 * 1000);
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ----------------- Helper: Format Timestamp -----------------
function formatTime(ms) {
  const date = new Date(ms);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  if (minutes < 10) minutes = "0" + minutes;
  return `${hours}:${minutes} ${ampm}`;
}

// ----------------- Listen for Messages -----------------
onChildAdded(messagesRef, (snapshot) => {
  const data = snapshot.val();
  const key = snapshot.key;
  if (!data) return;

  const div = document.createElement("div");
  div.className = "msg";
  div.id = `msg-${key}`;

  const nameSpan = document.createElement("span");
  nameSpan.className = "sender";
  nameSpan.textContent = `${data.sender}: `;
  div.appendChild(nameSpan);

  const textSpan = document.createElement("span");
  textSpan.className = "text";
  textSpan.textContent = data.text;
  div.appendChild(textSpan);

  const timeSpan = document.createElement("span");
  timeSpan.style.fontSize = "11px";
  timeSpan.style.opacity = "0.6";
  timeSpan.textContent = ` • ${formatTime(data.timestamp)}`;
  div.appendChild(timeSpan);

  // Edit/Delete buttons for own messages
  if (data.sender === username) {
    const actions = document.createElement("div");
    actions.style.marginTop = "5px";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️ Edit";
    editBtn.style.marginRight = "5px";
    editBtn.style.cursor = "pointer";
    editBtn.addEventListener("click", () => {
      const newText = prompt("Edit your message:", data.text);
      if (newText !== null && newText.trim() !== "") {
        update(ref(database, `messages/${key}`), { text: newText.trim() });
      }
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️ Delete";
    delBtn.style.cursor = "pointer";
    delBtn.addEventListener("click", () => {
      if (confirm("Delete this message?")) {
        remove(ref(database, `messages/${key}`));
        div.remove();
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    div.appendChild(actions);
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Also auto remove message div in UI after 1 hour
  const timeLeft = 60 * 60 * 1000 - (Date.now() - data.timestamp);
  if (timeLeft > 0) {
    setTimeout(() => {
      remove(ref(database, `messages/${key}`));
      div.remove();
    }, timeLeft);
  }
});
