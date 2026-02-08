# About DailyDose

Drug-to-drug, drug-to-vitamin, and drug-to-body interactions are often difficult to understand and keep in balance when dealing with a large variety of medications. DailyDose was designed to help users manage prescription medications and daily supplement needs, taking into account the user's health statuses, dietary needs, and various other parameters to create a personalized timetable of when to take their medications, so that they don't overdose, miss a dose, or accidentally intake a potentially dangerous combination of drugs.

## Features

- Detects drug-drug and drug-vitamin interaction risks
- Separates conflicting medications with safety spacing
- Respects meal timing (with food, empty stomach, anytime)
- Flags health-condition risks (pregnancy, diabetes, kidney/liver, blood pressure)
- Generates a 24-hour weekly schedule
- Exports to PDF, PNG, and calendar (`.ics`) for Google Calendar import

## Built With

- HTML5
- CSS3
- Vanilla JavaScript (ES6)
- `html2canvas` (CDN) for PNG export
- Local datasets in `assets/data/`
- Google Fonts (Inter)
- No backend or database (runs entirely in the browser)

## Data Sources

Local files used by the interaction engine and condition warnings:

- `assets/data/interaction_dataset.json`
- `assets/data/db_drug_interactions.csv`
- `assets/data/condition_risks.json`

## How It Works (Short Version)

1. You enter meds, dosage, frequency, and timing rules.
2. The local interaction engine scans for unsafe pairs.
3. The scheduler places doses around meals and enforces minimum spacing.
4. A visual grid renders the final plan.
5. You export or print your schedule.

## Disclaimer

DailyDose is a scheduling tool and **not** medical advice. Always consult a healthcare professional before starting, stopping, or changing medications.

## License

MIT. See `LICENSE` for details.

## Citations

- Selvarajan, S., Das, S., Behera, S., Xavier, A., & Dharanipragada, S. (2019). Are drug-drug interactions a real clinical concern? Perspectives in Clinical Research, 10(2), 62. <https://doi.org/10.4103/picr.picr_55_18>
- Zhao, Y., Yin J., Zhang L., Zhang Y., Chen X. (2023). Drug-drug interaction prediction: databases, web servers and computational models. <https://pmc.ncbi.nlm.nih.gov/articles/PMC10782925/>
