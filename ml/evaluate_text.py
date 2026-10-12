import pandas as pd, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (classification_report, confusion_matrix,
                             ConfusionMatrixDisplay, accuracy_score, f1_score)

CSV = "data/raw/civic_issues.csv"  # adjust if your path changed
df = pd.read_csv(CSV)
print("Samples:", len(df)); print(df["category"].value_counts())
X, y = df["text"].values, df["category"].values
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

def make():
    return Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1,2), max_features=5000, sublinear_tf=True,
                                   strip_accents="unicode", analyzer="word", min_df=1)),
        ("clf", LogisticRegression(max_iter=1000, C=5.0, class_weight="balanced", solver="lbfgs")),
    ])

pipe = make().fit(Xtr, ytr); pred = pipe.predict(Xte)
print("Test accuracy:", round(accuracy_score(yte, pred), 4))
print("Macro-F1:", round(f1_score(yte, pred, average="macro"), 4),
      "Weighted-F1:", round(f1_score(yte, pred, average="weighted"), 4))
print(classification_report(yte, pred, digits=3))
labels = sorted(set(y)); cm = confusion_matrix(yte, pred, labels=labels); print(cm)
fig, ax = plt.subplots(figsize=(3.45, 3.2), dpi=300)
ConfusionMatrixDisplay(cm, display_labels=labels).plot(ax=ax, xticks_rotation=60, colorbar=False, cmap="Blues")
ax.tick_params(labelsize=6); plt.tight_layout(); plt.savefig("text_confusion.png")
s = cross_val_score(make(), X, y, cv=5, scoring="accuracy")
print("5-fold CV: %.3f +/- %.3f" % (s.mean(), s.std()), s.round(3))