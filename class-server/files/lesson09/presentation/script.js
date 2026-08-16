(function () {
  var slides = document.querySelectorAll('.slide');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var progressFill = document.getElementById('progressFill');
  var pageIndicator = document.getElementById('pageIndicator');
  var current = 0;
  var total = slides.length;

  function showSlide(index) {
    slides[current].classList.remove('active');
    current = index;
    slides[current].classList.add('active');
    updateUI();
  }

  function next() {
    if (current < total - 1) showSlide(current + 1);
  }

  function prev() {
    if (current > 0) showSlide(current - 1);
  }

  function updateUI() {
    var pct = ((current + 1) / total) * 100;
    progressFill.style.width = pct + '%';
    pageIndicator.textContent = (current + 1) + ' / ' + total;
  }

  // Button clicks
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      prev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      showSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      showSlide(total - 1);
    }
  });

  // Touch swipe
  var touchStartX = 0;
  var touchStartY = 0;

  document.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });

  document.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
  });

  // Mouse click on left/right half
  document.addEventListener('click', function (e) {
    if (e.target.closest('.nav-btn')) return;
    if (e.clientX < window.innerWidth / 3) prev();
    else if (e.clientX > window.innerWidth * 2 / 3) next();
  });

  // Initialize
  updateUI();
})();
