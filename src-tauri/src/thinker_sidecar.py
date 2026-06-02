import sys
import os
import json
import sqlite3
import random

# Try to import ML libraries; fall back to pure-Python if unavailable.
try:
    import pandas as pd
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.ensemble import RandomForestClassifier
    HAS_ML = True
except ImportError:
    HAS_ML = False


def load_seed_data(seed_csv_path):
    """Loads synthetic developer accomplishments from the seed CSV."""
    seed_tasks = []
    if os.path.exists(seed_csv_path):
        try:
            with open(seed_csv_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for line in lines[1:]:
                    parts = line.strip().split(',')
                    if len(parts) >= 2:
                        seed_tasks.append({
                            "text": parts[0].strip('"'),
                            "targetCode": parts[1].strip('"'),
                        })
        except Exception as e:
            sys.stderr.write(f"Error loading seed CSV: {e}\n")

    if not seed_tasks:
        seed_tasks = [
            {"text": "Run R quality-check scripts on the latest CBMS dataset", "targetCode": "IPCR-A-102"},
            {"text": "Standardize component tokens across the CBMS Portal", "targetCode": "IPCR-B-004"},
            {"text": "Draft the cutoff output summary for verification", "targetCode": "IPCR-A-101"},
            {"text": "Resolve the Vue 3 router hydration mismatch in CBMS", "targetCode": "IPCR-B-004"},
            {"text": "Refactor the Excel VBA verification macros for CBMS 2026", "targetCode": "IPCR-B-004"},
            {"text": "Document the CBMS Portal API endpoints", "targetCode": "IPCR-A-101"},
            {"text": "Process weekly CBMS data updates and clean outputs", "targetCode": "IPCR-A-102"},
            {"text": "Run the technical evidence review for the compliance audit", "targetCode": "IPCR-ADMIN"},
        ]
    return seed_tasks


def get_db_logs(db_path, member_id, mode):
    """Reads logs from SQLite, scoped to a member or the whole team."""
    logs = []
    if not os.path.exists(db_path):
        return logs
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        group = mode == 'group'

        def query(sql_all, sql_one):
            try:
                if group:
                    cursor.execute(sql_all)
                else:
                    cursor.execute(sql_one, (member_id,))
                return cursor.fetchall()
            except sqlite3.OperationalError:
                # Pre-migration DB without member_id column.
                cursor.execute(sql_all)
                return cursor.fetchall()

        for row in query("SELECT output, target_code FROM wfh_logs",
                         "SELECT output, target_code FROM wfh_logs WHERE member_id = ?"):
            logs.append({"text": row[0], "targetCode": row[1]})

        cat_map = {'Dev': 'IPCR-B-004', 'Data': 'IPCR-A-102', 'Docs': 'IPCR-A-101', 'Meeting': 'IPCR-ADMIN'}
        for row in query("SELECT text, category FROM payroll_accomplishments",
                         "SELECT text, category FROM payroll_accomplishments WHERE member_id = ?"):
            logs.append({"text": row[0], "targetCode": cat_map.get(row[1], 'IPCR-ADMIN')})

        conn.close()
    except Exception as e:
        sys.stderr.write(f"Database read error: {e}\n")
    return logs


def predict_ml(seed_tasks, user_logs):
    """TF-IDF + Random Forest with deficit-weighted candidate ranking."""
    all_data = seed_tasks + user_logs
    df = pd.DataFrame(all_data)

    vectorizer = TfidfVectorizer(max_features=100)
    X = vectorizer.fit_transform(df['text']).toarray()
    y = df['targetCode'].values

    clf = RandomForestClassifier(n_estimators=10)
    clf.fit(X, y)

    target_hours = {t: 0.0 for t in set(df['targetCode'])}
    for log in user_logs:
        target_hours[log['targetCode']] = target_hours.get(log['targetCode'], 0.0) + 8.0

    sorted_deficits = sorted(target_hours.items(), key=lambda x: x[1])
    under = [t[0] for t in sorted_deficits[:2]]
    candidates = [task for task in seed_tasks if task['targetCode'] in under]

    suggestions = []
    if len(user_logs) > 0:
        user_X = vectorizer.transform([l['text'] for l in user_logs]).toarray()
        centroid = np.mean(user_X, axis=0)
        scored = []
        for task in candidates:
            vec = vectorizer.transform([task['text']]).toarray()[0]
            sim = np.dot(vec, centroid) / (np.linalg.norm(vec) * np.linalg.norm(centroid) + 1e-9)
            scored.append((task, sim))
        scored.sort(key=lambda x: x[1], reverse=True)
        suggestions = [item[0] for item in scored[:4]]

    if len(suggestions) < 4:
        remaining = [c for c in candidates if c not in suggestions]
        suggestions.extend(random.sample(remaining, min(len(remaining), 4 - len(suggestions))))
    return suggestions[:4]


def predict_fallback(seed_tasks, user_logs):
    """Pure-Python deficit ranking."""
    counts = {}
    for log in user_logs:
        counts[log['targetCode']] = counts.get(log['targetCode'], 0) + 1
    for t in set(task['targetCode'] for task in seed_tasks):
        counts.setdefault(t, 0)

    deficit = [t[0] for t in sorted(counts.items(), key=lambda x: x[1])[:2]]
    candidates = [task for task in seed_tasks if task['targetCode'] in deficit]
    random.shuffle(candidates)
    return candidates[:4]


def parse_args():
    args = sys.argv
    opts = {"db_path": "", "seed_csv": "seed_data.csv", "member_id": "me", "mode": "individual"}
    flags = {"--db-path": "db_path", "--seed-csv": "seed_csv", "--member-id": "member_id", "--mode": "mode"}
    for i, a in enumerate(args):
        if a in flags and i + 1 < len(args):
            opts[flags[a]] = args[i + 1]
    return opts


def main():
    opts = parse_args()
    seed_tasks = load_seed_data(opts["seed_csv"])
    user_logs = get_db_logs(opts["db_path"], opts["member_id"], opts["mode"]) if opts["db_path"] else []

    if HAS_ML and len(user_logs) > 2:
        suggestions = predict_ml(seed_tasks, user_logs)
    else:
        suggestions = predict_fallback(seed_tasks, user_logs)

    result = [
        {"id": f"s-{i}", "text": s["text"], "targetCode": s["targetCode"]}
        for i, s in enumerate(suggestions)
    ]
    print(json.dumps(result))


if __name__ == "__main__":
    main()
