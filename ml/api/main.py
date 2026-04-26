from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
# NEW
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from priority.priority_scorer import score_priority
from pydantic import BaseModel
from typing import Optional
import joblib
import json
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from io import BytesIO
import os

app = FastAPI(title="Civic Issue ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# ── Load text model ──
print("Loading text classifier...")
text_clf  = joblib.load(os.path.join(MODEL_DIR, "text_classifier.pkl"))
vectorizer = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))
print("✅ Text classifier loaded!")

# ── Load EfficientNet image model ──
print("Loading EfficientNet image classifier...")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

with open(os.path.join(MODEL_DIR, "efficientnet_civic_meta.json")) as f:
    img_meta = json.load(f)

IDX_TO_CLASS = img_meta["idx_to_class"]
NUM_CLASSES  = img_meta["num_classes"]

class CivicIssueClassifier(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.base = models.efficientnet_b0(weights=None)
        in_features = self.base.classifier[1].in_features
        self.base.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes)
        )
    def forward(self, x):
        return self.base(x)

img_model = CivicIssueClassifier(num_classes=NUM_CLASSES)
img_model.load_state_dict(
    torch.load(
        os.path.join(MODEL_DIR, "efficientnet_civic.pt"),
        map_location=device
    )
)
img_model.to(device)
img_model.eval()
print(f"✅ EfficientNet loaded on {device}! Classes: {img_meta['classes']}")

# ── Image transform ──
img_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])


def predict_text(text: str) -> dict:
    vec       = vectorizer.transform([text])
    category  = text_clf.predict(vec)[0]
    proba     = text_clf.predict_proba(vec)[0]
    classes   = text_clf.classes_
    confidence = round(float(max(proba)), 4)
    all_scores = {c: round(float(p), 4) for c, p in zip(classes, proba)}
    return {
        "category":   category,
        "confidence": confidence,
        "all_scores": all_scores
    }


def predict_image(image_bytes: bytes) -> dict:
    image  = Image.open(BytesIO(image_bytes)).convert("RGB")
    tensor = img_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = img_model(tensor)
        probs  = torch.softmax(output, dim=1)[0]

    scores    = probs.cpu().tolist()
    top_idx   = int(torch.argmax(probs).item())
    category  = IDX_TO_CLASS[str(top_idx)]
    confidence = round(scores[top_idx], 4)
    all_scores = {IDX_TO_CLASS[str(i)]: round(s, 4) for i, s in enumerate(scores)}

    return {
        "category":   category,
        "confidence": confidence,
        "all_scores": all_scores
    }


def combine(text_result: dict, image_result: Optional[dict], description: str) -> dict:
    if image_result is None:
        final_category = text_result["category"]
        confidence     = text_result["confidence"]
        source         = "text_only"
    elif image_result["confidence"] >= 0.80:
        # Trust image if very confident
        final_category = image_result["category"]
        confidence     = image_result["confidence"]
        source         = "image"
    elif image_result["confidence"] >= 0.60 and image_result["category"] == text_result["category"]:
        # Both agree — boost confidence
        final_category = text_result["category"]
        confidence     = round((text_result["confidence"] + image_result["confidence"]) / 2, 4)
        source         = "combined"
    else:
        # Default to text
        final_category = text_result["category"]
        confidence     = text_result["confidence"]
        source         = "text"

    return {
        "category":        final_category,
        "confidence":      confidence,
        "text_prediction": text_result,
        "image_prediction": image_result,
        "source":          source,
    }


@app.get("/health")
def health():
    return {
        "status":  "ok",
        "models":  ["text_classifier", "efficientnet_image"],
        "classes": img_meta["classes"],
        "image_model_accuracy": img_meta["best_test_accuracy"]
    }


@app.post("/predict")
async def predict(
    text:  str            = Form(...),
    image: Optional[UploadFile] = File(None),
):
    # 1. Text prediction
    text_result = predict_text(text)

    # 2. Image prediction (if provided)
    image_result = None
    if image and image.filename:
        image_bytes  = await image.read()
        image_result = predict_image(image_bytes)

    # 3. Combine results
    result = combine(text_result, image_result, text)

    # 4. Priority scoring
    priority_result = score_priority(result["category"], text)
    result["priority"]         = priority_result["priority"]
    result["priority_score"]   = priority_result["score"]
    result["matched_keyword"]  = priority_result["matched_keyword"]

    return result