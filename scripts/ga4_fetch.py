import csv
import json
import os
from datetime import date, timedelta
from pathlib import Path

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Dimension, Filter, FilterExpression, Metric, RunReportRequest

PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "551862318")
OUT = Path("ga4-report")
OUT.mkdir(parents=True, exist_ok=True)
client = BetaAnalyticsDataClient()

end = date.today() - timedelta(days=1)
start = end - timedelta(days=27)
prev_end = start - timedelta(days=1)
prev_start = prev_end - timedelta(days=27)


def run(start_date, end_date, dimensions=None, path_filter=None, limit=100):
    req = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        date_ranges=[DateRange(start_date=str(start_date), end_date=str(end_date))],
        dimensions=[Dimension(name=d) for d in (dimensions or [])],
        metrics=[Metric(name="screenPageViews"), Metric(name="totalUsers"), Metric(name="newUsers"), Metric(name="sessions")],
        limit=limit,
    )
    if path_filter:
        req.dimension_filter = FilterExpression(filter=Filter(field_name="pagePath", string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH, value=path_filter)))
    return client.run_report(req)


def totals(start_date, end_date, path_filter=None):
    r = run(start_date, end_date, path_filter=path_filter, limit=1)
    vals = [int(float(x.value or 0)) for x in r.rows[0].metric_values] if r.rows else [0, 0, 0, 0]
    return dict(zip(["views", "users", "new_users", "sessions"], vals))


def rows_to_csv(response, path):
    headers = [h.name for h in response.dimension_headers] + [h.name for h in response.metric_headers]
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for row in response.rows:
            w.writerow([v.value for v in row.dimension_values] + [v.value for v in row.metric_values])

current = totals(start, end)
previous = totals(prev_start, prev_end)

# LAB is the root site. LP and corporate are separate GitHub Pages project paths.
sections = {
    "lab": totals(start, end, "/"),
    "lp": totals(start, end, "/lp/"),
    "corporate": totals(start, end, "/corporate/"),
}

summary = {
    "property_id": PROPERTY_ID,
    "period": {"start": str(start), "end": str(end)},
    "previous_period": {"start": str(prev_start), "end": str(prev_end)},
    "current": current,
    "previous": previous,
    "sections": sections,
}
(OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

pages = run(start, end, dimensions=["pagePath"], limit=200)
rows_to_csv(pages, OUT / "pages.csv")

traffic = RunReportRequest(
    property=f"properties/{PROPERTY_ID}",
    date_ranges=[DateRange(start_date=str(start), end_date=str(end))],
    dimensions=[Dimension(name="sessionSource"), Dimension(name="sessionMedium")],
    metrics=[Metric(name="sessions"), Metric(name="totalUsers")],
    limit=100,
)
rows_to_csv(client.run_report(traffic), OUT / "traffic.csv")

print(json.dumps(summary, ensure_ascii=False, indent=2))
