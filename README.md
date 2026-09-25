# Lockheed Martin Aircraft Educational Website

## About

A student educational website created as a Full Stack Development project to explore aircraft information and practice HTML, CSS, JavaScript, and Supabase Authentication.

> **Disclaimer:** This is an independent educational/student project and is not affiliated with, sponsored by, or endorsed by Lockheed Martin.

## Technologies

- HTML5 (Semantic Structure)
- CSS3 (Responsive Design & Styling)
- JavaScript (Vanilla ES6+ DOM & Event Handling)
- Supabase Authentication (User Registration, Login, Session Management)

## Features

- Home page with featured aircraft and educational overview
- Aircraft collection with detailed cards and specifications
- Aircraft categories (Fighters, Transports, Reconnaissance, Helicopters, Special Mission)
- Interactive aircraft details viewer
- About page detailing project objectives and learning outcomes
- Contact page with accessible form validation
- User registration (Email, Password, Username, Aircraft Interest)
- User sign in with error handling (invalid credentials, email confirmation prompt)
- Real client-side Supabase authentication
- Protected member dashboard with user account information
- Secure sign out functionality

## Project Structure

```text
Lockheed-Martin-Project/
│
├── index.html              # Main landing / home page
├── aircraft.html           # Aircraft collection overview
├── aircraft-details.html   # Dynamic aircraft details viewer
├── about.html              # Project background & educational purpose
├── contact.html            # Contact inquiry form
├── signup.html             # User registration page
├── signin.html             # User login page
├── dashboard.html          # Protected user member area
│
├── css/
│   └── style.css           # Semantic stylesheet for all pages
│
├── js/
│   ├── script.js           # Main client-side scripts, DOM handlers & auth logic
│   └── supabase.js         # Browser Supabase client initialization
│
├── images/                 # Aircraft photographs, illustrations, and SVG badges
│
├── database/
│   ├── aircraft.sql        # Supabase PostgreSQL aircraft catalog schema, RLS & seed data
│   └── profiles.sql        # Supabase PostgreSQL profiles schema & RLS policies
│
├── .gitignore              # Git ignore rules for clean repository management
└── README.md               # Project documentation
```

## Running Locally

This project is a static website and does not require any backend build tools or Node.js runtime.

1. **Option 1: VS Code Live Server (Recommended)**
   - Open this folder in **Visual Studio Code**.
   - Install the **Live Server** extension (by Ritwick Dey).
   - Right-click `index.html` and select **"Open with Live Server"**.
   - Your browser will open the site at `http://127.0.0.1:5500/index.html`.

2. **Option 2: Python Simple HTTP Server**
   - Open your terminal in the project directory.
   - Run:
     ```bash
     python -m http.server 8000
     ```
   - Navigate to `http://localhost:8000` in your web browser.

3. **Option 3: Direct Browser Preview**
   - Double-click `index.html` to open it directly in any modern browser.
   - *Note:* Using a local web server (Option 1 or 2) is recommended so browser security policies allow smooth CDN script execution and session storage.

## Deployment

The website can be deployed as a static website to any static hosting platform:

### 1. GitHub Pages
1. Push this repository to GitHub.
2. In your GitHub repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the `main` (or `master`) branch with the root `/` folder and click **Save**.
5. Your site will be published at your GitHub Pages URL.

### 2. Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Set the framework preset to **Other** (Plain HTML/CSS/JS).
3. Leave the build command and output directory empty.
4. Click **Deploy**. Vercel will automatically serve the static website.

### 3. Netlify
1. Log in to [Netlify](https://netlify.com) and click **"Add new site"** > **"Import an existing project"**.
2. Connect your GitHub repository.
3. Leave the **Build command** empty and set the **Publish directory** to root (`.` or `/`).
4. Click **Deploy site**.
