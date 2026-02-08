/**
 * 1. Data Normalization & Pair Generation
 */
const normalize = (name) => name?.toLowerCase().trim();

function getDrugPairs(drugs) {
    const pairs = [];
    for (let i = 0; i < drugs.length; i++) {
        for (let j = i + 1; j < drugs.length; j++) {
            pairs.push([normalize(drugs[i]), normalize(drugs[j])]);
        }
    }
    return pairs;
}

/**
 * 2. Interaction Logic
 * Matches user input against the database structure: 
 * { "drug_1": "...", "drug_2": "...", "Interaction Description": "..." }
 */
function checkInteractions(userDrugs, interactionDB) {
    const pairs = getDrugPairs(userDrugs);
    const results = [];

    for (const [drugA, drugB] of pairs) {
        const match = interactionDB.find(entry => {
            const d1 = normalize(entry.drug_1);
            const d2 = normalize(entry.drug_2);

            // Check bidirectional (A-B or B-A)
            return (d1 === drugA && d2 === drugB) || (d1 === drugB && d2 === drugA);
        });

        if (match) {
            results.push({
                pair: [match.drug_1, match.drug_2],
                description: match["Interaction Description"]
            });
        }
    }
    return results;
}

/**
 * 3. Data Loading (Frontend/Browser approach)
 */
async function loadInteractions() {
    try {
        const res = await fetch("/data/interactions_dataset.json");
        if (!res.ok) throw new Error("Could not find the JSON file.");
        return await res.json();
    } catch (error) {
        console.error("Loading Error:", error);
        return [];
    }
}

/**
 * 4. Main Controller
 */
async function loadData() {
    console.log("Initializing drug interaction check...");

    // Load the database
    const interactionDB = await loadInteractions();

    // Example User Input (Usually from a form)
    const userMeds = ["Trioxsalen ", "Verteporfin"];

    // Run the check
    const findings = checkInteractions(userMeds, interactionDB);

    // Output results
    if (findings.length > 0) {
        console.log("Interactions detected:", findings);
    } else {
        console.log("No interactions found.");
    }
}

// Start the process
loadData();