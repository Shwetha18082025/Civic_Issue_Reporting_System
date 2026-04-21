import pandas as pd
import numpy as np
import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix

def train():
    # Load data
    df = pd.read_csv("data/processed/civic_issues.csv")
    X = df['text'].values
    y = df['category'].values

    print(f"Total samples: {len(df)}")
    print(f"Categories: {list(df['category'].unique())}\n")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Build pipeline: TF-IDF + Logistic Regression
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),      # unigrams + bigrams
            max_features=5000,
            sublinear_tf=True,       # log scaling
            strip_accents='unicode',
            analyzer='word',
            min_df=1,
        )),
        ('clf', LogisticRegression(
            max_iter=1000,
            C=5.0,
            class_weight='balanced',
            solver='lbfgs',            
        ))
    ])

    # Train
    print("Training text classifier...")
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    print("\n=== Classification Report ===")
    print(classification_report(y_test, y_pred))

    # Cross-validation score
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')
    print(f"5-fold CV Accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    # Save model
    os.makedirs("models", exist_ok=True)
    joblib.dump(pipeline, "models/text_classifier.pkl")
    print("\n✅ Model saved to models/text_classifier.pkl")

    # Quick test
    test_inputs = [
        "Large pothole near bus stop causing accidents",
        "Street light not working for 2 weeks",
        "Garbage overflowing near market",
        "Water pipe burst flooding road",
        "Open manhole danger for pedestrians",
        "Tree fallen blocking entire road",
    ]
    print("\n=== Quick Predictions ===")
    for text in test_inputs:
        pred = pipeline.predict([text])[0]
        proba = pipeline.predict_proba([text])[0]
        confidence = max(proba) * 100
        print(f"  '{text[:50]}...' → {pred} ({confidence:.1f}%)")

def predict(text):
    pipeline = joblib.load("models/text_classifier.pkl")
    pred = pipeline.predict([text])[0]
    proba = pipeline.predict_proba([text])[0]
    classes = pipeline.classes_
    scores = dict(zip(classes, proba.tolist()))
    return {
        "category": pred,
        "confidence": float(max(proba)),
        "all_scores": scores
    }

if __name__ == "__main__":
    train()