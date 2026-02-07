const grid = document.getElementById("grid");
const days = ["Time", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let drugRegimen = [];

// 1. Initialize the Calendar Grid
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

// 2. Add Medication to the Staging List
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

// 3. Update the UI List (With X on the Left)
function updateListUI() {
  const list = document.getElementById("list");
  list.innerHTML = "";
  drugRegimen.forEach(item => {
    const li = document.createElement("li");
    li.className = "med-item";
    li.innerHTML = `
            <button class="delete-btn" onclick="removeItem(${item.id})">×</button>
            <div class="med-info">
                <strong>${item.name}</strong><br>
                <span>${item.dosage}</span>
            </div>
        `;
    list.appendChild(li);
  });
}

window.removeItem = (id) => {
  drugRegimen = drugRegimen.filter(i => i.id !== id);
  updateListUI();
};

// 4. Generate Data and Schedule
document.getElementById("generate").onclick = () => {
  const selectedStatuses = [];
  document.querySelectorAll('#statusGroup input:checked').forEach(cb => {
    selectedStatuses.push(cb.value);
  });

  const finalData = {
    userProfile: {
      conditions: selectedStatuses,
      mealTimes: {
        breakfast: Number(document.getElementById("breakfastTime").value),
        lunch: Number(document.getElementById("lunchTime").value),
        dinner: Number(document.getElementById("dinnerTime").value)
      }
    },
    medications: drugRegimen
  };

  console.log("FINAL OBJECT FOR BACKEND:", finalData);
  renderScheduleOnGrid(finalData);
};

// 5. Render Events on the Grid
function renderScheduleOnGrid(data) {
  // Remove existing cards before re-rendering
  document.querySelectorAll(".event-card").forEach(el => el.remove());

  data.medications.forEach((med, idx) => {
    let baseHour = 9;
    if (med.mealRelation === "with_meal") baseHour = data.userProfile.mealTimes.breakfast;
    if (med.mealRelation === "empty") baseHour = data.userProfile.mealTimes.breakfast - 1;

    // Spread doses across 14 hours of the day
    const gap = Math.floor(14 / med.freq);

    for (let d = 1; d <= 7; d++) {
      for (let i = 0; i < med.freq; i++) {
        const scheduledHour = (baseHour + (i * gap)) % 24;
        placeEvent(d, scheduledHour, med, idx);
      }
    }
  });
}

// 6. Positioning Logic for Event Cards
function placeEvent(day, hour, med, index) {
  const ev = document.createElement("div");
  ev.className = "event-card";
  ev.innerHTML = `<strong>${med.name}</strong><br>${med.dosage}`;

  const rowH = 40; // Height of each cell in pixels
  const colW = (grid.offsetWidth - 80) / 7; // Width of each day column (minus time label column)

  // Teal/Green range hue (140 to 180)
  const hue = 155 + (index * 20) % 40;
  ev.style.backgroundColor = `hsl(${hue}, 45%, 35%)`;
  ev.style.color = "white";
  ev.style.position = "absolute";

  // Calculate position: (hour + 1) because row 0 is the day header
  ev.style.top = `${(hour + 1) * rowH + 2}px`;
  ev.style.left = `${80 + (day - 1) * colW + 4}px`;
  ev.style.width = `${colW - 8}px`;
  ev.style.height = `36px`;

  grid.appendChild(ev);
}