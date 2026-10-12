import os, shutil, joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

CSV = "data/raw/civic_issues.csv"
OUT = "text_model"

df = pd.read_csv(CSV)
X, y = df["text"].values, df["category"].values
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

vec = TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True,
                      strip_accents="unicode", analyzer="word", min_df=1)
clf = LogisticRegression(max_iter=1000, C=5.0, class_weight="balanced", solver="lbfgs")
clf.fit(vec.fit_transform(Xtr), ytr)

acc = accuracy_score(yte, clf.predict(vec.transform(Xte)))
print("Classes:", list(clf.classes_))
print("Test accuracy:", acc)

os.makedirs("../model_backup_4class", exist_ok=True)
for f in ("text_classifier.pkl", "tfidf_vectorizer.pkl"):
    p = os.path.join(OUT, f)
    if os.path.exists(p):
        shutil.copy(p, os.path.join("../model_backup_4class", f))

joblib.dump(clf, os.path.join(OUT, "text_classifier.pkl"))
joblib.dump(vec, os.path.join(OUT, "tfidf_vectorizer.pkl"))
print("Saved the 10-class model.")