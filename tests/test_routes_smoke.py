from collections import defaultdict

from fastapi import FastAPI

import main


def test_no_duplicate_route_methods():
    app: FastAPI = main.app
    seen = defaultdict(set)
    duplicates = []

    for route in app.routes:
        path = getattr(route, "path", None)
        methods = getattr(route, "methods", None)
        if not path or not methods:
            continue
        for m in methods:
            key = (path, m)
            if m in seen[path]:
                duplicates.append(key)
            else:
                seen[path].add(m)

    assert not duplicates, f"Duplicate routes detected: {duplicates}"
