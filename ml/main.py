from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import json
import torch
from PIL import Image
from io import BytesIO
from transformers import CLIPProcessor, CLIPModel
import os

app = FastAPI(title="Civic Issue ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load text model ──
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

text_clf = joblib.load(os.path.join(MODEL_DIR, "text_classifier.pkl"))
vectorizer = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))

# ── Load CLIP config ──
with open(os.path.join(MODEL_DIR, "clip_config.json")) as f:
    clip_cfg = json.load(f)

CANDIDATE_LABELS = clip_cfg["candidate_labels"]
LABEL_TO_CATEGORY = clip_cfg["label_to_category"]

# ── Load CLIP model ──
print("Loading CLIP model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
clip_model.eval()
print(f"CLIP loaded on {device}")


def predict_text(text: str) -> dict:
    vec = vectorizer.transform([text])
    category = text_clf.predict(vec)[0]
    proba = text_clf.predict_proba(vec)[0]
    confidence = round(float(max(proba)), 4)
    return {"category": category, "confidence": confidence}


def predict_image(image_bytes: bytes) -> dict:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    inputs = clip_processor(
        text=CANDIDATE_LABELS, images=image,
        return_tensors="pt", padding=True
    ).to(device)
    with torch.no_grad():
        outputs = clip_model(**inputs)
        probs = torch.softmax(outputs.logits_per_image[0], dim=0)
    scores = probs.cpu().tolist()
    top_idx = int(torch.argmax(probs))
    return {
        "category": LABEL_TO_CATEGORY[CANDIDATE_LABELS[top_idx]],
        "confidence": round(scores[top_idx], 4),
    }


def combine(text_result: dict, image_result: Optional[dict]) -> dict:
    if image_result is None:
        return {**text_result, "source": "text_only"}
    
    if image_result["confidence"] >= 0.70:
        final = image_result["category"]
        source = "image"
    else:
        final = text_result["category"]
        source = "text"
    
    return {
        "category": final,
        "confidence": max(text_result["confidence"], image_result["confidence"]),
        "text_prediction": text_result,
        "image_prediction": image_result,
        "source": source,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(
    text: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    text_result = predict_text(text)
    
    image_result = None
    if image and image.filename:
        image_bytes = await image.read()
        image_result = predict_image(image_bytes)
    
    return combine(text_result, image_result)