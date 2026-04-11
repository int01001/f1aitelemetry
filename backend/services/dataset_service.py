from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd


DEFAULT_DATASET_PATH = Path(__file__).resolve().parent.parent / "data" / "fastf1_ml_dataset.csv"


class FastF1DatasetBuilder:
    """Build lap-level ML datasets from FastF1 sessions."""

    def __init__(self, f1_service):
        self.f1_service = f1_service

    def _to_seconds(self, value):
        if pd.isna(value):
            return None
        return value.total_seconds()

    def _to_number(self, value):
        if pd.isna(value):
            return None
        return float(value)

    def _format_team_color(self, value):
        if pd.isna(value) or value in (None, ""):
            return None
        color = str(value)
        return color if color.startswith("#") else f"#{color}"

    def _driver_lookup(self, selected_session):
        drivers = {}
        for driver_id in selected_session.drivers:
            driver_info = selected_session.get_driver(driver_id)
            drivers[driver_info.get("Abbreviation")] = {
                "driver_number": driver_info.get("DriverNumber"),
                "driver_name": driver_info.get("FullName"),
                "team": driver_info.get("TeamName"),
                "team_color": self._format_team_color(driver_info.get("TeamColor")),
                "headshot_url": None if pd.isna(driver_info.get("HeadshotUrl")) else driver_info.get("HeadshotUrl"),
            }
        return drivers

    def _weather_summary(self, selected_session):
        weather = getattr(selected_session, "weather_data", pd.DataFrame())
        if weather is None or weather.empty:
            return {
                "air_temp_mean": None,
                "track_temp_mean": None,
                "humidity_mean": None,
                "pressure_mean": None,
                "wind_speed_mean": None,
                "rainfall_any": None,
            }

        return {
            "air_temp_mean": self._to_number(weather.get("AirTemp", pd.Series(dtype=float)).mean()),
            "track_temp_mean": self._to_number(weather.get("TrackTemp", pd.Series(dtype=float)).mean()),
            "humidity_mean": self._to_number(weather.get("Humidity", pd.Series(dtype=float)).mean()),
            "pressure_mean": self._to_number(weather.get("Pressure", pd.Series(dtype=float)).mean()),
            "wind_speed_mean": self._to_number(weather.get("WindSpeed", pd.Series(dtype=float)).mean()),
            "rainfall_any": bool(weather.get("Rainfall", pd.Series(dtype=bool)).fillna(False).any()),
        }

    def _telemetry_summary(self, lap):
        empty_summary = {
            "speed_mean": None,
            "speed_max": None,
            "rpm_mean": None,
            "rpm_max": None,
            "throttle_mean": None,
            "throttle_full_pct": None,
            "brake_pct": None,
            "gear_mean": None,
            "gear_max": None,
        }

        if not hasattr(lap, "get_telemetry"):
            return empty_summary

        try:
            telemetry = lap.get_telemetry()
        except Exception:
            return empty_summary

        if telemetry is None or telemetry.empty:
            return empty_summary

        brake = telemetry.get("Brake", pd.Series(dtype=bool)).fillna(False)
        throttle = telemetry.get("Throttle", pd.Series(dtype=float))
        gear = telemetry.get("nGear", pd.Series(dtype=float))

        return {
            "speed_mean": self._to_number(telemetry.get("Speed", pd.Series(dtype=float)).mean()),
            "speed_max": self._to_number(telemetry.get("Speed", pd.Series(dtype=float)).max()),
            "rpm_mean": self._to_number(telemetry.get("RPM", pd.Series(dtype=float)).mean()),
            "rpm_max": self._to_number(telemetry.get("RPM", pd.Series(dtype=float)).max()),
            "throttle_mean": self._to_number(throttle.mean()),
            "throttle_full_pct": self._to_number((throttle >= 95).mean()),
            "brake_pct": self._to_number(brake.astype(bool).mean()),
            "gear_mean": self._to_number(gear.mean()),
            "gear_max": self._to_number(gear.max()),
        }

    def build_session_dataset(
        self,
        year: int,
        event: dict[str, Any] | str,
        session_name: str,
        include_telemetry: bool = True,
    ) -> pd.DataFrame:
        event_name = event["name"] if isinstance(event, dict) else event
        selected_session = self.f1_service.load_session(
            year,
            event_name,
            session_name,
            include_telemetry=True,
        )

        laps = selected_session.laps
        if laps.empty:
            return pd.DataFrame()

        event_meta = event if isinstance(event, dict) else {}
        drivers = self._driver_lookup(selected_session)
        weather = self._weather_summary(selected_session)
        lap_iterator = laps.iterlaps() if hasattr(laps, "iterlaps") else laps.iterrows()
        rows: list[dict[str, Any]] = []

        for _, lap in lap_iterator:
            driver_code = lap.get("Driver")
            driver_meta = drivers.get(driver_code, {})

            row = {
                "year": year,
                "round_number": event_meta.get("round"),
                "event_name": event_name,
                "official_event_name": event_meta.get("official_name"),
                "country": event_meta.get("country"),
                "location": event_meta.get("location"),
                "session_name": session_name,
                "driver_code": driver_code,
                "driver_number": driver_meta.get("driver_number") or lap.get("DriverNumber"),
                "driver_name": driver_meta.get("driver_name"),
                "team": driver_meta.get("team") or lap.get("Team"),
                "team_color": driver_meta.get("team_color"),
                "headshot_url": driver_meta.get("headshot_url"),
                "lap_number": lap.get("LapNumber"),
                "position": lap.get("Position"),
                "lap_time": self._to_seconds(lap.get("LapTime")),
                "sector1": self._to_seconds(lap.get("Sector1Time")),
                "sector2": self._to_seconds(lap.get("Sector2Time")),
                "sector3": self._to_seconds(lap.get("Sector3Time")),
                "compound": lap.get("Compound") or "UNKNOWN",
                "tyre_life": lap.get("TyreLife"),
                "fresh_tyre": lap.get("FreshTyre"),
                "stint": lap.get("Stint"),
                "track_status": lap.get("TrackStatus"),
                "is_accurate": lap.get("IsAccurate"),
                "is_pit_out": not pd.isna(lap.get("PitOutTime")),
                "is_pit_in": not pd.isna(lap.get("PitInTime")),
                **weather,
            }

            if include_telemetry:
                row.update(self._telemetry_summary(lap))

            rows.append(row)

        frame = pd.DataFrame(rows)
        if frame.empty:
            return frame

        frame = frame.sort_values(["driver_code", "lap_number"])
        frame["next_lap_time"] = frame.groupby("driver_code")["lap_time"].shift(-1)
        return frame

    def build_dataset(
        self,
        years: list[int],
        sessions: list[str],
        max_events: int | None = None,
        include_telemetry: bool = True,
    ) -> pd.DataFrame:
        frames: list[pd.DataFrame] = []

        for year in years:
            print(f"Loading event schedule for {year}...")
            events = self.f1_service.get_events(year)
            selected_events = events[:max_events] if max_events else events

            for event in selected_events:
                for session_name in sessions:
                    if not any(session["name"] == session_name for session in event["sessions"]):
                        continue

                    print(f"Extracting rows: {year} {event['name']} {session_name}")
                    try:
                        frame = self.build_session_dataset(
                            year,
                            event,
                            session_name,
                            include_telemetry=include_telemetry,
                        )
                    except Exception as error:
                        print(f"  Skipped: {error}")
                        continue

                    if not frame.empty:
                        frames.append(frame)
                        print(f"  Added {len(frame)} rows and {len(frame.columns)} columns")

        if not frames:
            return pd.DataFrame()

        return pd.concat(frames, ignore_index=True)
