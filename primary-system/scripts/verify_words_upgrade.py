"""SQLite backup + old-column row hashes; no secrets/row contents in report.

Run with --copy to prepare isolated rehearsal, then --verify AFTER migration.
Daily backup is an explicit separate step after rehearsal passes.
"""
import argparse
import hashlib
import json
import os
import sqlite3
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('database')
parser.add_argument('report')
parser.add_argument('--copy')
parser.add_argument('--verify', action='store_true')
args = parser.parse_args()
db = sqlite3.connect(args.database)
db.row_factory = sqlite3.Row
report = Path(args.report)

def row_key(table, value):
    # Session primary keys are bearer credentials, never retain them in reports.
    return hashlib.sha256(str(value).encode()).hexdigest() if table == 'django_session' else str(value)

def digest(row):
    return hashlib.sha256(json.dumps(list(row), ensure_ascii=False, default=str).encode()).hexdigest()

if args.verify:
    before = json.loads(report.read_text())
    results = {}
    failures = []
    for table, data in before['tables'].items():
        columns = data['columns']
        query = 'SELECT ' + ','.join('"'+x+'"' for x in columns) + ' FROM "'+table+'"'
        rows = {row_key(table, row[0]): digest(row) for row in db.execute(query)}
        changed = [key for key, value in data['rows'].items() if rows.get(key) != value]
        added = len(set(rows) - set(data['rows']))
        results[table] = {'original_rows': len(data['rows']), 'checked_rows': rows, 'changed_or_missing': changed, 'added': added}
        if changed:
            failures.append(table)
    mapping = [dict(row) for row in db.execute('SELECT w.id legacy_word_id,w.target_id,t.sense_id,t.pronunciation_id,t.evidence_id FROM words_scenarioword w JOIN words_learningtarget t ON w.target_id=t.id ORDER BY w.id')]
    progress_errors = [dict(row) for row in db.execute('SELECT p.id FROM words_wordprogress p JOIN words_scenarioword w ON p.word_id=w.id WHERE p.target_id != w.target_id OR p.legacy_word_id != w.id')]
    result = {'passed': not failures and not progress_errors, 'tables': results, 'mapping': mapping,
              'unresolved_targets': db.execute('SELECT count(*) FROM words_learningtarget WHERE evidence_id IS NULL').fetchone()[0],
              'progress_mapping_errors': progress_errors, 'integrity': db.execute('PRAGMA integrity_check').fetchone()[0]}
    result_path = report.with_name(report.stem+'-result.json')
    result_path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    os.chmod(result_path, 0o600)
    print(json.dumps({k: v for k, v in result.items() if k != 'tables' and k != 'mapping'}, ensure_ascii=False))
    if not result['passed']:
        raise SystemExit(1)
else:
    if report.exists():
        raise SystemExit('Refuse to overwrite baseline')
    tables = {}
    for table, in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'django_migrations'"):
        columns = [r[1] for r in db.execute('PRAGMA table_info("'+table+'")')]
        # All project tables use the first column as primary key.
        tables[table] = {'columns': columns, 'rows': {row_key(table, row[0]): digest(row) for row in db.execute('SELECT * FROM "'+table+'"')}}
    report.write_text(json.dumps({'tables': tables}, ensure_ascii=False, indent=2))
    os.chmod(report, 0o600)
    if args.copy:
        destination = Path(args.copy)
        if destination.exists():
            raise SystemExit('Refuse to overwrite backup')
        dest = sqlite3.connect(destination)
        db.backup(dest)
        dest.close()
        os.chmod(destination, 0o600)
    print(json.dumps({'tables': len(tables), 'rows': sum(len(x['rows']) for x in tables.values()), 'backup': args.copy}))
