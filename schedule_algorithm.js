function calculateMedicationSchedule(data, interactionDB) {
    const { userProfile, medications } = data;
    const { breakfast, lunch, dinner } = userProfile.mealTimes;
    const schedule = [];
    const warnings = [];

    // 1. Check for Drug-Drug Interactions
    const interactions = checkInteractions(medications, interactionDB);
    interactions.forEach(inter => {
        warnings.push(`Interaction between ${inter.pair[0]} and ${inter.pair[1]}: ${inter.description}`);
    });

    // 2. Medical Condition Warnings
    if (userProfile.conditions.includes('kidney')) {
        warnings.push("Kidney/Liver concern: Ensure you've discussed dosage clearance with your doctor.");
    }
    if (userProfile.conditions.includes('pregnant')) {
        warnings.push("Pregnancy: Some supplements/meds cross the placenta. Verify safety with your OB-GYN.");
    }

    // 3. Simple Scheduling Logic
    medications.forEach(med => {
        let times = [];
        
        // Logic based on frequency and meal relation
        if (med.mealRelation === "with_meal") {
            if (med.freq >= 1) times.push(breakfast);
            if (med.freq >= 2) times.push(dinner);
            if (med.freq >= 3) times.push(lunch);
        } else if (med.mealRelation === "empty") {
            // Take 1 hour before meals or late night
            if (med.freq >= 1) times.push((breakfast - 1 + 24) % 24);
            if (med.freq >= 2) times.push((dinner - 1 + 24) % 24);
        } else {
            // Anytime - Space out evenly starting at 9am
            for (let i = 0; i < med.freq; i++) {
                times.push((9 + (i * Math.floor(12 / med.freq))) % 24);
            }
        }

        times.forEach(t => {
            schedule.push({
                name: med.name,
                dosage: med.dosage,
                time: `${t}:00`
            });
        });
    });

    return { schedule, warnings };
}