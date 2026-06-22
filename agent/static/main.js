let selectedMessage = null;
let recognition = null;
let isRecording = false;
let interimTranscript = '';

function toggleVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('当前浏览器不支持语音输入');
        return;
    }

    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    interimTranscript = '';
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isRecording = true;
        document.getElementById('voiceBtn').classList.add('recording');
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                let text = event.results[i][0].transcript;
                if (!/[，,。！？!？.]/.test(text.slice(-1))) {
                    if (interimTranscript && !/[，,。！？!？.]/.test(interimTranscript.slice(-1))) {
                        interimTranscript += '，';
                    }
                }
                finalTranscript += text;
            }
        }
        if (finalTranscript) {
            interimTranscript += finalTranscript;
            document.getElementById('messageInput').value = interimTranscript;
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
    };

    recognition.onend = () => {
        stopRecording();
    };

    recognition.start();
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    isRecording = false;
    document.getElementById('voiceBtn').classList.remove('recording');
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    const chatArea = document.getElementById('chatArea');
    if (chatArea.querySelector('.empty-state')) {
        chatArea.innerHTML = '';
    }

    const userDiv = document.createElement('div');
    userDiv.className = 'message user';
    userDiv.innerHTML = `
        <div class="message-label">You</div>
        <div class="message-content">${escapeHtml(message)}</div>
    `;
    chatArea.appendChild(userDiv);

    const agentDiv = document.createElement('div');
    agentDiv.className = 'message agent';
    agentDiv.innerHTML = `
        <div class="message-label">Agent</div>
        <div class="message-content">思考中...</div>
    `;
    chatArea.appendChild(agentDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        if (data.error) {
            agentDiv.querySelector('.message-content').textContent = 'Error: ' + data.error;
            agentDiv.style.color = 'red';
        } else {
            const processText = renderProcessText(data.request_response_pairs);
            agentDiv.querySelector('.message-content').innerHTML = processText + '<div class="final-reply">' + escapeHtml(data.reply) + '</div>';
            agentDiv.onclick = () => selectMessage(agentDiv, data);
        }
    } catch (error) {
        agentDiv.querySelector('.message-content').textContent = 'Request failed: ' + error.message;
        agentDiv.style.color = 'red';
    }

    sendBtn.disabled = false;
}

function renderProcessText(request_response_pairs) {
    if (!request_response_pairs || request_response_pairs.length === 0) return '';

    let html = '<div class="process-steps">';
    request_response_pairs.forEach((pair, index) => {
        const hasToolCalls = pair.response.choices && pair.response.choices[0].message.tool_calls;
        html += `<div class="process-step"><span class="step-indicator">→</span> 发送请求到 LLM</div>`;

        if (hasToolCalls) {
            html += `<div class="process-step"><span class="step-indicator">←</span> LLM 返回，准备调用工具</div>`;
            if (pair.tool_executions && pair.tool_executions.length > 0) {
                pair.tool_executions.forEach(exec => {
                    const success = exec.result && exec.result.status === 'success';
                    const icon = success ? '✓' : '✗';
                    const status = success ? '成功' : '失败';
                    html += `<div class="process-step"><span class="step-indicator">${icon}</span> 调用 ${exec.function}... ${status}</div>`;
                });
            }
        } else {
            html += `<div class="process-step"><span class="step-indicator">←</span> LLM 返回最终回复</div>`;
        }
    });
    html += '</div>';
    return html;
}

function selectMessage(element, data) {
    if (selectedMessage) {
        selectedMessage.classList.remove('selected');
    }
    element.classList.add('selected');
    selectedMessage = element;

    const jsonArea = document.getElementById('jsonArea');
    let html = '<div class="steps-container">';

    if (data.request_response_pairs && data.request_response_pairs.length > 0) {
        data.request_response_pairs.forEach((pair, index) => {
            html += `<div class="json-section">`;
            html += `<div class="json-section-title">Request/Response Pair ${index + 1}</div>`;
            html += `<div class="json-section-title" style="font-size: 12px; color: #666;">Request:</div>`;
            html += `<div class="json-content"><pre>${escapeHtml(JSON.stringify(sanitizeLongStrings(pair.request), null, 2))}</pre></div>`;
            html += `<div class="json-section-title" style="font-size: 12px; color: #666;">Response:</div>`;
            html += `<div class="json-content"><pre>${escapeHtml(JSON.stringify(sanitizeLongStrings(pair.response), null, 2))}</pre></div>`;
            html += `</div>`;
        });
    } else {
        html += '<div class="empty-state">No request/response data available</div>';
    }
    html += '</div>';
    jsonArea.innerHTML = html;
}

function sanitizeLongStrings(obj, threshold = 500) {
    if (typeof obj === 'string') {
        if (obj.length > threshold) {
            return `[这是一段较长的内容（${obj.length}字符），完整内容请查看 files/ 目录]`;
        }
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(item => sanitizeLongStrings(item, threshold));
    } else if (obj !== null && typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
            result[key] = sanitizeLongStrings(obj[key], threshold);
        }
        return result;
    }
    return obj;
}

async function clearChat() {
    await fetch('/api/clear', { method: 'POST' });
    document.getElementById('chatArea').innerHTML = '<div class="empty-state">开始和 Agent 对话吧</div>';
    document.getElementById('jsonArea').innerHTML = '<div class="empty-state">点击 Agent 的回复查看 JSON 详情</div>';
    selectedMessage = null;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}