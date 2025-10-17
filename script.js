// ----------------- Dark Mode Toggle -----------------
const toggleBtn = document.getElementById("toggleThemeBtn");
toggleBtn?.addEventListener("click", () => {
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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

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
const adminPanel = document.getElementById("adminPanel");
const announcementInput = document.getElementById("announcementInput");
const announceBtn = document.getElementById("announceBtn");
const clearChatBtn = document.getElementById("clearChatBtn");

// ----------------- Sounds -----------------
const joinSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const adminDing = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

// ----------------- User Setup -----------------
let username = null;
let isAdmin = false;
let onlineUsersBefore = 0;

// ----------------- Set Username -----------------
setNameBtn.addEventListener("click", () => {
  let name = usernameInput.value.trim();
  if (!name) return alert("Enter a valid name!");

  if (name === "MASTER") {
    isAdmin = true;
    username = "ADMIN";
    adminPanel.style.display = "flex";
  } else {
    username = name;
  }

  usernameModal.style.display = "none";

  // Presence
  const userStatusRef = ref(database, `presence/${username}`);
  set(userStatusRef, true);
  onDisconnect(userStatusRef).remove();

  // System join message
  push(messagesRef, {
    type: "system",
    text: `${username} joined the chat 🚀`,
    timestamp: Date.now()
  });
});

// ----------------- Typing Indicator -----------------
let typingTimeout;
input?.addEventListener("input", () => {
  if (!username) return;
  set(ref(database, `typing/${username}`), true);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    set(ref(database, `typing/${username}`), false);
  }, 1500);
});

onValue(typingRef, snapshot => {
  const typingUsers = snapshot.val() || {};
  const others = Object.keys(typingUsers).filter(u => typingUsers[u] && u !== username);
  if (others.length > 0) {
    typingText.textContent = `${others.join(", ")} typing...`;
    typingIndicator.style.display = "block";
  } else {
    typingIndicator.style.display = "none";
  }
});

// ----------------- Online Counter -----------------
onValue(presenceRef, snapshot => {
  const users = snapshot.val() || {};
  const count = Object.keys(users).length;
  onlineCount.textContent = `Online: [${count} Users]`;
  if (count > onlineUsersBefore && onlineUsersBefore !== 0) joinSound.play().catch(()=>{});
  onlineUsersBefore = count;
});

// ----------------- Send Message -----------------
function sendMessage() {
  if (!username) return;
  const msg = input.value.trim();
  if (!msg) return;

  // Admin command /clear
  if (isAdmin && msg === "/clear") {
    remove(messagesRef);
    chatBox.innerHTML = "";
    input.value = "";
    return;
  }

  const messageRef = push(messagesRef, {
    type: "text",
    text: msg.replace(/@(\w+)/g, "@$1"),
    sender: username,
    admin: isAdmin,
    timestamp: Date.now()
  });

  input.value = "";
  set(ref(database, `typing/${username}`), false);

  if (isAdmin) adminDing.play().catch(()=>{});

  // Auto delete 1 hour later
  setTimeout(() => remove(messageRef), 60*60*1000);
}

sendBtn?.addEventListener("click", sendMessage);
input?.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });

// ----------------- Display Messages -----------------
onChildAdded(messagesRef, snapshot => {
  const data = snapshot.val();
  const key = snapshot.key;
  if (!data || !chatBox) return;

  const div = document.createElement("div");
  div.className = "msg";
  div.id = `msg-${key}`;
  if (data.sender === username) div.classList.add("self");
  if (data.type === "system") {
    div.style.textAlign = "center";
    div.style.opacity = "0.8";
    div.textContent = data.text;
  } else {
    const nameSpan = document.createElement("span");
    nameSpan.className = "sender";
    nameSpan.textContent = `${data.sender}: `;
    if (data.admin) {
      nameSpan.classList.add("admin");
    }

    const textSpan = document.createElement("span");
    textSpan.className = "text";
    textSpan.innerHTML = data.text.replace(/@(\w+)/g, '<span class="tagged">@$1</span>');

    div.appendChild(nameSpan);
    div.appendChild(textSpan);

    // Admin message deletion
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

  // Auto remove after 1 hour
  const timeLeft = 60*60*1000 - (Date.now() - data.timestamp);
  if (timeLeft > 0) {
    setTimeout(() => {
      remove(ref(database, `messages/${key}`));
      div.remove();
    }, timeLeft);
  }
});

// ----------------- Admin Panel Buttons -----------------
announceBtn?.addEventListener("click", () => {
  const text = announcementInput.value.trim();
  if (!text) return;
  push(messagesRef, {
    type: "announcement",
    text: text,
    sender: "ADMIN",
    admin: true,
    timestamp: Date.now()
  });
  announcementInput.value = "";
});

clearChatBtn?.addEventListener("click", () => {
  if (confirm("Delete all messages?")) {
    remove(messagesRef);
    chatBox.innerHTML = "";
  }
});
