var promptInput = document.getElementById('promptInput');
var generateBtn = document.getElementById('generateBtn');
var loading = document.getElementById('loading');
var result = document.getElementById('result');
var resultImage = document.getElementById('resultImage');
var errorDiv = document.getElementById('error');
var downloadBtn = document.getElementById('downloadBtn');
var historyGrid = document.getElementById('historyGrid');

var history = [];

// Load history from localStorage
function loadHistory() {
    try {
        var saved = localStorage.getItem('gen_image_history');
        if (saved) {
            history = JSON.parse(saved);
            renderHistory();
        }
    } catch (e) {}
}

function saveHistory() {
    try {
        localStorage.setItem('gen_image_history', JSON.stringify(history));
    } catch (e) {}
}

function renderHistory() {
    historyGrid.innerHTML = '';
    for (var i = 0; i < history.length; i++) {
        var item = history[i];
        var div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = (function(url, prompt) {
            return function() {
                showResult(url);
            };
        })(item.url, item.prompt);
        div.innerHTML = '<img src="' + item.url + '" alt=""><div class="overlay">' + escapeHtml(item.prompt) + '</div>';
        historyGrid.appendChild(div);
    }
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getSize() {
    var radios = document.getElementsByName('size');
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) return radios[i].value;
    }
    return 'square';
}

function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
    result.classList.add('hidden');
}

function showResult(url) {
    resultImage.src = url;
    result.classList.remove('hidden');
    errorDiv.classList.add('hidden');
}

function generate() {
    var prompt = promptInput.value.trim();
    if (!prompt) {
        showError('Please enter a prompt first.');
        return;
    }

    var size = getSize();
    var width, height;
    if (size === 'landscape') {
        width = 1024; height = 576;
    } else if (size === 'portrait') {
        width = 576; height = 1024;
    } else {
        width = 768; height = 768;
    }

    var url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) +
              '?width=' + width + '&height=' + height + '&nologo=true&seed=' + Math.floor(Math.random() * 100000);

    // Show loading
    loading.classList.remove('hidden');
    result.classList.add('hidden');
    errorDiv.classList.add('hidden');

    var img = new Image();
    img.onload = function() {
        loading.classList.add('hidden');
        showResult(url);
        // Add to history
        history.unshift({ url: url, prompt: prompt });
        if (history.length > 20) history.pop();
        saveHistory();
        renderHistory();
        promptInput.value = '';
    };
    img.onerror = function() {
        loading.classList.add('hidden');
        showError('Failed to generate image. Please try again.');
    };
    img.src = url;
}

function download() {
    var a = document.createElement('a');
    a.href = resultImage.src;
    a.download = 'generated_' + Date.now() + '.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

generateBtn.addEventListener('click', generate);
promptInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') generate();
});
downloadBtn.addEventListener('click', download);

loadHistory();
