import csv
import json
import os
from datetime import date, timedelta
from pathlib import Path

import google.auth
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
OUT_DIR = Path("gsc-report")
OUT_DIR.mkdir(exist_ok=True)

SECTIONS = {
    "lp": "https://hadaojiprint.github.io/lp/",
    "lab": "https://hadaojiprint.github.io/wearprint-lab/",
    "corporate": "https://hadaojiprint.github.io/corporate/",
}


def pct_change(current, previous):
    if previous == 0:
        return None
    return round((current - previous) / previous * 100, 2)


def fetch(service, site_url, start_date, end_date, dimensions=None, row_limit=1000, page_prefix=None):
    body = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "rowLimit": row_limit,
    }
    if dimensions:
        body["dimensions"] = dimensions
    if page_prefix:
        body["dimensionFilterGroups"] = [
            {
                "filters": [
                    {
                        "dimension": "page",
                        "operator": "contains",
                        "expression": page_prefix,
                    }
                ]
            }
        ]
    return service.searchanalytics().query(siteUrl=site_url, body=body).execute()


def metric_row(response):
    rows = response.get("rows", [])
    if not rows:
        return {"clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0}
    row = rows[0]
    return {
        "clicks": row.get("clicks", 0),
        "impressions": row.get("impressions", 0),
        "ctr": row.get("ctr", 0.0),
        "position": row.get("position", 0.0),
    }


def write_dimension_csv(path, response, key_name):
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([key_name, "clicks", "impressions", "ctr", "position"])
        for row in response.get("rows", []):
            writer.writerow([
                row.get("keys", [""])[0],
                row.get("clicks", 0),
                row.get("impressions", 0),
                round(row.get("ctr", 0.0) * 100, 2),
                round(row.get("position", 0.0), 2),
            ])


def build_report(service, site_url, current_start, current_end, previous_start, previous_end, page_prefix=None):
    current_total = metric_row(fetch(service, site_url, current_start, current_end, page_prefix=page_prefix))
    previous_total = metric_row(fetch(service, site_url, previous_start, previous_end, page_prefix=page_prefix))
    queries = fetch(service, site_url, current_start, current_end, ["query"], 250, page_prefix=page_prefix)
    pages = fetch(service, site_url, current_start, current_end, ["page"], 250, page_prefix=page_prefix)

    return {
        "summary": {
            "site": site_url,
            "page_prefix": page_prefix,
            "generated_at": date.today().isoformat(),
            "current_period": {"start": current_start.isoformat(), "end": current_end.isoformat(), **current_total},
            "previous_period": {"start": previous_start.isoformat(), "end": previous_end.isoformat(), **previous_total},
            "changes_percent": {
                "clicks": pct_change(current_total["clicks"], previous_total["clicks"]),
                "impressions": pct_change(current_total["impressions"], previous_total["impressions"]),
                "ctr": pct_change(current_total["ctr"], previous_total["ctr"]),
                "position": pct_change(current_total["position"], previous_total["position"]),
            },
            "top_queries": [
                {
                    "query": r.get("keys", [""])[0],
                    "clicks": r.get("clicks", 0),
                    "impressions": r.get("impressions", 0),
                    "ctr": round(r.get("ctr", 0.0) * 100, 2),
                    "position": round(r.get("position", 0.0), 2),
                }
                for r in queries.get("rows", [])[:50]
            ],
            "top_pages": [
                {
                    "page": r.get("keys", [""])[0],
                    "clicks": r.get("clicks", 0),
                    "impressions": r.get("impressions", 0),
                    "ctr": round(r.get("ctr", 0.0) * 100, 2),
                    "position": round(r.get("position", 0.0), 2),
                }
                for r in pages.get("rows", [])[:50]
            ],
        },
        "queries": queries,
        "pages": pages,
    }


def save_report(name, report):
    report_dir = OUT_DIR / name
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "summary.json").write_text(
        json.dumps(report["summary"], ensure_ascii=False, indent=2), encoding="utf-8"
    )
    write_dimension_csv(report_dir / "queries.csv", report["queries"], "query")
    write_dimension_csv(report_dir / "pages.csv", report["pages"], "page")


def main():
    requested_site = os.environ["GSC_SITE_URL"]
    credentials, _ = google.auth.default(scopes=SCOPES)
    service = build("searchconsole", "v1", credentials=credentials, cache_discovery=False)

    site_entries = service.sites().list().execute().get("siteEntry", [])
    accessible_sites = [entry.get("siteUrl") for entry in site_entries if entry.get("siteUrl")]
    print("Accessible Search Console properties:", json.dumps(accessible_sites, ensure_ascii=False))

    if requested_site not in accessible_sites:
        raise RuntimeError(
            f"Requested root property {requested_site!r} is not accessible. Accessible properties: {accessible_sites}"
        )

    site_url = requested_site
    current_end = date.today() - timedelta(days=3)
    current_start = current_end - timedelta(days=27)
    previous_end = current_start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=27)

    all_report = build_report(service, site_url, current_start, current_end, previous_start, previous_end)
    save_report("all", all_report)

    section_summaries = {}
    for name, prefix in SECTIONS.items():
        report = build_report(
            service,
            site_url,
            current_start,
            current_end,
            previous_start,
            previous_end,
            page_prefix=prefix,
        )
        save_report(name, report)
        section_summaries[name] = report["summary"]

    dashboard = {
        "site": site_url,
        "generated_at": date.today().isoformat(),
        "period": {"start": current_start.isoformat(), "end": current_end.isoformat()},
        "all": all_report["summary"],
        "sections": section_summaries,
    }
    (OUT_DIR / "dashboard.json").write_text(
        json.dumps(dashboard, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(json.dumps(dashboard, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
