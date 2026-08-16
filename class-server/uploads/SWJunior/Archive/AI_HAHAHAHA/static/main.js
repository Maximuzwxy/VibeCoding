// ─── Elements ────────────────────────────────────────────
const messageInput = document.getElementById("messageInput");
const btnSend = document.getElementById("btnSend");
const btnMic = document.getElementById("btnMic");
const messagesContainer = document.getElementById("messagesContainer");
const welcomeMessage = document.getElementById("welcomeMessage");
const detailContent = document.getElementById("detailContent");
const historyList = document.getElementById("historyList");
const btnNewChat = document.getElementById("btnNewChat");
const btnToggleSidebar = document.getElementById("btnToggleSidebar");
const sidebar = document.getElementById("sidebar");
const themeSelect = document.getElementById("themeSelect");

let allConversations = [];
let activeConversationId = null;
let currentSelectedConv = null;
let currentUtterance = null;
let pendingDocText = null;
let pendingDocName = null;

// ─── Helpers ─────────────────────────────────────────────

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function cleanReply(text) {
  // Strip markdown image syntax: ![alt](url)
  return text.replace(/!\[.*?\]\(.*?\)/g, "").trim();
}

// ─── Text-to-Speech ──────────────────────────────────────
function stripEmoji(text) {
  // Remove emojis and other non-speakable symbols
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}✨⭐🌟💫🎉🎊🎈🎁🎀🏆🥇🥈🥉👍👎👏🙌🤝💪🙏🤲👐🤞✌️🤟🤘👌👈👉👆👇☝️✋🤚🖐️🖖👋🤙💪🦵🦶👂👃🧠🦷🦴👀👁️👅👄💋🧡💛💚💙💜🤎🖤🤍💔❣️💕💞💓💗💖💘💝💟☮️✝️☪️🕉️☸️✡️🔯🕎☯️☦️🛐⛎♈♉♊♋♌♍♎♏♐♑♒♓🆔⚛️🉑☢️☣️📴📳🈶🈚🈸🈺🈷️✴️🆚💮🉐㊙️㊗️🈴🈵🈹🈲🅰️🅱️🆎🆑🅾️🆘❌⭕🛑⛔📛🚫💯💢♨️🚷🚯🚳🚱🔞📵🚭❗❕❓❔‼️⁉️🔅🔆〽️⚠️🚸🔱⚜️🔰♻️✅🈯💹❇️✳️❎🌐💠Ⓜ️🌀💤🏧🚾♿🅿️🈳🈂️🛂🛃🛄🛅🚹🚺🚼🚻🚮🎦📶🈁🔣ℹ️🔤🔡🔠🆖🆗🆙🆒🆕🆓0️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟🔢#️⃣️⬆️⬇️⬅️➡️↗️↖️↘️↙️↩️↪️⤴️⤵️🔄🔃🔙🔛🔝🔚🔜🆕🆓🆖🆗🆙🆒🎵🎶➕➖➗✖️💲💱™️©️®️〰️➰➿🔚🔙🔛🔝🔜☑️🔘🔴🟠🟡🟢🔵🟣⚫⚪🟤🔺🔻🔸🔹🔶🔷🔳🔲▪️▫️◾◽◼️◻️🟥🟧🟨🟩🟦🟪⬛⬜🟫]/gu, "");
}

function stripMarkdown(text) {
  // Remove markdown formatting that sounds bad in TTS
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")     // **bold** → bold
    .replace(/\*(.+?)\*/g, "$1")          // *italic* → italic
    .replace(/__(.+?)__/g, "$1")          // __underline__
    .replace(/`{1,3}[^`]*`{1,3}/g, "")   // `code` → removed
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")   // [link](url) → link
    .replace(/^#{1,6}\s+/gm, "")          // # headers
    .replace(/~~(.+?)~~/g, "$1")          // ~~strikethrough~~
    .replace(/>\s+/gm, "")                // > blockquote
    .replace(/[-*_]{3,}/g, "")            // horizontal rules
    .trim();
}

function getFemaleVoice() {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Light female voices — prioritize Samantha (Apple's best light female)
      const preferred = voices.filter(v => {
        const name = v.name.toLowerCase();
        return (name.includes("samantha") || name.includes("ava") ||
                name.includes("allison") || name.includes("fiona") ||
                name.includes("victoria") || name.includes("moira") ||
                name.includes("tessa") || name.includes("veena") ||
                name.includes("alice") || name.includes("amy"));
      });
      if (preferred.length > 0) {
        // Samantha is the most natural light female on Mac
        const p = preferred.find(v => v.name.toLowerCase().includes("samantha")) || preferred[0];
        resolve(p);
        return;
      }
      // Fallback: any female voice
      const female = voices.find(v => v.name.toLowerCase().includes("female") || 
                                       v.name.toLowerCase().includes("woman"));
      if (female) { resolve(female); return; }
      // Last resort: any English voice
      const english = voices.find(v => v.lang.startsWith("en"));
      resolve(english || voices[0]);
    } else {
      resolve(null);
    }
  });
}

function speakText(rawText, btnEl) {
  // Strip emojis and markdown formatting
  let text = stripEmoji(rawText);
  text = stripMarkdown(text);
  if (!text.trim()) return;

  // Stop any current speech
  speechSynthesis.cancel();
  
  // Remove speaking class from all buttons
  document.querySelectorAll(".btn-speak.speaking").forEach(b => b.classList.remove("speaking"));
  
  if (btnEl) btnEl.classList.add("speaking");

  // Break into sentences for varied intonation
  const sentences = text.match(/[^.!?]+[.!?]+[\])'"'""]*\s*/g) || [text];
  let currentIndex = 0;

  getFemaleVoice().then(voice => {
    const totalSentences = sentences.length;

    function speakNext() {
      if (currentIndex >= totalSentences) {
        if (btnEl) btnEl.classList.remove("speaking");
        currentUtterance = null;
        return;
      }

      const sentence = sentences[currentIndex].trim();
      if (!sentence) {
        currentIndex++;
        speakNext();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentence);
      if (voice) utterance.voice = voice;
      
      // Natural pace with subtle variation
      utterance.rate = 0.92 + (Math.random() * 0.04) - 0.02;
      
      // Natural volume variation — slightly louder on short/emphatic, softer on longer sentences
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount <= 3) {
        utterance.volume = 0.95 + Math.random() * 0.05; // Short = slightly louder
      } else {
        utterance.volume = 0.82 + Math.random() * 0.18; // Longer = more varied, some softer
      }
      
      // NATURAL pitch curve — drops and rises like real speech
      const trimmed = sentence.trim();
      
      // Start sentences higher, gradually lower in long paragraphs
      const positionFactor = 1.0 - (currentIndex / Math.max(totalSentences, 1)) * 0.25;
      
      // Random natural variation in a wider range
      const randomShift = (Math.random() * 0.25) - 0.10; // -0.10 to +0.15
      
      // Base natural female pitch (not forced high)
      const basePitch = 1.08 + positionFactor * 0.10;
      
      // Intonation: questions rise, periods drop slightly
      if (trimmed.endsWith("?")) {
        utterance.pitch = Math.min(basePitch + randomShift + 0.10, 2.0);  // Rise at end
      } else if (trimmed.endsWith(".")) {
        utterance.pitch = Math.max(basePitch + randomShift - 0.04, 0.5);  // Slight drop
      } else if (trimmed.endsWith("!") || trimmed.endsWith("...")) {
        utterance.pitch = Math.min(basePitch + randomShift + 0.08, 2.0);  // Emphasis
      } else {
        utterance.pitch = Math.max(0.5, Math.min(basePitch + randomShift, 2.0));
      }

      utterance.onend = () => {
        currentIndex++;
        speakNext();
      };

      utterance.onerror = () => {
        currentIndex++;
        speakNext();
      };

      currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    }

    speakNext();
  });
}

function stopSpeaking() {
  speechSynthesis.cancel();
  document.querySelectorAll(".btn-speak.speaking").forEach(b => b.classList.remove("speaking"));
  currentUtterance = null;
}

function addSpeakButton(container, text) {
  if (!text || !text.trim()) return;
  
  const btnRow = document.createElement("div");
  btnRow.className = "msg-btns";
  
  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "btn-copy";
  copyBtn.title = "Copy response";
  copyBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
  copyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.classList.add("copied");
      copyBtn.title = "Copied!";
      setTimeout(() => { copyBtn.classList.remove("copied"); copyBtn.title = "Copy response"; }, 2000);
    });
  });
  btnRow.appendChild(copyBtn);
  
  // Speak button
  const speakBtn = document.createElement("button");
  speakBtn.className = "btn-speak";
  speakBtn.title = "Listen";
  speakBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  `;
  speakBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentUtterance && speakBtn.classList.contains("speaking")) {
      stopSpeaking();
    } else {
      speakText(text, speakBtn);
    }
  });
  btnRow.appendChild(speakBtn);

  // Feedback button (thumbs up/down)
  const fbBtn = document.createElement("button");
  fbBtn.className = "btn-feedback";
  fbBtn.title = "Feedback";
  fbBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
    </svg>
  `;
  fbBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fbBtn.classList.toggle("feedback-like");
    if (fbBtn.classList.contains("feedback-like")) {
      fbBtn.title = "Liked!";
      fbBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path>
        </svg>
      `;
    } else {
      fbBtn.title = "Feedback";
      fbBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path>
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
      `;
    }
  });
  btnRow.appendChild(fbBtn);

  container.appendChild(btnRow);
}

// ─── Detail Panel ────────────────────────────────────────

function showDetail(requestJSON, responseJSON) {
  detailContent.innerHTML = `
    <div class="detail-section">
      <h3 class="detail-title">Request</h3>
      <pre>${escapeHTML(formatJSON(requestJSON))}</pre>
    </div>
    <div class="detail-section">
      <h3 class="detail-title">Response</h3>
      <pre>${escapeHTML(formatJSON(responseJSON))}</pre>
    </div>
  `;
}

// ─── Render Chat Area ────────────────────────────────────

function renderMessages(messages) {
  messagesContainer.innerHTML = "";
  if (messages.length === 0) {
    welcomeMessage.style.display = "flex";
  } else {
    welcomeMessage.style.display = "none";
  }

  messages.forEach((msg, i) => {
    // User bubble
    const userDiv = document.createElement("div");
    userDiv.className = "message user-message";
    userDiv.textContent = msg.user;
    messagesContainer.appendChild(userDiv);

    // Agent bubble
    const agentDiv = document.createElement("div");
    agentDiv.className = "message assistant-message message-selectable";
    agentDiv.dataset.index = i;

    // Steps
    if (msg.steps && msg.steps.length > 0) {
      const stepsDiv = document.createElement("div");
      stepsDiv.className = "message-steps";
      msg.steps.forEach(step => {
        const s = document.createElement("div");
        s.className = "step";
        s.textContent = step;
        stepsDiv.appendChild(s);
      });
      agentDiv.appendChild(stepsDiv);
    }

    // Reply text
    const textDiv = document.createElement("div");
    textDiv.className = "message-text";
    textDiv.textContent = msg.assistant;
    agentDiv.appendChild(textDiv);

    // Speak button
    addSpeakButton(agentDiv, msg.assistant);

    // Click handler for detail
    if (msg.requestJSON && msg.responseJSON) {
      agentDiv.addEventListener("click", () => {
        document.querySelectorAll(".message-selected").forEach(el => el.classList.remove("message-selected"));
        agentDiv.classList.add("message-selected");
        showDetail(msg.requestJSON, msg.responseJSON);
      });
    }

    messagesContainer.appendChild(agentDiv);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ─── Load Messages for Current Conversation ──────────────

async function loadConversationMessages() {
  try {
    const resp = await fetch("/api/history");
    const data = await resp.json();
    allConversations = data.conversations || [];
    activeConversationId = data.active;

    renderConversationList();

    const active = allConversations.find(c => c.id === activeConversationId);
    if (active && active.messages) {
      // Build display messages with steps
      const displayMessages = active.messages.map(msg => ({
        user: msg.user,
        assistant: msg.assistant,
        steps: ["→ Send request to LLM", "← LLM returns final reply"],
        requestJSON: { user: msg.user },
        responseJSON: { assistant: msg.assistant }
      }));
      renderMessages(displayMessages);
    } else {
      renderMessages([]);
    }
  } catch (e) {
    console.error("Failed to load conversations", e);
  }
}

// ─── Render Conversation List ────────────────────────────

function renderConversationList() {
  historyList.innerHTML = "";

  // Sort: most recently updated first
  const sorted = [...allConversations].sort((a, b) =>
    (b.updated || b.created).localeCompare(a.updated || a.created)
  );

  sorted.forEach(conv => {
    const div = document.createElement("div");
    div.className = "history-item";
    if (conv.id === activeConversationId) {
      div.classList.add("active");
    }
    div.innerHTML = `
      <span class="history-title">${escapeHTML(conv.title || "New Chat")}</span>
      <span class="history-date">${(conv.updated || conv.created || "").slice(0, 10)}</span>
    `;
    div.addEventListener("click", () => switchConversation(conv.id));
    div.addEventListener("contextmenu", (e) => showContextMenu(e, conv.id));
    historyList.appendChild(div);
  });

  // Also highlight newly selected
  const activeItem = historyList.querySelector(".history-item.active");
  if (activeItem) activeItem.scrollIntoView({ block: "nearest" });
}

// ─── Conversation Actions ────────────────────────────────

let contextMenuConvId = null;

function createContextMenu() {
  const menu = document.createElement("div");
  menu.id = "contextMenu";
  menu.className = "context-menu";
  menu.innerHTML = '<div class="context-item delete-item">Hide Chat</div>';
  menu.querySelector(".delete-item").addEventListener("click", () => {
    hideContextMenu();
    if (contextMenuConvId) {
      if (confirm("Hide this chat? It'll be removed from view but the AI remembers everything.")) {
        deleteConversation(contextMenuConvId);
      }
    }
  });
  document.body.appendChild(menu);
}

function showContextMenu(e, convId) {
  e.preventDefault();
  contextMenuConvId = convId;
  const menu = document.getElementById("contextMenu");
  menu.style.left = e.clientX + "px";
  menu.style.top = e.clientY + "px";
  menu.style.display = "block";
}

function hideContextMenu() {
  const menu = document.getElementById("contextMenu");
  if (menu) menu.style.display = "none";
}

async function deleteConversation(id) {
  try {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    loadConversationMessages();
  } catch (e) {
    console.error("Failed to delete conversation", e);
  }
}

async function newConversation() {
  try {
    const resp = await fetch("/api/conversations/new", { method: "POST" });
    const data = await resp.json();
    await loadConversationMessages();
  } catch (e) {
    console.error("Failed to create conversation", e);
  }
}

async function switchConversation(id) {
  try {
    await fetch("/api/conversations/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: id })
    });
    await loadConversationMessages();
  } catch (e) {
    console.error("Failed to switch conversation", e);
  }
}

// ─── Send Message ────────────────────────────────────────

async function sendMessage() {
  let text = messageInput.value.trim();
  if (!text) return;

  // Prepend uploaded document text if exists
  if (pendingDocText) {
    text = pendingDocText + "\n\n" + text;
  }

  // Show user message immediately
  const userDiv = document.createElement("div");
  userDiv.className = "message user-message";
  userDiv.textContent = pendingDocName ? `[${pendingDocName}] ${messageInput.value.trim()}` : text;
  messagesContainer.appendChild(userDiv);
  welcomeMessage.style.display = "none";
  pendingDocText = null;
  pendingDocName = null;
  messageInput.placeholder = "Type a message...";

  // Show loading
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "message assistant-message";
  loadingDiv.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  messageInput.value = "";
  btnSend.disabled = true;

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await resp.json();

    // Remove loading
    loadingDiv.remove();

    if (data.error) {
      const errDiv = document.createElement("div");
      errDiv.className = "message assistant-message error";
      errDiv.textContent = "Error: " + data.error;
      messagesContainer.appendChild(errDiv);
    } else {
      // Build agent bubble with steps
      const agentDiv = document.createElement("div");
      agentDiv.className = "message assistant-message message-selectable";

      const pairs = data.request_response_pairs || [];
      const stepsDiv = document.createElement("div");
      stepsDiv.className = "message-steps";

      pairs.forEach((pair, idx) => {
        if (pair.response.content !== null && idx === pairs.length - 1 && pair.tool_executions.length === 0) {
          // Simple no-tool path: merged into one
          stepsDiv.insertAdjacentHTML("beforeend",
            '<div class="step">→ Send request to LLM</div>' +
            '<div class="step">← LLM returns final reply</div>'
          );
        } else {
          if (idx === 0 || pair.response.content === null) {
            stepsDiv.insertAdjacentHTML("beforeend",
              '<div class="step">→ Send request to LLM</div>'
            );
          }
          if (pair.tool_executions.length > 0) {
            pair.tool_executions.forEach(tool => {
              const icon = tool.success ? "✓" : "✗";
              const cls = tool.success ? "step-tool" : "step-tool tool-fail";
              stepsDiv.insertAdjacentHTML("beforeend",
                `<div class="step ${cls}">${icon} Called ${tool.name}... ${tool.success ? "success" : "failed"}</div>`
              );
            });
            stepsDiv.insertAdjacentHTML("beforeend",
              `<div class="step">→ Send request to LLM (round ${idx + 2})</div>`
            );
          }
          if (pair.response.content !== null) {
            stepsDiv.insertAdjacentHTML("beforeend",
              '<div class="step">← LLM returns final reply</div>'
            );
          }
        }
      });

      agentDiv.appendChild(stepsDiv);

      // Show generated images first (before text)
      if (data.generated_images && data.generated_images.length > 0) {
        const imgContainer = document.createElement("div");
        imgContainer.className = "generated-images";
        data.generated_images.forEach(img => {
          const wrapper = document.createElement("div");
          wrapper.className = "generated-img-wrapper";
          const imgEl = document.createElement("img");
          // Use data_url if available (most reliable), fall back to /files/
          imgEl.src = img.data_url || `/files/${img.filename}`;
          imgEl.alt = img.prompt || "Generated image";
          imgEl.style.maxWidth = "380px";
          imgEl.style.height = "auto";
          imgEl.style.display = "block";
          imgEl.onerror = function() { 
            this.style.display = "none"; 
            const errMsg = document.createElement("div");
            errMsg.className = "generated-img-error";
            errMsg.textContent = "(Image failed to load - try again)";
            errMsg.style.color = "#ff6666";
            errMsg.style.padding = "8px";
            this.parentNode.appendChild(errMsg);
          };
          imgEl.addEventListener("click", () => {
            const url = img.data_url || `/files/${img.filename}`;
            window.open(url, "_blank");
          });
          wrapper.appendChild(imgEl);
          const caption = document.createElement("div");
          caption.className = "generated-img-caption";
          caption.textContent = img.prompt ? img.prompt.substring(0, 80) : "";
          wrapper.appendChild(caption);
          imgContainer.appendChild(wrapper);
        });
        agentDiv.appendChild(imgContainer);
      }

      const textDiv = document.createElement("div");
      textDiv.className = "message-text";
      textDiv.textContent = cleanReply(data.reply);
      agentDiv.appendChild(textDiv);

      // Speak button
      addSpeakButton(agentDiv, cleanReply(data.reply));

      // Click for detail
      const lastPair = pairs[pairs.length - 1];
      if (lastPair) {
        agentDiv.addEventListener("click", () => {
          document.querySelectorAll(".message-selected").forEach(el => el.classList.remove("message-selected"));
          agentDiv.classList.add("message-selected");
          showDetail(lastPair.request, lastPair.response);
        });
      }

      messagesContainer.appendChild(agentDiv);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (e) {
    loadingDiv.remove();
    const errDiv = document.createElement("div");
    errDiv.className = "message assistant-message error";
    errDiv.textContent = "Error: " + e.message;
    messagesContainer.appendChild(errDiv);
  }

  btnSend.disabled = false;
  messageInput.focus();

  // Refresh sidebar
  loadConversationMessages();
}

// ─── Init ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("pi-theme") || "default";
  document.documentElement.setAttribute("data-theme", saved);
  themeSelect.value = saved;
  createContextMenu();
  initSpeechRecognition();
  // Preload speech synthesis voices
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  loadConversationMessages();
  messageInput.focus();
  // Hide context menu when clicking elsewhere
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#contextMenu")) hideContextMenu();
  });
});

// ─── Event Listeners ────────────────────────────────────
btnSend.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
btnNewChat.addEventListener("click", newConversation);
btnToggleSidebar.addEventListener("click", () => sidebar.classList.toggle("open"));
themeSelect.addEventListener("change", () => {
  const val = themeSelect.value;
  document.documentElement.setAttribute("data-theme", val);
  localStorage.setItem("pi-theme", val);
});

// ─── Voice Input (Speech-to-Text) ─────────────────────
let recognition = null;
let isRecording = false;

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btnMic.style.display = "none";
    console.log("Speech recognition not supported in this browser");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;  // Single utterance — more reliable
  recognition.interimResults = true;
  recognition.lang = navigator.language || "en-US";  // Auto-detect browser language

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    messageInput.value = transcript.trim();
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + "px";
    messageInput.placeholder = "Type a message...";
  };

  recognition.onaudiostart = () => {
    console.log("Speech: audio started");
  };

  recognition.onsoundstart = () => {
    console.log("Speech: sound detected");
    messageInput.value = "";
    messageInput.placeholder = "Hearing you...";
  };

  recognition.onspeechend = () => {
    console.log("Speech: ended");
    messageInput.placeholder = "Processing...";
  };

  recognition.onerror = (event) => {
    console.error("Speech error:", event.error, event.message);
    stopRecordingUI();
    if (event.error === "not-allowed") {
      alert("Microphone access denied.");
    } else if (event.error === "no-speech") {
      messageInput.placeholder = "No speech detected — try again";
    } else if (event.error === "network") {
      alert("Speech recognition needs internet. Check your connection.");
    } else {
      alert("Speech error: " + event.error);
    }
  };

  recognition.onend = () => {
    console.log("Speech: recognition ended, isRecording=" + isRecording);
    if (isRecording) {
      // If we have text and it's non-continuous mode, auto-send
      stopRecordingUI();
      if (messageInput.value.trim()) {
        setTimeout(() => sendMessage(), 200);
      }
    }
  };

  console.log("Speech recognition initialized");
}

function startRecording() {
  if (!recognition) return;
  isRecording = true;
  btnMic.classList.add("recording");
  messageInput.placeholder = "Listening...";
  messageInput.value = "";
  try {
    recognition.start();
    console.log("Speech: recognition started");
  } catch(e) {
    console.error("Speech: start failed", e);
    stopRecordingUI();
  }
}

function stopRecordingUI() {
  isRecording = false;
  btnMic.classList.remove("recording");
  messageInput.placeholder = "Type a message...";
  try {
    recognition.stop();
  } catch(e) {}
}

btnMic.addEventListener("click", () => {
  if (isRecording) {
    stopRecordingUI();
    if (messageInput.value.trim()) {
      sendMessage();
    }
  } else {
    startRecording();
  }
});

// ─── File Upload ─────────────────────────────────────────
const fileUpload = document.getElementById("fileUpload");
const btnUpload = document.getElementById("btnUpload");

btnUpload.addEventListener("click", () => {
  fileUpload.click();
});

fileUpload.addEventListener("change", async () => {
  const file = fileUpload.files[0];
  if (!file) return;
  
  btnUpload.classList.add("uploading");
  
  const formData = new FormData();
  formData.append("file", file);
  
  try {
    const res = await fetch("/upload-word", { method: "POST", body: formData });
    const data = await res.json();
    
    if (data.error) {
      addSystemMessage(`Upload failed: ${data.error}`);
    } else {
      // Store doc text, show reference in input
      pendingDocText = `[File: ${data.filename}]\n${data.text}`;
      pendingDocName = data.filename;
      messageInput.value = '';
      messageInput.placeholder = `File loaded: ${data.filename} — type your question & send`;
      messageInput.focus();
      btnSend.disabled = false;
    }
  } catch (err) {
    addSystemMessage(`Upload error: ${err.message}`);
  }
  
  btnUpload.classList.remove("uploading");
  fileUpload.value = "";
});
