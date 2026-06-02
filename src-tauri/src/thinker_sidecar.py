import sys
import os
import json
import sqlite3
import random
from datetime import datetime

# Try to import ML libraries; if unavailable, fallback to pure Python implementation
try:
    import pandas as pd
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.ensemble import RandomForestClassifier
    HAS_ML = True
except ImportError:
    HAS_ML = False

def load_seed_data(seed_csv_path):
    """Loads synthetic developer accomplishments from seed CSV."""
    seed_tasks = []
    if os.path.exists(seed_csv_path):
        try:
            with open(seed_csv_path, 'r', encoding='utf-8') as f:
                # Basic CSV parser to avoid dependency on csv/pandas in fallback
                lines = f.readlines()
                header = lines[0].strip().split(',')
                for line in lines[1:]:
                    parts = line.strip().split(',')
                    if len(parts) >= 2:
                        seed_tasks.append({
                            "text": parts[0].strip('"'),
                            "targetCode": parts[1].strip('"')
                        })
        except Exception as e:
            sys.stderr.write(f"Error loading seed CSV: {e}\n")
    
    # Fallback default seeds if file is empty/not found
    if not seed_tasks:
        seed_tasks = [
            {"text": "Run R scripting checks on WGP dataset", "targetCode": "IPCR-A-102"},
            {"text": "Standardize CBMS Portal component tokens", "targetCode": "IPCR-B-004"},
            {"text": "Draft quarterly output summary for verification", "targetCode": "IPCR-A-101"},
            {"text": "Resolve Vue 3 router hydration mismatch in CBMS", "targetCode": "IPCR-B-004"},
            {"text": "Refactor VBA Excel verification macros for CBMS 2026", "targetCode": "IPCR-B-004"},
            {"text": "Compile documentation for CBMS Portal API endpoints", "targetCode": "IPCR-A-101"},
            {"text": "Coordinate technical collection for SOC2 compliance", "targetCode": "IPCR-ADMIN"},
            {"text": "Process weekly CBMS data updates and clean outputs", "targetCode": "IPCR-A-102"}
        ]
    return seed_tasks

def get_db_logs(db_path):
    """Reads logs directly from the SQLite database."""
    wfh_logs = []
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            # Fetch WFH logs
            cursor.execute("SELECT output, target_code FROM wfh_logs")
            for row in cursor.fetchall():
                wfh_logs.append({"text": row[0], "targetCode": row[1]})
            
            # Fetch payroll accomplishments mapped to mock codes based on category
            cursor.execute("SELECT text, category FROM payroll_accomplishments")
            cat_map = {
                'Dev': 'IPCR-B-004',
                'Data': 'IPCR-A-102',
                'Docs': 'IPCR-A-101',
                'Meeting': 'IPCR-ADMIN'
            }
            for row in cursor.fetchall():
                wfh_logs.append({"text": row[0], "targetCode": cat_map.get(row[1], 'IPCR-ADMIN')})
            conn.close()
        except Exception as e:
            sys.stderr.write(f"Database read error: {e}\n")
    return wfh_logs

def predict_ml(seed_tasks, user_logs):
    """ML suggestion using Random Forest and TF-IDF Cosine Similarity."""
    all_data = seed_tasks + user_logs
    df = pd.DataFrame(all_data)
    
    # Vectorize task texts
    vectorizer = TfidfVectorizer(max_features=100)
    X = vectorizer.fit_transform(df['text']).toarray()
    y = df['targetCode'].values
    
    # Fit Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=10)
    clf.fit(X, y)
    
    # Calculate hours logged per target in user logs to find deficits
    target_hours = {t: 0.0 for t in set(df['targetCode'])}
    for log in user_logs:
        # Assign mock hours to logged items to estimate workload
        target_hours[log['targetCode']] = target_hours.get(log['targetCode'], 0.0) + 8.0
    
    # Deficit targets are those with lower hours
    sorted_deficits = sorted(target_hours.items(), key=lambda x: x[1])
    under_represented_targets = [t[0] for t in sorted_deficits[:2]]
    
    # Filter seed tasks belonging to under-represented targets
    candidates = [task for task in seed_tasks if task['targetCode'] in under_represented_targets]
    
    # If we have user logs, find tasks highly matching user log syntax but not yet logged
    suggestions = []
    if len(user_logs) > 0:
        user_X = vectorizer.transform([l['text'] for l in user_logs]).toarray()
        user_centroid = np.mean(user_X, axis=0)
        
        # Calculate similarity score for candidate tasks
        scored_candidates = []
        for task in candidates:
            task_vec = vectorizer.transform([task['text']]).toarray()[0]
            similarity = np.dot(task_vec, user_centroid) / (np.linalg.norm(task_vec) * np.linalg.norm(user_centroid) + 1e-9)
            scored_candidates.append((task, similarity))
        
        # Sort by similarity (Collaborative Filtering match)
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        suggestions = [item[0] for item in scored_candidates[:3]]
    
    if len(suggestions) < 3:
        # Fill up with random candidates from under-represented targets
        remaining = [c for c in candidates if c not in suggestions]
        suggestions.extend(random.sample(remaining, min(len(remaining), 3 - len(suggestions))))
        
    return suggestions

def predict_fallback(seed_tasks, user_logs):
    """Pure-Python fallback implementation using keyword relevance and deficits."""
    # Deficit calculations
    target_counts = {}
    for log in user_logs:
        target_counts[log['targetCode']] = target_counts.get(log['targetCode'], 0) + 1
        
    # Get all target codes
    all_targets = set([t['targetCode'] for t in seed_tasks])
    for target in all_targets:
        if target not in target_counts:
            target_counts[target] = 0
            
    # Sort targets by deficit (lowest count first)
    sorted_targets = sorted(target_counts.items(), key=lambda x: x[1])
    deficit_targets = [t[0] for t in sorted_targets[:2]]
    
    # Find candidates matching deficit targets
    candidates = [task for task in seed_tasks if task['targetCode'] in deficit_targets]
    
    # Select a mix of tasks matching the deficit areas
    random.shuffle(candidates)
    return candidates[:3]

def main():
    db_path = ""
    seed_csv_path = "seed_data.csv"
    
    # Basic argument parser
    args = sys.argv
    for i in range(len(args)):
        if args[i] == '--db-path' and i + 1 < len(args):
            db_path = args[i+1]
        elif args[i] == '--seed-csv' and i + 1 < len(args):
            seed_csv_path = args[i+1]
            
    # Load seed data and current database logs
    seed_tasks = load_seed_data(seed_csv_path)
    user_logs = get_db_logs(db_path) if db_path else []
    
    # Run prediction
    if HAS_ML and len(user_logs) > 2:
        suggestions = predict_ml(seed_tasks, user_logs)
    else:
        suggestions = predict_fallback(seed_tasks, user_logs)
        
    # Output suggestions as JSON
    print(json.dumps(suggestions))

if __name__ == "__main__":
    main()
