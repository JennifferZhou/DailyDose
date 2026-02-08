// Ensure we select existing DOM elements
const grid = document.getElementById("grid");
const emptyMsg = document.getElementById("empty-msg");
const warningArea = document.getElementById("warning-list-area");
const days = ["Time", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let drugRegimen = [];

// 1. Initialize Grid
function createGrid() {
    if (!grid) return;
    grid.innerHTML = "";
    
    // Header Row
    days.forEach(day => {
        const div = document.createElement("div");
        div.className = "cell header";
        div.textContent = day;
        grid.appendChild(div);
    });

    // 24 Hour Rows
    for (let h = 0; h < 24; h++) {
        const timeCell = document.createElement("div");
        timeCell.className = "cell time-label";
        timeCell.textContent = `${h}:00`;
        grid.appendChild(timeCell);

        for (let d = 1; d <= 7; d++) {
            const slot = document.createElement("div");
            slot.className = "cell empty-slot";
            slot.id = `slot-${d}-${h}`; // Coordinates: slot-day-hour
            grid.appendChild(slot);
        }
    }
}
createGrid();

// 2. Add Medication Logic
document.getElementById("drugForm").onsubmit = (e) => {
    e.preventDefault();
    const repeatPattern = document.getElementById("repeatPattern").value;
    let repeatDays = [];
    
    if (repeatPattern === "custom") {
        repeatDays = Array.from(document.querySelectorAll(".custom-day:checked")).map(cb => parseInt(cb.value));
        if (repeatDays.length === 0) {
            alert("Please select at least one day for custom repeat pattern.");
            return;
        }
    }
    
    const drug = {
        id: Date.now(),
        name: document.getElementById("name").value,
        dosage: document.getElementById("dosage").value,
        freq: Number(document.getElementById("freq").value),
        mealRelation: document.getElementById("mealRelation").value,
        repeatPattern: repeatPattern,
        repeatDays: repeatDays
    };
    drugRegimen.push(drug);
    updateListUI();
    e.target.reset();
    document.getElementById("customDaysContainer").style.display = "none";
};

// Show/hide custom days selector
document.getElementById("repeatPattern").onchange = (e) => {
    const customContainer = document.getElementById("customDaysContainer");
    if (e.target.value === "custom") {
        customContainer.style.display = "block";
    } else {
        customContainer.style.display = "none";
    }
};

function updateListUI() {
    const list = document.getElementById("list");
    if (!list) return;
    list.innerHTML = "";
    emptyMsg.style.display = drugRegimen.length === 0 ? "block" : "none";

    drugRegimen.forEach(item => {
        let repeatText = "daily";
        if (item.repeatPattern === "every_other_day") repeatText = "every other day";
        else if (item.repeatPattern === "weekdays") repeatText = "weekdays";
        else if (item.repeatPattern === "weekends") repeatText = "weekends";
        else if (item.repeatPattern === "custom") repeatText = `custom (${item.repeatDays.length} days)`;
        
        const li = document.createElement("li");
        li.className = "med-item";
        li.innerHTML = `
            <button class="delete-btn" onclick="window.removeItem(${item.id})">×</button>
            <div class="med-info">
                <strong>${item.name}</strong><br>
                <span style="font-size: 0.75rem; color: #64748b;">${item.dosage} • ${item.freq}x daily • ${repeatText}</span>
            </div>
        `;
        list.appendChild(li);
    });
}

window.removeItem = (id) => {
    drugRegimen = drugRegimen.filter(i => i.id !== id);
    updateListUI();
};

// 3. Rendering Logic
document.getElementById("generate").onclick = async () => {
    const genBtn = document.getElementById("generate");
    const originalText = genBtn.textContent;
    
    if (drugRegimen.length === 0) {
        alert("Please add at least one medication.");
        return;
    }

    genBtn.disabled = true;
    genBtn.textContent = "Processing...";

    try {
        // 1. Fetch interactions from local JSON engine
        // This MUST return an array of objects like { pair: ["A", "B"], description: "..." }
        const interactionFindings = await window.checkInteractions(drugRegimen);
        
        // 2. Prepare the data package for the algorithm
        const finalData = {
            userProfile: {
                conditions: Array.from(document.querySelectorAll('#statusGroup input:checked')).map(cb => cb.value),
                mealTimes: {
                    breakfast: Number(document.getElementById("breakfastTime").value || 8),
                    lunch: Number(document.getElementById("lunchTime").value || 13),
                    dinner: Number(document.getElementById("dinnerTime").value || 19)
                }
            },
            // Pass a deep copy of medications to prevent reference bugs
            medications: JSON.parse(JSON.stringify(drugRegimen))
        };

        // 3. Get the calculated schedule (Pass findings as the second argument)
        const result = await window.calculateMedicationSchedule(finalData, interactionFindings);
        
        // 4. Update the UI Warnings
        const warningCount = displayWarnings(result.warnings);
        
        // Use the correct ID for scrolling: "warning-list-area" (from your top-level const)
        if (warningCount > 0 && warningArea) {
            warningArea.scrollIntoView({ behavior: "smooth" });
        }

        // 5. Render to Grid
        renderAlgorithmSchedule(result.schedule);
        
        console.log("Schedule successfully generated with " + interactionFindings.length + " interactions caught.");

    } catch (err) {
        console.error("Generation failed:", err);
        alert("An error occurred. Check the console (F12) for details.");
    } finally {
        genBtn.disabled = false;
        genBtn.textContent = originalText;
    }
};

/**
 * Renders the warning banners to the warningArea div
 */
function displayWarnings(warnings) {
    if (!warningArea) return 0;
    warningArea.innerHTML = ""; 
    
    if (warnings && warnings.length > 0) {
        warnings.forEach(msg => {
            const warnBox = document.createElement('div');
            warnBox.className = "warning-banner"; 
            
            // Inline styles to ensure visibility regardless of CSS load state
            Object.assign(warnBox.style, {
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px",
                borderLeft: "5px solid #ef4444",
                fontSize: "0.9rem",
                fontWeight: "500"
            });
            
            warnBox.innerHTML = `<strong>SAFETY ALERT:</strong> ${msg}`;
            warningArea.appendChild(warnBox);
        });
        return warnings.length;
    }
    return 0;
}

/**
 * Determines which days a medication should be shown based on repeat pattern
 */
function getScheduleDays(repeatPattern, repeatDays) {
    const allDays = [1, 2, 3, 4, 5, 6, 7]; // Sun=1, Mon=2, ..., Sat=7 (calendar grid order)
    
    if (repeatPattern === "daily") {
        return allDays;
    } else if (repeatPattern === "every_other_day") {
        return [1, 3, 5, 7]; // Alternate days starting with Sunday
    } else if (repeatPattern === "weekdays") {
        return [2, 3, 4, 5, 6]; // Mon-Fri
    } else if (repeatPattern === "weekends") {
        return [1, 7]; // Sun and Sat
    } else if (repeatPattern === "custom") {
        return repeatDays;
    }
    return allDays; // Default to daily
}

/**
 * Places the medication cards into the correct grid slots based on repeat pattern
 */
function renderAlgorithmSchedule(scheduleArray) {
    // Clear all existing cards first
    document.querySelectorAll(".event-card").forEach(el => el.remove());

    scheduleArray.forEach((item, index) => {
        // item.time is expected as "HH:00" string
        const hour = parseInt(item.time.split(":")[0]);
        
        // Get the days this medication should appear
        const scheduleDays = getScheduleDays(item.repeatPattern, item.repeatDays);
        
        // Place on selected days only
        scheduleDays.forEach(day => {
            const slot = document.getElementById(`slot-${day}-${hour}`);
            if (slot) {
                const card = createVisualCard(item, index);
                slot.appendChild(card);
            }
        });
    });
}

/**
 * Creates the individual medication card element
 */
function createVisualCard(item, index) {
    const ev = document.createElement("div");
    ev.className = "event-card";
    
    // Golden angle color rotation for high contrast
    const hue = (index * 137.5) % 360; 
    
    Object.assign(ev.style, {
        borderLeft: item.conflictMoved ? "4px solid #ef4444" : `4px solid hsl(${hue}, 70%, 40%)`,
        backgroundColor: item.conflictMoved ? "#fff1f2" : `hsl(${hue}, 70%, 96%)`,
        color: item.conflictMoved ? "#991b1b" : `hsl(${hue}, 80%, 20%)`,
        padding: "5px",
        margin: "2px",
        borderRadius: "4px",
        fontSize: "0.75rem",
        cursor: "help",
        border: item.conflictMoved ? "1px dashed #ef4444" : "none"
    });

    if (item.conflictMoved) {
        ev.title = "Time adjusted to prevent a drug-drug interaction.";
    }

    const safetyBadge = item.conflictMoved 
        ? `<span style="float:right; font-size: 0.6rem; background: #ef4444; color: white; padding: 1px 4px; border-radius: 3px;">SAFETY MOVE</span>` 
        : "";

    ev.innerHTML = `
        ${safetyBadge}
        <div style="font-weight:800; text-transform: capitalize;">${item.name}</div>
        <div style="opacity: 0.9;">${item.dosage}</div>
    `;

    return ev;
}

// 4. Print & Export Logic
window.printSchedule = () => window.print();

document.getElementById("exportPDF").onclick = () => {
    window.print();
};

document.getElementById("exportPNG").onclick = async () => {
    if (drugRegimen.length === 0) {
        alert("Please generate a schedule first.");
        return;
    }
    
    const exportBtn = document.getElementById("exportPNG");
    const originalText = exportBtn.textContent;
    exportBtn.disabled = true;
    exportBtn.textContent = "Processing...";
    
    try {
        // Capture the grid element
        const gridElement = document.getElementById("grid");
        if (!gridElement) {
            alert("Could not find schedule to export.");
            return;
        }
        
        // Use html2canvas to convert the grid to PNG
        const canvas = await html2canvas(gridElement, {
            backgroundColor: "#ffffff",
            scale: 2,
            logging: false
        });
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `DailyDose_Schedule_${new Date().toISOString().split("T")[0]}.png`;
            link.click();
            alert("Schedule exported as PNG!");
        });
    } catch (err) {
        console.error("PNG export failed:", err);
        alert("Failed to export PNG. Check console for details.");
    } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = originalText;
    }
};

document.getElementById("exportCalendar").onclick = async () => {
    if (drugRegimen.length === 0) {
        alert("Please generate a schedule first.");
        return;
    }
    
    // Get current schedule from DOM
    const events = [];
    document.querySelectorAll(".event-card").forEach(card => {
        const medName = card.querySelector("div:nth-child(2)")?.textContent || "Medication";
        const dosage = card.querySelector("div:nth-child(3)")?.textContent || "";
        const timeStr = card.parentElement.id.match(/-(\d+)$/)?.[1];
        
        if (timeStr) {
            const hour = parseInt(timeStr);
            const today = new Date();
            const eventDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 0);
            
            events.push({
                name: medName,
                dosage: dosage,
                date: eventDate
            });
        }
    });
    
    if (events.length === 0) {
        alert("No schedule to export.");
        return;
    }
    
    // Generate iCalendar format
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DailyDose//Medication Scheduler//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:DailyDose Schedule
X-WR-TIMEZONE:UTC
BEGIN:VTIMEZONE
TZID:UTC
BEGIN:STANDARD
DTSTART:19700101T000000Z
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
DTSTART:19700101T000000Z
END:STANDARD
END:VTIMEZONE
`;
    
    events.forEach((event, idx) => {
        const dtstart = event.date.toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
        const dtend = new Date(event.date.getTime() + 3600000).toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
        const dtstamp = new Date().toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
        
        icsContent += `BEGIN:VEVENT
UID:dailydose-${Date.now()}-${idx}@dailydose.local
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:Take ${event.name}
DESCRIPTION:Medication: ${event.name}\\nDosage: ${event.dosage}\\n\\nScheduled via DailyDose
LOCATION:Home
STATUS:CONFIRMED
END:VEVENT
`;
    });
    
    icsContent += `END:VCALENDAR`;
    
    // Download the ICS file
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DailyDose_Schedule_${new Date().toISOString().split("T")[0]}.ics`;
    link.click();
    
    alert("Calendar file downloaded! Import it into Google Calendar or any calendar app.");
};

document.addEventListener("DOMContentLoaded", () => {
    // Handle instructions modal
    const instructionsModal = document.getElementById("instructionsModal");
    const helpBtn = document.getElementById("helpBtn");
    const closeInstructions = document.getElementById("closeInstructions");
    
    if (helpBtn && instructionsModal) {
        helpBtn.onclick = () => {
            instructionsModal.style.display = "flex";
        };
    }
    
    if (closeInstructions) {
        closeInstructions.onclick = () => {
            instructionsModal.style.display = "none";
        };
    }
    
    // Handle disclaimer modal
    const modal = document.getElementById("disclaimerModal");
    const closeBtn = document.getElementById("closeDisclaimer");
    if (modal && closeBtn) {
        if (sessionStorage.getItem("disclaimerAgreed") === "true") modal.style.display = "none";
        closeBtn.onclick = () => {
            modal.style.display = "none";
            sessionStorage.setItem("disclaimerAgreed", "true");
        };
    }
});