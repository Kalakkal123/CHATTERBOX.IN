// ----------------- Dark Mode Toggle -----------------
const toggleBtn = document.getElementById("toggleThemeBtn");

toggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  document.body.setAttribute("data-theme", currentTheme === "dark" ? "light" : "dark");
});

// ----------------- Firebase Setup -----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Your Firebase config (use your project’s config)
const firebaseConfig = {
  apiKey: "AIzaSyBCJI2YgCLUyI0U9ufRfCujRjDDTeP-lNY",
  authDomain: "kalakkal1-d6e19.firebaseapp.com",
  databaseURL: "https://kalakkal1-d6e19-default-rtdb.firebaseio.com",
  projectId: "kalakkal1-d6e19",
  storageBucket: "kalakkal1-d6e19.firebasestorage.app",
  messagingSenderId: "979373423767",
  appId: "1:979373423767:web:52485a1a022670f2b6fdd2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const messagesRef = ref(database, 'messages');

// ----------------- DOM Elements -----------------
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// ----------------- Send Message -----------------
sendBtn.addEventListener("click", () => {
  const msg = input.value.trim();
  if (msg !== "") {
    push(messagesRef, { text: msg, timestamp: Date.now() });
    input.value = "";
  }
});

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// ----------------- Listen for Messages -----------------
onChildAdded(messagesRef, (snapshot) => {
  const data = snapshot.val();
  const div = document.createElement("div");
  div.className = "msg";
  div.textContent = data.text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});
