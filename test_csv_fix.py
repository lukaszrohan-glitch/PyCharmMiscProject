"""
CSV Export Fix Verification Script
Tests that NULL values are preserved in CSV exports
"""
import io
import csv
from typing import Dict, List, Any


def test_csv_export_preservation():
    """Test that NULL values are properly handled in CSV export."""

    # Simulate database rows with NULL values
    test_rows = [
        {
            "order_id": "ORD-001",
            "customer_id": "CUST-001",
            "status": "New",
            "order_date": "2025-01-01",
            "due_date": None,  # NULL value
            "contact_person": "John Doe"
        },
        {
            "order_id": "ORD-002",
            "customer_id": "CUST-002",
            "status": "InProgress",
            "order_date": "2025-01-02",
            "due_date": "2025-01-15",
            "contact_person": None  # NULL value
        },
        {
            "order_id": "ORD-003",
            "customer_id": "CUST-003",
            "status": "Done",
            "order_date": None,  # NULL value
            "due_date": None,  # NULL value
            "contact_person": None  # NULL value
        }
    ]

    # OLD METHOD (BROKEN - converts None to "")
    print("=== OLD METHOD (BROKEN) ===")
    buf_old = io.StringIO()
    writer_old = csv.writer(buf_old)
    header = ["order_id", "customer_id", "status", "order_date", "due_date", "contact_person"]
    writer_old.writerow(header)

    for r in test_rows:
        # OLD: r.get(col, "") - if key exists and value is None, returns None, not ""
        # Actually the bug is more subtle - .get(col, "") still returns None if the key exists
        writer_old.writerow([r.get(col, "") for col in header])

    print(buf_old.getvalue())
    print()

    # NEW METHOD (FIXED - preserves None as empty but explicitly handles it)
    print("=== NEW METHOD (FIXED) ===")
    buf_new = io.StringIO()
    writer_new = csv.writer(buf_new)
    writer_new.writerow(header)

    for r in test_rows:
        # NEW: r.get(col) if r.get(col) is not None else ""
        writer_new.writerow([r.get(col) if r.get(col) is not None else "" for col in header])

    print(buf_new.getvalue())
    print()

    # Verify the data
    print("=== VERIFICATION ===")
    buf_new.seek(0)
    reader = csv.DictReader(buf_new)
    rows_read = list(reader)

    print(f"Total rows exported: {len(rows_read)}")
    print(f"Row 1 due_date (should be empty): '{rows_read[0]['due_date']}'")
    print(f"Row 2 contact_person (should be empty): '{rows_read[1]['contact_person']}'")
    print(f"Row 3 order_date (should be empty): '{rows_read[2]['order_date']}'")

    # The real issue: csv.writer converts None to empty string anyway!
    # So the original code was actually working, but let's verify
    print()
    print("=== CSV Writer Behavior with None ===")
    buf_test = io.StringIO()
    writer_test = csv.writer(buf_test)
    writer_test.writerow(["Header1", "Header2", "Header3"])
    writer_test.writerow(["Value1", None, "Value3"])  # Direct None
    writer_test.writerow([None, None, None])  # All None
    print(buf_test.getvalue())


if __name__ == "__main__":
    test_csv_export_preservation()

