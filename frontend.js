const grid = document.getElementById("grid");
const emptyMsg = document.getElementById("empty-msg");
const days = ["Time", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let drugRegimen = [];

// 1. Initialize Grid
function createGrid() {
    grid.innerHTML = "";
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

window.removeItem = (id) => {
    drugRegimen = drugRegimen.filter(i => i.id !== id);
    updateListUI();
};

// 3. Algorithm Hand-off
document.getElementById("generate").onclick = () => {
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

    const result = calculateMedicationSchedule(finalData);
    renderResultsToGrid(result.schedule);
    renderWarnings(result.warnings);
};

// 4. Corrected Warning Function (Targeting the area below calendar)
function renderWarnings(warnings) {
    const container = document.getElementById("warning-list-area");
    if (!container) return;
    
    container.innerHTML = ""; 

    if (warnings && warnings.length > 0) {
        warnings.forEach(msg => {
            const banner = document.createElement("div");
            banner.className = "warning-banner";
            banner.innerHTML = `<strong>Warning:</strong> ${msg}`;
            container.appendChild(banner);
        });
    }
}

function renderResultsToGrid(schedule) {
    document.querySelectorAll(".event-card").forEach(el => el.remove());
    schedule.forEach(item => {
        placeEvent(item.day, item.hour, item, item.colorIndex);
    });
}

function placeEvent(day, hour, med, index) {
    const ev = document.createElement("div");
    ev.className = "event-card";
    ev.innerHTML = `<strong>${med.name}</strong><br>${med.dosage}`;

    const rowH = 60; 
    const colW = (grid.offsetWidth - 80) / 7;

    const hue = 160 + (index * 35) % 100;
    ev.style.backgroundColor = `hsl(${hue}, 60%, 40%)`;
    ev.style.color = "white";
    ev.style.position = "absolute";
    ev.style.top = `${(hour + 1) * rowH + 4}px`;
    ev.style.left = `${80 + (day - 1) * colW + 6}px`;
    ev.style.width = `${colW - 12}px`;
    ev.style.height = `52px`;
    ev.style.zIndex = 10;

    grid.appendChild(ev);
}

// 5. Modal Logic (Fixed)
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("disclaimerModal");
    const closeBtn = document.getElementById("closeDisclaimer");

    // Check session storage
    const hasAgreed = sessionStorage.getItem("disclaimerAgreed");

    if (hasAgreed === "true") {
        modal.classList.add("hidden");
    } else {
        modal.classList.remove("hidden");
    }

    closeBtn.onclick = () => {
        modal.classList.add("hidden");
        sessionStorage.setItem("disclaimerAgreed", "true");
    };
});