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
  remove,
  get,
  onChildRemoved,
  onChildChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// paste the keys here //
const firebaseConfig = {
  apiKey: "AIzaSyBCJI2YgCLUyI0U9ufRfCujRjDDTeP-lNY",
  authDomain: "kalakkal1-d6e19.firebaseapp.com",
  databaseURL: "https://kalakkal1-d6e19-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kalakkal1-d6e19",
  storageBucket: "kalakkal1-d6e19.appspot.com",
  messagingSenderId: "979373423767",
  appId: "1:979373423767:web:52485a1a022670f2b6fdd2",
};
// ================== //

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
const recordBtn = document.getElementById("recordBtn");
const announcementInput = document.getElementById("announcementInput");
const announceBtn = document.getElementById("announceBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const clearAIBtn = document.getElementById("clearAIBtn");
const closeAdminBtn = document.getElementById("closeAdminBtn");
const adminPanelBtn = document.getElementById("adminPanelBtn");
const imageUploadInput = document.getElementById("imageUploadInput");
const uploadImageBtn = document.getElementById("uploadImageBtn");
const muteSoundBtn = document.getElementById("muteSoundBtn");
const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const replyPreview = document.getElementById("replyPreview");
const replyPreviewText = document.getElementById("replyPreviewText");
const cancelReplyBtn = document.getElementById("cancelReplyBtn");
const exportChatBtn = document.getElementById("exportChatBtn");
const puterAuthBtn = document.getElementById("puterAuthBtn");

// ----------------- Sounds -----------------
const joinSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const adminDing = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

// ----------------- User Setup -----------------
let username = null;
let isAdmin = false;
let onlineUsersBefore = 0;
let isMuted = false;
let replyTarget = null;

muteSoundBtn?.addEventListener("click", () => {
  isMuted = !isMuted;
  muteSoundBtn.textContent = isMuted ? "🔇" : "🔊";
});

// ----------------- Puter Auth -----------------
if (puter.auth.isSignedIn()) {
  if (puterAuthBtn) puterAuthBtn.textContent = "🧠✓";
}

puterAuthBtn?.addEventListener("click", async () => {
  if (puter.auth.isSignedIn()) {
    puter.auth.signOut();
    if (puterAuthBtn) puterAuthBtn.textContent = "🧠";
  } else {
    try {
      await puter.auth.signIn();
      if (puterAuthBtn) puterAuthBtn.textContent = "🧠✓";
    } catch (err) {
      console.error("Auth canceled", err);
    }
  }
});

// ----------------- Set Username -----------------
setNameBtn.addEventListener("click", () => {
  let name = usernameInput.value.trim();
  if (!name) return alert("Enter a valid name!");

  if (name === "MASTER") {
    isAdmin = true;
    username = "ADMIN";
    adminPanelBtn.style.display = "block";
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
  const others = Object.keys(typingUsers).filter(
    u => typingUsers[u] && u !== username
  );
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
  if (count > onlineUsersBefore && onlineUsersBefore !== 0) {
    if (!isMuted) joinSound.play().catch(() => {});
  }
  onlineUsersBefore = count;
});

// ----------------- Scroll To Bottom Helper -----------------
chatBox?.addEventListener("scroll", () => {
  if (chatBox.scrollHeight - chatBox.scrollTop > chatBox.clientHeight + 150) {
    scrollToBottomBtn.style.display = "flex";
  } else {
    scrollToBottomBtn.style.display = "none";
  }
});
scrollToBottomBtn?.addEventListener("click", () => {
  chatBox.scrollTop = chatBox.scrollHeight;
});

// ----------------- Emoji Picker -----------------
const commonEmojis = ["😀", "😂", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎", "🙏", "🔥", "✨", "🎉", "❤️", "💯", "👀", "🙌", "✅"];
commonEmojis.forEach(em => {
  const span = document.createElement("span");
  span.className = "emoji-item";
  span.textContent = em;
  span.addEventListener("click", () => {
    input.value += em;
    input.focus();
    emojiPicker.style.display = "none";
  });
  emojiPicker.appendChild(span);
});
emojiBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  emojiPicker.style.display = emojiPicker.style.display === "none" ? "grid" : "none";
});
document.addEventListener("click", (e) => {
  if (emojiPicker && emojiPicker.style.display === "grid" && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
    emojiPicker.style.display = "none";
  }
});

// ----------------- Voice Recording -----------------
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

recordBtn?.addEventListener("click", async () => {
  if (!username) return alert("Please set your name first!");

  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      isRecording = true;
      recordBtn.classList.add("recording");

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          const newMsgRef = push(messagesRef, {
            type: "audio",
            src: base64Audio,
            sender: username,
            admin: isAdmin,
            timestamp: Date.now()
          });
          // Delete voice message after 30 seconds
          setTimeout(() => remove(ref(database, `messages/${newMsgRef.key}`)), 30000);
        };
        audioChunks = [];
      });
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone permission is required to send voice messages.");
    }
  } else {
    mediaRecorder.stop();
    isRecording = false;
    recordBtn.classList.remove("recording");
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
});

// ----------------- Image Upload -----------------
uploadImageBtn?.addEventListener("click", () => {
  if (!username) return alert("Please set your name first!");
  imageUploadInput.click();
});

imageUploadInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Check file size (e.g., limit to 5MB to avoid Firebase payload issues)
  if (file.size > 5 * 1024 * 1024) {
    alert("Image is too large (max 5MB).");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64Image = reader.result;
    const newMsgRef = push(messagesRef, {
      type: "image",
      src: base64Image,
      sender: username,
      admin: isAdmin,
      timestamp: Date.now()
    });
    // Delete user uploaded image after 15 seconds (Fix)
    setTimeout(() => remove(ref(database, `messages/${newMsgRef.key}`)), 15000);
  };
  reader.readAsDataURL(file);
  imageUploadInput.value = "";
});

// ----------------- Send Message -----------------
async function sendMessage() {
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

  // Puter AI Auth Guard
  if (msg.toLowerCase().startsWith("@ai")) {
    if (!puter.auth.isSignedIn()) {
      try {
        await puter.auth.signIn();
        if (puterAuthBtn) puterAuthBtn.textContent = "🧠✓";
      } catch (e) {
        alert("You must connect your Puter account to use AI features.");
        return;
      }
    }
  }

  const messageRef = push(messagesRef, {
    type: "text",
    text: msg,
    sender: username,
    admin: isAdmin,
    replyTo: replyTarget,
    timestamp: Date.now()
  });

  input.value = "";
  set(ref(database, `typing/${username}`), false);
  
  // Reset Reply Preview
  replyTarget = null;
  if(replyPreview) replyPreview.style.display = "none";

  if (isAdmin && !isMuted) {
    adminDing.play().catch(() => {});
  }

  // Delete regular message after 1 hour (3600000 ms)
  setTimeout(() => remove(ref(database, `messages/${messageRef.key}`)), 3600000);

  // Prune messages to keep only the latest 50
  get(messagesRef).then((snapshot) => {
    if (snapshot.exists()) {
      const keys = Object.keys(snapshot.val());
      if (keys.length > 50) {
        const keysToRemove = keys.slice(0, keys.length - 50);
        keysToRemove.forEach(k => remove(ref(database, `messages/${k}`)));
      }
    }
  });

  // Puter.js AI response
  if (!isAdmin || msg !== "/clear") {
    if (msg.toLowerCase().startsWith("@ai")) {
      const aiQuery = msg.substring(3).trim();
      if (aiQuery) {
        // Check for natural language image requests
        const imgRegex = /(?:create|generate|make|draw|show).*(?:image|picture|photo|drawing)\s+(?:of\s+)?(.*)/i;
        const drawRegex = /draw\s+(?:a|an|the|some)\s+(.*)/i;
        const pollRegex = /(?:ask|create|make).*(?:question|poll)\s+(?:about\s+)?(.*)/i;
        
        let imagePrompt = null;
        let pollTopic = null;
        const imgMatch = aiQuery.match(imgRegex);
        const drawMatch = aiQuery.match(drawRegex);
        const pollMatch = aiQuery.match(pollRegex);
        
        if (imgMatch && imgMatch[1]) imagePrompt = imgMatch[1];
        else if (drawMatch && drawMatch[1]) imagePrompt = drawMatch[1];
        else if (pollMatch && pollMatch[1]) pollTopic = pollMatch[1];

        if (imagePrompt) {
          getAIImageResponse(imagePrompt.trim());
        } else if (pollTopic) {
          getAIPollResponse(pollTopic.trim());
        } else {
          getAIResponse(aiQuery);
        }
      }
    }
  }
}

async function getAIImageResponse(prompt) {
  try {
    set(ref(database, `typing/AI Friend`), true);
    const imageElement = await puter.ai.txt2img(prompt);
    
    const newMsgRef = push(messagesRef, {
      type: "image",
      src: imageElement.src,
      sender: "AI Friend",
      admin: false,
      timestamp: Date.now()
    });
    set(ref(database, `typing/AI Friend`), false);

    // Delete the image from Firebase after 15 seconds
    setTimeout(() => {
      remove(ref(database, `messages/${newMsgRef.key}`));
    }, 15000);
  } catch (error) {
    console.error("Puter AI Image error:", error);
    set(ref(database, `typing/AI Friend`), false);
  }
}

async function getAIPollResponse(topic) {
  try {
    set(ref(database, `typing/AI Friend`), true);
    const prompt = `Create a multiple choice question about ${topic}. Return ONLY valid JSON exactly like this: {"question": "Question text?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "answerIndex": 0} where answerIndex is the number (0-3) of the correct option. Do not include markdown formatting.`;
    const response = await puter.ai.chat(prompt, { response_format: { type: "json_object" } });
    
    let content = typeof response === 'string' ? response : (response?.message?.content || "{}");
    if (Array.isArray(content)) content = content[0]?.text;
    
    // Clean up any markdown that might sneak in
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const pollData = JSON.parse(content);

    const newMsgRef = push(messagesRef, {
      type: "poll",
      poll: pollData,
      sender: "AI Friend",
      admin: false,
      timestamp: Date.now()
    });
    set(ref(database, `typing/AI Friend`), false);

    // Delete the poll after 1 hour
    setTimeout(() => remove(ref(database, `messages/${newMsgRef.key}`)), 3600000);
  } catch (error) {
    console.error("Puter AI Poll error:", error);
    set(ref(database, `typing/AI Friend`), false);
  }
}

async function getAIResponse(userMsg) {
  try {
    set(ref(database, `typing/AI Friend`), true);
    const prompt = `Act as a friendly chat companion in a group chat. Suggest ideas if applicable. Reply like a friend. Keep your response strictly under 30 words. Message: "${userMsg}"`;
    const response = await puter.ai.chat(prompt);
    
    let answerText = typeof response === 'string' ? response : (response?.message?.content || "...");
    if (Array.isArray(answerText)) answerText = answerText[0]?.text;

    const newMsgRef = push(messagesRef, {
      type: "text",
      text: answerText,
      sender: "AI Friend",
      admin: false,
      timestamp: Date.now()
    });
    set(ref(database, `typing/AI Friend`), false);

    // Delete AI's text message after 1 hour
    setTimeout(() => remove(ref(database, `messages/${newMsgRef.key}`)), 3600000);
  } catch (error) {
    console.error("Puter AI error:", error);
    set(ref(database, `typing/AI Friend`), false);
  }
}

sendBtn?.addEventListener("click", sendMessage);
input?.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

cancelReplyBtn?.addEventListener("click", () => {
  replyTarget = null;
  replyPreview.style.display = "none";
});

// ----------------- Markdown / Text Formatter -----------------
function formatMessageText(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // HTML Escaping
    .replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>') // Code blocks
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>") // Bold
    .replace(/_(.*?)_/g, "<em>$1</em>") // Italic
    .replace(/~(.*?)~/g, "<del>$1</del>") // Strikethrough
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="chat-link">$1</a>') // Link detection
    .replace(/@(\w+)/g, '<span class="tagged">@$1</span>'); // Mentions
}

// ----------------- Reactions UI -----------------
function updateReactionsUI(div, reactions, msgKey) {
  let displayDiv = div.querySelector(".reactions-display");
  if (!displayDiv) {
    displayDiv = document.createElement("div");
    displayDiv.className = "reactions-display";
    div.appendChild(displayDiv);
  }
  displayDiv.innerHTML = "";
  
  if (reactions) {
    for (const [emoji, users] of Object.entries(reactions)) {
      const userCount = Object.keys(users).length;
      if (userCount > 0) {
        const badge = document.createElement("span");
        badge.className = "reaction-badge";
        badge.textContent = `${emoji} ${userCount}`;
        badge.title = Object.keys(users).join(", ");
        badge.addEventListener("click", () => {
          const refPath = ref(database, `messages/${msgKey}/reactions/${emoji}/${username}`);
          if (users[username]) remove(refPath);
          else set(refPath, true);
        });
        displayDiv.appendChild(badge);
      }
    }
  }
}

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
    if (data.admin) nameSpan.classList.add("admin");

    // Apply Message Action Buttons (Copy, Read, Reply, Delete)
    const actionsSpan = document.createElement("span");
    actionsSpan.style.float = "right";

    if (data.type === "text" || data.type === "poll") {
      const copyBtn = document.createElement("span");
      copyBtn.textContent = "📋";
      copyBtn.className = "msg-action-btn";
      copyBtn.title = "Copy Message";
      copyBtn.addEventListener("click", () => navigator.clipboard.writeText(data.text || data.poll?.question));
      actionsSpan.appendChild(copyBtn);
    }

    if (data.type === "text") {
      const ttsBtn = document.createElement("span");
      ttsBtn.textContent = "🔊";
      ttsBtn.className = "msg-action-btn";
      ttsBtn.title = "Read Aloud";
      ttsBtn.addEventListener("click", async () => {
        try { 
          if (!puter.auth.isSignedIn()) {
            await puter.auth.signIn();
            if (puterAuthBtn) puterAuthBtn.textContent = "🧠✓";
          }
          const audio = await puter.ai.txt2speech(data.text); 
          audio.play(); 
        } catch(e) { alert("Auth required to read aloud."); }
      });
      actionsSpan.appendChild(ttsBtn);
    }

    const replyBtn = document.createElement("span");
    replyBtn.textContent = "↩️";
    replyBtn.className = "msg-action-btn";
    replyBtn.title = "Reply";
    replyBtn.addEventListener("click", () => {
      replyTarget = { sender: data.sender, text: data.text || `[${data.type}]` };
      replyPreviewText.textContent = `Replying to ${data.sender}: ${replyTarget.text}`;
      replyPreview.style.display = "flex";
      input.focus();
    });
    actionsSpan.appendChild(replyBtn);

    if (isAdmin || data.sender === username) {
      const deleteBtn = document.createElement("span");
      deleteBtn.textContent = "🗑️";
      deleteBtn.className = "msg-action-btn";
      deleteBtn.title = "Delete message";
      deleteBtn.addEventListener("click", () => { if (confirm("Delete this message?")) remove(ref(database, `messages/${key}`)); });
      actionsSpan.appendChild(deleteBtn);
    }

    nameSpan.appendChild(actionsSpan);
    div.appendChild(nameSpan);

    if (data.replyTo) {
      const quoteDiv = document.createElement("div");
      quoteDiv.className = "quoted-msg";
      quoteDiv.textContent = `${data.replyTo.sender}: ${data.replyTo.text}`;
      div.appendChild(quoteDiv);
    }

    if (data.type === "image") {
      const imgContainer = document.createElement("div");
      imgContainer.style.display = "flex";
      imgContainer.style.flexDirection = "column";
      imgContainer.style.alignItems = "flex-start";

      const img = document.createElement("img");
      img.src = data.src;
      img.className = "chat-img";
      img.onload = () => { chatBox.scrollTop = chatBox.scrollHeight; };
      imgContainer.appendChild(img);

      const downloadBtn = document.createElement("a");
      downloadBtn.href = data.src;
      downloadBtn.download = `ai_image_${Date.now()}.png`;
      downloadBtn.target = "_blank";
      downloadBtn.textContent = "⬇️ Download Image";
      downloadBtn.className = "download-btn";
      imgContainer.appendChild(downloadBtn);

      div.appendChild(imgContainer);
    } else if (data.type === "audio") {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = data.src;
      div.appendChild(audio);
    } else if (data.type === "poll" && data.poll) {
      const pollContainer = document.createElement("div");
      pollContainer.className = "poll-container";
      
      const qSpan = document.createElement("div");
      qSpan.className = "poll-question";
      qSpan.textContent = data.poll.question;
      pollContainer.appendChild(qSpan);

      data.poll.options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.className = "poll-option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          if (index === data.poll.answerIndex) btn.classList.add("correct");
          else btn.classList.add("wrong");
        });
        pollContainer.appendChild(btn);
      });
      
      div.appendChild(pollContainer);
    } else {
      const textSpan = document.createElement("span");
      textSpan.className = "text";
      textSpan.innerHTML = formatMessageText(data.text);
      div.appendChild(textSpan);
    }

    // Reaction Logic
    const reactBtn = document.createElement("button");
    reactBtn.className = "reaction-btn";
    reactBtn.innerHTML = "😀+";
    reactBtn.title = "Add Reaction";
    
    let pickerDiv = null;
    reactBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (pickerDiv) {
        pickerDiv.remove();
        pickerDiv = null;
        return;
      }
      pickerDiv = document.createElement("div");
      pickerDiv.className = "reaction-picker";
      const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
      emojis.forEach(em => {
        const span = document.createElement("span");
        span.textContent = em;
        span.addEventListener("click", (e) => {
          e.stopPropagation();
          set(ref(database, `messages/${key}/reactions/${em}/${username}`), true);
          pickerDiv.remove();
          pickerDiv = null;
        });
        pickerDiv.appendChild(span);
      });
      div.appendChild(pickerDiv);
    });

    document.addEventListener("click", () => {
      if (pickerDiv) {
        pickerDiv.remove();
        pickerDiv = null;
      }
    });

    div.appendChild(reactBtn);
    if (data.reactions) updateReactionsUI(div, data.reactions, key);

  }

  chatBox.appendChild(div);
  setTimeout(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 50);
});

// ----------------- Update Reactions on Change -----------------
onChildChanged(messagesRef, snapshot => {
  const data = snapshot.val();
  const key = snapshot.key;
  const div = document.getElementById(`msg-${key}`);
  if (div && data && data.type !== "system") {
    updateReactionsUI(div, data.reactions, key);
  }
});

// ----------------- Remove Deleted Messages from DOM -----------------
onChildRemoved(messagesRef, snapshot => {
  const key = snapshot.key;
  const div = document.getElementById(`msg-${key}`);
  if (div) {
    div.remove();
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

clearAIBtn?.addEventListener("click", async () => {
  if (confirm("Delete all AI messages?")) {
    const snapshot = await get(messagesRef);
    if (snapshot.exists()) {
      const msgs = snapshot.val();
      for (const [key, msgData] of Object.entries(msgs)) {
        if (msgData.sender === "AI Friend") {
          remove(ref(database, `messages/${key}`));
        }
      }
    }
  }
});

exportChatBtn?.addEventListener("click", async () => {
  const snapshot = await get(messagesRef);
  if (snapshot.exists()) {
    const msgs = snapshot.val();
    let exportText = "KK Chat Export\n\n";
    for (const [key, msgData] of Object.entries(msgs)) {
      const time = new Date(msgData.timestamp).toLocaleString();
      exportText += `[${time}] ${msgData.sender}: ${msgData.text || '[' + msgData.type + ']'}\n`;
    }
    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Chat_Export_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
});

closeAdminBtn?.addEventListener("click", () => {
  adminPanel.style.display = "none";
});

adminPanelBtn?.addEventListener("click", () => {
  adminPanel.style.display = "flex";
});