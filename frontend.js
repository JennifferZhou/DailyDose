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

// 3. Algorithm Hand-off & Rendering
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

    // The result from your schedule_algorithm.js
    const result = calculateMedicationSchedule(finalData);

    // Render the visual plan
    renderAlgorithmSchedule(result);
    
    // Note: If your algorithm returns an object like {schedule: [], warnings: []}
    // you would use result.schedule below instead.
};

function renderAlgorithmSchedule(scheduleArray) {
    // Clear old cards first
    document.querySelectorAll(".event-card").forEach(el => el.remove());

    // 1. Group items by their hour to find overlaps
    const hourGroups = {};
    scheduleArray.forEach(item => {
        const hour = typeof item.time === 'string' ? parseInt(item.time.split(":")[0]) : item.time;
        if (!hourGroups[hour]) hourGroups[hour] = [];
        hourGroups[hour].push(item);
    });

    // 2. Render each group
    Object.keys(hourGroups).forEach(hour => {
        const medsInThisHour = hourGroups[hour];
        const totalInHour = medsInThisHour.length;

        medsInThisHour.forEach((item, index) => {
            for (let day = 1; day <= 7; day++) {
                // Pass the index and total count to the visual card creator
                createVisualCard(day, parseInt(hour), item, index, totalInHour);
            }
        });
    });
}

function createVisualCard(day, hour, item, index, totalInHour) {
    const ev = document.createElement("div");
    ev.className = "event-card";
    ev.innerHTML = `<strong>${item.name}</strong><br>${item.dosage}`;

    const rowH = 50; 
    const fullColW = (grid.offsetWidth - 80) / 7; 

    // CALCULATE SPLIT WIDTH
    // If there are 2 meds, each gets 50% width. If 3, each gets 33%, etc.
    const splitW = (fullColW - 12) / totalInHour;
    
    const hue = 160 + (index * 40) % 120;
    ev.style.backgroundColor = `hsl(${hue}, 60%, 40%)`;
    ev.style.color = "white";
    ev.style.position = "absolute";

    // COORDINATES
    ev.style.top = `${(hour + 1) * rowH + 4}px`;
    
    // SHIFT LEFT based on the index
    // Base left + column offset + (index * width of one split card)
    const baseLeft = 80 + (day - 1) * fullColW + 6;
    ev.style.left = `${baseLeft + (index * splitW)}px`;
    
    ev.style.width = `${splitW}px`; // Use the new narrow width
    ev.style.height = `42px`;
    ev.style.zIndex = 10 + index;

    // Small UI polish: hide dosage if the box is too skinny
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

    const hasAgreed = sessionStorage.getItem("disclaimerAgreed");
    if (hasAgreed === "true") {
        modal.style.display = "none";
    }

    closeBtn.onclick = () => {
        modal.style.display = "none";
        sessionStorage.setItem("disclaimerAgreed", "true");
    };
});