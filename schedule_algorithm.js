function calculateMedicationSchedule(incomingData) {

    const meds = incomingData.medications; 
    const profile = incomingData.userProfile;
    const mealTimes = [profile.mealTimes.breakfast, profile.mealTimes.lunch, profile.mealTimes.dinner];
    
    let schedule = [];

    // Check conditions
    const safeMeds = meds.filter(drug => {
        let isSafe = true;
        profile.conditions.forEach(condition => {
            if (!checkDrugSafety(condition, drug)) {
                isSafe = false;
            }
        });
        return isSafe;
    });

    // interaction check (Backend Mockup)
    // Assuming checkInteractions returns an array of drugs that don't clash
    const validatedMeds = typeof checkInteractions === 'function' 
        ? checkInteractions(safeMeds) 
        : safeMeds;

    // logic 
    validatedMeds.forEach(drug => {

        if (drug.freq > 3) {
            const dayStart = profile.mealTimes.breakfast;
            const dayEnd = 22; 
            const gap = Math.floor((dayEnd - dayStart) / (drug.freq - 1));
            
            for (let i = 0; i < drug.freq; i++) {
                const time = dayStart + (i * gap);
                addToSchedule(schedule, time, drug);
            }
        } 
        else {
            let buffer = (drug.mealRelation === "empty") ? -2 : 0;
            
            for (let i = 0; i < drug.freq; i++) {
                const targetTime = mealTimes[i] + buffer;
                addToSchedule(schedule, targetTime, drug);
            }
        }
    });

    return schedule;
}

function checkDrugSafety(condition, drug) {
    const restrictions = {
        "kidney": ["ibuprofen", "naproxen"],
        "pregnant": ["retinoids", "warfarin"],
        "high_bp": ["pseudoephedrine"]
    };

    const forbidden = restrictions[condition] || [];
    return !forbidden.includes(drug.name.toLowerCase());
}

function addToSchedule(schedule, time, drug) {
    const normalizedTime = (time + 24) % 24; 
    schedule.push({
        time: `${normalizedTime}:00`,
        name: drug.name,
        dosage: drug.dosage
    });
}