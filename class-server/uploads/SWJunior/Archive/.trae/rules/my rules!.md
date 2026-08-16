Rule: Project File Structure

All projects must follow these file organization conventions:

Frontend-only projects (no backend):
- Split into three files: index.html (structure), style.css (styling), script.js (logic).
- Inline <style> and <script> tags are not allowed. The original unsplit file must be preserved.
- index.html links to external CSS via <link rel="stylesheet" href="style.css"> and external JS via <script src="script.js"></script>.

Flask projects (frontend + backend):
- Frontend: /static/ for CSS and JS files, /templates/ for HTML files.
- Backend: app.py in the project root as the single entry point. Run with python app.py. Always bind to host='0.0.0.0' so the server is accessible from other devices on the same WiFi (e.g., http://192.168.x.x:5000).
- Database: .json files in the project root. Backend reads/writes them — frontend never touches them directly.
- HTML pages are served via render_template(), not opened directly in the browser.
- Frontend communicates with backend using fetch() calls. API routes return JSON via jsonify(), never HTML.
- Each API route handles one operation (GET=read, POST=create, PUT=update, DELETE=delete).