import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- 🛰️ FIREBASE CONFIGURATION (Provided by USER) ---
const firebaseConfig = {
  apiKey: "AIzaSyCA1Yb-pB3qnpI9CYxSnt3ELxYaHhO7iRk",
  authDomain: "linkly-link-system.firebaseapp.com",
  databaseURL: "https://linkly-link-system-default-rtdb.firebaseio.com",
  projectId: "linkly-link-system",
  storageBucket: "linkly-link-system.firebasestorage.app",
  messagingSenderId: "578996179983",
  appId: "1:578996179983:web:13ae1024d9ec882560bf7a"
};

// Initialize Firebase Core & Database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 🗂️ STATE PARAMETERS ---
const childUniqueId = "child_device_9988";
let isLockedByParent = false;
let screentimeUsed = 0;
let screentimeLimit = 60;
let bypassPin = "1234"; // Cached from Firebase, defaults to 1234
let activeSimMarker = null;
let activeSimMap = null;

// --- 🔒 LOCKSCREEN STATE LISTENERS (`onValue`) ---
const lockStatusRef = ref(db, `devices/${childUniqueId}/status/isLockedByParent`);
const usedRef = ref(db, `devices/${childUniqueId}/screentime_used`);
const limitRef = ref(db, `devices/${childUniqueId}/screentime_limit`);
const pinRef = ref(db, `devices/${childUniqueId}/status/bypassPin`);
const profileRef = ref(db, `devices/${childUniqueId}/profile`);

// Sync Profile Name
onValue(profileRef, (snap) => {
    const profile = snap.val();
    if (profile && profile.name) {
        document.getElementById("childHeaderName").textContent = profile.name;
    }
});

// Sync Bypass Pin Code
onValue(pinRef, (snap) => {
    bypassPin = snap.val() || "1234";
});

// Shared Evaluator for Lock screen Trigger
function checkLockRequirements() {
    const isExceeded = screentimeUsed >= screentimeLimit;
    const isLocked = isLockedByParent || isExceeded;

    const overlay = document.getElementById("lockscreenOverlay");
    const title = document.getElementById("lockscreenTitle");
    const message = document.getElementById("lockscreenMessage");

    if (isLocked) {
        overlay.classList.remove("hidden");
        document.body.style.overflow = "hidden"; // Prevent scrolling
        
        if (isLockedByParent) {
            title.textContent = "SYSTEM LOCKED BY PARENT";
            message.textContent = "Your supervisor has placed this hardware node under absolute lockdown. Direct access is temporarily prohibited.";
        } else {
            title.textContent = "STUDY TIMER EXPIRED";
            message.textContent = "You have used up your allocated daily screen time limit. Time for some homework or outside play!";
        }
    } else {
        overlay.classList.add("hidden");
        document.body.style.overflow = "auto";
    }
}

onValue(lockStatusRef, (snap) => {
    isLockedByParent = snap.val() || false;
    checkLockRequirements();
});

onValue(usedRef, (snap) => {
    screentimeUsed = snap.val() || 0;
    document.getElementById("childScreenUsedText").textContent = `Used: ${screentimeUsed} mins`;
    
    // Update local progress bar
    renderLocalScreenTimeProgressBar();
    checkLockRequirements();
});

onValue(limitRef, (snap) => {
    screentimeLimit = snap.val() || 60;
    document.getElementById("childScreenLimitText").textContent = `Limit: ${screentimeLimit} mins`;
    
    renderLocalScreenTimeProgressBar();
    checkLockRequirements();
});

function renderLocalScreenTimeProgressBar() {
    const pct = screentimeLimit > 0 ? (screentimeUsed * 100) / screentimeLimit : 0;
    const fill = document.getElementById("childScreenProgressBar");
    fill.style.width = `${Math.min(pct, 100)}%`;
    
    if (pct >= 100) {
        fill.style.background = "#ef4444";
    } else if (pct >= 80) {
        fill.style.background = "#f59e0b";
    } else {
        fill.style.background = "#10b981"; // Green
    }
}

// Emergency Bypass Lock Override
document.getElementById("btnBypassUnlock").addEventListener("click", () => {
    const pin = document.getElementById("lockscreenPinInput").value.trim();
    if (pin === bypassPin) {
        // Correct pin: bypass in Firebase!
        set(ref(db, `devices/${childUniqueId}/status/isLockedByParent`), false);
        set(ref(db, `devices/${childUniqueId}/screentime_used`), 0);
        document.getElementById("lockscreenPinInput").value = "";
        alert("Access granted via administrative override PIN code!");
    } else {
        alert("Invalid security bypass PIN code.");
    }
});

// --- 📱 HARDWARE TELEMETRY SIMULATION CONTROLS ---

// Battery Level Simulator
const batterySlider = document.getElementById("simBatterySlider");
const batteryLabel = document.getElementById("simBatteryLabel");

batterySlider.addEventListener("input", (e) => {
    const val = e.target.value;
    batteryLabel.textContent = `${val}%`;
    document.getElementById("childHeaderBatteryText").textContent = `${val}%`;
});

batterySlider.addEventListener("change", (e) => {
    const val = parseInt(e.target.value);
    set(ref(db, `db_write_sim`, val)); // trigger quick update
    set(ref(db, `devices/${childUniqueId}/telemetry/batteryLevel`), val);
});

// Active Simulated App Dropdown
document.getElementById("simForegroundApp").addEventListener("change", (e) => {
    const val = e.target.value;
    set(ref(db, `devices/${childUniqueId}/telemetry/foregroundApp`), val);
});

// --- 🗺️ GPS SIMULATOR MAP (Leaflet Click-to-Teleport) ---
function initSimMap() {
    const initialCenter = [12.9716, 77.5946];
    
    activeSimMap = L.map('simGpsMap', { attributionControl: false }).setView(initialCenter, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(activeSimMap);
    
    // Add glowing cyan marker for simulation
    activeSimMarker = L.marker(initialCenter).addTo(activeSimMap);

    // Dynamic teleport trigger on clicking map coordinates!
    activeSimMap.on('click', (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        activeSimMarker.setLatLng(e.latlng);
        activeSimMap.setView(e.latlng);

        // Upload live coordinates to Firebase in real time
        set(ref(db, `devices/${childUniqueId}/location`), {
            latitude: lat,
            longitude: lng,
            timestamp: Date.now()
        }).then(() => {
            console.log(`Simulated hardware GPS Teleport: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        });
    });

    // Make sure map sizes recalculate
    setTimeout(() => {
        activeSimMap.invalidateSize();
    }, 400);
}

// --- 🧠 INTERACTIVE EDUCATIONAL MATH QUIZ GAME ---

// Questions Database (Exact same conceptual pool from EducationalGameActivity.kt!)
const conceptualPool = [
    { text: "What is the next number in the pattern: 2, 4, 8, 16, ?", options: ["20", "24", "32", "64"], correctIndex: 2 },
    { text: "Solve: 12 + (3 * 4) - 5", options: ["15", "19", "25", "55"], correctIndex: 1 },
    { text: "Which shape has exactly 5 equal sides?", options: ["Triangle", "Square", "Pentagon", "Hexagon"], correctIndex: 2 },
    { text: "If 3x = 18, what is the value of x?", options: ["4", "5", "6", "9"], correctIndex: 2 },
    { text: "Which number is a prime number?", options: ["9", "15", "21", "29"], correctIndex: 3 },
    { text: "How many degrees are in a straight angle?", options: ["90", "180", "270", "360"], correctIndex: 1 },
    { text: "What is the square root of 144?", options: ["10", "11", "12", "14"], correctIndex: 2 },
    { text: "Which of these is a multiple of 7?", options: ["22", "35", "48", "54"], correctIndex: 1 },
    { text: "A triangle with all three sides equal is called?", options: ["Isosceles", "Scalene", "Equilateral", "Right-angled"], correctIndex: 2 },
    { text: "If a square has a side length of 6cm, what is its area?", options: ["12 sq cm", "24 sq cm", "36 sq cm", "48 sq cm"], correctIndex: 2 },
    { text: "What is the next prime number after 7?", options: ["9", "11", "13", "15"], correctIndex: 1 },
    { text: "What is the value of 2 to the power of 5 (2^5)?", options: ["16", "25", "32", "64"], correctIndex: 2 },
    { text: "If you roll a standard 6-sided die, what is the probability of getting an even number?", options: ["1/6", "1/3", "1/2", "2/3"], correctIndex: 2 },
    { text: "What is 15% of 200?", options: ["15", "20", "30", "45"], correctIndex: 2 },
    { text: "Which fraction is equivalent to 3/4?", options: ["6/8", "5/6", "9/12", "Both 6/8 and 9/12"], correctIndex: 3 }
];

let selectedQuestions = [];
let currentQuizIdx = 0;
let score = 0;

// Build mixed dynamic & conceptual quiz list
function generateSeededQuiz() {
    selectedQuestions = [];
    currentQuizIdx = 0;
    score = 0;

    // Pick 3 random conceptual questions
    let poolCopy = [...conceptualPool];
    for (let i = 0; i < 3; i++) {
        let randIdx = Math.floor(Math.random() * poolCopy.length);
        selectedQuestions.push(poolCopy.splice(randIdx, 1)[0]);
    }

    // Generate 2 dynamically compiled math equations (mirroring Kotlin Service)
    for (let i = 0; i < 2; i++) {
        let type = Math.floor(Math.random() * 3); // 0: +, 1: -, 2: *
        let num1 = 0, num2 = 0, correct = 0, symbol = "";
        
        if (type === 0) {
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            symbol = "+";
            correct = num1 + num2;
        } else if (type === 1) {
            num1 = Math.floor(Math.random() * 50) + 50;
            num2 = Math.floor(Math.random() * 40) + 5;
            symbol = "-";
            correct = num1 - num2;
        } else {
            num1 = Math.floor(Math.random() * 11) + 2;
            num2 = Math.floor(Math.random() * 11) + 2;
            symbol = "*";
            correct = num1 * num2;
        }

        const questionText = `Solve: ${num1} ${symbol} ${num2}`;

        // Options generator
        let optionsSet = new Set();
        optionsSet.add(correct);
        while (optionsSet.size < 4) {
            let offset = Math.floor(Math.random() * 15) - 7;
            if (offset !== 0 && (correct + offset) >= 0) {
                optionsSet.add(correct + offset);
            }
        }

        let sortedOpts = Array.from(optionsSet).sort((a,b) => a - b);
        let correctIndex = sortedOpts.indexOf(correct);

        selectedQuestions.push({
            text: questionText,
            options: sortedOpts.map(n => n.toString()),
            correctIndex
        });
    }

    // Fully shuffle standard Fisher-Yates
    for (let i = selectedQuestions.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = selectedQuestions[i];
        selectedQuestions[i] = selectedQuestions[j];
        selectedQuestions[j] = temp;
    }
}

// Start button trigger
document.getElementById("btnStartQuiz").addEventListener("click", () => {
    document.getElementById("btnStartQuiz").style.display = "none";
    generateSeededQuiz();
    renderQuizQuestion();
});

// Render question item in UI
function renderQuizQuestion() {
    const container = document.getElementById("quizInterface");
    const optionsGrid = document.getElementById("quizOptionsList");

    if (currentQuizIdx >= selectedQuestions.length) {
        submitQuizResults();
        return;
    }

    const question = selectedQuestions[currentQuizIdx];

    // Progress updates
    document.getElementById("quizProgressLabel").textContent = `Question ${currentQuizIdx + 1} of ${selectedQuestions.length}`;
    document.getElementById("quizProgressBar").style.width = `${((currentQuizIdx + 1) * 100) / selectedQuestions.length}%`;
    document.getElementById("quizQuestionText").textContent = question.text;

    optionsGrid.innerHTML = "";
    question.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
            if (idx === question.correctIndex) {
                score++;
            }
            currentQuizIdx++;
            renderQuizQuestion();
        });
        optionsGrid.appendChild(btn);
    });
}

// Complete challenge and transmit details
function submitQuizResults() {
    const accuracy = Math.round((score * 100) / selectedQuestions.length);
    const time = Date.now();

    const statsPayload = {
        correctAnswers: score,
        totalQuestions: selectedQuestions.length,
        timestamp: time
    };

    // 1. Sync stats to Firebase
    set(ref(db, `devices/${childUniqueId}/education_stats`), statsPayload)
        .then(() => {
            // 2. Push alert to Parent alerts feed (exact payload match to Kotlin companion)
            const alertsRef = ref(db, `devices/${childUniqueId}/alerts`);
            const alertPayload = {
                message: `🎓 Child completed Brain Quiz (Score: ${score}/${selectedQuestions.length} - Accuracy: ${accuracy}%)`,
                category: "success",
                timestamp: time
            };
            push(alertsRef, alertPayload).then(() => {
                renderQuizSuccessScreen();
            });
        })
        .catch(e => alert("Could not synchronize score. Reconnecting..."));
}

function renderQuizSuccessScreen() {
    const container = document.getElementById("quizInterface");
    container.innerHTML = `
        <div class="quiz-success-panel">
            <span class="success-trophy">🏆</span>
            <h3 style="font-size: 1.4rem; color: var(--color-green); margin-bottom: 0.5rem;">Quiz Complete!</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Your performance stats (${score}/5 score) have been synchronized to your parent.</p>
            <button id="btnRestartQuiz" class="btn-primary" style="background: var(--color-green); border: none; padding: 0.6rem 2rem;">Play Again</button>
        </div>
    `;

    document.getElementById("btnRestartQuiz").addEventListener("click", () => {
        // Restore elements
        container.innerHTML = `
            <div class="progress-labels">
                <span id="quizProgressLabel">Question -- of 5</span>
            </div>
            <div class="progress-bar-container" style="height: 5px; margin-bottom: 1rem;">
                <div class="progress-bar-fill" id="quizProgressBar" style="background: var(--color-green)"></div>
            </div>
            <div class="quiz-question-box" style="background: rgba(0,0,0,0.15); border: 1px solid var(--border-glass); padding: 1.25rem; border-radius: 12px; min-height: 80px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 600; text-align: center;">
                <span id="quizQuestionText">Click start to test your math brainpower!</span>
            </div>
            <div class="quiz-option-list" id="quizOptionsList"></div>
            <button id="btnStartQuiz" class="btn-primary btn-block" style="background: var(--color-green); margin-top: 1.5rem;">Start Challenge</button>
        `;
        
        // Re-bind click
        document.getElementById("btnStartQuiz").addEventListener("click", () => {
            document.getElementById("btnStartQuiz").style.display = "none";
            generateSeededQuiz();
            renderQuizQuestion();
        });
    });
}

// --- 🤝 PAIRING TOKEN SIMULATION GENERATOR ---
document.getElementById("btnGenerateToken").addEventListener("click", () => {
    // Generate random 6-character token
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 6; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    document.getElementById("tokenOutput").textContent = token;

    // Push token to Firebase child_codes node
    const tokenRef = ref(db, `child_codes/${token}`);
    const tokenData = {
        childDeviceId: childUniqueId,
        childName: "Web Child Companion",
        childAge: "10"
    };

    set(tokenRef, tokenData)
        .then(() => {
            console.log(`Generated and uploaded pairing handshake token: ${token}`);
        })
        .catch(err => alert("Token generation failed. Check credentials."));
});

// --- 🚀 INITIALIZATION ---
window.addEventListener("DOMContentLoaded", () => {
    // 1. Boot Telemetry Map Simulator
    initSimMap();

    // 2. Set default active app telemetry in Firebase
    set(ref(db, `devices/${childUniqueId}/telemetry/foregroundApp`), "com.linkly_linksystem.child.EducationalGameActivity");
    
    // 3. Set default connection states
    set(ref(db, `devices/${childUniqueId}/status/isLinked`), true);
});
