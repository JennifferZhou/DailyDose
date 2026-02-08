// Ensure we select existing DOM elements
const grid = document.getElementById("grid");
const emptyMsg = document.getElementById("empty-msg");
const warningArea = document.getElementById("warning-list-area");
const days = ["Time", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let drugRegimen = [];

// 1. Initialize Grid
function createGrid() {
    grid.innerHTML = "";
    // Set explicit grid template for easier calculation
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "80px repeat(7, 1fr)";
    grid.style.position = "relative"; // REQUIRED for absolute cards

    days.forEach(day => {
        const div = document.createElement("div");
        div.className = "cell header";
        div.textContent = day;
        grid.appendChild(div);
    });

    for (let h = 0; h < 24; h++) {
        const timeCell = document.createElement("div");
        timeCell.className = "cell time-label";
        timeCell.textContent = `${h}:00`;
        grid.appendChild(timeCell);

        for (let d = 0; d < 7; d++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "cell empty-slot";
            grid.appendChild(emptyCell);
        }
    }
}
createGrid();

// 2. Add Medication Logic
document.getElementById("drugForm").onsubmit = (e) => {
    e.preventDefault();
    const drug = {
        id: Date.now(),
        name: document.getElementById("name").value,
        dosage: document.getElementById("dosage").value,
        freq: Number(document.getElementById("freq").value),
        mealRelation: document.getElementById("mealRelation").value
    };
    drugRegimen.push(drug);
    updateListUI();
    e.target.reset();
};

function updateListUI() {
    const list = document.getElementById("list");
    list.innerHTML = "";
    emptyMsg.style.display = drugRegimen.length === 0 ? "block" : "none";

    drugRegimen.forEach(item => {
        const li = document.createElement("li");
        li.className = "med-item";
        li.innerHTML = `
            <button class="delete-btn" onclick="removeItem(${item.id})">×</button>
            <div class="med-info">
                <strong>${item.name}</strong><br>
                <span style="font-size: 0.75rem; color: #64748b;">${item.dosage} • ${item.freq}x daily</span>
            </div>
        `;
        list.appendChild(li);
    });
}

// Fixed: Attach removeItem to window so inline onclick works
window.removeItem = (id) => {
    drugRegimen = drugRegimen.filter(i => i.id !== id);
    updateListUI();
};

// 3. Algorithm Hand-off & Rendering
document.getElementById("generate").onclick = async () => {
    // Safety check: ensure the functions from other files exist
    if (typeof loadInteractions !== 'function' || typeof calculateMedicationSchedule !== 'function') {
        console.error("Critical: main.js or schedule_algorithm.js not loaded.");
        alert("System error: Interaction logic not found.");
        return;
    }

    const interactionDB = await loadInteractions();

    const finalData = {
        userProfile: {
            conditions: Array.from(document.querySelectorAll('#statusGroup input:checked')).map(cb => cb.value),
            mealTimes: {
                breakfast: Number(document.getElementById("breakfastTime").value),
                lunch: Number(document.getElementById("lunchTime").value),
                dinner: Number(document.getElementById("dinnerTime").value)
            }
        },
        medications: drugRegimen
    };

    const result = calculateMedicationSchedule(finalData, interactionDB);
    displayWarnings(result.warnings);
    renderAlgorithmSchedule(result.schedule);
};

function displayWarnings(warnings) {
    warningArea.innerHTML = ""; 
    if (warnings && warnings.length > 0) {
        warnings.forEach(msg => {
            const warnBox = document.createElement('div');
            warnBox.className = "warning-banner"; 
            warnBox.innerHTML = `<strong>IMPORTANT</strong> ${msg.replace(/⚠️|🚨/g, '')}`;
            warningArea.appendChild(warnBox);
        });
    }
}

function renderAlgorithmSchedule(scheduleArray) {
    document.querySelectorAll(".event-card").forEach(el => el.remove());

    const hourGroups = {};
    scheduleArray.forEach(item => {
        const hour = typeof item.time === 'string' ? parseInt(item.time.split(":")[0]) : item.time;
        if (!hourGroups[hour]) hourGroups[hour] = [];
        hourGroups[hour].push(item);
    });

    Object.keys(hourGroups).forEach(hour => {
        const medsInThisHour = hourGroups[hour];
        medsInThisHour.forEach((item, index) => {
            for (let day = 1; day <= 7; day++) {
                createVisualCard(day, parseInt(hour), item, index, medsInThisHour.length);
            }
        });
    });
}

function createVisualCard(day, hour, item, index, totalInHour) {
    const ev = document.createElement("div");
    ev.className = "event-card";
    ev.innerHTML = `<strong>${item.name}</strong><br>${item.dosage}`;

    // Improved math for card placement
    const rowH = 50; 
    const headerH = 40; // Height of the "Day" labels
    const colW = (grid.offsetWidth - 80) / 7; 
    const splitW = (colW - 4) / totalInHour; // Gap calculation
    
    const hue = 200 + (index * 60); // Variations of professional blue
    ev.style.backgroundColor = `hsl(${hue}, 70%, 45%)`;
    ev.style.color = "white";
    ev.style.position = "absolute";
    ev.style.borderRadius = "4px";
    ev.style.padding = "2px";
    ev.style.fontSize = "0.7rem";
    ev.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";

    // Top calculation accounts for the header row
    ev.style.top = `${headerH + (hour * rowH) + 4}px`;
    const baseLeft = 80 + (day - 1) * colW + 2;
    ev.style.left = `${baseLeft + (index * splitW)}px`;
    
    ev.style.width = `${splitW - 2}px`;
    ev.style.height = `42px`;
    ev.style.zIndex = 10 + index;

    if (totalInHour > 2) {
        ev.style.fontSize = "0.6rem";
        ev.innerHTML = `<strong>${item.name}</strong>`;
    }

    grid.appendChild(ev);
}

// 4. Modal Logic
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("disclaimerModal");
    const closeBtn = document.getElementById("closeDisclaimer");
    if (sessionStorage.getItem("disclaimerAgreed") === "true") {
        modal.style.display = "none";
    }
    closeBtn.onclick = () => {
        modal.style.display = "none";
        sessionStorage.setItem("disclaimerAgreed", "true");
    };
});