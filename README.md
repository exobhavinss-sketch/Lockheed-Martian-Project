# Lockheed Martin Aircraft Educational Website

## Description

A student Full Stack Development project demonstrating HTML5, CSS3, JavaScript, Supabase authentication, PostgreSQL database integration, Row Level Security (RLS), dynamic aircraft catalog, search, category filtering, user favorites, and user profile management.

> **Educational Disclaimer:**
> This project is created for educational purposes only and is not affiliated with, sponsored by, or officially connected to Lockheed Martin.

## Technologies Used

- **HTML5:** Semantic document structure, accessible form controls, and clean layout hierarchy.
- **CSS3:** Modern aerospace-inspired dark theme, custom responsive layouts, and cross-device grid/flex styling.
- **JavaScript (ES6+):** Client-side DOM manipulation, real-time search & filtering, form validation, and asynchronous API calls.
- **Supabase & PostgreSQL:** Cloud relational database, user authentication (Auth), and Row Level Security (RLS).
- **Git & GitHub:** Version control, deployment automation, and repository management.

## Key Features

- **Responsive Multi-Page Design:** Desktop, tablet, and mobile (tested at 375px & 360px viewport widths without horizontal scrolling).
- **Aircraft Collection:** Real-world aerospace platforms dynamically loaded from Supabase PostgreSQL.
- **Search & Filtering:** Real-time client-side name search, category dropdown filtering, result count indicator, and no-results fallback.
- **Aircraft Details Viewer:** Dedicated specifications page with platform details, dimensions, mission roles, and status classifications (including explicit labeling for the fictional SR-71 Darkstar concept).
- **Supabase Authentication:** Secure user sign-up with input validation, sign-in, session persistence, and instant sign-out.
- **Protected Member Dashboard:** Session-guarded area displaying user account information and saved favorites.
- **User Profile Management:** Read-only profile overview with inline editable form to update Full Name, Username, and Aircraft Interest. Email remains strictly read-only.
- **Favorites System:** Authenticated users can add or remove aircraft platforms from cards or details pages, view saved favorites in the dashboard, and remove them dynamically.
- **Row Level Security (RLS):** Database policies restricting access so users can only view, insert, and update their own records.

## Database Architecture

The project integrates three Supabase PostgreSQL tables:

1. **`public.profiles`**
   - Stores user metadata linked 1-to-1 with Supabase Auth (`auth.users.id`).
   - Fields: `id (UUID PRIMARY KEY)`, `full_name (TEXT)`, `username (TEXT)`, `email (TEXT)`, `aircraft_interest (TEXT)`, `created_at (TIMESTAMPTZ)`.
   - Security: RLS enabled. Policies ensure authenticated users can only SELECT, INSERT, and UPDATE their own profile (`auth.uid() = id`).
   - SQL definition: `database/profiles.sql` & `database/profile-update.sql`.

2. **`public.aircraft`**
   - Catalog of aerospace platforms.
   - Fields: `id (UUID PRIMARY KEY)`, `name (TEXT UNIQUE)`, `category (TEXT)`, `description (TEXT)`, `image (TEXT)`, `status (TEXT)`, `is_fictional (BOOLEAN)`, `created_at (TIMESTAMPTZ)`.
   - Security: RLS enabled with public SELECT access (`anon`, `authenticated`). Public write access is strictly blocked.
   - SQL definition: `database/aircraft.sql`.

3. **`public.favorites`**
   - User aircraft favorites relationship table.
   - Fields: `id (UUID PRIMARY KEY)`, `user_id (UUID REFERENCES auth.users(id) ON DELETE CASCADE)`, `aircraft_id (UUID REFERENCES public.aircraft(id) ON DELETE CASCADE)`, `created_at (TIMESTAMPTZ)`.
   - Constraint: `UNIQUE (user_id, aircraft_id)` prevents duplicate favorites.
   - Security: RLS enabled. Policies allow authenticated users to SELECT, INSERT, and DELETE only their own favorites (`auth.uid() = user_id`).
   - SQL definition: `database/favorites.sql`.

## Security Architecture

- **Browser-Safe Credentials:** The frontend client utilizes only the public Supabase URL and anonymous publishable API key (`SUPABASE_PUBLISHABLE_KEY`).
- **No Secret Key Exposure:** No `service_role` keys or database passwords exist in frontend scripts.
- **Strict Row Level Security:** Enforced at the PostgreSQL database level. A user cannot view, modify, or delete another user's profile or favorites.
- **Authentication Guard:** Unauthenticated access to `dashboard.html` automatically redirects to `signin.html`.

## User Profile Management

Authenticated users can manage their personal profiles from `dashboard.html`:
- **View Profile:** Inspect account details including email address, full name, username, aircraft interest, and join date in a clean read-only display.
- **Edit Profile:** Click "Edit Profile" to enter an inline form to update Full Name, Username, and Aircraft Interest.
- **Email Protection:** The account email address remains read-only to safeguard account credentials.
- **Cancel Without Changes:** Exit edit mode anytime using "Cancel" to restore saved values without contacting Supabase.
- **Instant Synchronization:** Updates are validated client-side, sent to Supabase with RLS verification, and reflected in the UI immediately.

## Project Structure

```text
Lockheed Martin Project/
│
├── index.html              # Main landing / home page
├── aircraft.html           # Aircraft collection with search & filter
├── aircraft-details.html   # Detailed specifications viewer
├── about.html              # Project background & educational purpose
├── contact.html            # Contact inquiry form
├── signup.html             # User registration page
├── signin.html             # User login page
├── dashboard.html          # Protected user member area & profile editor
│
├── css/
│   └── style.css           # Vanilla CSS stylesheet for all pages
│
├── js/
│   ├── script.js           # Client-side scripts, DOM handlers, search, & auth
│   └── supabase.js         # Supabase client initialization
│
├── images/                 # Aircraft photographs, illustrations, and SVG assets
│
├── database/
│   ├── aircraft.sql        # Supabase PostgreSQL aircraft catalog schema & seed
│   ├── profiles.sql        # Supabase PostgreSQL profiles schema & RLS policies
│   ├── favorites.sql       # Supabase PostgreSQL favorites schema & RLS policies
│   └── profile-update.sql  # Supabase PostgreSQL profile update policy & verification queries
│
├── .gitignore              # Git ignore rules for clean repository management
└── README.md               # Project documentation
```

## Running Locally

This project is a static website and does not require Node.js or any build step.

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

## Deployment Readiness

The website is fully prepared for static hosting:

- **GitHub Pages:** Compatible with deployment directly from the `main` branch root folder.
- **Vercel:** Ready for static import with framework preset "Other" (no build command needed).
- **Netlify:** Ready for instant static drag-and-drop or repository connection with publish directory `./`.
- All CSS, JavaScript, image, and page links use clean relative paths.
