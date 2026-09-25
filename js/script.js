/* ==========================================================================
   Lockheed Martin Aircraft - Educational Project JavaScript
   Subject: Full Stack Development - 1 (Semester 3)
   Concepts: DOM Manipulation, Form Validation, Supabase Auth & PostgreSQL Profiles
   ========================================================================== */

// Wait for the full DOM tree to load before executing JavaScript
document.addEventListener("DOMContentLoaded", function () {

    // ======================================================================
    // 1. Home Page Simple Interaction (index.html)
    // ======================================================================
    const exploreNoticeBtn = document.getElementById("exploreNoticeBtn");
    const homeNotice = document.getElementById("homeNotice");

    if (exploreNoticeBtn && homeNotice) {
        exploreNoticeBtn.addEventListener("click", function () {
            homeNotice.textContent = "Explore our collection of aircraft.";
        });
    }

    // ======================================================================
    // 2. Sign Up Form with Real Supabase Authentication (signup.html)
    // ======================================================================
    const signupForm = document.getElementById("signupForm");
    const signupMessage = document.getElementById("signupMessage");

    if (signupForm && signupMessage) {
        // STEP 13: Redirect already-authenticated users to dashboard
        checkAuthRedirect();

        signupForm.addEventListener("submit", async function (event) {
            // Prevent default HTML form submission
            event.preventDefault();

            // Retrieve form values
            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const aircraftInterest = document.getElementById("aircraftInterest").value;
            const terms = document.getElementById("terms").checked;

            // Reset previous status messages
            signupMessage.textContent = "";
            signupMessage.className = "";

            // STEP 4: Client-side Validation Checks
            // 1. Full Name is not empty
            if (fullName === "") {
                signupMessage.textContent = "Please enter your full name.";
                signupMessage.className = "error-message";
                return;
            }

            // 2. Email is not empty
            if (email === "") {
                signupMessage.textContent = "Please enter your email address.";
                signupMessage.className = "error-message";
                return;
            }

            // 3. Email has a reasonable email format
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                signupMessage.textContent = "Please enter a valid email address.";
                signupMessage.className = "error-message";
                return;
            }

            // 4. Username is not empty
            if (username === "") {
                signupMessage.textContent = "Please choose a username.";
                signupMessage.className = "error-message";
                return;
            }

            // 5. Password is not empty
            if (password === "") {
                signupMessage.textContent = "Please enter a password.";
                signupMessage.className = "error-message";
                return;
            }

            // 6. Password meets a reasonable minimum length
            if (password.length < 6) {
                signupMessage.textContent = "Password must be at least 6 characters long.";
                signupMessage.className = "error-message";
                return;
            }

            // 7. Password and Confirm Password are identical
            if (password !== confirmPassword) {
                signupMessage.textContent = "Passwords do not match. Please re-enter your password.";
                signupMessage.className = "error-message";
                return;
            }

            // Aircraft interest selection check
            if (aircraftInterest === "") {
                signupMessage.textContent = "Please select an aircraft category.";
                signupMessage.className = "error-message";
                return;
            }

            // 8. Terms checkbox is checked
            if (!terms) {
                signupMessage.textContent = "Please accept the terms and conditions to register.";
                signupMessage.className = "error-message";
                return;
            }

            // Check if Supabase client is initialized
            if (!window.supabaseClient) {
                signupMessage.textContent = "Supabase client is not available. Please verify js/supabase.js.";
                signupMessage.className = "error-message";
                return;
            }

            // Loading indicator
            signupMessage.textContent = "Creating your account with Supabase...";
            signupMessage.className = "form-message";

            try {
                // STEP 8: Create Supabase Auth account with user metadata
                const { data, error } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName,
                            username: username,
                            aircraft_interest: aircraftInterest
                        }
                    }
                });

                // Handle signup errors
                if (error) {
                    signupMessage.textContent = "Signup failed: " + error.message;
                    signupMessage.className = "error-message";
                    return;
                }

                // Check for existing user (identities array is empty when account already exists)
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    signupMessage.innerHTML = 'An account with this email address already exists. <a href="signin.html">Go to Sign In</a>.';
                    signupMessage.className = "error-message";
                    return;
                }

                // STEP 8 & 9: Handle session and profile creation
                if (data.session && data.user) {
                    // Session is immediately active: create profile in public.profiles (STEP 8)
                    try {
                        await window.supabaseClient
                            .from("profiles")
                            .insert([{
                                id: data.user.id,
                                full_name: fullName,
                                username: username,
                                email: email,
                                aircraft_interest: aircraftInterest
                            }]);
                    } catch (profileErr) {
                        console.warn("Could not insert profile on signup:", profileErr);
                    }

                    signupMessage.textContent = "Account created successfully! Redirecting to dashboard...";
                    signupMessage.className = "success-message";
                    signupForm.reset();

                    setTimeout(function () {
                        window.location.href = "dashboard.html";
                    }, 1200);
                } else {
                    // STEP 9: Email confirmation required (data.session is null)
                    // Do NOT attempt authenticated INSERT without a session (RLS blocks it safely)
                    // Auth metadata is safely stored in auth.users and profile will be created upon sign-in
                    signupMessage.innerHTML = 'Account created successfully. Please check your email and confirm your account before signing in.<br><br><a href="signin.html" class="btn-card" style="display:inline-block; margin-top:8px; text-decoration:none;">Go to Sign In</a>';
                    signupMessage.className = "success-message";
                    signupForm.reset();
                }

            } catch (err) {
                signupMessage.textContent = "A network error occurred while connecting to Supabase. Please try again.";
                signupMessage.className = "error-message";
            }
        });
    }

    // ======================================================================
    // 3. Sign In Form with Real Supabase Authentication (signin.html)
    // ======================================================================
    const signinForm = document.getElementById("signinForm");
    const signinMessage = document.getElementById("signinMessage");

    if (signinForm && signinMessage) {
        // STEP 12: Redirect already-authenticated users to dashboard
        checkAuthRedirect();

        signinForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            signinMessage.textContent = "";
            signinMessage.className = "";

            if (email === "") {
                signinMessage.textContent = "Please enter your email address.";
                signinMessage.className = "error-message";
                return;
            }

            if (password === "") {
                signinMessage.textContent = "Please enter your password.";
                signinMessage.className = "error-message";
                return;
            }

            if (!window.supabaseClient) {
                signinMessage.textContent = "Supabase client is not available. Please verify js/supabase.js.";
                signinMessage.className = "error-message";
                return;
            }

            signinMessage.textContent = "Signing in...";
            signinMessage.className = "form-message";

            try {
                // Authenticate user with email and password via Supabase Auth
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    if (error.message.toLowerCase().includes("invalid login credentials")) {
                        signinMessage.textContent = "Invalid email or password. Please try again.";
                    } else if (error.message.toLowerCase().includes("email not confirmed")) {
                        signinMessage.textContent = "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
                    } else {
                        signinMessage.textContent = "Sign in failed: " + error.message;
                    }
                    signinMessage.className = "error-message";
                    return;
                }

                // STEP 10: Profile verification and creation after sign in
                // 1. Get authenticated user
                // 2. Check if profile already exists for that user ID
                // 3. If not, create from Auth metadata (prevents duplicate profiles)
                if (data.user) {
                    try {
                        await getOrCreateUserProfile(data.user);
                    } catch (profileErr) {
                        console.warn("Profile check on signin:", profileErr);
                    }
                }

                signinMessage.textContent = "Sign in successful! Redirecting to dashboard...";
                signinMessage.className = "success-message";
                signinForm.reset();

                setTimeout(function () {
                    window.location.href = "dashboard.html";
                }, 1000);

            } catch (err) {
                signinMessage.textContent = "A network error occurred while connecting to Supabase. Please try again.";
                signinMessage.className = "error-message";
            }
        });
    }

    // ======================================================================
    // 4. Contact Form Validation (contact.html)
    // ======================================================================
    const contactForm = document.getElementById("contactForm");
    const contactMessage = document.getElementById("contactMessage");

    if (contactForm && contactMessage) {
        contactForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const subject = document.getElementById("subject").value.trim();
            const message = document.getElementById("message").value.trim();

            contactMessage.textContent = "";
            contactMessage.className = "";

            if (name === "" || email === "" || subject === "" || message === "") {
                contactMessage.textContent = "Please fill in all required fields.";
                contactMessage.className = "error-message";
                return;
            }

            contactMessage.textContent = "Your message has been submitted successfully. This is currently a frontend demonstration.";
            contactMessage.className = "success-message";

            contactForm.reset();
        });
    }

    // ======================================================================
    // 5. Dashboard Authentication & Profiles Database Integration (dashboard.html)
    // ======================================================================
    const dashboardContent = document.getElementById("dashboardContent");
    const editProfileForm = document.getElementById("editProfileForm");
    const signoutBtn = document.getElementById("signoutBtn");
    const navSignoutLink = document.getElementById("navSignoutLink");

    // Initialize dashboard if elements exist
    if (dashboardContent) {
        loadUserProfileDashboard();
    }

    // Edit Profile form submission
    if (editProfileForm) {
        editProfileForm.addEventListener("submit", handleProfileUpdate);
    }

    // Sign out handlers
    if (signoutBtn) {
        signoutBtn.addEventListener("click", handleUserSignOut);
    }
    if (navSignoutLink) {
        navSignoutLink.addEventListener("click", function (event) {
            event.preventDefault();
            handleUserSignOut();
        });
    }

    // ======================================================================
    // 6. Dynamic Aircraft Collection Page (aircraft.html)
    // ======================================================================
    const aircraftGrid = document.getElementById("aircraftGrid");
    if (aircraftGrid) {
        loadAircraftCollection();
    }

    // ======================================================================
    // 7. Dynamic Aircraft Details Page (aircraft-details.html)
    // ======================================================================
    const aircraftDetailsContainer = document.getElementById("aircraftDetailsContainer");
    if (aircraftDetailsContainer) {
        loadAircraftDetailsPage();
    }

    // ======================================================================
    // 8. Aircraft Search and Category Filtering (aircraft.html)
    // ======================================================================
    const aircraftSearchInput = document.getElementById("aircraftSearch");
    if (aircraftSearchInput && !aircraftGrid) {
        initAircraftFilters();
    }

    // ======================================================================
    // 8. Aircraft Save / Favorites Button (aircraft-details.html)
    // ======================================================================
    const saveAircraftButton = document.getElementById("saveAircraftButton");
    if (saveAircraftButton) {
        initAircraftSaveButton();
    }

});

/**
 * STEP 12 & 13: Redirects already-authenticated users from signin.html and signup.html directly to dashboard.html.
 */
async function checkAuthRedirect() {
    if (!window.supabaseClient) return;
    try {
        const { data: authData } = await window.supabaseClient.auth.getSession();
        if (authData && authData.session && authData.session.user) {
            window.location.href = "dashboard.html";
        }
    } catch (err) {
        // Silently ignore session check errors on auth pages
    }
}

/**
 * STEP 10 & 12: Retrieves the user's profile from the public.profiles table.
 * If the profile does not exist yet for this user ID, creates one using Auth metadata,
 * refetches it, and returns it. Prevents creating duplicate profile records.
 *
 * @param {object} user - Authenticated user object from Supabase Auth
 * @param {object} [formValues] - Optional signup form values
 * @returns {Promise<{profile: object|null, error: Error|null}>}
 */
async function getOrCreateUserProfile(user, formValues = null) {
    if (!window.supabaseClient || !user) {
        return { profile: null, error: new Error("Supabase client or user is unavailable.") };
    }

    try {
        // STEP 10: 2. Check whether a profile already exists for that user ID
        const { data: existingProfile, error: selectError } = await window.supabaseClient
            .from("profiles")
            .select("id, full_name, username, email, aircraft_interest, created_at")
            .eq("id", user.id)
            .maybeSingle();

        if (selectError) {
            console.warn("Unable to query profiles table:", selectError.message);
            return { profile: null, error: selectError };
        }

        // Existing profile found — return directly without inserting a duplicate
        if (existingProfile) {
            return { profile: existingProfile, error: null };
        }

        // STEP 10: 3. If a profile does not exist: create one using Auth metadata
        const metadata = user.user_metadata || {};
        const profilePayload = {
            id: user.id,
            full_name: (formValues && formValues.full_name) || metadata.full_name || "New Member",
            username: (formValues && formValues.username) || metadata.username || (user.email ? user.email.split("@")[0] : "user"),
            email: user.email || (formValues && formValues.email) || "",
            aircraft_interest: (formValues && formValues.aircraft_interest) || metadata.aircraft_interest || "Fighter Aircraft"
        };

        const { error: insertError } = await window.supabaseClient
            .from("profiles")
            .insert([profilePayload]);

        if (insertError) {
            console.error("Error creating profile row:", insertError.message);
            return { profile: null, error: insertError };
        }

        // STEP 12: Fetch the profile again after creation
        const { data: newProfile, error: refetchError } = await window.supabaseClient
            .from("profiles")
            .select("id, full_name, username, email, aircraft_interest, created_at")
            .eq("id", user.id)
            .maybeSingle();

        if (refetchError || !newProfile) {
            return { profile: { ...profilePayload, created_at: new Date().toISOString() }, error: null };
        }

        return { profile: newProfile, error: null };
    } catch (err) {
        console.error("Unexpected error in getOrCreateUserProfile:", err);
        return { profile: null, error: err };
    }
}

/**
 * Loads the authenticated user's session and displays their information on dashboard.html.
 * STEP 11: Retrieves the user's profile from public.profiles table instead of relying only on Auth metadata.
 * STEP 12: Handles missing profile gracefully without showing JavaScript or SQL errors.
 */
async function loadUserProfileDashboard() {
    const dashboardMessage = document.getElementById("dashboardMessage");
    const userWelcome = document.getElementById("userWelcome");
    const userFullName = document.getElementById("userFullName");
    const userUsername = document.getElementById("userUsername");
    const userEmail = document.getElementById("userEmail");
    const userInterest = document.getElementById("userInterest");
    const userMemberSince = document.getElementById("userMemberSince");

    const editFullName = document.getElementById("editFullName");
    const editUsername = document.getElementById("editUsername");
    const editAircraftInterest = document.getElementById("editAircraftInterest");

    // Check if Supabase client is configured
    if (!window.supabaseClient) {
        if (dashboardMessage) {
            dashboardMessage.innerHTML = "<strong>Configuration Needed:</strong> Supabase credentials are not configured yet. Please verify <code>js/supabase.js</code>.<br><br><a href='signin.html'>Back to Sign In</a>";
            dashboardMessage.className = "error-message";
        }
        if (userWelcome) userWelcome.textContent = "Visitor";
        if (userFullName) userFullName.textContent = "Supabase Not Configured";
        if (userUsername) userUsername.textContent = "N/A";
        if (userEmail) userEmail.textContent = "N/A";
        if (userInterest) userInterest.textContent = "N/A";
        if (userMemberSince) userMemberSince.textContent = "N/A";
        return;
    }

    try {
        // Step 1: Verify authenticated session using getSession() (STEP 16 / TEST 8)
        const { data: authData, error: authError } = await window.supabaseClient.auth.getSession();

        if (authError || !authData || !authData.session || !authData.session.user) {
            // TEST 8: Redirect to signin.html if unauthenticated
            window.location.href = "signin.html";
            return;
        }

        const user = authData.session.user;

        // STEP 11 & 12: Retrieve user's profile from public.profiles
        // If missing: attempts to create from Auth metadata, refetches, and displays
        const { profile, error: profileError } = await getOrCreateUserProfile(user);

        if (profile) {
            // STEP 11: Display profile data from public.profiles
            const displayName = profile.full_name || "Member";
            const displayUsername = profile.username || (user.email ? user.email.split("@")[0] : "user");
            const displayEmail = profile.email || user.email;
            const displayInterest = profile.aircraft_interest || "Fighter Aircraft";
            const memberDate = profile.created_at || user.created_at;

            if (userWelcome) userWelcome.textContent = displayName;
            if (userFullName) userFullName.textContent = displayName;
            if (userUsername) userUsername.textContent = displayUsername;
            if (userEmail) userEmail.textContent = displayEmail;
            if (userInterest) userInterest.textContent = displayInterest;
            if (userMemberSince) userMemberSince.textContent = formatMemberDate(memberDate);

            // Pre-fill Edit Profile Form inputs
            if (editFullName) editFullName.value = displayName;
            if (editUsername) editUsername.value = displayUsername;
            if (editAircraftInterest) editAircraftInterest.value = displayInterest;
        } else {
            // STEP 12: Handle missing profile gracefully without showing JavaScript or SQL errors
            console.error("Profile could not be loaded from public.profiles:", profileError);

            if (dashboardMessage) {
                dashboardMessage.textContent = "Your account is signed in, but your profile could not be loaded.";
                dashboardMessage.className = "error-message";
            }

            // Safe fallback display from Auth metadata so user sees their basic account info
            const metadata = user.user_metadata || {};
            const fallbackName = metadata.full_name || "Member";
            const fallbackUsername = metadata.username || (user.email ? user.email.split("@")[0] : "user");
            const fallbackEmail = user.email || "N/A";
            const fallbackInterest = metadata.aircraft_interest || "Fighter Aircraft";

            if (userWelcome) userWelcome.textContent = fallbackName;
            if (userFullName) userFullName.textContent = fallbackName;
            if (userUsername) userUsername.textContent = fallbackUsername;
            if (userEmail) userEmail.textContent = fallbackEmail;
            if (userInterest) userInterest.textContent = fallbackInterest;
            if (userMemberSince) userMemberSince.textContent = formatMemberDate(user.created_at);

            if (editFullName) editFullName.value = fallbackName;
            if (editUsername) editUsername.value = fallbackUsername;
            if (editAircraftInterest) editAircraftInterest.value = fallbackInterest;
        }

        // Safely load saved aircraft if favorites table exists
        if (typeof loadUserSavedAircraft === "function") {
            try {
                loadUserSavedAircraft(user.id);
            } catch (favErr) {
                // Ignore if favorites table is not created yet
            }
        }

    } catch (err) {
        console.error("Dashboard error:", err);
        window.location.href = "signin.html";
    }
}

/**
 * STEP 6: Handles Edit Profile form submission.
 * Updates public.profiles row guarded by RLS (auth.uid() = id).
 * STEP 15: Handles duplicate username or other database errors gracefully.
 */
async function handleProfileUpdate(event) {
    event.preventDefault();

    const editProfileMessage = document.getElementById("editProfileMessage");
    const editFullName = document.getElementById("editFullName").value.trim();
    const editUsername = document.getElementById("editUsername").value.trim();
    const editAircraftInterest = document.getElementById("editAircraftInterest").value;
    const saveProfileBtn = document.getElementById("saveProfileBtn");

    editProfileMessage.textContent = "";
    editProfileMessage.className = "";

    // Validation
    if (editFullName === "" || editUsername === "" || editAircraftInterest === "") {
        editProfileMessage.textContent = "Please fill in all profile fields.";
        editProfileMessage.className = "error-message";
        return;
    }

    if (!window.supabaseClient) {
        editProfileMessage.textContent = "Supabase client is not available.";
        editProfileMessage.className = "error-message";
        return;
    }

    // Disable button during update
    if (saveProfileBtn) {
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = "Saving...";
    }

    try {
        // Retrieve current authenticated user
        const { data: authData } = await window.supabaseClient.auth.getSession();
        if (!authData || !authData.session || !authData.session.user) {
            window.location.href = "signin.html";
            return;
        }

        const user = authData.session.user;

        // STEP 6: Update user's row in public.profiles table (enforced by RLS auth.uid() = id)
        const { error: dbUpdateError } = await window.supabaseClient
            .from("profiles")
            .update({
                full_name: editFullName,
                username: editUsername,
                aircraft_interest: editAircraftInterest
            })
            .eq("id", user.id);

        if (dbUpdateError) {
            // STEP 15: Handle duplicate username or database errors gracefully without raw SQL errors
            if (dbUpdateError.message && dbUpdateError.message.toLowerCase().includes("unique")) {
                editProfileMessage.textContent = "This username is already taken. Please choose another username.";
            } else {
                editProfileMessage.textContent = "Could not update profile in database. Please try again.";
            }
            editProfileMessage.className = "error-message";
            if (saveProfileBtn) {
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = "Save Changes";
            }
            return;
        }

        // Also update Auth metadata to keep auth and profile synchronized
        await window.supabaseClient.auth.updateUser({
            data: {
                full_name: editFullName,
                username: editUsername,
                aircraft_interest: editAircraftInterest
            }
        });

        // Display success confirmation
        editProfileMessage.textContent = "Profile updated successfully.";
        editProfileMessage.className = "success-message";

        // Refresh the displayed overview on the dashboard
        const userWelcome = document.getElementById("userWelcome");
        const userFullName = document.getElementById("userFullName");
        const userUsername = document.getElementById("userUsername");
        const userInterest = document.getElementById("userInterest");

        if (userWelcome) userWelcome.textContent = editFullName;
        if (userFullName) userFullName.textContent = editFullName;
        if (userUsername) userUsername.textContent = editUsername;
        if (userInterest) userInterest.textContent = editAircraftInterest;

    } catch (err) {
        editProfileMessage.textContent = "An error occurred while saving profile changes. Please try again.";
        editProfileMessage.className = "error-message";
    } finally {
        if (saveProfileBtn) {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = "Save Changes";
        }
    }
}

/**
 * Signs the user out using Supabase and redirects to signin.html.
 */
async function handleUserSignOut() {
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.auth.signOut();
        } catch (err) {
            console.error("Error signing out:", err);
        }
    }
    window.location.href = "signin.html";
}

/**
 * Formats ISO date string into a friendly readable format.
 */
function formatMemberDate(dateString) {
    if (!dateString) return "Active Member";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    } catch (e) {
        return dateString;
    }
}

// ==========================================================================
// 7. Static Aircraft Collection Data (10 Aircraft)
// ==========================================================================
const aircraftData = {
    f35: {
        name: "F-35 Lightning II",
        category: "Fighter Aircraft",
        role: "Multirole Fighter",
        status: "Active / Operational",
        image: "images/F-35 Lightning 2.jpg",
        caption: "F-35 Lightning II stealth multirole fighter",
        description: "An advanced 5th generation multirole stealth fighter designed for air superiority and strike missions. It combines advanced low-observable stealth with high-speed agility, sensor fusion, and networked combat operations.",
        label: "",
        labelClass: "",
        specs: {
            "Aircraft": "F-35 Lightning II",
            "Category": "Fighter Aircraft",
            "Role": "Multirole Fighter",
            "Status": "Operational",
            "Manufacturer": "Lockheed Martin Aeronautics",
            "Top Speed": "Mach 1.6 (1,200 mph / 1,930 km/h)",
            "Combat Range": "1,200 nautical miles (2,220 km)"
        }
    },

    f22: {
        name: "F-22 Raptor",
        category: "Fighter Aircraft",
        role: "Air Superiority Fighter",
        status: "Active / Operational",
        image: "images/F22 Raptor.webp",
        caption: "F-22 Raptor air superiority stealth fighter",
        description: "A premier 5th generation tactical stealth fighter renowned for extreme speed, agility, and situational awareness. It integrates supercruise, supermaneuverability, and advanced radar stealth.",
        label: "",
        labelClass: "",
        specs: {
            "Aircraft": "F-22 Raptor",
            "Category": "Fighter Aircraft",
            "Role": "Air Superiority Fighter",
            "Status": "Operational",
            "Manufacturer": "Lockheed Martin / Boeing",
            "Top Speed": "Mach 2.25 (1,500 mph / 2,414 km/h)",
            "Combat Range": "1,600 nautical miles (2,960 km)"
        }
    },

    f16: {
        name: "F-16 Fighting Falcon",
        category: "Fighter Aircraft",
        role: "Multirole Fighter",
        status: "Active / Operational",
        image: "images/F 16 Fighting Falcon 2.webp",
        caption: "F-16 Fighting Falcon supersonic multirole fighter",
        description: "A highly agile supersonic multirole fighter aircraft used extensively for air combat and tactical missions worldwide. Highly recognized for its bubble canopy, side-stick controller, and proven multirole versatility.",
        label: "",
        labelClass: "",
        specs: {
            "Aircraft": "F-16 Fighting Falcon",
            "Category": "Fighter Aircraft",
            "Role": "Multirole Fighter",
            "Status": "Operational",
            "Manufacturer": "General Dynamics / Lockheed Martin",
            "Top Speed": "Mach 2.0 (1,320 mph / 2,124 km/h)",
            "Combat Range": "1,740 nautical miles (3,220 km)"
        }
    },

    f117: {
        name: "F-117 Nighthawk",
        category: "Stealth / Special Aircraft",
        role: "Stealth Attack Aircraft",
        status: "Historic Aircraft (Retired)",
        image: "images/F117 Nighthawk.jpeg",
        caption: "F-117 Nighthawk precision attack stealth aircraft",
        description: "A pioneering precision strike aircraft designed with stealth technology to operate undetected by radar. Developed by Lockheed's legendary Skunk Works, it was the world's first operational stealth combat aircraft.",
        label: "Historic Aircraft",
        labelClass: "label-historic",
        specs: {
            "Aircraft": "F-117 Nighthawk",
            "Category": "Stealth / Special Aircraft",
            "Role": "Stealth Attack Aircraft",
            "Status": "Retired (Historic Aircraft)",
            "Manufacturer": "Lockheed Skunk Works",
            "Top Speed": "Mach 0.92 (617 mph / 993 km/h)",
            "Combat Range": "930 nautical miles (1,720 km)"
        }
    },

    sr71: {
        name: "SR-71 Blackbird",
        category: "Stealth / Special Aircraft",
        role: "Strategic Reconnaissance Aircraft",
        status: "Historic Icon (Retired)",
        image: "images/SR 71 BlackBird.avif",
        caption: "SR-71 Blackbird high-altitude Mach 3 reconnaissance aircraft",
        description: "A legendary long-range reconnaissance aircraft engineered to cruise at Mach 3 speeds and extreme altitudes. It holds the official absolute speed record for crewed airbreathing jet aircraft.",
        label: "HIGH VALUE",
        labelClass: "label-high-value",
        specs: {
            "Aircraft": "SR-71 Blackbird",
            "Category": "Stealth / Special Aircraft",
            "Role": "Strategic Reconnaissance Aircraft",
            "Status": "Retired (Historic Record Holder)",
            "Manufacturer": "Lockheed Skunk Works",
            "Top Speed": "Mach 3.32 (2,193 mph / 3,529 km/h)",
            "Operational Ceiling": "85,000+ ft (25,900 m)"
        }
    },

    darkstar: {
        name: "SR-71 Darkstar",
        category: "Stealth / Special Aircraft",
        role: "Fictional Hypersonic Aircraft Concept",
        status: "Fictional Concept",
        image: "images/SR 72 Darkstar.jpeg",
        caption: "SR-71 Darkstar fictional hypersonic concept aircraft",
        description: "A fictional hypersonic aircraft concept featured in the movie 'Top Gun: Maverick', designed in conceptual collaboration with Lockheed Martin Skunk Works. This platform is not a real operational aircraft and was created purely as a cinematic and conceptual design.",
        label: "FICTIONAL CONCEPT",
        labelClass: "label-fictional",
        specs: {
            "Aircraft": "SR-71 Darkstar",
            "Category": "Stealth / Special Aircraft",
            "Role": "Fictional Hypersonic Aircraft Concept",
            "Status": "Fictional Concept (Top Gun: Maverick)",
            "Conceptual Design": "Lockheed Martin Skunk Works & Paramount",
            "Theoretical Speed": "Mach 10.0+ (Hypersonic Fictional Concept)",
            "Real-World Status": "Conceptual Movie Model (Non-operational)"
        }
    },

    c5: {
        name: "C-5 Galaxy",
        category: "Transport Aircraft",
        role: "Strategic Airlift Aircraft",
        status: "Active / Operational",
        image: "images/C5 Galaxy.jpg",
        caption: "C-5 Galaxy heavy strategic military airlifter",
        description: "A heavy strategic military airlifter designed to transport oversized cargo and vehicles across global distances. It is one of the largest military transport aircraft in the world.",
        label: "",
        labelClass: "",
        specs: {
            "Aircraft": "C-5 Galaxy",
            "Category": "Transport Aircraft",
            "Role": "Strategic Airlift Aircraft",
            "Status": "Operational",
            "Manufacturer": "Lockheed Martin Aeronautics",
            "Top Speed": "531 mph (462 knots / 855 km/h)",
            "Payload Capacity": "281,000 lbs (127,460 kg)"
        }
    },

    c130: {
        name: "C-130 Hercules",
        category: "Transport Aircraft",
        role: "Military Transport Aircraft",
        status: "Active / Operational",
        image: "images/C130 Hercules.jpeg",
        caption: "C-130 Hercules tactical military transport aircraft",
        description: "A versatile four-engine turboprop military transport capable of operating from unprepared runways in demanding environments. In continuous production for decades, it performs tactical airlift, search and rescue, and humanitarian missions.",
        label: "",
        labelClass: "",
        specs: {
            "Aircraft": "C-130 Hercules",
            "Category": "Transport Aircraft",
            "Role": "Military Transport Aircraft",
            "Status": "Operational",
            "Manufacturer": "Lockheed Martin Aeronautics",
            "Top Speed": "368 mph (320 knots / 592 km/h)",
            "Combat Range": "2,050 nautical miles (3,800 km)"
        }
    },

    ch53k: {
        name: "CH-53K King Stallion",
        category: "Helicopter",
        role: "Heavy-Lift Helicopter",
        status: "Active / Operational",
        image: "images/CH 53K.jpg",
        caption: "CH-53K King Stallion heavy-lift transport helicopter",
        description: "A heavy-lift military cargo helicopter engineered to transport heavy equipment, armored vehicles, and combat personnel. Built for the United States Marine Corps to conduct expeditionary assault and logistics.",
        label: "",
        labelClass: "",
        specs: {
            "Aircraft": "CH-53K King Stallion",
            "Category": "Helicopter",
            "Role": "Heavy-Lift Helicopter",
            "Status": "Operational",
            "Manufacturer": "Sikorsky Aircraft (Lockheed Martin)",
            "Cruise Speed": "170 knots (196 mph / 315 km/h)",
            "External Payload": "36,000 lbs (16,329 kg)"
        }
    },

    vh92: {
        name: "VH-92 Patriot",
        category: "Special Mission / Presidential Transport",
        role: "Presidential Transport Helicopter",
        status: "Active / Presidential Service",
        image: "images/VH 92.jpeg",
        caption: "VH-92 Patriot presidential transport executive helicopter",
        description: "A secure presidential transport helicopter built to provide executive transport for the President of the United States. Flown by Marine Helicopter Squadron One (HMX-1) under the call sign 'Marine One'.",
        label: "SPECIAL MISSION",
        labelClass: "label-special-mission",
        specs: {
            "Aircraft": "VH-92 Patriot",
            "Category": "Special Mission / Presidential Transport",
            "Role": "Presidential Transport Helicopter",
            "Status": "Operational (Marine One)",
            "Manufacturer": "Sikorsky Aircraft (Lockheed Martin)",
            "Top Speed": "190 mph (165 knots / 306 km/h)",
            "Mission Profile": "Executive Presidential Transport"
        }
    }
};

// ==========================================================================
// Aircraft Collection State (STEP 6 & 24)
// Stores loaded aircraft once from Supabase in memory.
// All search and category filtering operates locally on this array.
// ==========================================================================
let allAircraft = [];

/**
 * STEP 2 & 24: Connect aircraft.html to Supabase.
 * Loads the aircraft collection once from public.aircraft using window.supabaseClient.
 * Stores data in allAircraft array, sets up event listeners, and renders initial collection.
 * Handles loading state (STEP 20) and friendly error handling (STEP 21).
 */
async function loadAircraftCollection() {
    const aircraftGrid = document.getElementById("aircraftGrid");
    const loadingEl = document.getElementById("aircraftLoading");
    const errorEl = document.getElementById("aircraftErrorMessage");
    const countDisplay = document.getElementById("aircraftCount");
    const noResultsMsg = document.getElementById("noResultsMessage");

    if (!aircraftGrid) return;

    // STEP 20: Loading State — Page loads -> Loading aircraft... -> Supabase request
    if (loadingEl) loadingEl.style.display = "block";
    if (errorEl) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
    }
    if (countDisplay) countDisplay.textContent = "Loading aircraft...";
    if (noResultsMsg) noResultsMsg.style.display = "none";

    // Ensure Supabase client is available
    if (!window.supabaseClient) {
        console.error("Supabase client is not available. Ensure @supabase/supabase-js and js/supabase.js are loaded.");
        if (loadingEl) loadingEl.style.display = "none";
        if (errorEl) {
            errorEl.textContent = "Unable to load aircraft information. Please try again later.";
            errorEl.style.display = "block";
        }
        if (countDisplay) countDisplay.textContent = "";
        return;
    }

    try {
        // STEP 2: Query Supabase public.aircraft ordered by name ONCE
        const { data: aircraftList, error } = await window.supabaseClient
            .from("aircraft")
            .select("*")
            .order("name");

        // STEP 21: Error handling — friendly message to user, technical error logged to console
        if (error) {
            console.error("Error loading aircraft collection from Supabase:", error);
            if (loadingEl) loadingEl.style.display = "none";
            if (errorEl) {
                errorEl.textContent = "Unable to load aircraft information. Please try again later.";
                errorEl.style.display = "block";
            }
            if (countDisplay) countDisplay.textContent = "";
            return;
        }

        // Hide loading indicator
        if (loadingEl) loadingEl.style.display = "none";

        // STEP 6: Store loaded aircraft in JavaScript array
        allAircraft = aircraftList || [];

        // STEP 17, 18, 19: Set up search and filter event listeners
        initAircraftFilters();

        // Render initial view with all loaded aircraft
        filterAircraft();

    } catch (err) {
        console.error("Unexpected error in loadAircraftCollection:", err);
        if (loadingEl) loadingEl.style.display = "none";
        if (errorEl) {
            errorEl.textContent = "Unable to load aircraft information. Please try again later.";
            errorEl.style.display = "block";
        }
        if (countDisplay) countDisplay.textContent = "";
    }
}

/**
 * STEP 7, 8, 9, 10: Filter aircraft collection.
 * 1. Reads the search input (case-insensitive, partial match on aircraft.name).
 * 2. Reads the selected category.
 * 3. Filters allAircraft using Array.filter().
 * 4. Passes matching aircraft to renderAircraft().
 */
function filterAircraft() {
    const searchInput = document.getElementById("aircraftSearch");
    const categorySelect = document.getElementById("aircraftCategory") || document.getElementById("categoryFilter");

    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedCategory = categorySelect ? categorySelect.value : "All Aircraft";

    // STEP 7: Use JavaScript Array.filter() on the stored allAircraft array
    const filtered = allAircraft.filter(function (aircraft) {
        // STEP 8: Search logic against aircraft.name (case-insensitive partial-match)
        const name = (aircraft.name || "").toLowerCase();
        const matchesSearch = (searchTerm === "") || name.includes(searchTerm);

        // STEP 9: Category logic (matches selected category or shows all)
        const matchesCategory = (selectedCategory === "All Aircraft") || (aircraft.category === selectedCategory);

        // STEP 10: Aircraft must satisfy BOTH conditions
        return matchesSearch && matchesCategory;
    });

    // STEP 13: Render matching aircraft
    renderAircraft(filtered);
}

/**
 * STEP 13 — Render function responsible for displaying aircraft cards.
 * 1. Clears existing grid.
 * 2. Updates result count (STEP 11).
 * 3. Shows no-results message if 0 matches (STEP 12).
 * 4. Loops through filtered aircraft and creates cards using existing design (STEP 14, 15, 16).
 */
function renderAircraft(aircraftList) {
    const aircraftGrid = document.getElementById("aircraftGrid");
    const countDisplay = document.getElementById("aircraftCount");
    const noResultsMsg = document.getElementById("noResultsMessage");

    if (!aircraftGrid) return;

    const count = aircraftList ? aircraftList.length : 0;

    // STEP 11: Display result counter
    // Examples: "10 aircraft found", "3 aircraft found", "1 aircraft found", "0 aircraft found"
    if (countDisplay) {
        countDisplay.textContent = `${count} aircraft found`;
    }

    // STEP 12: No Results Message
    if (count === 0) {
        aircraftGrid.innerHTML = `
            <div class="notice-box" style="text-align: center; padding: 40px 20px; grid-column: 1 / -1; width: 100%;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #b91c1c;">No aircraft found.</p>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">Try changing your search or category filter.</p>
            </div>
        `;
        if (noResultsMsg) {
            noResultsMsg.textContent = "No aircraft found. Try changing your search or category filter.";
            noResultsMsg.style.display = "block";
        }
        return;
    }

    // Hide no-results banner when matches exist
    if (noResultsMsg) {
        noResultsMsg.style.display = "none";
    }

    // Clear existing grid
    aircraftGrid.innerHTML = "";

    // STEP 13 & 14: Loop through filtered aircraft and create cards
    aircraftList.forEach(function (aircraft) {
        const card = document.createElement("article");
        card.className = "aircraft-card";
        card.setAttribute("data-name", aircraft.name || "");
        card.setAttribute("data-category", aircraft.category || "");

        // STEP 16: Clear visual label for fictional aircraft (SR-71 Darkstar)
        let specialBadgeHtml = "";
        if (aircraft.is_fictional === true) {
            specialBadgeHtml = `<p class="special-label label-fictional">FICTIONAL CONCEPT</p>`;
        } else if (aircraft.status === "Historic Aircraft") {
            specialBadgeHtml = `<p class="special-label label-historic">Historic Aircraft</p>`;
        } else if (aircraft.status === "HIGH VALUE") {
            specialBadgeHtml = `<p class="special-label label-high-value">HIGH VALUE</p>`;
        } else if (aircraft.status === "Special Mission") {
            specialBadgeHtml = `<p class="special-label label-special-mission">Special Mission</p>`;
        }

        // Relative image path & meaningful alt text
        const imageHtml = aircraft.image ? `
            <figure>
                <img src="${escapeHtml(aircraft.image)}" alt="${escapeHtml(aircraft.name)}">
                <figcaption>${escapeHtml(aircraft.name)}</figcaption>
            </figure>
        ` : `
            <figure>
                <div style="height: 200px; display: flex; align-items: center; justify-content: center; background-color: #0b1728; color: #94a3b8; font-size: 14px;">
                    No Image Available
                </div>
                <figcaption>${escapeHtml(aircraft.name)}</figcaption>
            </figure>
        `;

        // STEP 14 & 15: Display image, name, category, status, description, and View Details button with actual UUID
        card.innerHTML = `
            ${imageHtml}
            <h3>${escapeHtml(aircraft.name)}</h3>
            <p class="aircraft-category"><strong>Category:</strong> ${escapeHtml(aircraft.category)}</p>
            <p class="aircraft-status"><strong>Status:</strong> ${escapeHtml(aircraft.status)}</p>
            ${specialBadgeHtml}
            <p class="aircraft-desc">${escapeHtml(aircraft.description || "")}</p>
            <a href="aircraft-details.html?id=${encodeURIComponent(aircraft.id)}" class="btn-card">View Details</a>
        `;

        aircraftGrid.appendChild(card);
    });
}

/**
 * STEP 17, 18, 19: Sets up event listeners for search input, category dropdown, and clear button.
 */
function initAircraftFilters() {
    const searchInput = document.getElementById("aircraftSearch");
    const categorySelect = document.getElementById("aircraftCategory") || document.getElementById("categoryFilter");
    const clearBtn = document.getElementById("clearFilters") || document.getElementById("resetFilters");

    if (searchInput) {
        // STEP 17: Search event — real-time filtering as user types without requiring Enter
        searchInput.oninput = filterAircraft;
    }

    if (categorySelect) {
        // STEP 18: Category event — filters on dropdown selection change
        categorySelect.onchange = filterAircraft;
    }

    if (clearBtn) {
        // STEP 5 & 19: Clear Filters event — resets input and dropdown, re-renders all aircraft
        clearBtn.onclick = function () {
            if (searchInput) searchInput.value = "";
            if (categorySelect) categorySelect.value = "All Aircraft";
            filterAircraft();
            if (searchInput) searchInput.focus();
        };
    }
}


/**
 * STEP 15 & 16: Reads URL search parameter 'id' using URLSearchParams,
 * queries public.aircraft for that specific aircraft ID, and populates aircraft-details.html.
 * Handles missing/invalid IDs (STEP 17), loading state (STEP 18), and error handling (STEP 19).
 */
async function loadAircraftDetailsPage() {
    const detailsContainer = document.getElementById("aircraftDetailsContainer");
    const errorContainer = document.getElementById("aircraftErrorContainer");
    const errorMessage = document.getElementById("aircraftErrorMessage");
    const errorText = document.getElementById("aircraftErrorText");
    const errorBtn = document.getElementById("aircraftErrorBtn");

    if (!detailsContainer || !errorContainer) return;

    // STEP 15: Retrieve 'id' parameter from current URL (with fallback to 'aircraft')
    const params = new URLSearchParams(window.location.search);
    const aircraftId = params.get("id");
    const aircraftSlug = params.get("aircraft");

    // Slug mapping for backwards compatibility with legacy query params
    const slugMap = {
        f35: "F-35 Lightning II",
        f22: "F-22 Raptor",
        f16: "F-16 Fighting Falcon",
        f117: "F-117 Nighthawk",
        sr71: "SR-71 Blackbird",
        darkstar: "SR-71 Darkstar",
        c5: "C-5 Galaxy",
        c130: "C-130 Hercules",
        ch53k: "CH-53K King Stallion",
        vh92: "VH-92 Patriot"
    };

    // STEP 17: Scenario 1 — If the URL does not contain an aircraft ID
    if ((!aircraftId || aircraftId.trim() === "") && (!aircraftSlug || aircraftSlug.trim() === "")) {
        detailsContainer.style.display = "none";
        errorContainer.style.display = "block";
        if (errorMessage) errorMessage.textContent = "Aircraft not found.";
        if (errorText) errorText.textContent = "No aircraft was selected. Please return to the aircraft collection.";
        if (errorBtn) {
            errorBtn.textContent = "Back to Aircraft";
            errorBtn.href = "aircraft.html";
        }
        return;
    }

    // STEP 17: Scenario 2 — Non-UUID / Invalid aircraft ID in URL
    const isUuid = aircraftId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(aircraftId.trim()) : false;
    const isKnownSlug = aircraftSlug ? Boolean(slugMap[aircraftSlug.trim().toLowerCase()]) : false;

    if (!isUuid && !isKnownSlug) {
        detailsContainer.style.display = "none";
        errorContainer.style.display = "block";
        if (errorMessage) errorMessage.textContent = "Aircraft not found.";
        if (errorText) errorText.textContent = "The requested aircraft ID could not be found in our collection.";
        if (errorBtn) {
            errorBtn.textContent = "Back to Aircraft";
            errorBtn.href = "aircraft.html";
        }
        return;
    }

    // STEP 18: Loading State
    detailsContainer.style.display = "block";
    errorContainer.style.display = "none";

    const aircraftNameEl = document.getElementById("aircraftName");
    const aircraftDescEl = document.getElementById("aircraftDescription");
    const aircraftCategoryEl = document.getElementById("aircraftCategory");
    const aircraftStatusEl = document.getElementById("aircraftStatus");
    const aircraftSpecialLabel = document.getElementById("aircraftSpecialLabel");
    const aircraftImage = document.getElementById("aircraftImage");
    const aircraftCaption = document.getElementById("aircraftCaption");

    if (aircraftNameEl) aircraftNameEl.textContent = "Loading aircraft...";
    if (aircraftCategoryEl) aircraftCategoryEl.innerHTML = "<strong>Category:</strong> Loading...";
    if (aircraftStatusEl) aircraftStatusEl.innerHTML = "<strong>Status:</strong> Loading...";
    if (aircraftDescEl) aircraftDescEl.textContent = "Loading aircraft description...";
    if (aircraftSpecialLabel) aircraftSpecialLabel.style.display = "none";

    // STEP 20: Ensure Supabase client is available
    if (!window.supabaseClient) {
        console.error("Supabase client is not available. Please verify js/supabase.js.");
        detailsContainer.style.display = "none";
        errorContainer.style.display = "block";
        if (errorMessage) errorMessage.textContent = "Unable to load aircraft information.";
        if (errorText) errorText.textContent = "Unable to load aircraft information. Please try again later.";
        return;
    }

    try {
        // STEP 15: Build query for this specific aircraft
        let query = window.supabaseClient.from("aircraft").select("*");

        if (aircraftId && aircraftId.trim() !== "") {
            query = query.eq("id", aircraftId.trim());
        } else if (aircraftSlug && aircraftSlug.trim() !== "") {
            const targetName = slugMap[aircraftSlug.trim().toLowerCase()] || aircraftSlug.trim();
            query = query.eq("name", targetName);
        }

        const { data: aircraft, error } = await query.maybeSingle();

        // STEP 19 & 17: Error Handling
        if (error) {
            console.error("Error fetching aircraft details from Supabase:", error);
            detailsContainer.style.display = "none";
            errorContainer.style.display = "block";

            // If error is invalid UUID syntax (e.g. user typed a non-UUID ID in URL)
            if (error.code === "22P02" || error.code === "PGRST116") {
                if (errorMessage) errorMessage.textContent = "Aircraft not found.";
                if (errorText) errorText.textContent = "The requested aircraft could not be found in our collection.";
            } else {
                if (errorMessage) errorMessage.textContent = "Unable to load aircraft information.";
                if (errorText) errorText.textContent = "Unable to load aircraft information. Please try again later.";
            }
            if (errorBtn) {
                errorBtn.textContent = "Back to Aircraft";
                errorBtn.href = "aircraft.html";
            }
            return;
        }

        // STEP 17: Scenario 2 — ID exists in URL but aircraft does not exist in database
        if (!aircraft) {
            detailsContainer.style.display = "none";
            errorContainer.style.display = "block";
            if (errorMessage) errorMessage.textContent = "Aircraft not found.";
            if (errorText) errorText.textContent = "The requested aircraft could not be found in our collection.";
            if (errorBtn) {
                errorBtn.textContent = "Back to Aircraft";
                errorBtn.href = "aircraft.html";
            }
            return;
        }

        // STEP 16: Render Aircraft Details Page Content
        detailsContainer.style.display = "block";
        errorContainer.style.display = "none";
        document.title = `${aircraft.name} | Aircraft Details`;

        // 1. Aircraft Name
        if (aircraftNameEl) {
            aircraftNameEl.textContent = aircraft.name;
        }

        // 2. STEP 14: Clear visual label for fictional concept
        if (aircraftSpecialLabel) {
            if (aircraft.is_fictional === true) {
                aircraftSpecialLabel.textContent = "FICTIONAL CONCEPT";
                aircraftSpecialLabel.className = "special-label label-fictional";
                aircraftSpecialLabel.style.display = "inline-block";
            } else if (aircraft.status === "Historic Aircraft") {
                aircraftSpecialLabel.textContent = "Historic Aircraft";
                aircraftSpecialLabel.className = "special-label label-historic";
                aircraftSpecialLabel.style.display = "inline-block";
            } else if (aircraft.status === "HIGH VALUE") {
                aircraftSpecialLabel.textContent = "HIGH VALUE";
                aircraftSpecialLabel.className = "special-label label-high-value";
                aircraftSpecialLabel.style.display = "inline-block";
            } else if (aircraft.status === "Special Mission") {
                aircraftSpecialLabel.textContent = "Special Mission";
                aircraftSpecialLabel.className = "special-label label-special-mission";
                aircraftSpecialLabel.style.display = "inline-block";
            } else {
                aircraftSpecialLabel.style.display = "none";
            }
        }

        // 3. Category & Status
        if (aircraftCategoryEl) {
            aircraftCategoryEl.innerHTML = `<strong>Category:</strong> ${escapeHtml(aircraft.category)}`;
        }
        if (aircraftStatusEl) {
            aircraftStatusEl.innerHTML = `<strong>Status:</strong> ${escapeHtml(aircraft.status)}`;
        }

        // 4. Description
        if (aircraftDescEl) {
            aircraftDescEl.textContent = aircraft.description || "No description available for this aircraft.";
        }

        // 5. Image & Caption
        if (aircraftImage) {
            if (aircraft.image) {
                aircraftImage.src = aircraft.image;
                aircraftImage.alt = aircraft.name;
                aircraftImage.style.display = "block";
            } else {
                aircraftImage.style.display = "none";
            }
        }
        if (aircraftCaption) {
            aircraftCaption.textContent = aircraft.name;
        }

        // 6. Platform Specifications Table
        const specsBody = document.getElementById("aircraftSpecsBody");
        if (specsBody) {
            specsBody.innerHTML = `
                <tr><th>Platform</th><td>${escapeHtml(aircraft.name)}</td></tr>
                <tr><th>Category</th><td>${escapeHtml(aircraft.category)}</td></tr>
                <tr><th>Status</th><td>${escapeHtml(aircraft.status)}</td></tr>
                <tr><th>Classification</th><td>${aircraft.is_fictional ? "Fictional Concept" : "Real-World Aircraft Platform"}</td></tr>
            `;
        }

    } catch (err) {
        console.error("Unexpected error in loadAircraftDetailsPage:", err);
        detailsContainer.style.display = "none";
        errorContainer.style.display = "block";
        if (errorMessage) errorMessage.textContent = "Unable to load aircraft information.";
        if (errorText) errorText.textContent = "Unable to load aircraft information. Please try again later.";
    }
}


/**
 * Escapes special HTML characters to prevent XSS.
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================================================
// 8. Favorites / Saved Aircraft Functions
// ==========================================================================

/**
 * Initializes the "☆ Save Aircraft" button on aircraft-details.html.
 * Checks if the current user is authenticated and if the aircraft is already saved.
 * Toggles save / remove and enforces authentication rules.
 */
async function initAircraftSaveButton() {
    const saveBtn = document.getElementById("saveAircraftButton");
    const saveMsg = document.getElementById("saveAircraftMessage");

    if (!saveBtn) return;

    // 1. Get currently selected aircraft ID from URL parameters
    const params = new URLSearchParams(window.location.search);
    const aircraftParam = params.get("aircraft");

    if (!aircraftParam) {
        saveBtn.style.display = "none";
        return;
    }

    const aircraftId = aircraftParam.trim().toLowerCase();

    // Verify aircraft exists in local data
    if (!aircraftData[aircraftId]) {
        saveBtn.style.display = "none";
        return;
    }

    // 2. Check if user is currently signed in and whether this aircraft is already saved
    if (window.supabaseClient) {
        try {
            const { data: authData } = await window.supabaseClient.auth.getSession();
            const user = authData && authData.session && authData.session.user;

            if (user) {
                // Query favorites table for current user and aircraft
                const { data: favorite, error } = await window.supabaseClient
                    .from("favorites")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("aircraft_id", aircraftId)
                    .maybeSingle();

                if (!error && favorite) {
                    // Aircraft is already saved
                    saveBtn.classList.add("is-saved");
                    saveBtn.textContent = "★ Saved Aircraft";
                    saveBtn.setAttribute("title", "Click to remove from saved aircraft");
                } else {
                    saveBtn.classList.remove("is-saved");
                    saveBtn.textContent = "☆ Save Aircraft";
                    saveBtn.setAttribute("title", "Click to save aircraft");
                }
            }
        } catch (err) {
            console.warn("Could not check saved aircraft status:", err);
        }
    }

    // 3. Handle Save / Remove button click
    saveBtn.addEventListener("click", async function () {
        // Clear previous messages
        if (saveMsg) {
            saveMsg.style.display = "none";
            saveMsg.innerHTML = "";
            saveMsg.className = "save-aircraft-message";
        }

        // Check if Supabase client is configured
        if (!window.supabaseClient) {
            if (saveMsg) {
                saveMsg.innerHTML = "<strong>Configuration Needed:</strong> Supabase credentials are not configured yet. Please open <code>js/supabase.js</code>.";
                saveMsg.className = "save-aircraft-message error-msg";
                saveMsg.style.display = "block";
            }
            return;
        }

        try {
            // Check active Supabase authentication session
            const { data: authData, error: authError } = await window.supabaseClient.auth.getSession();
            const user = authData && authData.session && authData.session.user;

            // SECTION 2 RULE: If visitor is NOT signed in:
            // Display: "Please sign in to save aircraft." with link to signin.html
            if (authError || !user) {
                if (saveMsg) {
                    saveMsg.innerHTML = 'Please <a href="signin.html">sign in</a> to save aircraft.';
                    saveMsg.className = "save-aircraft-message info-msg";
                    saveMsg.style.display = "block";
                }
                return;
            }

            const isSaved = saveBtn.classList.contains("is-saved");

            if (isSaved) {
                // ==============================================================
                // REMOVE FAVORITE: Delete row from favorites table
                // ==============================================================
                saveBtn.disabled = true;
                saveBtn.textContent = "Removing...";

                const { error: deleteError } = await window.supabaseClient
                    .from("favorites")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("aircraft_id", aircraftId);

                saveBtn.disabled = false;

                if (deleteError) {
                    if (saveMsg) {
                        saveMsg.textContent = "Failed to remove aircraft: " + deleteError.message;
                        saveMsg.className = "save-aircraft-message error-msg";
                        saveMsg.style.display = "block";
                    }
                    saveBtn.textContent = "★ Saved Aircraft";
                    return;
                }

                // Update button appearance
                saveBtn.classList.remove("is-saved");
                saveBtn.textContent = "☆ Save Aircraft";
                saveBtn.setAttribute("title", "Click to save aircraft");

                if (saveMsg) {
                    saveMsg.textContent = "Aircraft removed from your saved list.";
                    saveMsg.className = "save-aircraft-message success-msg";
                    saveMsg.style.display = "block";
                    setTimeout(function () {
                        if (saveMsg && saveMsg.classList.contains("success-msg")) {
                            saveMsg.style.display = "none";
                        }
                    }, 3000);
                }

            } else {
                // ==============================================================
                // SAVE FAVORITE: Insert row into favorites table
                // ==============================================================
                saveBtn.disabled = true;
                saveBtn.textContent = "Saving...";

                const { error: insertError } = await window.supabaseClient
                    .from("favorites")
                    .insert({
                        user_id: user.id,
                        aircraft_id: aircraftId
                    });

                saveBtn.disabled = false;

                if (insertError) {
                    // Gracefully handle duplicate favorite constraint (code 23505)
                    if (insertError.code === "23505" || 
                        (insertError.message && insertError.message.toLowerCase().includes("unique")) ||
                        (insertError.message && insertError.message.toLowerCase().includes("duplicate"))) {
                        saveBtn.classList.add("is-saved");
                        saveBtn.textContent = "★ Saved Aircraft";
                        saveBtn.setAttribute("title", "Click to remove from saved aircraft");
                        if (saveMsg) {
                            saveMsg.textContent = "This aircraft is already saved in your collection.";
                            saveMsg.className = "save-aircraft-message info-msg";
                            saveMsg.style.display = "block";
                        }
                    } else {
                        if (saveMsg) {
                            saveMsg.textContent = "Failed to save aircraft: " + insertError.message;
                            saveMsg.className = "save-aircraft-message error-msg";
                            saveMsg.style.display = "block";
                        }
                        saveBtn.textContent = "☆ Save Aircraft";
                    }
                    return;
                }

                // Update button appearance to saved state
                saveBtn.classList.add("is-saved");
                saveBtn.textContent = "★ Saved Aircraft";
                saveBtn.setAttribute("title", "Click to remove from saved aircraft");

                if (saveMsg) {
                    saveMsg.textContent = "Aircraft saved to your dashboard!";
                    saveMsg.className = "save-aircraft-message success-msg";
                    saveMsg.style.display = "block";
                    setTimeout(function () {
                        if (saveMsg && saveMsg.classList.contains("success-msg")) {
                            saveMsg.style.display = "none";
                        }
                    }, 3000);
                }
            }

        } catch (err) {
            console.error("Save aircraft error:", err);
            saveBtn.disabled = false;
            if (saveMsg) {
                saveMsg.textContent = "A network error occurred. Please try again.";
                saveMsg.className = "save-aircraft-message error-msg";
                saveMsg.style.display = "block";
            }
        }
    });
}

/**
 * Queries Supabase `favorites` table for the current user and renders
 * the corresponding aircraft cards in "MY SAVED AIRCRAFT" on dashboard.html.
 *
 * @param {string} userId - The authenticated user's UUID.
 */
async function loadUserSavedAircraft(userId) {
    const savedGrid = document.getElementById("savedAircraftGrid");
    const savedEmpty = document.getElementById("savedAircraftEmpty");
    const favMsg = document.getElementById("favoritesMessage");

    if (!savedGrid || !savedEmpty) return;

    if (!window.supabaseClient) {
        if (favMsg) {
            favMsg.textContent = "Supabase is not configured yet. Cannot load saved aircraft.";
            favMsg.className = "favorites-message-box error-msg";
            favMsg.style.display = "block";
        }
        savedGrid.style.display = "none";
        savedEmpty.style.display = "block";
        return;
    }

    try {
        // Query the favorites table for current user's records
        const { data: favorites, error: fetchError } = await window.supabaseClient
            .from("favorites")
            .select("id, aircraft_id, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (fetchError) {
            // If favorites table is not created yet (pure auth stage), show empty state
            savedGrid.style.display = "none";
            savedEmpty.style.display = "block";
            return;
        }

        // Handle empty favorites state
        if (!favorites || favorites.length === 0) {
            savedGrid.innerHTML = "";
            savedGrid.style.display = "none";
            savedEmpty.style.display = "block";
            return;
        }

        // Render saved aircraft cards
        savedEmpty.style.display = "none";
        savedGrid.style.display = "flex";
        savedGrid.innerHTML = "";

        favorites.forEach(function (item) {
            const key = (item.aircraft_id || "").toLowerCase().trim();
            const aircraft = aircraftData[key];

            if (aircraft) {
                const card = document.createElement("article");
                card.className = "aircraft-card";
                card.id = `saved-card-${key}`;
                card.setAttribute("data-aircraft-id", key);

                // Optional special label badge (e.g., Fictional Concept, Historic, High Value)
                let labelHtml = "";
                if (aircraft.label && aircraft.label.trim() !== "") {
                    labelHtml = `<p class="special-label ${aircraft.labelClass || ''}">${aircraft.label}</p>`;
                }

                card.innerHTML = `
                    <figure>
                        <img src="${aircraft.image}" alt="${aircraft.name}">
                        <figcaption>${aircraft.name}</figcaption>
                    </figure>
                    <h3>${aircraft.name}</h3>
                    <p class="aircraft-category"><strong>Category:</strong> ${aircraft.category}</p>
                    ${labelHtml}
                    <p class="aircraft-desc">${aircraft.description}</p>
                    <div class="saved-card-actions">
                        <a href="aircraft-details.html?aircraft=${key}" class="btn-card">View Details</a>
                        <button type="button" class="btn-remove-favorite" data-aircraft-id="${key}">Remove</button>
                    </div>
                `;

                // Attach Remove event handler
                const removeBtn = card.querySelector(".btn-remove-favorite");
                if (removeBtn) {
                    removeBtn.addEventListener("click", function () {
                        removeFavoriteAircraft(key, card);
                    });
                }

                savedGrid.appendChild(card);
            }
        });

        // If records were in table but none matched local dataset
        if (savedGrid.children.length === 0) {
            savedGrid.style.display = "none";
            savedEmpty.style.display = "block";
        }

    } catch (err) {
        console.error("Error in loadUserSavedAircraft:", err);
        savedGrid.style.display = "none";
        savedEmpty.style.display = "block";
    }
}

/**
 * Removes a saved aircraft from the Supabase `favorites` table and updates the dashboard view.
 *
 * @param {string} aircraftId - The lowercase identifier of the aircraft (e.g. "f35").
 * @param {HTMLElement} cardElement - The DOM card element to remove.
 */
async function removeFavoriteAircraft(aircraftId, cardElement) {
    if (!window.supabaseClient) return;

    const favMsg = document.getElementById("favoritesMessage");
    const removeBtn = cardElement.querySelector(".btn-remove-favorite");

    if (removeBtn) {
        removeBtn.disabled = true;
        removeBtn.textContent = "Removing...";
    }

    try {
        // Verify current authenticated session
        const { data: authData } = await window.supabaseClient.auth.getSession();
        const user = authData && authData.session && authData.session.user;

        if (!user) {
            window.location.href = "signin.html";
            return;
        }

        // Delete the row from Supabase favorites table
        const { error: deleteError } = await window.supabaseClient
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("aircraft_id", aircraftId);

        if (deleteError) {
            console.error("Failed to delete favorite:", deleteError);
            if (favMsg) {
                favMsg.textContent = "Failed to remove favorite: " + deleteError.message;
                favMsg.className = "favorites-message-box error-msg";
                favMsg.style.display = "block";
            }
            if (removeBtn) {
                removeBtn.disabled = false;
                removeBtn.textContent = "Remove";
            }
            return;
        }

        // Remove card element from DOM without page reload
        cardElement.remove();

        if (favMsg) {
            favMsg.textContent = "Aircraft removed from your saved list.";
            favMsg.className = "favorites-message-box success-msg";
            favMsg.style.display = "block";
            setTimeout(function () {
                if (favMsg && favMsg.classList.contains("success-msg")) {
                    favMsg.style.display = "none";
                }
            }, 3000);
        }

        // Update empty state if no favorites remain
        const savedGrid = document.getElementById("savedAircraftGrid");
        const savedEmpty = document.getElementById("savedAircraftEmpty");
        if (savedGrid && savedEmpty) {
            const remainingCards = savedGrid.querySelectorAll(".aircraft-card");
            if (remainingCards.length === 0) {
                savedGrid.style.display = "none";
                savedEmpty.style.display = "block";
            }
        }

    } catch (err) {
        console.error("Error in removeFavoriteAircraft:", err);
        if (removeBtn) {
            removeBtn.disabled = false;
            removeBtn.textContent = "Remove";
        }
    }
}

