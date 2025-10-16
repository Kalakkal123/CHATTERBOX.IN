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
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCJI2YgCLUyI0U9ufRfCujRjDDTeP-lNY",
  authDomain: "kalakkal1-d6e19.firebaseapp.com",
  databaseURL: "https://kalakkal1-d6e19-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kalakkal1-d6e19",
  storageBucket: "kalakkal1-d6e19.appspot.com",
  messagingSenderId: "979373423767",
  appId: "1:979373423767:web:52485a1a022670f2b6fdd2",
};

let app, database, storage;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  storage = getStorage(app);
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

// Image upload elements
const imageInput = document.getElementById("imageInput");
const imageBtn = document.getElementById("attachImageBtn"); // Corrected ID

let username = null;

// ----------------- Username Setup -----------------
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

// ----------------- Online User Counter -----------------
onValue(presenceRef, (snapshot) => {
  const users = snapshot.val() || {};
  const count = Object.keys(users).length;
  onlineCount.textContent = `Online: [${count} Users]`;
});

// ----------------- Send Text Message -----------------
function sendMessage() {
  const msg = input.value.trim();
  if (msg === "" || !username) return;

  push(messagesRef, {
    type: "text",
    text: msg,
    sender: username,
    timestamp: Date.now(),
  });

  input.value = "";
  set(ref(database, `typing/${username}`), false);
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ----------------- Send Image Message -----------------
imageBtn.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !username) return;

  const filePath = `images/${Date.now()}_${file.name}`;
  const imgRef = storageRef(storage, filePath);

  try {
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);

    const msgRef = push(messagesRef, {
      type: "image",
      url,
      path: filePath,
      sender: username,
      timestamp: Date.now(),
    });

    // Auto-delete after 10 minutes
    setTimeout(async () => {
      try {
        await deleteObject(imgRef);
        await remove(msgRef);
        console.log("🗑️ Image deleted after 10 mins");
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }, 10 * 60 * 1000);
  } catch (err) {
    console.error("Image upload failed:", err);
  }
});

// ----------------- Listen for Messages -----------------
onChildAdded(messagesRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const div = document.createElement("div");
  div.className = "msg";

  const nameSpan = document.createElement("span");
  nameSpan.className = "sender";
  nameSpan.textContent = `${data.sender || "Unknown"}: `;
  div.appendChild(nameSpan);

  if (data.type === "text") {
    const textSpan = document.createElement("span");
    textSpan.className = "text";
    textSpan.textContent = data.text;
    div.appendChild(textSpan);
  } else if (data.type === "image") {
    const img = document.createElement("img");
    img.src = data.url;
    img.alt = "image";
    img.className = "chat-image";
    div.appendChild(img);
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});
