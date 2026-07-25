"""Generates sample security log data with deterministic IDs (idempotent)."""
import json
import os
import random
from datetime import datetime, timedelta


class SampleLogGenerator:
    def __init__(self):
        self.suspicious_ips = [
            "10.0.0.55",
            "10.0.0.100",
            "192.168.1.50",
            "172.16.0.23",
            "10.10.10.45",
        ]
        self.normal_ips = [
            "10.0.0.1",
            "10.0.0.2",
            "192.168.1.1",
            "172.16.0.1",
            "10.10.10.1",
        ]
        self.alert_types = [
            "Brute Force Attack",
            "Malware Detected",
            "Failed Login Attempt",
            "Suspicious Process",
            "Network Scanning",
        ]

    def generate_alerts(self, count: int = 200):
        alerts = []
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)

        for i in range(count):
            timestamp = start_time + timedelta(seconds=random.randint(0, 86400))
            is_suspicious = random.random() < 0.7
            source_ip = random.choice(
                self.suspicious_ips if is_suspicious else self.normal_ips
            )

            alerts.append(
                {
                    "_id": f"seed-alert-{i:04d}",  # deterministic -> reruns never duplicate
                    "_index": "alerts-security",
                    "_source": {
                        "@timestamp": timestamp.isoformat(),
                        "source": {
                            "ip": source_ip,
                            "port": random.randint(1024, 65535),
                        },
                        "destination": {
                            "ip": random.choice(self.normal_ips),
                            "port": random.choice([22, 80, 443, 3389]),
                        },
                        "event": {
                            "type": (
                                "authentication"
                                if random.random() < 0.7
                                else "malware"
                            ),
                            "outcome": "failure" if is_suspicious else "success",
                            "severity": random.randint(1, 5)
                            + (3 if is_suspicious else 0),
                        },
                        "rule": {
                            "name": random.choice(self.alert_types),
                            "description": f"Alert from {source_ip}",
                        },
                        "user": {"name": f"user_{random.randint(1, 100)}"},
                        "message": f"Security alert from {source_ip}",
                    },
                }
            )
        return alerts

    def save_to_file(self, filename: str | None = None):
        if filename is None:
            filename = os.path.join(os.path.dirname(__file__), "sample_logs.json")
        alerts = self.generate_alerts(200)
        with open(filename, "w") as f:
            json.dump(alerts, f, indent=2)
        print(f"Generated {len(alerts)} alerts with deterministic IDs -> {filename}")


if __name__ == "__main__":
    SampleLogGenerator().save_to_file()
