const grid = document.getElementById("grid");
const emptyMsg = document.getElementById("empty-msg");
const days = ["Time", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let drugRegimen = [];

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

document.getElementById("generate").onclick = () => {
  const selectedStatuses = Array.from(document.querySelectorAll('#statusGroup input:checked')).map(cb => cb.value);

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

  renderScheduleOnGrid(finalData);
};

function renderScheduleOnGrid(data) {
  document.querySelectorAll(".event-card").forEach(el => el.remove());

  data.medications.forEach((med, idx) => {
    let baseHour = 9;
    if (med.mealRelation === "with_meal") baseHour = data.userProfile.mealTimes.breakfast;
    if (med.mealRelation === "empty") baseHour = data.userProfile.mealTimes.breakfast - 1;

    // Use a 12-hour window for dosing spacing
    const gap = Math.max(2, Math.floor(12 / med.freq));

    for (let d = 1; d <= 7; d++) {
      for (let i = 0; i < med.freq; i++) {
        const scheduledHour = (baseHour + (i * gap)) % 24;
        placeEvent(d, scheduledHour, med, idx);
      }
    }
  });
}

function placeEvent(day, hour, med, index) {
  const ev = document.createElement("div");
  ev.className = "event-card";
  ev.innerHTML = `<strong>${med.name}</strong><br>${med.dosage}`;

  const rowH = 50;
  const colW = (grid.offsetWidth - 80) / 7;

  const hue = 160 + (index * 35) % 100; // Diverse teal/blue/purple palette
  ev.style.backgroundColor = `hsl(${hue}, 60%, 40%)`;
  ev.style.color = "white";
  ev.style.position = "absolute";

  ev.style.top = `${(hour + 1) * rowH + 4}px`;
  ev.style.left = `${80 + (day - 1) * colW + 6}px`;
  ev.style.width = `${colW - 12}px`;
  ev.style.height = `42px`;
  ev.style.zIndex = index + 1;

  grid.appendChild(ev);
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("disclaimerModal");
  const closeBtn = document.getElementById("closeDisclaimer");

  // Check if user already agreed during this session
  if (sessionStorage.getItem("disclaimerAgreed")) {
    modal.classList.add("hidden");
  }

  closeBtn.onclick = () => {
    // Hide the modal
    modal.classList.add("hidden");
    // Remember the choice for this session
    sessionStorage.setItem("disclaimerAgreed", "true");
  };
});