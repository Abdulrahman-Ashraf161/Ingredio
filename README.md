# Ingredio — The Intelligent Kitchen & Nutrition Management Ecosystem

**Ingredio** is a high-performance, Single-Page Application (SPA) designed to bridge the gap between household inventory management and personalized athletic nutrition. Built with a focus on sustainability and fitness, the platform empowers users to reduce food waste by tracking pantry stock while simultaneously optimizing their physical performance through precision macro-nutrient tracking. 

---

## 🚀 Core Features

### 1. Dynamic Digital Pantry (Real-Time CRUD)
* [cite_start]**Inventory Lifecycle**: Manage the full lifecycle of your ingredients with an intuitive interface[cite: 21, 31].
* [cite_start]**Zero-Waste Alerts**: Visual cues (Green to Red) notify users of items nearing their expiration dates to prevent food waste[cite: 16].
* [cite_start]**Instant Updates**: All Create, Read, Update, and Delete operations are performed via AJAX, ensuring the UI stays in sync without page reloads[cite: 17, 30].

### 2. AI-Driven Recipe Discovery
* [cite_start]**Intelligent Matching**: Leverages a third-party API to suggest recipes based specifically on what you already have in stock[cite: 35, 36].
* **Macro-Nutrient Breakdown**: Every recipe is accompanied by a detailed nutritional profile, including calories, protein, fats, and fiber, tailored for athletes and gym-goers.
* **Pantry Integration**: One-click functionality to check which ingredients you are missing for a specific recipe.

### 3. Visual Meal Logging & Analytics
* [cite_start]**Secure Media Uploads**: Users can document their culinary achievements by uploading meal photos directly to the server[cite: 55, 56].
* [cite_start]**Historical Tracking**: A persistent log of past meals helps users monitor their dietary habits over time[cite: 57].
* [cite_start]**Server-Side Validation**: High-level security checks ensure that only valid image formats and sizes are processed[cite: 58].

### 4. Custom Design System
* [cite_start]**Responsive Excellence**: A fully responsive layout optimized for mobile, tablet, and desktop viewports using modern CSS[cite: 19, 80].
* **Multi-Theme Support**: Users can toggle between several professional themes (Fresh, Dark, Gym, and Warm) to suit their environment and preference.

---

## 🛠 Technical Architecture

**Ingredio** is architected to follow the strict principles of **Separation of Concerns (SoC)** and **Clean Code**.

### The SPA Engine
[cite_start]The application operates within a single HTML shell (`index.php`)[cite: 4, 9, 61]. [cite_start]The navigation logic, handled by `script.js`, intercepts all user actions and updates the DOM dynamically using the Fetch API[cite: 17, 30].

### Backend Proxy Pattern
[cite_start]To ensure maximum security, all third-party API requests are proxied through the PHP backend (`API_Ops.php`)[cite: 46, 49, 61]. [cite_start]This prevents sensitive API keys from being exposed to the client-side JavaScript, a standard practice in professional web security[cite: 48, 85].

### File Structure
* [cite_start]**`index.php`**: The main application entry point and layout shell[cite: 61].
* [cite_start]**`DB_Ops.php`**: The centralized engine for all MySQL database interactions using PDO prepared statements[cite: 22, 61, 75].
* [cite_start]**`API_Ops.php / .js`**: The communication layer for the external nutrition and recipe API[cite: 46, 61].
* [cite_start]**`Upload.php`**: Dedicated handler for secure image processing and validation[cite: 61].
* [cite_start]**`style.css`**: A comprehensive stylesheet utilizing CSS variables for dynamic theming[cite: 80].

---

## 🛡 Security & Robustness

Security is integrated into every layer of the Ingredio platform:
* [cite_start]**SQL Injection Prevention**: Absolute reliance on Prepared Statements/PDO for all database queries; raw string concatenation is strictly forbidden[cite: 22, 23, 75].
* [cite_start]**XSS Protection**: All user-generated content and external data are sanitized using `htmlspecialchars()` before being rendered to the browser[cite: 68, 88].
* [cite_start]**Dual-Layer Validation**: Inputs are validated on the client side for immediate feedback and re-validated on the server side for absolute integrity[cite: 32, 33, 86].
* [cite_start]**Graceful Error Handling**: AJAX responses are checked for errors to ensure the user is presented with helpful messages rather than application crashes[cite: 47, 87].

---

## 📦 Installation & Deployment

1.  [cite_start]**Environment**: Deploy the project on a local stack (XAMPP, WAMP, or LAMP)[cite: 96].
2.  [cite_start]**Database**: Import the provided `ingredio.sql` file into your MySQL server[cite: 64, 94].
3.  **API Key**: Obtain a free API key from a supported provider (e.g., Spoonacular) and insert it into the `SPOONACULAR_API_KEY` constant in `API_Ops.php`.
4.  **Permissions**: Ensure the `uploads/` directory has write permissions for image storage.
5.  **Access**: Navigate to `http://localhost/ingredio/index.php` in your browser.

---

**Ingredio** — *The future of smart kitchens. Cook with intent. Eat with purpose.*
