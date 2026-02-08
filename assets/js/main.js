/**
 * Local Data Engine
 */
window.loadInteractions = async function () {
    try {
        const res = await fetch("assets/data/interaction_dataset.json");
        return await res.json();
    } catch (error) {
        console.error("Local database error", error);
        return [];
    }
};

window.checkInteractions = async function (userDrugs) {
    if (!userDrugs || userDrugs.length < 2) return [];
    const localDB = await window.loadInteractions();
    
    const drugPairs = userDrugs.map(d => d.name.toLowerCase().trim());
    let findings = [];

    localDB.forEach(entry => {
        const d1_db = entry["Drug.1"]?.toLowerCase().trim() || "";
        const d2_db = entry["Drug.2"]?.toLowerCase().trim() || "";

        if (!d1_db || !d2_db) return; // Skip incomplete entries

        // Check all pairs of user drugs against database
        for (let i = 0; i < drugPairs.length; i++) {
            for (let j = i + 1; j < drugPairs.length; j++) {
                const userDrug1 = drugPairs[i];
                const userDrug2 = drugPairs[j];

                // Bidirectional fuzzy matching
                const match1 = (userDrug1.includes(d1_db) || d1_db.includes(userDrug1)) &&
                               (userDrug2.includes(d2_db) || d2_db.includes(userDrug2));
                const match2 = (userDrug1.includes(d2_db) || d2_db.includes(userDrug1)) &&
                               (userDrug2.includes(d1_db) || d1_db.includes(userDrug2));

                if (match1 || match2) {
                    findings.push({
                        pair: [entry["Drug.1"], entry["Drug.2"]],
                        description: entry["Interaction.Description"] || "Potential interaction detected.",
                        severity: "moderate" // Default severity
                    });
                    break; // Found this interaction, don't add duplicates
                }
            }
        }
    });

    return findings;
};

// Initialization
(async () => { console.log("DailyDose: Local Mode Activated."); })();