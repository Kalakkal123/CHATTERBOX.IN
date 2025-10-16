// ----------------- Dark Mode Toggle -----------------
const toggleBtn = document.getElementById("toggleThemeBtn");

toggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  document.body.setAttribute("data-theme", currentTheme === "dark" ? "light" : "dark");
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
  serverTimestamp,
  onValue,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCJI2YgCLUyI0U9ufRfCujRjDDTeP-lNY",
  authDomain: "kalakkal1-d6e19.firebaseapp.com",
  databaseURL: "https://kalakkal1-d6e19-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kalakkal1-d6e19",
  storageBucket: "kalakkal1-d6e19.firebasestorage.app",
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

let username = null;

// ----------------- Username Setup -----------------
setNameBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (name === "") return alert("Please enter a valid name");
  username = name;

  // Hide modal
  usernameModal.style.display = "none";

  // Add user to presence list
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

// Display typing status from other users
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

// ----------------- Online User Counter -----------------
onValue(presenceRef, (snapshot) => {
  const users = snapshot.val() || {};
  const count = Object.keys(users).length;
  onlineCount.textContent = `Online: [${count} Users]`;
});

// ----------------- Send Message -----------------
function sendMessage() {
  const msg = input.value.trim();
  if (msg === "" || !username) return;

  try {
    push(messagesRef, {
      text: msg,
      sender: username,
      timestamp: Date.now(),
    });
    input.value = "";
    set(ref(database, `typing/${username}`), false);
  } catch (err) {
    console.error("Error sending message:", err);
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ----------------- Listen for Messages -----------------
onChildAdded(messagesRef, (snapshot) => {
  const data = snapshot.val();
  if (!data || !data.text) return;

  const div = document.createElement("div");
  div.className = "msg";

  const nameSpan = document.createElement("span");
  nameSpan.className = "sender";
  nameSpan.textContent = `${data.sender || "Unknown"}: `;

  const textSpan = document.createElement("span");
  textSpan.className = "text";
  textSpan.textContent = data.text;

  div.appendChild(nameSpan);
  div.appendChild(textSpan);
  chatBox.appendChild(div);

  // Auto scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
});
