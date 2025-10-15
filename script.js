// ----------------- Dark Mode Toggle -----------------
const toggleBtn = document.getElementById("toggleThemeBtn");

toggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  document.body.setAttribute("data-theme", currentTheme === "dark" ? "light" : "dark");
});

// ----------------- Firebase Setup -----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCJI2YgCLUyI0U9ufRfCujRjDDTeP-lNY",
  authDomain: "kalakkal1-d6e19.firebaseapp.com",
  databaseURL: "https://kalakkal1-d6e19-default-rtdb.firebaseio.com",
  projectId: "kalakkal1-d6e19",
  storageBucket: "kalakkal1-d6e19.firebasestorage.app",
  messagingSenderId: "979373423767",
  appId: "1:979373423767:web:52485a1a022670f2b6fdd2"
};

let app, database;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log("Firebase initialized successfully ✅");
} catch (err) {
  console.error("Firebase initialization error:", err);
}

const messagesRef = ref(database, 'messages');

// ----------------- DOM Elements -----------------
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// ----------------- Send Message -----------------
function sendMessage() {
  const msg = input.value.trim();
  if (msg === "") return;

  try {
    push(messagesRef, { text: msg, timestamp: Date.now() });
    input.value = "";
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
  div.textContent = data.text;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});
