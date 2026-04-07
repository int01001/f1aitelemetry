from datetime import datetime
import os

import fastf1
import pandas as pd


# Enable cache to avoid re-downloading data
cache_dir = os.path.join(os.path.dirname(__file__), "..", "f1cache")
os.makedirs(cache_dir, exist_ok=True)
fastf1.Cache.enable_cache(cache_dir)


class FastF1Service:
    def __init__(
        self,
        default_year=2023,
        default_race="Italian Grand Prix",
        default_session="Race",
    ):
        self.default_year = default_year
        self.default_race = default_race
        self.default_session = default_session
        self._full_sessions = {}
        self._basic_sessions = {}
        self._schedules = {}

    def _normalize_selection(self, year=None, race=None, session=None):
        return (
            int(year or self.default_year),
            race or self.default_race,
            session or self.default_session,
        )

    def _get_schedule(self, year):
        year = int(year)
        if year not in self._schedules:
            self._schedules[year] = fastf1.get_event_schedule(year, include_testing=False)
        return self._schedules[year]

    def _format_optional_timestamp(self, value):
        if pd.isna(value):
            return None
        return value.isoformat()

    def _format_team_color(self, value):
        if pd.isna(value) or value in (None, ""):
            return "#cccccc"
        color = str(value)
        return color if color.startswith("#") else f"#{color}"

    def get_available_years(self, start_year=2018):
        current_year = datetime.now().year
        return list(range(current_year, start_year - 1, -1))

    def get_events(self, year):
        schedule = self._get_schedule(year)
        events = []

        for _, row in schedule.iterrows():
            if not bool(row.get("F1ApiSupport", False)):
                continue

            sessions = []
            for index in range(1, 6):
                session_name = row.get(f"Session{index}")
                if pd.isna(session_name):
                    continue

                sessions.append(
                    {
                        "name": session_name,
                        "date": self._format_optional_timestamp(row.get(f"Session{index}Date")),
                    }
                )

            events.append(
                {
                    "round": int(row["RoundNumber"]),
                    "name": row["EventName"],
                    "official_name": row["OfficialEventName"],
                    "country": row["Country"],
                    "location": row["Location"],
                    "event_date": self._format_optional_timestamp(row["EventDate"]),
                    "format": row["EventFormat"],
                    "sessions": sessions,
                }
            )

        return events

    def load_session(self, year=None, race=None, session=None, include_telemetry=True):
        year, race, session = self._normalize_selection(year, race, session)
        key = (year, race, session)
        session_cache = self._full_sessions if include_telemetry else self._basic_sessions

        if key not in session_cache:
            print(
                f"Loading {'full' if include_telemetry else 'basic'} session "
                f"{year} {race} {session}..."
            )
            loaded_session = fastf1.get_session(year, race, session)
            loaded_session.load(
                laps=include_telemetry,
                telemetry=include_telemetry,
                weather=include_telemetry,
                messages=include_telemetry,
            )
            session_cache[key] = loaded_session
            print("Session loaded.")

        return session_cache[key]

    def get_drivers(self, year=None, race=None, session=None):
        try:
            selected_session = self.load_session(
                year,
                race,
                session,
                include_telemetry=False,
            )
        except Exception:
            selected_session = self.load_session(
                year,
                race,
                session,
                include_telemetry=True,
            )
        drivers = []

        for driver_id in selected_session.drivers:
            driver_info = selected_session.get_driver(driver_id)
            position = driver_info.get("Position")
            if pd.isna(position):
                position = None
            else:
                position = int(position)

            headshot_url = driver_info.get("HeadshotUrl")
            if pd.isna(headshot_url):
                headshot_url = None

            drivers.append(
                {
                    "driver_code": driver_info["Abbreviation"],
                    "name": driver_info["FullName"],
                    "team": driver_info["TeamName"],
                    "color": self._format_team_color(driver_info.get("TeamColor")),
                    "position": position,
                    "driver_number": driver_info.get("DriverNumber"),
                    "headshot_url": headshot_url,
                }
            )

        return sorted(drivers, key=lambda driver: (driver["position"] is None, driver["position"] or 999, driver["name"]))

    def get_laps(self, driver_code, year=None, race=None, session=None):
        selected_session = self.load_session(year, race, session, include_telemetry=True)
        laps = selected_session.laps.pick_driver(driver_code)

        def format_timedelta(value):
            if pd.isnull(value):
                return None
            return value.total_seconds()

        laps_data = []
        for _, row in laps.iterrows():
            laps_data.append(
                {
                    "lap_number": row["LapNumber"],
                    "lap_time": format_timedelta(row["LapTime"]),
                    "sector1": format_timedelta(row["Sector1Time"]),
                    "sector2": format_timedelta(row["Sector2Time"]),
                    "sector3": format_timedelta(row["Sector3Time"]),
                    "compound": row["Compound"],
                    "tyre_life": row["TyreLife"],
                    "is_pit_out": row["PitOutTime"] is not pd.NaT,
                }
            )
        return laps_data

    def get_telemetry(self, driver_code, year=None, race=None, session=None):
        selected_session = self.load_session(year, race, session, include_telemetry=True)
        fastest_lap = selected_session.laps.pick_driver(driver_code).pick_fastest()

        if pd.isnull(fastest_lap["LapTime"]):
            return {"error": "No valid lap times found"}

        telemetry = fastest_lap.get_telemetry()

        return {
            "driver": driver_code,
            "lap_time": fastest_lap["LapTime"].total_seconds() if not pd.isnull(fastest_lap["LapTime"]) else None,
            "session_time": telemetry["SessionTime"].dt.total_seconds().tolist(),
            "distance": telemetry["Distance"].tolist(),
            "speed": telemetry["Speed"].tolist(),
            "rpm": telemetry["RPM"].tolist(),
            "gear": telemetry["nGear"].tolist(),
            "throttle": telemetry["Throttle"].tolist(),
            "brake": telemetry["Brake"].astype(int).tolist(),
        }
