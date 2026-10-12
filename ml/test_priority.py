from priority_scorer import score_priority

cases = [
    ("pothole", "Pothole near school gate is dangerous for children", "high"),
    ("pothole", "Pothole swallowed my motorcycle wheel today", "medium"),
    ("pothole", "Accident happened because of a deep pothole, rider injured", "critical"),
    ("sewage", "Open manhole at night caused person to fall inside", "critical"),
    ("sewage", "Drain blocked with garbage causing water stagnation", "medium"),
    ("tree_hazard", "Dead tree about to fall on power lines", "critical"),
    ("tree_hazard", "Tree stump left on footpath tripping pedestrians", "low"),
    ("public_toilet", "No water supply in public toilet for weeks", "high"),
    ("noise_pollution", "Honking vehicles near school during exam time", "high"),
    ("other", "Graffiti and vandalism on public property walls", "low"),
]
for cat, text, expected in cases:
    got = score_priority(cat, text)["priority"]
    print("PASS" if got == expected else "FAIL", cat, got, expected)