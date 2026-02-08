/**
 * Medication Scheduling Algorithm - Full Implementation
 * Features: Condition-based Blocking, Interaction Spacing, and Meal-Relation Placement.
 */
window.calculateMedicationSchedule = async function (data, interactionPairs) {
    const { userProfile, medications } = data;
    const { breakfast, lunch, dinner } = userProfile.mealTimes;
    const schedule = [];
    let warnings = [];
    const SAFETY_BUFFER = 4;
    let orderCounter = 0;

    // --- 1. HEALTH CONDITION RISK CHECK (BLOCKING LOGIC) ---
    // In a real app, you'd fetch this from assets/data/condition_risks.json
    // Defining locally here for immediate functionality:
    const conditionDB = [
        {
            condition: "pregnant",
            restricted_keywords: ["vitamin a", "retinol", "aspirin", "ibuprofen", "isotretinoin"],
            message: "Safety Note: High-dose Vitamin A and NSAIDs (like Ibuprofen) are usually avoided during pregnancy or nursing. Please check with your doctor before taking these."
        },
        {
            condition: "diabetic",
            restricted_keywords: ["pseudoephedrine", "glucosamine", "cough syrup"],
            message: "Blood Sugar Alert: These ingredients can sometimes cause unexpected spikes in blood glucose levels."
        },
        {
            condition: "kidney",
            restricted_keywords: ["naproxen", "ibuprofen", "potassium supplement"],
            message: "Organ Stress Note: These can be tough on the kidneys or liver. It’s best to ask your doctor if a different option is safer for you."
        },
        {
            condition: "high_bp",
            restricted_keywords: ["sudafed", "phenylephrine", "licorice root"],
            message: "Blood Pressure Note: Decongestants and certain herbs can raise your heart rate or blood pressure, which might interfere with your meds."
        }
    ];

    let allowedMedications = [];

    medications.forEach(med => {
        let isBlocked = false;
        const medNameLower = med.name.toLowerCase();

        conditionDB.forEach(risk => {
            if (userProfile.conditions.includes(risk.condition)) {
                const match = risk.restricted_keywords.find(key => medNameLower.includes(key));
                if (match) {
                    warnings.push(`CRITICAL: ${med.name} was removed from schedule. ${risk.message}`);
                    isBlocked = true;
                }
            }
        });

        if (!isBlocked) {
            allowedMedications.push(med);
        }
    });

    // General Kidney/Liver caution if not already caught by specific keywords
    if (userProfile.conditions.includes('kidney') || userProfile.conditions.includes('liver')) {
        warnings.push("Condition Alert: Kidney/Liver concerns detected. Consult your doctor regarding dosage clearance.");
    }

    // --- 2. INTERACTION PAIR SYNC ---
    if (!Array.isArray(interactionPairs) || interactionPairs.length === 0) {
        if (typeof window.checkInteractions === "function") {
            try {
                interactionPairs = await window.checkInteractions(allowedMedications);
            } catch (err) {
                console.warn("Interaction check failed; proceeding without interaction data.", err);
                interactionPairs = [];
            }
        } else {
            interactionPairs = [];
        }
    }

    // --- 3. INITIAL PLACEMENT LOGIC ---
    allowedMedications.forEach(med => {
        let times = [];
        if (med.mealRelation === "with_meal") {
            if (med.freq >= 1) times.push(breakfast);
            if (med.freq >= 2) times.push(dinner);
            if (med.freq >= 3) times.push(lunch);
        } else if (med.mealRelation === "empty") {
            times.push((breakfast - 1 + 24) % 24);
        } else {
            const interval = Math.floor(14 / med.freq);
            for (let i = 0; i < med.freq; i++) {
                times.push((9 + (i * interval)) % 24);
            }
        }

        times.forEach(t => {
            schedule.push({
                name: med.name,
                dosage: med.dosage,
                time: Number(t),
                conflictMoved: false,
                repeatPattern: med.repeatPattern || "daily",
                repeatDays: med.repeatDays || [],
                _order: orderCounter++
            });
        });
    });

    // --- 4. CONFLICT RESOLUTION (THE SEPARATOR) ---
    let stable = false;
    let iterations = 0;

    while (!stable && iterations < 20) {
        stable = true;
        schedule.sort((a, b) => (a.time - b.time) || (a._order - b._order));

        for (let i = 0; i < schedule.length; i++) {
            for (let j = i + 1; j < schedule.length; j++) {
                const medA = schedule[i];
                const medB = schedule[j];

                const interaction = interactionPairs.find(inter => {
                    const p1 = inter.pair[0].toLowerCase().trim();
                    const p2 = inter.pair[1].toLowerCase().trim();
                    const n1 = medA.name.toLowerCase().trim();
                    const n2 = medB.name.toLowerCase().trim();
                    return (n1.includes(p1) && n2.includes(p2)) || (n1.includes(p2) && n2.includes(p1));
                });

                if (interaction) {
                    const rawDiff = Math.abs(medA.time - medB.time);
                    const diff = Math.min(rawDiff, 24 - rawDiff);

                    if (diff < SAFETY_BUFFER) {
                        stable = false;
                        medB.time = (medA.time + SAFETY_BUFFER) % 24;
                        medB.conflictMoved = true;

                        const msg = `Interaction Alert: ${medA.name} and ${medB.name} spaced by ${SAFETY_BUFFER}h. Details: ${interaction.description}`;
                        if (!warnings.some(w => w.includes(medA.name) && w.includes(medB.name))) {
                            warnings.push(msg);
                        }
                    }
                }
            }
        }
        iterations++;
    }

    // --- 5. FINAL FORMATTING ---
    return {
        schedule: schedule.map(item => ({
            name: item.name,
            dosage: item.dosage,
            time: `${String(Math.floor(item.time)).padStart(2, "0")}:00`,
            conflictMoved: item.conflictMoved,
            repeatPattern: item.repeatPattern,
            repeatDays: item.repeatDays
        })),
        warnings: [...new Set(warnings)]
    };
};