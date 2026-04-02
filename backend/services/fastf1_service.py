import fastf1
import pandas as pd
import numpy as np
import os

# Enable cache to avoid re-downloading data
cache_dir = os.path.join(os.path.dirname(__file__), '..', 'f1cache')
os.makedirs(cache_dir, exist_ok=True)
fastf1.Cache.enable_cache(cache_dir)

class FastF1Service:
    def __init__(self, year=2023, race='Monza', session='R'):
        self.year = year
        self.race = race
        self.session_type = session
        self.session = None

    def load_session(self):
        if self.session is None:
            print(f"Loading session {self.year} {self.race} {self.session_type}...")
            self.session = fastf1.get_session(self.year, self.race, self.session_type)
            self.session.load()
            print("Session loaded.")
        return self.session

    def get_drivers(self):
        session = self.load_session()
        drivers = []
        for driver_id in session.drivers:
            driver_info = session.get_driver(driver_id)
            drivers.append({
                "driver_code": driver_info['Abbreviation'],
                "name": driver_info['FullName'],
                "team": driver_info['TeamName'],
                "color": driver_info['TeamColor'],
                "position": driver_info['GridPosition']
            })
        return drivers

    def get_laps(self, driver_code):
        session = self.load_session()
        laps = session.laps.pick_driver(driver_code)
        
        # We need to serialize pandas Timedelta to a format JSON can handle (seconds or string)
        def format_timedelta(td):
            if pd.isnull(td):
                return None
            return td.total_seconds()

        laps_data = []
        for index, row in laps.iterrows():
            laps_data.append({
                "lap_number": row['LapNumber'],
                "lap_time": format_timedelta(row['LapTime']),
                "sector1": format_timedelta(row['Sector1Time']),
                "sector2": format_timedelta(row['Sector2Time']),
                "sector3": format_timedelta(row['Sector3Time']),
                "compound": row['Compound'],
                "tyre_life": row['TyreLife'],
                "is_pit_out": row['PitOutTime'] is not pd.NaT
            })
        return laps_data

    def get_telemetry(self, driver_code):
        session = self.load_session()
        # Get the fastest lap for the driver
        fastest_lap = session.laps.pick_driver(driver_code).pick_fastest()
        if pd.isnull(fastest_lap['LapTime']):
            return {"error": "No valid lap times found"}
            
        telemetry = fastest_lap.get_telemetry()
        
        # Extract telemetry data to lists
        return {
            "driver": driver_code,
            "lap_time": fastest_lap['LapTime'].total_seconds() if not pd.isnull(fastest_lap['LapTime']) else None,
            "session_time": telemetry['SessionTime'].dt.total_seconds().tolist(),
            "distance": telemetry['Distance'].tolist(),
            "speed": telemetry['Speed'].tolist(),
            "rpm": telemetry['RPM'].tolist(),
            "gear": telemetry['nGear'].tolist(),
            "throttle": telemetry['Throttle'].tolist(),
            "brake": telemetry['Brake'].astype(int).tolist()
        }
