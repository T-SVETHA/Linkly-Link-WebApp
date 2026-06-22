import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

// --- 🗂️ STATE MANAGEMENT ---
let activeChildId = "child_device_9988";
let currentListeners = []; // Track active database refs to unbind when switching children
let installedAppsList = []; // Cache list for real-time search filtering
let safeZonesList = []; // Map markers references
let mapElements = {
    miniMap: null,
    fullMap: null,
    miniMarker: null,
    fullMarker: null,
    miniCircleZones: [],
    fullCircleZones: []
};

// Default Simulated Child fallback (matching Android parent SharedPreferences initialization)
const DEFAULT_CHILD = { id: "child_device_9988", name: "Simulated Child" };

// --- 🤝 LOAD LINKED CHILDREN (localStorage) ---
function getLinkedChildren() {
    let list = localStorage.getItem("linkly_children");
    if (!list) {
        // Initialize with default child
        list = JSON.stringify([DEFAULT_CHILD]);
        localStorage.setItem("linkly_children", list);
    }
    try {
        return JSON.parse(list);
    } catch (e) {
        return [DEFAULT_CHILD];
    }
}

function saveLinkedChild(id, name) {
    let list = getLinkedChildren();
    // Prevent duplicate entries
    if (!list.some(child => child.id === id)) {
        list.push({ id, name });
        localStorage.setItem("linkly_children", JSON.stringify(list));
    }
}

// --- 🛠️ HELPER: MANAGE DATABASE LISTENERS ---
function addManagedListener(dbRef, callback) {
    const unsubscribe = onValue(dbRef, callback);
    currentListeners.push({ dbRef, unsubscribe });
}

function clearAllListeners() {
    currentListeners.forEach(listener => {
        listener.unsubscribe();
    });
    currentListeners = [];
}

// --- 🗺️ LEAFLET MAP ENGINE INITIALIZATION ---
function initMaps() {
    const defaultCenter = [12.9716, 77.5946]; // Fallback coordinates
    const defaultZoom = 13;

    // Mini Map (Dashboard)
    if (!mapElements.miniMap) {
        mapElements.miniMap = L.map('miniMap', { zoomControl: false, attributionControl: false }).setView(defaultCenter, defaultZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapElements.miniMap);
        mapElements.miniMarker = L.marker(defaultCenter).addTo(mapElements.miniMap);
    }

    // Full Map (Tracker Page)
    if (!mapElements.fullMap) {
        mapElements.fullMap = L.map('fullMap').setView(defaultCenter, defaultZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapElements.fullMap);
        mapElements.fullMarker = L.marker(defaultCenter).addTo(mapElements.fullMap);
    }
}

// Dynamically center and update location markers
function updateMapsLocation(lat, lng, childName) {
    if (!lat || !lng) return;
    
    const newPos = [lat, lng];
    const markerPopupText = `<b>${childName || 'Child'}</b><br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`;

    if (mapElements.miniMap) {
        mapElements.miniMap.setView(newPos, 14);
        mapElements.miniMarker.setLatLng(newPos).bindPopup(markerPopupText).openPopup();
    }

    if (mapElements.fullMap) {
        mapElements.fullMap.setView(newPos, 14);
        mapElements.fullMarker.setLatLng(newPos).bindPopup(markerPopupText);
    }
}

// Clear map overlays for safe zones
function clearMapSafeZones() {
    mapElements.miniCircleZones.forEach(circle => circle.remove());
    mapElements.fullCircleZones.forEach(circle => circle.remove());
    mapElements.miniCircleZones = [];
    mapElements.fullCircleZones = [];
}

// Draw safe zones circular geofences
function drawMapSafeZones() {
    clearMapSafeZones();
    
    safeZonesList.forEach(zone => {
        if (!zone.latitude || !zone.longitude || !zone.radius) return;

        const options = {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.15,
            radius: zone.radius,
            weight: 2
        };

        if (mapElements.miniMap) {
            const miniCircle = L.circle([zone.latitude, zone.longitude], options).addTo(mapElements.miniMap);
            miniCircle.bindPopup(`<b>${zone.name}</b><br>Radius: ${zone.radius}m`);
            mapElements.miniCircleZones.push(miniCircle);
        }

        if (mapElements.fullMap) {
            const fullCircle = L.circle([zone.latitude, zone.longitude], options).addTo(mapElements.fullMap);
            fullCircle.bindPopup(`<b>${zone.name}</b><br>Radius: ${zone.radius}m`);
            mapElements.fullCircleZones.push(fullCircle);
        }
    });
}

// --- 📡 DATABASE SYNCHRONIZATION (onValue Engine) ---
function bindChildData(childId, childName) {
    clearAllListeners();

    // 1. Connection Status Check
    const linkCheckRef = ref(db, `devices/${childId}/status/isLinked`);
    addManagedListener(linkCheckRef, (snapshot) => {
        const isLinked = snapshot.val() || false;
        const statusBadge = document.getElementById("connectionStatusBadge");
        const statusText = document.getElementById("connectionStatusText");
        
        if (isLinked) {
            statusBadge.className = "connection-pill online";
            statusText.textContent = "Online";
        } else {
            statusBadge.className = "connection-pill offline";
            statusText.textContent = "Offline";
        }
    });

    // 2. Battery telemetry
    const batteryRef = ref(db, `devices/${childId}/telemetry/batteryLevel`);
    addManagedListener(batteryRef, (snapshot) => {
        const pct = snapshot.val();
        const headerText = document.getElementById("headerBatteryText");
        if (pct !== null && pct !== undefined) {
            headerText.textContent = `${pct}%`;
        } else {
            headerText.textContent = "--%";
        }
    });

    // 3. Remote Lockdown Switch state
    const lockdownRef = ref(db, `devices/${childId}/status/isLockedByParent`);
    addManagedListener(lockdownRef, (snapshot) => {
        const isLocked = snapshot.val() || false;
        const toggle = document.getElementById("lockdownSwitch");
        const stateLabel = document.getElementById("lockdownStatusText");
        
        toggle.checked = isLocked;
        stateLabel.textContent = isLocked ? "SYSTEM LOCKED" : "DEVICE UNLOCKED";
    });

    // 4. Bypass Pin override display
    const pinRef = ref(db, `devices/${childId}/status/bypassPin`);
    addManagedListener(pinRef, (snapshot) => {
        const pin = snapshot.val() || "";
        document.getElementById("bypassPinInput").value = pin;
    });

    // 5. Foreground active Application
    const fgAppRef = ref(db, `devices/${childId}/telemetry/foregroundApp`);
    addManagedListener(fgAppRef, (snapshot) => {
        const pkg = snapshot.val() || "None";
        const cleanName = pkg.substring(pkg.lastIndexOf(".") + 1);
        document.getElementById("activeScreenText").textContent = cleanName;
    });

    // 6. Permissions telemetry states
    const permissionsRef = ref(db, `devices/${childId}/permissions`);
    addManagedListener(permissionsRef, (snapshot) => {
        const locationOk = snapshot.child("isLocationGranted").val() || false;
        const usageOk = snapshot.child("isUsageStatsGranted").val() || false;

        const locBadge = document.getElementById("permLocationText");
        const usageBadge = document.getElementById("permUsageText");

        locBadge.className = locationOk ? "permission-status permission-granted" : "permission-status permission-disabled";
        locBadge.textContent = locationOk ? "GRANTED" : "DISABLED";

        usageBadge.className = usageOk ? "permission-status permission-granted" : "permission-status permission-disabled";
        usageBadge.textContent = usageOk ? "GRANTED" : "DISABLED";
    });

    // 7. Real-time GPS Location tracker
    const locationRef = ref(db, `devices/${childId}/location`);
    addManagedListener(locationRef, (snapshot) => {
        const lat = snapshot.child("latitude").val();
        const lng = snapshot.child("longitude").val();
        const time = snapshot.child("timestamp").val();

        const coordsText = document.getElementById("gpsCoordinatesText");
        const stampText = document.getElementById("gpsTimestampText");

        if (lat !== null && lng !== null) {
            coordsText.textContent = `Lat: ${lat.toFixed(5)} | Lng: ${lng.toFixed(5)}`;
            if (time) {
                const date = new Date(time);
                stampText.textContent = `Synced: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } else {
                stampText.textContent = "Synced Just Now";
            }
            updateMapsLocation(lat, lng, childName);
        } else {
            coordsText.textContent = "Telemetry Offline";
            stampText.textContent = "No coordinates synced";
        }
    });

    // 8. Screen Time progress controls
    const screentimeUsedRef = ref(db, `devices/${childId}/screentime_used`);
    const screentimeLimitRef = ref(db, `devices/${childId}/screentime_limit`);
    
    let usedMins = 0;
    let limitMins = 60;

    function renderScreenTimeProgress() {
        document.getElementById("progressUsedText").textContent = `Used: ${usedMins} mins`;
        document.getElementById("progressLimitText").textContent = `Limit: ${limitMins} mins`;
        
        const pct = limitMins > 0 ? (usedMins * 100) / limitMins : 0;
        const fill = document.getElementById("screentimeProgressBar");
        fill.style.width = `${Math.min(pct, 100)}%`;
        
        if (pct >= 100) {
            fill.style.background = "#ef4444"; // Red (Exceeded)
        } else if (pct >= 80) {
            fill.style.background = "#f59e0b"; // Amber (Warning)
        } else {
            fill.style.background = "#3b82f6"; // Blue (Healthy)
        }
    }

    addManagedListener(screentimeUsedRef, (snapshot) => {
        usedMins = snapshot.val() || 0;
        renderScreenTimeProgress();
    });

    addManagedListener(screentimeLimitRef, (snapshot) => {
        limitMins = snapshot.val() || 60;
        document.getElementById("quickLimitInput").value = limitMins;
        renderScreenTimeProgress();
    });

    // 9. Daily Application usage bar charts
    const usageStatsRef = ref(db, `devices/${childId}/usage_stats`);
    addManagedListener(usageStatsRef, (snapshot) => {
        const container = document.getElementById("usageStatsChart");
        container.innerHTML = "";

        if (!snapshot.exists()) {
            container.innerHTML = `<div style="text-align:center; padding: 2rem; color: #94a3b8;">No app time stats synchronized.</div>`;
            return;
        }

        let rawList = [];
        snapshot.forEach(childSnap => {
            const pkg = childSnap.child("packageName").val() || childSnap.key;
            const timeUsed = childSnap.child("timeUsedMins").val() || 0;
            const appLabel = pkg.substring(pkg.lastIndexOf(".") + 1).replace(/^\w/, c => c.toUpperCase());
            rawList.push({ pkg, timeUsed, appLabel });
        });

        // Sort descending by usage mins
        rawList.sort((a, b) => b.timeUsed - a.timeUsed);
        
        const maxVal = rawList[0] ? rawList[0].timeUsed : 60;

        rawList.forEach(item => {
            const pct = maxVal > 0 ? (item.timeUsed * 100) / maxVal : 0;
            const barHtml = `
                <div class="chart-bar-item">
                    <div class="bar-info">
                        <span>${item.appLabel} <span class="bar-pkg">(${item.pkg})</span></span>
                        <span>${item.timeUsed} mins</span>
                    </div>
                    <div class="bar-outer">
                        <div class="bar-inner" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML("beforeend", barHtml);
        });
    });

    // 10. Installed apps directory
    const installedAppsRef = ref(db, `devices/${childId}/installed_apps`);
    addManagedListener(installedAppsRef, (snapshot) => {
        installedAppsList = [];
        if (snapshot.exists()) {
            snapshot.forEach(childSnap => {
                const appName = childSnap.child("appName").val() || "Unknown App";
                const packageName = childSnap.child("packageName").val() || "";
                installedAppsList.push({ appName, packageName });
            });
        }
        renderInstalledAppsGrid(installedAppsList);
    });

    // 11. Safe Zones geo circle fence syncing
    const safeZonesRef = ref(db, `devices/${childId}/safe_zones`);
    addManagedListener(safeZonesRef, (snapshot) => {
        safeZonesList = [];
        const szContainer = document.getElementById("szList");
        szContainer.innerHTML = "";

        if (snapshot.exists()) {
            snapshot.forEach(childSnap => {
                const zone = childSnap.val();
                safeZonesList.push(zone);

                // Render dynamic safe zone items in list
                const zoneHtml = `
                    <div class="sz-item" data-id="${zone.id}">
                        <div class="sz-info">
                            <span class="sz-name">${zone.name}</span>
                            <span class="sz-radius-label">Radius: ${zone.radius}m | Lat: ${zone.latitude.toFixed(4)}</span>
                        </div>
                        <button class="btn-delete" data-id="${zone.id}">❌</button>
                    </div>
                `;
                szContainer.insertAdjacentHTML("beforeend", zoneHtml);
            });
        } else {
            szContainer.innerHTML = `<div style="text-align:center; padding: 1rem; color: #64748b; font-size: 0.8rem;">No boundaries added.</div>`;
        }

        drawMapSafeZones();
    });

    // 12. Recent Alert Logs list syncing
    const alertsListRef = ref(db, `devices/${childId}/alerts`);
    addManagedListener(alertsListRef, (snapshot) => {
        const container = document.getElementById("alertsFeedList");
        container.innerHTML = "";

        if (!snapshot.exists()) {
            container.innerHTML = `<div style="text-align:center; padding: 1.5rem; color:#64748b; font-size:0.85rem;">No notifications recorded for this child node.</div>`;
            return;
        }

        let alertItems = [];
        snapshot.forEach(childSnap => {
            const val = childSnap.val();
            alertItems.push(val);
        });

        // Sort descending by timestamp (recent first)
        alertItems.sort((a, b) => b.timestamp - a.timestamp);

        alertItems.forEach(alert => {
            const time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let bgClass = "rgba(255, 255, 255, 0.02)";
            let borderCol = "var(--border-glass)";
            
            if (alert.category === "success") {
                bgClass = "rgba(16, 185, 129, 0.05)";
                borderCol = "rgba(16, 185, 129, 0.2)";
            } else if (alert.category === "warning") {
                bgClass = "rgba(245, 158, 11, 0.05)";
                borderCol = "rgba(245, 158, 11, 0.2)";
            } else if (alert.category === "error" || alert.category === "lock") {
                bgClass = "rgba(239, 68, 68, 0.05)";
                borderCol = "rgba(239, 68, 68, 0.2)";
            }

            const alertHtml = `
                <div style="background: ${bgClass}; border: 1px solid ${borderCol}; padding: 0.85rem 1.25rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; transition: var(--transition-smooth);">
                    <span style="font-size: 0.88rem; font-weight: 500;">${alert.message}</span>
                    <span style="font-size: 0.75rem; color: var(--text-dark);">${time}</span>
                </div>
            `;
            container.insertAdjacentHTML("beforeend", alertHtml);
        });
    });
}

// --- 📱 RENDER APP DIRECTORY LIST & REAL-TIME FILTERING ---
function renderInstalledAppsGrid(apps) {
    const grid = document.getElementById("installedAppsGrid");
    grid.innerHTML = "";

    if (apps.length === 0) {
        grid.innerHTML = `<div style="text-align:center; grid-column:1/-1; padding:3rem; color:#94a3b8;">No applications found matching query.</div>`;
        return;
    }

    apps.forEach(app => {
        const cleanChar = app.appName.charAt(0).toUpperCase();
        const appItemHtml = `
            <div class="app-grid-item">
                <div class="app-icon-dummy">${cleanChar}</div>
                <div class="app-details">
                    <span class="app-name-label">${app.appName}</span>
                    <span class="app-pkg-label">${app.packageName}</span>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML("beforeend", appItemHtml);
    });
}

// Filter apps list on keystrokes
document.getElementById("searchAppsInput").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        renderInstalledAppsGrid(installedAppsList);
        return;
    }
    const filtered = installedAppsList.filter(app => 
        app.appName.toLowerCase().includes(query) || 
        app.packageName.toLowerCase().includes(query)
    );
    renderInstalledAppsGrid(filtered);
});

// --- 👶 POPULATE DYNAMIC MULTI-CHILD DROPDOWN ---
function renderChildDropdown() {
    const selector = document.getElementById("childSelector");
    selector.innerHTML = "";

    const children = getLinkedChildren();
    children.forEach(child => {
        const option = document.createElement("option");
        option.value = child.id;
        option.textContent = child.name;
        selector.appendChild(option);
    });

    selector.value = activeChildId;
}

// Dropdown change triggers state listeners re-binds
document.getElementById("childSelector").addEventListener("change", (e) => {
    const id = e.target.value;
    const children = getLinkedChildren();
    const target = children.find(c => c.id === id) || DEFAULT_CHILD;
    
    activeChildId = id;
    bindChildData(activeChildId, target.name);
});

// --- 🔒 COMMAND CONTROLLERS: LOCKDOWN, OVERRIDES, SCALARS ---

// Immediate lockdown toggle sync
document.getElementById("lockdownSwitch").addEventListener("change", (e) => {
    const isLocked = e.target.checked;
    set(ref(db, `devices/${activeChildId}/status/isLockedByParent`), isLocked)
        .then(() => {
            console.log(`Transmitted remote lock signal: ${isLocked}`);
        })
        .catch(err => {
            alert("Database write error: Lockdown failed.");
            e.target.checked = !isLocked; // Revert state
        });
});

// Update Administrative Bypass Pin code
document.getElementById("btnUpdatePin").addEventListener("click", () => {
    const pin = document.getElementById("bypassPinInput").value.trim();
    if (pin.length !== 4 || isNaN(pin)) {
        alert("Bypass PIN must be exactly 4 numeric digits.");
        return;
    }
    set(ref(db, `devices/${activeChildId}/status/bypassPin`), pin)
        .then(() => {
            alert("Security Bypass PIN synced successfully to companion device.");
        })
        .catch(e => alert("Synchronization failed. Check Firebase network permissions."));
});

// Update daily Screen Time limit scalars
document.getElementById("btnUpdateLimit").addEventListener("click", () => {
    const mins = parseInt(document.getElementById("quickLimitInput").value);
    if (isNaN(mins) || mins < 0) {
        alert("Please enter a valid positive duration in minutes.");
        return;
    }
    set(ref(db, `devices/${activeChildId}/screentime_limit`), mins)
        .then(() => {
            alert(`Daily screen limit configured to ${mins} minutes.`);
        })
        .catch(e => alert("Daily limit update failed."));
});

// Pin child's current latitude/longitude to Geo-Fence editor
document.getElementById("btnPinCurrentLocation").addEventListener("click", (e) => {
    e.preventDefault();
    
    // Read the current markers coordinates
    const latLng = mapElements.fullMarker.getLatLng();
    if (latLng) {
        document.getElementById("szLat").value = latLng.lat.toFixed(6);
        document.getElementById("szLng").value = latLng.lng.toFixed(6);
        document.getElementById("szRadius").value = 150; // Default radius value
    } else {
        alert("No GPS Coordinates synced yet for child.");
    }
});

// Safe Zone addition handler
document.getElementById("btnSaveSafeZone").addEventListener("click", (e) => {
    e.preventDefault();

    const name = document.getElementById("szName").value.trim();
    const lat = parseFloat(document.getElementById("szLat").value);
    const lng = parseFloat(document.getElementById("szLng").value);
    const radius = parseFloat(document.getElementById("szRadius").value);

    if (!name || isNaN(lat) || isNaN(lng) || isNaN(radius)) {
        alert("Please complete Name, Coordinates, and Radius details.");
        return;
    }

    const newZoneId = "zone_" + Date.now();
    const safeZoneData = {
        id: newZoneId,
        name: name,
        latitude: lat,
        longitude: lng,
        radius: radius
    };

    set(ref(db, `devices/${activeChildId}/safe_zones/${newZoneId}`), safeZoneData)
        .then(() => {
            alert(`Safe boundary "${name}" added successfully.`);
            
            // Clear inputs
            document.getElementById("szName").value = "";
            document.getElementById("szLat").value = "";
            document.getElementById("szLng").value = "";
            document.getElementById("szRadius").value = "";
        })
        .catch(err => alert("Failed to save geofence."));
});

// Safe Zone deletion handler (delegated listener)
document.getElementById("szList").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-delete")) {
        const zoneId = e.target.getAttribute("data-id");
        if (confirm("Delete this geo-fence boundary?")) {
            set(ref(db, `devices/${activeChildId}/safe_zones/${zoneId}`), null)
                .then(() => {
                    console.log(`Boundary deleted: ${zoneId}`);
                });
        }
    }
});

// --- 🤝 PAIRING HANDSHAKE & DEVICE SYNC TOKEN ---
document.getElementById("btnPairSubmit").addEventListener("click", () => {
    const code = document.getElementById("pairCodeInput").value.trim().toUpperCase();
    if (code.length !== 6) {
        alert("Please enter a valid 6-character token.");
        return;
    }

    const codeRef = ref(db, `child_codes/${code}`);
    get(codeRef).then((snapshot) => {
        if (snapshot.exists()) {
            const childId = snapshot.child("childDeviceId").val();
            const name = snapshot.child("childName").val() || "Child Companion";
            const age = snapshot.child("childAge").val() || "--";

            if (childId) {
                // 1. Cache device locally
                saveLinkedChild(childId, name);
                
                // 2. Set profile coordinates in database
                set(ref(db, `devices/${childId}/profile`), { name, age });
                
                // 3. Complete linked handshake handshake
                set(ref(db, `devices/${childId}/status/isLinked`), true)
                    .then(() => {
                        alert(`Successfully linked to child device (${name})!`);
                        document.getElementById("pairCodeInput").value = "";
                        
                        // Switch active state to new child
                        activeChildId = childId;
                        renderChildDropdown();
                        bindChildData(activeChildId, name);
                    });
            }
        } else {
            alert("Pairing token invalid or expired.");
        }
    }).catch(e => {
        alert("Connection error: Link verification failed.");
    });
});

// --- 🧭 ROUTER: DYNAMIC TAB PANES SWITCHING ---
const tabButtons = document.querySelectorAll(".nav-item");
const tabPanes = document.querySelectorAll(".tab-pane");

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        
        // Remove active state
        tabButtons.forEach(b => b.classList.remove("active"));
        tabPanes.forEach(p => p.classList.remove("active"));

        // Set new active tab
        btn.classList.add("active");
        const activePane = document.getElementById(`tab-${targetTab}`);
        activePane.classList.add("active");

        // Force Leaflet Maps to recalibrate container size to prevent grey boxes
        if (targetTab === 'map' && mapElements.fullMap) {
            setTimeout(() => {
                mapElements.fullMap.invalidateSize();
                drawMapSafeZones();
            }, 300);
        } else if (targetTab === 'dashboard' && mapElements.miniMap) {
            setTimeout(() => {
                mapElements.miniMap.invalidateSize();
                drawMapSafeZones();
            }, 300);
        }
    });
});

// --- 🚀 APP BOOTSTRAP INITIALIZATION ---
window.addEventListener("DOMContentLoaded", () => {
    // 1. Populate Dropdown
    renderChildDropdown();
    
    // 2. Initialize Maps
    initMaps();
    
    // 3. Connect First Child database listener
    const children = getLinkedChildren();
    const activeChildObj = children.find(c => c.id === activeChildId) || DEFAULT_CHILD;
    bindChildData(activeChildId, activeChildObj.name);
});
