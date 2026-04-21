import requests
import base64
import os
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
API_URL = "https://router.huggingface.co/hf-inference/models/google/vit-base-patch16-224/zero-shot-image-classification"

CANDIDATE_LABELS = [
    "pothole",
    "garbage dump",
    "broken street light",
    "sewage overflow",
    "fallen tree",
    "road damage",
    "dirty public toilet",
    "water pipe leak",
    "construction noise",
    "other"
]

LABEL_TO_CATEGORY = {
    "pothole on road": "pothole",
    "garbage or waste dump": "garbage",
    "broken street light": "street_light",
    "sewage overflow or open manhole": "sewage",
    "fallen tree blocking road": "tree_hazard",
    "road damage or broken footpath": "road_damage",
    "overflowing public toilet": "public_toilet",
    "water pipe leak flooding road": "water_leak",
    "noise pollution construction": "noise_pollution",
    "other civic issue": "other"
}

def predict_from_path(image_path: str) -> dict:
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    return _call_api(image_bytes)

def predict_from_bytes(image_bytes: bytes) -> dict:
    return _call_api(image_bytes)

def _call_api(image_bytes: bytes) -> dict:
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }

    encoded = base64.b64encode(image_bytes).decode("utf-8")
    payload = {
        "inputs": encoded,
        "parameters": {"candidate_labels": CANDIDATE_LABELS}
    }

    response = requests.post(API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        print(f"HF API error: {response.status_code} {response.text}")
        return {"category": "other", "confidence": 0.0, "all_scores": {}}

    results = response.json()

    if isinstance(results, list) and len(results) > 0:
        top = results[0]
        category = LABEL_TO_CATEGORY.get(top["label"], "other")
        all_scores = {
            LABEL_TO_CATEGORY.get(r["label"], "other"): round(r["score"], 4)
            for r in results
        }
        return {
            "category": category,
            "confidence": round(top["score"], 4),
            "all_scores": all_scores
        }

    return {"category": "other", "confidence": 0.0, "all_scores": {}}

if __name__ == "__main__":
    # Quick test with a sample image
    test_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Pothole_on_I-95.jpg/320px-Pothole_on_I-95.jpg"
    img_bytes = requests.get(test_url).content
    result = predict_from_bytes(img_bytes)
    print("Test result:", result)