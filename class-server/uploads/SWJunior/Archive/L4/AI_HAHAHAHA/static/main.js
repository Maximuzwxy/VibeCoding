// ─── Elements ────────────────────────────────────────────
const messageInput = document.getElementById("messageInput");
const btnSend = document.getElementById("btnSend");
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
  menu.innerHTML = '<div class="context-item delete-item">Delete Chat</div>';
  menu.querySelector(".delete-item").addEventListener("click", () => {
    hideContextMenu();
    if (contextMenuConvId) {
      if (confirm("Delete this chat permanently?")) {
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
  const text = messageInput.value.trim();
  if (!text) return;

  // Show user message immediately
  const userDiv = document.createElement("div");
  userDiv.className = "message user-message";
  userDiv.textContent = text;
  messagesContainer.appendChild(userDiv);
  welcomeMessage.style.display = "none";

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
          imgEl.src = `/files/${img.filename}`;
          imgEl.alt = img.prompt || "Generated image";
          imgEl.loading = "lazy";
          imgEl.onerror = function() { this.style.display = "none"; };
          imgEl.addEventListener("click", () => window.open(`/files/${img.filename}`, "_blank"));
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
