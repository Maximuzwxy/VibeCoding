// Excerpts from "The Little Prince"
const excerpts = [
    "All grown-ups were once children... but only few of them remember it.",
    "It is only with the heart that one can see rightly; what is essential is invisible to the eye.",
    "The most beautiful things in the world cannot be seen or touched, they are felt with the heart.",
    "You become responsible, forever, for what you have tamed.",
    "Grown-ups never understand anything by themselves, and it is tiresome for children to be always and forever explaining things to them.",
    "What makes the desert beautiful is that somewhere it hides a well.",
    "It is the time you have wasted for your rose that makes your rose so important.",
    "One sees clearly only with the heart. Anything essential is invisible to the eyes.",
    "The stars are beautiful because of a flower that cannot be seen.",
    "You're beautiful, but you're empty... One could not die for you."
];

// Color palettes
const textColors = [
    '#000000', '#2E294E', '#1B998B', '#D90368', 
    '#FF9A00', '#005F73', '#9B2226', '#AE2012',
    '#003049', '#6A040F'
];

const bgColors = [
    '#FFFFFF', '#FDF0D5', '#FFEEAD', '#C1FBA4', 
    '#A0E7E5', '#BDE0FE', '#FFCAD4', '#E2E2B6',
    '#FFE0B5', '#D8F3DC'
];

// Create paragraph elements
const contentDiv = document.getElementById('content');
const paragraphs = [];

excerpts.forEach((excerpt, index) => {
    const p = document.createElement('p');
    p.className = 'paragraph';
    p.textContent = excerpt;
    p.dataset.index = index;
    contentDiv.appendChild(p);
    paragraphs.push(p);
});

// Function to get a random color from an array
function getRandomColor(colorArray) {
    return colorArray[Math.floor(Math.random() * colorArray.length)];
}

// Function to ensure text is readable against background
function getContrastingTextColor(bgColor) {
    // If background is light, use dark text; if dark, use light text
    // Simple luminance calculation
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
}

// Change text colors
document.getElementById('textColorBtn').addEventListener('click', () => {
    paragraphs.forEach(paragraph => {
        let newTextColor;
        let currentBg = paragraph.style.backgroundColor || '#FFFFFF';
        
        // Remove rgb() formatting if present
        if (currentBg.startsWith('rgb')) {
            // Convert RGB to hex for comparison
            const match = currentBg.match(/\d+/g);
            if (match) {
                const r = parseInt(match[0]).toString(16).padStart(2, '0');
                const g = parseInt(match[1]).toString(16).padStart(2, '0');
                const b = parseInt(match[2]).toString(16).padStart(2, '0');
                currentBg = `#${r}${g}${b}`;
            } else {
                currentBg = '#FFFFFF';
            }
        }
        
        // Ensure text color is different from background
        do {
            newTextColor = getRandomColor(textColors);
        } while (newTextColor.toLowerCase() === currentBg.toLowerCase());
        
        paragraph.style.color = newTextColor;
    });
});

// Change background colors
document.getElementById('bgColorBtn').addEventListener('click', () => {
    paragraphs.forEach(paragraph => {
        let newBgColor;
        let currentText = paragraph.style.color || '#000000';
        
        // Ensure background color is different from text color
        do {
            newBgColor = getRandomColor(bgColors);
        } while (newBgColor.toLowerCase() === currentText.toLowerCase());
        
        paragraph.style.backgroundColor = newBgColor;
        
        // Adjust text color if needed for readability
        const contrastingColor = getContrastingTextColor(newBgColor);
        if (Math.abs(parseInt(currentText.replace('#', ''), 16) - parseInt(contrastingColor.replace('#', ''), 16)) < 1000000) {
            // Only change if current text color isn't already contrasting enough
            paragraph.style.color = contrastingColor;
        }
    });
});

// Initialize with some colors
document.getElementById('textColorBtn').click();
document.getElementById('bgColorBtn').click();
