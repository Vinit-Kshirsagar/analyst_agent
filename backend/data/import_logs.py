"""Idempotent import into Elasticsearch. Safe to run any number of times:
uses deterministic _id values, so reruns overwrite rather than duplicate."""
import json
import os

from elasticsearch import Elasticsearch, NotFoundError

# Default to localhost for host-side seeding; Docker compose sets elasticsearch hostname.
ES_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")


def import_to_elasticsearch(filename: str | None = None):
    if filename is None:
        filename = os.path.join(os.path.dirname(__file__), "sample_logs.json")
    es = Elasticsearch(ES_URL)

    if not es.indices.exists(index="alerts-security"):
        es.indices.create(
            index="alerts-security",
            mappings={
                "properties": {
                    "@timestamp": {"type": "date"},
                    "source": {
                        "properties": {
                            "ip": {"type": "ip"},
                            "port": {"type": "integer"},
                        }
                    },
                    "destination": {
                        "properties": {
                            "ip": {"type": "ip"},
                            "port": {"type": "integer"},
                        }
                    },
                    "event": {
                        "properties": {
                            "type": {"type": "keyword"},
                            "outcome": {"type": "keyword"},
                            "severity": {"type": "integer"},
                        }
                    },
                    "rule": {
                        "properties": {
                            "name": {"type": "keyword"},
                            "description": {"type": "text"},
                        }
                    },
                    "user": {"properties": {"name": {"type": "keyword"}}},
                    "message": {"type": "text"},
                }
            },
        )

    with open(filename, "r") as f:
        alerts = json.load(f)

    created, existing = 0, 0
    for alert in alerts:
        doc_id = alert["_id"]
        source = alert["_source"]
        try:
            es.get(index="alerts-security", id=doc_id)
            existing += 1
        except NotFoundError:
            es.index(index="alerts-security", id=doc_id, document=source)
            created += 1

    total = es.count(index="alerts-security")["count"]
    print(
        f"Import complete: {created} new, {existing} already existed (skipped). "
        f"Total in index: {total}"
    )


if __name__ == "__main__":
    import_to_elasticsearch()
