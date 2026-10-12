PRIORITY_RULES = {
    "road_damage": {
        "critical": ["collapsed", "cave", "sinkhole", "bridge", "highway", "emergency", "accident happened"],
        "high":     ["pothole", "crater", "broken", "dangerous", "school", "hospital", "flooding"],
        "medium":   ["crack", "damage", "rough", "uneven"],
        "low":      ["faded", "marking", "minor"],
    },
    "garbage": {
        "critical": ["biomedical", "toxic", "chemical", "hospital waste", "dead animal"],
        "high":     ["overflowing", "rats", "mosquito", "disease", "smell", "water source", "school"],
        "medium":   ["not collected", "dump", "pile", "burning"],
        "low":      ["litter", "bin full", "scattered"],
    },
    "street_light": {
        "critical": ["accident", "robbery", "assault", "crime", "unsafe", "attack"],
        "high":     ["entire road", "multiple", "dark stretch", "school", "hospital", "atm", "women"],
        "medium":   ["not working", "flickering", "broken", "fused"],
        "low":      ["always on", "wasting", "single", "one light"],
    },
    "water_leak": {
        "critical": ["contaminated", "sewage mixing", "no supply", "burst main", "flooding road"],
        "high":     ["pipe burst", "days without", "week without", "dirty water", "smell"],
        "medium":   ["leaking", "low pressure", "irregular supply"],
        "low":      ["meter issue", "billing", "minor drip"],
    },
        "pothole": {
        "critical": ["accident", "injured", "crash", "collapsed", "sinkhole", "ambulance", "emergency"],
        "high":     ["highway", "school", "hospital", "children", "deep", "crater", "night", "flyover", "bridge", "traffic"],
        "medium":   ["pothole", "damage", "uneven", "unfixed", "patch"],
        "low":      ["minor", "small", "shallow"],
    },
    "sewage": {
        "critical": ["open manhole", "contaminated", "drinking water", "toxic", "sewer gas", "fell into", "collapsed", "emergency"],
        "high":     ["overflow", "flooding", "entering houses", "hospital", "school", "dengue", "mosquito", "stagnant"],
        "medium":   ["blocked", "clogged", "choked", "smell", "stench", "foul", "drain"],
        "low":      ["minor", "desilting", "cleaning"],
    },
    "tree_hazard": {
        "critical": ["power line", "electric wire", "live wire", "high tension", "transformer", "fire", "injured", "ambulance"],
        "high":     ["fallen", "blocking", "uprooted", "leaning", "about to fall", "ready to fall", "school", "hospital", "building", "highway"],
        "medium":   ["overhanging", "branch", "roots", "dead tree", "dry tree", "pruning"],
        "low":      ["trimming", "stump", "overgrown"],
    },
    "public_toilet": {
        "critical": ["exposed wiring", "electrical", "assault", "unsafe", "emergency"],
        "high":     ["no water", "overflow", "women", "hospital", "school", "children", "locked", "unhygienic", "disease", "differently abled"],
        "medium":   ["dirty", "broken", "smell", "not cleaned", "soap", "leaking", "clogged"],
        "low":      ["mirror", "dustbin", "minor", "paint"],
    },
    "noise_pollution": {
        "critical": ["explosive", "blast"],
        "high":     ["hospital", "patients", "school", "examination", "exam time", "children", "elderly", "midnight", "night", "late night"],
        "medium":   ["loudspeaker", "speaker", "generator", "construction", "horn", "honking", "music", "crackers", "machinery"],
        "low":      ["occasional", "minor", "once"],
    },
    "other": {
        "critical": ["live wire", "electric wire", "electrocution", "short circuit", "fire", "biting", "dog bite", "collapse", "emergency"],
        "high":     ["accident", "children", "dangerous", "hazard", "school", "hospital", "traffic signal", "stray", "mosquito", "unsafe"],
        "medium":   ["not working", "broken", "damaged", "no service", "encroachment", "illegal", "power cut"],
        "low":      ["graffiti", "billboard", "banner", "vandalism", "minor", "signboard"],
    },
}

PRIORITY_SCORES = {"critical": 4, "high": 3, "medium": 2, "low": 1}
SCORE_TO_PRIORITY = {4: "critical", 3: "high", 2: "medium", 1: "low"}


def score_priority(category: str, description: str) -> dict:
    text = description.lower()
    category = category.lower()

    rules = PRIORITY_RULES.get(category, {})
    best_score = 1  # default low

    matched_level = "low"
    matched_keyword = None

    for level, keywords in rules.items():
        for kw in keywords:
            if kw in text:
                score = PRIORITY_SCORES[level]
                if score > best_score:
                    best_score = score
                    matched_level = level
                    matched_keyword = kw

    return {
        "priority": matched_level,
        "score": best_score,
        "matched_keyword": matched_keyword,
        "category": category,
    }


if __name__ == "__main__":
    tests = [
        ("road_damage", "Large pothole near school causing accidents daily"),
        ("garbage",     "Overflowing dustbin near water source attracting rats"),
        ("street_light","Entire road dark causing robbery risk at night"),
        ("water_leak",  "Sewage mixing with drinking water supply for 3 days"),
        ("road_damage", "Faded road marking on service lane"),
    ]
    for cat, desc in tests:
        result = score_priority(cat, desc)
        print(f"{result['priority'].upper():8} | {cat:12} | {desc[:50]}")