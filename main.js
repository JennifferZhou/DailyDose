/**
 * 1. Data Normalization & Pair Generation
 */

window.loadInteractions = async function() {
    try {
        const res = await fetch("interaction_dataset.json");
        if (!res.ok) throw new Error("Could not find the JSON file.");
        return await res.json();
    } catch (error) {
        console.warn("Interaction database not found. Running without interaction checks.");
        return [];
    }
};

window.checkInteractions = function(userDrugs, interactionDB) {
    const drugNames = userDrugs.map(d => typeof d === 'string' ? d : d.name);
    const pairs = getDrugPairs(drugNames);
    const results = [];

    for (const [drugA, drugB] of pairs) {
        const match = interactionDB.find(entry => {
            const d1 = normalize(entry["Drug.1"]);
            const d2 = normalize(entry["Drug.2"]);
            return (d1 === drugA && d2 === drugB) || (d1 === drugB && d2 === drugA);
        });

        if (match) {
            results.push({
                pair: [match["Drug.1"], match["Drug.2"]],
                description: match["Interaction.Description"]
            });
        }
    }
    return results;
};

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