#!/usr/bin/env python3
"""Quick E2E smoke test for ArchitectAI backend."""
import json
import sys
import urllib.request

BASE = "http://localhost:8000"


def post(path: str, body: dict, timeout: int = 120) -> dict:
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def get(path: str) -> dict:
    with urllib.request.urlopen(f"{BASE}{path}", timeout=10) as resp:
        return json.loads(resp.read())


def main() -> int:
    results = []
    failed = 0

    def check(name: str, ok: bool, detail: str = ""):
        status = "PASS" if ok else "FAIL"
        results.append(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
        if not ok:
            nonlocal_failed[0] += 1

    nonlocal_failed = [0]

    print("ArchitectAI E2E Test\n" + "=" * 40)

    try:
        h = get("/health")
        check("Health", h.get("status") == "ok")
    except Exception as e:
        check("Health", False, str(e))

    try:
        t = get("/api/test-gemini")
        check("Gemini connectivity", t.get("success") is True, (t.get("raw") or "")[:60])
    except Exception as e:
        check("Gemini connectivity", False, str(e))

    try:
        from main import get_mock_graph

        g = post("/api/generate", {"prompt": "Design Netflix"})
        graph_data = g.get("graph", g)
        source = g.get("source", "gemini")
        system = graph_data.get("system", "")
        is_live = source == "gemini"
        name_ok = "netflix" in system.lower()
        check(
            "Generate (Netflix)",
            len(graph_data.get("nodes", [])) >= 8 and (is_live or name_ok),
            f"system={system}, source={source}, nodes={len(graph_data.get('nodes', []))}",
        )
    except Exception as e:
        check("Generate (Netflix)", False, str(e))

    try:
        from main import get_mock_graph

        graph = get_mock_graph()
        a = post("/api/ask", {"question": "What is the single point of failure?", "graph": graph})
        check("Scale Q&A (/api/ask)", a.get("success") is True, a.get("answer", "")[:80])
    except Exception as e:
        check("Scale Q&A (/api/ask)", False, str(e))

    try:
        from main import get_mock_graph

        g1, g2 = get_mock_graph("SQL approach"), get_mock_graph("NoSQL approach")
        c = post("/api/compare-summary", {"graph_a": g1, "graph_b": g2})
        check(
            "Compare summary",
            c.get("success") is True and len(c.get("summary", "")) > 20,
            c.get("summary", "")[:80] if c.get("success") else "success=false",
        )
    except Exception as e:
        check("Compare summary", False, str(e))

    print("\n".join(results))
    print("=" * 40)
    passed = len(results) - nonlocal_failed[0]
    print(f"Result: {passed}/{len(results)} passed")
    return 0 if nonlocal_failed[0] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
