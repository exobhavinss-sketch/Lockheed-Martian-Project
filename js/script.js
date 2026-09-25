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
    // 4. Contact Form Validation & Submission (contact.html)
    //    Uses FormSubmit.co for email delivery — no API keys required.
    // ======================================================================
    const contactForm = document.getElementById("contactForm");
    const contactMessage = document.getElementById("contactMessage");

    if (contactForm && contactMessage) {
        contactForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const subject = document.getElementById("subject").value.trim();
            const message = document.getElementById("message").value.trim();
            const topic = document.getElementById("topic") ? document.getElementById("topic").value : "";

            contactMessage.textContent = "";
            contactMessage.className = "";

            if (name === "" || email === "" || subject === "" || message === "") {
                contactMessage.textContent = "Please fill in all required fields.";
                contactMessage.className = "error-message";
                return;
            }

            // Disable button while sending
            const submitBtn = contactForm.querySelector("button[type='submit']");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Sending...";
            }

            try {
                const response = await fetch("https://formsubmit.co/ajax/bhavinshankur.tech@yahoo.com", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        _subject: subject,
                        topic: topic,
                        message: message
                    })
                });

                if (response.ok) {
                    contactMessage.textContent = "Your message has been sent successfully! We will get back to you soon.";
                    contactMessage.className = "success-message";
                    contactForm.reset();
                } else {
                    contactMessage.textContent = "There was a problem sending your message. Please try again later.";
                    contactMessage.className = "error-message";
                }
            } catch (err) {
                contactMessage.textContent = "A network error occurred. Please check your connection and try again.";
                contactMessage.className = "error-message";
            }

            // Re-enable button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Send Message";
            }
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

    // Edit Profile toggle buttons (STEPS 3 & 5)
    const editProfileBtn = document.getElementById("editProfileBtn");
    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", startEditProfile);
    }

    const cancelEditProfileBtn = document.getElementById("cancelEditProfileBtn");
    if (cancelEditProfileBtn) {
        cancelEditProfileBtn.addEventListener("click", cancelEditProfile);
    }

    // Edit Profile form submission (STEPS 5, 6, 7)
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

// In-memory profile state cache to allow instant cancel/restore without unnecessary Supabase queries (STEP 5)
let currentProfileData = null;

/**
 * Helper function to set the aircraft interest dropdown value.
 * STEP 4: If the existing profile contains another valid aircraft-interest value,
 * it preserves it by dynamically appending an option instead of dropping it.
 */
function setAircraftInterestDropdown(selectElement, targetValue) {
    if (!selectElement) return;
    if (!targetValue || targetValue.trim() === "") {
        selectElement.selectedIndex = 0;
        return;
    }

    const trimmed = targetValue.trim();
    let found = false;

    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].value.toLowerCase() === trimmed.toLowerCase()) {
            selectElement.selectedIndex = i;
            found = true;
            break;
        }
    }

    // Preserve custom or pre-existing category value
    if (!found) {
        const customOption = document.createElement("option");
        customOption.value = trimmed;
        customOption.textContent = trimmed;
        selectElement.appendChild(customOption);
        selectElement.value = trimmed;
    }
}

/**
 * STEP 5: Enters Edit Mode on dashboard.html:
 * - Hides the read-only display.
 * - Shows the editable form pre-populated with current profile values.
 * - Clears any previous status messages.
 */
function startEditProfile() {
    const readOnlyView = document.getElementById("profileReadOnlyView");
    const editView = document.getElementById("profileEditView");
    const editBtn = document.getElementById("editProfileBtn");
    const editMsg = document.getElementById("editProfileMessage");

    const editEmail = document.getElementById("editEmail");
    const editFullName = document.getElementById("editFullName");
    const editUsername = document.getElementById("editUsername");
    const editAircraftInterest = document.getElementById("editAircraftInterest");

    if (editMsg) {
        editMsg.textContent = "";
        editMsg.className = "";
    }

    // Populate editable fields with the current profile values
    if (currentProfileData) {
        if (editEmail) editEmail.value = currentProfileData.email || "";
        if (editFullName) editFullName.value = currentProfileData.full_name || "";
        if (editUsername) editUsername.value = currentProfileData.username || "";
        if (editAircraftInterest) setAircraftInterestDropdown(editAircraftInterest, currentProfileData.aircraft_interest);
    }

    if (readOnlyView) readOnlyView.style.display = "none";
    if (editBtn) editBtn.style.display = "none";
    if (editView) editView.style.display = "block";

    if (editFullName) editFullName.focus();
}

/**
 * STEP 5: Exits Edit Mode on dashboard.html:
 * - Restores previous saved profile values.
 * - Does NOT send anything to Supabase.
 * - Restores the clean read-only display.
 */
function cancelEditProfile() {
    const readOnlyView = document.getElementById("profileReadOnlyView");
    const editView = document.getElementById("profileEditView");
    const editBtn = document.getElementById("editProfileBtn");
    const editMsg = document.getElementById("editProfileMessage");

    const editEmail = document.getElementById("editEmail");
    const editFullName = document.getElementById("editFullName");
    const editUsername = document.getElementById("editUsername");
    const editAircraftInterest = document.getElementById("editAircraftInterest");

    // Clear any active error/status messages
    if (editMsg) {
        editMsg.textContent = "";
        editMsg.className = "";
    }

    // Restore form fields to current cached profile values without sending any request
    if (currentProfileData) {
        if (editEmail) editEmail.value = currentProfileData.email || "";
        if (editFullName) editFullName.value = currentProfileData.full_name || "";
        if (editUsername) editUsername.value = currentProfileData.username || "";
        if (editAircraftInterest) setAircraftInterestDropdown(editAircraftInterest, currentProfileData.aircraft_interest);
    }

    if (editView) editView.style.display = "none";
    if (readOnlyView) readOnlyView.style.display = "block";
    if (editBtn) editBtn.style.display = "inline-block";
}

/**
 * Loads the authenticated user's session and displays their information on dashboard.html.
 * STEP 9: Checks authentication, loads profile from public.profiles, displays Email, Full Name, Username, Interest.
 */
async function loadUserProfileDashboard() {
    const dashboardMessage = document.getElementById("dashboardMessage");
    const userWelcome = document.getElementById("userWelcome");
    const userFullName = document.getElementById("userFullName");
    const userUsername = document.getElementById("userUsername");
    const userEmail = document.getElementById("userEmail");
    const userInterest = document.getElementById("userInterest");
    const userMemberSince = document.getElementById("userMemberSince");

    const editEmail = document.getElementById("editEmail");
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
        // STEP 9: Step 1 — Verify authenticated session using getSession()
        const { data: authData, error: authError } = await window.supabaseClient.auth.getSession();

        if (authError || !authData || !authData.session || !authData.session.user) {
            // Redirect unauthenticated visitors to signin.html
            window.location.href = "signin.html";
            return;
        }

        const user = authData.session.user;

        // STEP 9: Step 2 & 3 — Load current user's profile from public.profiles
        const { profile, error: profileError } = await getOrCreateUserProfile(user);

        if (profile) {
            const displayName = profile.full_name || "Member";
            const displayUsername = profile.username || (user.email ? user.email.split("@")[0] : "user");
            const displayEmail = profile.email || user.email;
            const displayInterest = profile.aircraft_interest || "Fighter Aircraft";
            const memberDate = profile.created_at || user.created_at;

            // Cache current profile data
            currentProfileData = {
                id: user.id,
                email: displayEmail,
                full_name: displayName,
                username: displayUsername,
                aircraft_interest: displayInterest,
                created_at: memberDate
            };

            // STEP 9: Step 4 — Display Email, Full Name, Username, Aircraft Interest
            if (userWelcome) userWelcome.textContent = displayName;
            if (userFullName) userFullName.textContent = displayName;
            if (userUsername) userUsername.textContent = displayUsername;
            if (userEmail) userEmail.textContent = displayEmail;
            if (userInterest) userInterest.textContent = displayInterest;
            if (userMemberSince) userMemberSince.textContent = formatMemberDate(memberDate);

            // Pre-fill Edit Profile Form inputs
            if (editEmail) editEmail.value = displayEmail;
            if (editFullName) editFullName.value = displayName;
            if (editUsername) editUsername.value = displayUsername;
            if (editAircraftInterest) setAircraftInterestDropdown(editAircraftInterest, displayInterest);

        } else {
            console.error("Profile could not be loaded from public.profiles:", profileError);

            if (dashboardMessage) {
                dashboardMessage.textContent = "Your account is signed in, but your profile could not be loaded.";
                dashboardMessage.className = "error-message";
            }

            // Safe fallback display from Auth metadata
            const metadata = user.user_metadata || {};
            const fallbackName = metadata.full_name || "Member";
            const fallbackUsername = metadata.username || (user.email ? user.email.split("@")[0] : "user");
            const fallbackEmail = user.email || "N/A";
            const fallbackInterest = metadata.aircraft_interest || "Fighter Aircraft";

            currentProfileData = {
                id: user.id,
                email: fallbackEmail,
                full_name: fallbackName,
                username: fallbackUsername,
                aircraft_interest: fallbackInterest,
                created_at: user.created_at
            };

            if (userWelcome) userWelcome.textContent = fallbackName;
            if (userFullName) userFullName.textContent = fallbackName;
            if (userUsername) userUsername.textContent = fallbackUsername;
            if (userEmail) userEmail.textContent = fallbackEmail;
            if (userInterest) userInterest.textContent = fallbackInterest;
            if (userMemberSince) userMemberSince.textContent = formatMemberDate(user.created_at);

            if (editEmail) editEmail.value = fallbackEmail;
            if (editFullName) editFullName.value = fallbackName;
            if (editUsername) editUsername.value = fallbackUsername;
            if (editAircraftInterest) setAircraftInterestDropdown(editAircraftInterest, fallbackInterest);
        }

        // Ensure read-only view is visible initially and edit form view is hidden (STEP 3)
        const readOnlyView = document.getElementById("profileReadOnlyView");
        const editView = document.getElementById("profileEditView");
        const editBtn = document.getElementById("editProfileBtn");

        if (readOnlyView) readOnlyView.style.display = "block";
        if (editView) editView.style.display = "none";
        if (editBtn) editBtn.style.display = "inline-block";

        // Safely load saved favorites
        if (typeof loadDashboardFavorites === "function") {
            try {
                await loadDashboardFavorites();
            } catch (favErr) {
                console.warn("Could not load dashboard favorites:", favErr);
            }
        }

    } catch (err) {
        console.error("Dashboard error:", err);
        window.location.href = "signin.html";
    }
}

/**
 * STEP 5, 6, 7, 10: Handles Edit Profile form submission.
 * - Form validation (STEP 6)
 * - Restricts update strictly to authenticated user's own profile row where id = user.id (STEP 7)
 * - Loading state (STEP 5)
 * - Graceful error handling (STEP 10)
 * - Immediate UI update & return to read-only mode (STEP 5)
 */
async function handleProfileUpdate(event) {
    event.preventDefault();

    const editProfileMessage = document.getElementById("editProfileMessage");
    const editFullNameInput = document.getElementById("editFullName");
    const editUsernameInput = document.getElementById("editUsername");
    const editAircraftInterestInput = document.getElementById("editAircraftInterest");
    const saveProfileBtn = document.getElementById("saveProfileBtn");

    const editFullName = editFullNameInput ? editFullNameInput.value.trim() : "";
    const editUsername = editUsernameInput ? editUsernameInput.value.trim() : "";
    const editAircraftInterest = editAircraftInterestInput ? editAircraftInterestInput.value.trim() : "";

    if (editProfileMessage) {
        editProfileMessage.textContent = "";
        editProfileMessage.className = "";
    }

    // STEP 6: Beginner-Friendly Client-Side Validation
    // 1. Full Name: required & minimum length
    if (editFullName === "") {
        if (editProfileMessage) {
            editProfileMessage.textContent = "Please enter your full name.";
            editProfileMessage.className = "error-message";
        }
        if (editFullNameInput) editFullNameInput.focus();
        return;
    }

    if (editFullName.length < 2) {
        if (editProfileMessage) {
            editProfileMessage.textContent = "Full name must be at least 2 characters.";
            editProfileMessage.className = "error-message";
        }
        if (editFullNameInput) editFullNameInput.focus();
        return;
    }

    // 2. Username: required & minimum length
    if (editUsername === "") {
        if (editProfileMessage) {
            editProfileMessage.textContent = "Please enter a username.";
            editProfileMessage.className = "error-message";
        }
        if (editUsernameInput) editUsernameInput.focus();
        return;
    }

    if (editUsername.length < 3) {
        if (editProfileMessage) {
            editProfileMessage.textContent = "Username must be at least 3 characters.";
            editProfileMessage.className = "error-message";
        }
        if (editUsernameInput) editUsernameInput.focus();
        return;
    }

    // 3. Aircraft Interest: required
    if (editAircraftInterest === "") {
        if (editProfileMessage) {
            editProfileMessage.textContent = "Please select an aircraft interest.";
            editProfileMessage.className = "error-message";
        }
        if (editAircraftInterestInput) editAircraftInterestInput.focus();
        return;
    }

    if (!window.supabaseClient) {
        if (editProfileMessage) {
            editProfileMessage.textContent = "Supabase client is not available. Please try again.";
            editProfileMessage.className = "error-message";
        }
        return;
    }

    // STEP 5: Show loading state while saving
    if (saveProfileBtn) {
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = "Saving...";
    }

    try {
        // Retrieve current authenticated session
        const { data: authData, error: authError } = await window.supabaseClient.auth.getSession();
        if (authError || !authData || !authData.session || !authData.session.user) {
            window.location.href = "signin.html";
            return;
        }

        const user = authData.session.user;

        // STEP 7 & 11: Update only the current user's profile row (guarded by RLS auth.uid() = id)
        const { data: updatedProfile, error: dbUpdateError } = await window.supabaseClient
            .from("profiles")
            .update({
                full_name: editFullName,
                username: editUsername,
                aircraft_interest: editAircraftInterest
            })
            .eq("id", user.id)
            .select()
            .single();

        if (dbUpdateError) {
            console.error("Error updating profile in Supabase:", dbUpdateError);
            if (editProfileMessage) {
                if (dbUpdateError.message && dbUpdateError.message.toLowerCase().includes("unique")) {
                    editProfileMessage.textContent = "This username is already taken. Please choose another username.";
                } else {
                    editProfileMessage.textContent = "Unable to update your profile. Please try again.";
                }
                editProfileMessage.className = "error-message";
            }
            if (saveProfileBtn) {
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = "Save Changes";
            }
            return;
        }

        // Synchronize Supabase Auth user metadata
        try {
            await window.supabaseClient.auth.updateUser({
                data: {
                    full_name: editFullName,
                    username: editUsername,
                    aircraft_interest: editAircraftInterest
                }
            });
        } catch (metaErr) {
            console.warn("Could not sync auth metadata:", metaErr);
        }

        // Update in-memory profile cache
        currentProfileData = {
            ...(currentProfileData || {}),
            full_name: editFullName,
            username: editUsername,
            aircraft_interest: editAircraftInterest
        };

        // STEP 5: Update read-only DOM display immediately
        const userWelcome = document.getElementById("userWelcome");
        const userFullName = document.getElementById("userFullName");
        const userUsername = document.getElementById("userUsername");
        const userInterest = document.getElementById("userInterest");

        if (userWelcome) userWelcome.textContent = editFullName;
        if (userFullName) userFullName.textContent = editFullName;
        if (userUsername) userUsername.textContent = editUsername;
        if (userInterest) userInterest.textContent = editAircraftInterest;

        // STEP 5 & 10: Show friendly success message
        if (editProfileMessage) {
            editProfileMessage.textContent = "Profile updated successfully.";
            editProfileMessage.className = "success-message";
        }

        // STEP 5: Return to read-only mode after saving
        setTimeout(function () {
            const readOnlyView = document.getElementById("profileReadOnlyView");
            const editView = document.getElementById("profileEditView");
            const editBtn = document.getElementById("editProfileBtn");
            const dashboardMsg = document.getElementById("dashboardMessage");

            if (editView) editView.style.display = "none";
            if (readOnlyView) readOnlyView.style.display = "block";
            if (editBtn) editBtn.style.display = "inline-block";

            if (dashboardMsg) {
                dashboardMsg.textContent = "Profile updated successfully.";
                dashboardMsg.className = "success-message";
                dashboardMsg.style.display = "block";
                setTimeout(function () {
                    if (dashboardMsg && dashboardMsg.classList.contains("success-message")) {
                        dashboardMsg.style.display = "none";
                    }
                }, 4000);
            }
        }, 600);

    } catch (err) {
        console.error("Unexpected error in handleProfileUpdate:", err);
        if (editProfileMessage) {
            editProfileMessage.textContent = "Something went wrong. Please try again.";
            editProfileMessage.className = "error-message";
        }
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

        // STEP 12 & 13: Load current user's favorites from Supabase public.favorites
        await loadUserFavorites();

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
 * 5. Adds interactive Favorite button to each card (STEP 11, 14, 15, 16, 17).
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

        // STEP 14: Check favorite status for this aircraft
        const isFav = isAircraftFavorited(aircraft.id);

        // STEP 11, 14, 15: Display card with View Details and Favorite Button
        card.innerHTML = `
            ${imageHtml}
            <h3>${escapeHtml(aircraft.name)}</h3>
            <p class="aircraft-category"><strong>Category:</strong> ${escapeHtml(aircraft.category)}</p>
            <p class="aircraft-status"><strong>Status:</strong> ${escapeHtml(aircraft.status)}</p>
            ${specialBadgeHtml}
            <p class="aircraft-desc">${escapeHtml(aircraft.description || "")}</p>
            <div class="card-action-row">
                <a href="aircraft-details.html?id=${encodeURIComponent(aircraft.id)}" class="btn-card">View Details</a>
                <button type="button" class="btn-favorite-toggle ${isFav ? 'is-favorited' : ''}" data-aircraft-id="${aircraft.id}" aria-label="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}" title="${isFav ? 'Click to remove from favorites' : 'Click to add to favorites'}">
                    ${isFav ? '♥ Remove from Favorites' : '♡ Add to Favorites'}
                </button>
            </div>
        `;

        // STEP 17: Prevent favorite button click from opening details or triggering parent card clicks
        const favBtn = card.querySelector(".btn-favorite-toggle");
        if (favBtn) {
            favBtn.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                toggleFavorite(aircraft.id, favBtn);
            });
        }

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

        // 7. STEP 18: Initialize favorite button for this aircraft on details page
        await initDetailsPageFavorite(aircraft.id);

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
// 8. User Favorites System (public.favorites)
// ==========================================================================

let userFavoriteIds = new Set();
let currentAuthUser = null;

/**
 * STEP 12 & 13: Checks current Supabase authentication session and retrieves
 * the current user's saved aircraft IDs from public.favorites.
 * Populates userFavoriteIds Set. Safe for unauthenticated visitors.
 */
async function loadUserFavorites() {
    userFavoriteIds.clear();
    currentAuthUser = null;

    if (!window.supabaseClient) {
        return userFavoriteIds;
    }

    try {
        const { data: sessionData } = await window.supabaseClient.auth.getSession();
        const session = sessionData?.session;
        currentAuthUser = session?.user || null;

        if (!currentAuthUser) {
            return userFavoriteIds;
        }

        // Query public.favorites for this user only (guarded by RLS auth.uid() = user_id)
        const { data: favorites, error } = await window.supabaseClient
            .from("favorites")
            .select("aircraft_id")
            .eq("user_id", currentAuthUser.id);

        if (error) {
            console.error("Error loading user favorites from Supabase:", error);
            return userFavoriteIds;
        }

        if (favorites && Array.isArray(favorites)) {
            favorites.forEach(function (fav) {
                if (fav.aircraft_id) {
                    userFavoriteIds.add(fav.aircraft_id);
                }
            });
        }

        return userFavoriteIds;
    } catch (err) {
        console.error("Unexpected error in loadUserFavorites:", err);
        return userFavoriteIds;
    }
}

/**
 * STEP 14: Checks if a specific aircraft is saved in the current user's favorites.
 */
function isAircraftFavorited(aircraftId) {
    if (!aircraftId) return false;
    return userFavoriteIds.has(aircraftId);
}

/**
 * Shows a user-friendly floating toast message.
 */
function showFavoriteToast(message, type = "info", showSignInLink = false) {
    const toast = document.getElementById("favoritesToast");
    const textEl = document.getElementById("favoritesToastText");
    const linkEl = document.getElementById("favoritesToastLink");

    if (!toast || !textEl) return;

    textEl.textContent = message;
    toast.className = `favorites-toast ${type === "error" ? "error-toast" : type === "success" ? "success-toast" : ""}`;

    if (linkEl) {
        linkEl.style.display = showSignInLink ? "inline-block" : "none";
    }

    toast.style.display = "flex";

    if (!showSignInLink) {
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(function () {
            if (toast) toast.style.display = "none";
        }, 3500);
    }
}

/**
 * Shows a user-friendly message in the details page notification box.
 */
function showDetailsFavoriteMessage(message, type = "info", showSignInLink = false) {
    const msgEl = document.getElementById("saveAircraftMessage");
    if (!msgEl) return;

    if (showSignInLink) {
        msgEl.innerHTML = `${escapeHtml(message)} <a href="signin.html">Sign In</a>`;
    } else {
        msgEl.textContent = message;
    }

    msgEl.className = `save-aircraft-message ${type === "error" ? "error-msg" : type === "success" ? "success-msg" : "info-msg"}`;
    msgEl.style.display = "block";

    if (!showSignInLink) {
        setTimeout(function () {
            if (msgEl) msgEl.style.display = "none";
        }, 3500);
    }
}

/**
 * Updates button label and visual state across cards and details pages.
 */
function updateFavoriteButtonUI(buttonElement, isFavorited) {
    if (!buttonElement) return;

    if (isFavorited) {
        buttonElement.textContent = "♥ Remove from Favorites";
        buttonElement.classList.add("is-favorited");
        buttonElement.classList.add("is-saved");
        buttonElement.setAttribute("aria-label", "Remove from Favorites");
        buttonElement.setAttribute("title", "Click to remove from favorites");
    } else {
        buttonElement.textContent = "♡ Add to Favorites";
        buttonElement.classList.remove("is-favorited");
        buttonElement.classList.remove("is-saved");
        buttonElement.setAttribute("aria-label", "Add to Favorites");
        buttonElement.setAttribute("title", "Click to add to favorites");
    }
}

/**
 * STEP 10, 15, 16, 26, 27: Toggles favorite state (Add or Remove) for a specific aircraft ID.
 * Enforces authentication (STEP 10), handles duplicate constraints (STEP 26),
 * and updates local userFavoriteIds state without full page reload.
 */
async function toggleFavorite(aircraftId, buttonElement, messageContainer = null) {
    if (!aircraftId || !window.supabaseClient) return;

    // STEP 10: Check authentication
    try {
        const { data: sessionData } = await window.supabaseClient.auth.getSession();
        const session = sessionData?.session;
        currentAuthUser = session?.user || null;

        // If unauthenticated: do NOT perform anonymous insert
        if (!currentAuthUser) {
            const unauthMsg = "Please sign in to save favorites.";
            if (messageContainer) {
                showDetailsFavoriteMessage(unauthMsg, "error", true);
            } else {
                showFavoriteToast(unauthMsg, "error", true);
            }
            return;
        }

        const currentlyFavorited = isAircraftFavorited(aircraftId);

        if (buttonElement) {
            buttonElement.disabled = true;
        }

        if (currentlyFavorited) {
            // STEP 16: Remove Favorite — delete where user_id = currentUser.id AND aircraft_id = aircraftId
            const { error: deleteError } = await window.supabaseClient
                .from("favorites")
                .delete()
                .eq("user_id", currentAuthUser.id)
                .eq("aircraft_id", aircraftId);

            if (buttonElement) {
                buttonElement.disabled = false;
            }

            if (deleteError) {
                console.error("Error removing favorite from Supabase:", deleteError);
                const errMsg = "Unable to update favorites. Please try again.";
                if (messageContainer) {
                    showDetailsFavoriteMessage(errMsg, "error");
                } else {
                    showFavoriteToast(errMsg, "error");
                }
                return;
            }

            // Update local state
            userFavoriteIds.delete(aircraftId);
            updateFavoriteButtonUI(buttonElement, false);

            const successMsg = "Aircraft removed from favorites.";
            if (messageContainer) {
                showDetailsFavoriteMessage(successMsg, "info");
            } else {
                showFavoriteToast(successMsg, "info");
            }

        } else {
            // STEP 15: Add Favorite — insert user_id and aircraft_id
            const { error: insertError } = await window.supabaseClient
                .from("favorites")
                .insert([
                    { user_id: currentAuthUser.id, aircraft_id: aircraftId }
                ]);

            if (buttonElement) {
                buttonElement.disabled = false;
            }

            if (insertError) {
                // STEP 26: Gracefully handle duplicate favorite constraint (code 23505)
                if (insertError.code === "23505" || 
                    (insertError.message && insertError.message.toLowerCase().includes("unique")) ||
                    (insertError.message && insertError.message.toLowerCase().includes("duplicate"))) {
                    userFavoriteIds.add(aircraftId);
                    updateFavoriteButtonUI(buttonElement, true);
                    const existMsg = "Aircraft is already in your favorites.";
                    if (messageContainer) {
                        showDetailsFavoriteMessage(existMsg, "info");
                    } else {
                        showFavoriteToast(existMsg, "info");
                    }
                    return;
                }

                console.error("Error adding favorite to Supabase:", insertError);
                const errMsg = "Unable to update favorites. Please try again.";
                if (messageContainer) {
                    showDetailsFavoriteMessage(errMsg, "error");
                } else {
                    showFavoriteToast(errMsg, "error");
                }
                return;
            }

            // Update local state
            userFavoriteIds.add(aircraftId);
            updateFavoriteButtonUI(buttonElement, true);

            const successMsg = "Aircraft added to favorites.";
            if (messageContainer) {
                showDetailsFavoriteMessage(successMsg, "success");
            } else {
                showFavoriteToast(successMsg, "success");
            }
        }

    } catch (err) {
        console.error("Unexpected error in toggleFavorite:", err);
        if (buttonElement) {
            buttonElement.disabled = false;
        }
        const errMsg = "Unable to update favorites. Please try again.";
        if (messageContainer) {
            showDetailsFavoriteMessage(errMsg, "error");
        } else {
            showFavoriteToast(errMsg, "error");
        }
    }
}

/**
 * STEP 18: Initializes the favorite button on aircraft-details.html.
 */
async function initDetailsPageFavorite(aircraftId) {
    const saveBtn = document.getElementById("saveAircraftButton");
    const saveMsg = document.getElementById("saveAircraftMessage");

    if (!saveBtn || !aircraftId) return;

    // Load user favorites to check state
    await loadUserFavorites();

    const isFav = isAircraftFavorited(aircraftId);
    updateFavoriteButtonUI(saveBtn, isFav);

    // Attach click handler
    saveBtn.onclick = function (event) {
        event.preventDefault();
        toggleFavorite(aircraftId, saveBtn, saveMsg);
    };
}

/**
 * Backwards-compatibility wrapper for aircraft-details.html save button.
 */
async function initAircraftSaveButton() {
    const params = new URLSearchParams(window.location.search);
    const aircraftId = params.get("id");
    if (aircraftId) {
        await initDetailsPageFavorite(aircraftId);
    }
}

/**
 * STEP 20: Loads and renders the authenticated user's favorite aircraft on dashboard.html.
 */
async function loadDashboardFavorites() {
    const savedGrid = document.getElementById("savedAircraftGrid");
    const savedEmpty = document.getElementById("savedAircraftEmpty");
    const favMsg = document.getElementById("favoritesMessage");

    if (!savedGrid || !savedEmpty) return;

    if (!window.supabaseClient) {
        savedGrid.style.display = "none";
        savedEmpty.style.display = "block";
        return;
    }

    try {
        const { data: sessionData } = await window.supabaseClient.auth.getSession();
        const session = sessionData?.session;
        currentAuthUser = session?.user || null;

        if (!currentAuthUser) {
            savedGrid.style.display = "none";
            savedEmpty.style.display = "block";
            return;
        }

        // 1. Query the current user's favorites from public.favorites
        const { data: favRows, error: favError } = await window.supabaseClient
            .from("favorites")
            .select("aircraft_id, created_at")
            .eq("user_id", currentAuthUser.id)
            .order("created_at", { ascending: false });

        if (favError) {
            console.error("Error fetching user favorites from Supabase:", favError);
            savedGrid.style.display = "none";
            savedEmpty.style.display = "block";
            return;
        }

        // STEP 19: If user has no favorites, display empty state
        if (!favRows || favRows.length === 0) {
            renderDashboardFavorites([]);
            return;
        }

        // Also sync local Set
        userFavoriteIds.clear();
        favRows.forEach(f => userFavoriteIds.add(f.aircraft_id));

        // 2. Query the matching aircraft records from public.aircraft
        const favoriteAircraftIds = favRows.map(f => f.aircraft_id);
        const { data: aircraftData, error: airError } = await window.supabaseClient
            .from("aircraft")
            .select("*")
            .in("id", favoriteAircraftIds);

        if (airError) {
            console.error("Error fetching favorite aircraft platforms:", airError);
            renderDashboardFavorites([]);
            return;
        }

        // Keep order matching the favorites created_at order
        const aircraftMap = new Map();
        (aircraftData || []).forEach(a => aircraftMap.set(a.id, a));

        const orderedAircraft = [];
        favoriteAircraftIds.forEach(id => {
            if (aircraftMap.has(id)) {
                orderedAircraft.push(aircraftMap.get(id));
            }
        });

        renderDashboardFavorites(orderedAircraft);

    } catch (err) {
        console.error("Unexpected error in loadDashboardFavorites:", err);
        savedGrid.style.display = "none";
        savedEmpty.style.display = "block";
    }
}

/**
 * STEP 19: Renders favorite aircraft cards onto dashboard.html.
 */
function renderDashboardFavorites(favoriteAircraftList) {
    const savedGrid = document.getElementById("savedAircraftGrid");
    const savedEmpty = document.getElementById("savedAircraftEmpty");

    if (!savedGrid || !savedEmpty) return;

    if (!favoriteAircraftList || favoriteAircraftList.length === 0) {
        savedGrid.innerHTML = "";
        savedGrid.style.display = "none";
        savedEmpty.style.display = "block";
        return;
    }

    savedEmpty.style.display = "none";
    savedGrid.style.display = "flex";
    savedGrid.innerHTML = "";

    favoriteAircraftList.forEach(function (aircraft) {
        const card = document.createElement("article");
        card.className = "aircraft-card";
        card.id = `fav-card-${aircraft.id}`;
        card.setAttribute("data-aircraft-id", aircraft.id);

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

        card.innerHTML = `
            ${imageHtml}
            <h3>${escapeHtml(aircraft.name)}</h3>
            <p class="aircraft-category"><strong>Category:</strong> ${escapeHtml(aircraft.category)}</p>
            <p class="aircraft-status"><strong>Status:</strong> ${escapeHtml(aircraft.status)}</p>
            ${specialBadgeHtml}
            <p class="aircraft-desc">${escapeHtml(aircraft.description || "")}</p>
            <div class="saved-card-actions">
                <a href="aircraft-details.html?id=${encodeURIComponent(aircraft.id)}" class="btn-card">View Details</a>
                <button type="button" class="btn-remove-favorite" data-aircraft-id="${aircraft.id}">Remove Favorite</button>
            </div>
        `;

        // STEP 21: Attach Remove Favorite event handler
        const removeBtn = card.querySelector(".btn-remove-favorite");
        if (removeBtn) {
            removeBtn.addEventListener("click", function () {
                removeDashboardFavorite(aircraft.id, card);
            });
        }

        savedGrid.appendChild(card);
    });
}

/**
 * STEP 21: Removes a favorite from the dashboard without full page reload.
 */
async function removeDashboardFavorite(aircraftId, cardElement) {
    if (!window.supabaseClient || !aircraftId) return;

    const favMsg = document.getElementById("favoritesMessage");
    const removeBtn = cardElement ? cardElement.querySelector(".btn-remove-favorite") : null;

    if (removeBtn) {
        removeBtn.disabled = true;
        removeBtn.textContent = "Removing...";
    }

    try {
        const { data: sessionData } = await window.supabaseClient.auth.getSession();
        const session = sessionData?.session;
        currentAuthUser = session?.user || null;

        if (!currentAuthUser) {
            window.location.href = "signin.html";
            return;
        }

        // Delete from public.favorites for current user
        const { error: deleteError } = await window.supabaseClient
            .from("favorites")
            .delete()
            .eq("user_id", currentAuthUser.id)
            .eq("aircraft_id", aircraftId);

        if (deleteError) {
            console.error("Failed to delete favorite from dashboard:", deleteError);
            if (removeBtn) {
                removeBtn.disabled = false;
                removeBtn.textContent = "Remove Favorite";
            }
            if (favMsg) {
                favMsg.textContent = "Unable to update favorites. Please try again.";
                favMsg.className = "favorites-message-box error-msg";
                favMsg.style.display = "block";
            }
            return;
        }

        // Remove card from DOM without refreshing the page
        if (cardElement) {
            cardElement.remove();
        }

        userFavoriteIds.delete(aircraftId);

        if (favMsg) {
            favMsg.textContent = "Aircraft removed from favorites.";
            favMsg.className = "favorites-message-box success-msg";
            favMsg.style.display = "block";
            setTimeout(function () {
                if (favMsg && favMsg.classList.contains("success-msg")) {
                    favMsg.style.display = "none";
                }
            }, 3000);
        }

        // STEP 21: Update empty state if the last favorite was removed
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
        console.error("Unexpected error in removeDashboardFavorite:", err);
        if (removeBtn) {
            removeBtn.disabled = false;
            removeBtn.textContent = "Remove Favorite";
        }
    }
}

/**
 * Backwards compatibility alias for dashboard loading.
 */
async function loadUserSavedAircraft(userId) {
    await loadDashboardFavorites();
}

/**
 * Backwards compatibility alias for dashboard removal.
 */
async function removeFavoriteAircraft(aircraftId, cardElement) {
    await removeDashboardFavorite(aircraftId, cardElement);
}


