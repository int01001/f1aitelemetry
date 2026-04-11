from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score


MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
TRAINED_MODEL_PATH = MODEL_DIR / "lap_time_predictor.joblib"

FEATURE_COLUMNS = [
    "year",
    "event_name",
    "session_name",
    "driver_code",
    "lap_number",
    "tyre_life",
    "compound",
    "sector1",
    "sector2",
    "sector3",
]
TARGET_COLUMN = "next_lap_time"
NUMERIC_FEATURES = ["year", "lap_number", "tyre_life", "sector1", "sector2", "sector3"]
CATEGORICAL_FEATURES = ["event_name", "session_name", "driver_code", "compound"]


@dataclass
class ModelArtifacts:
    pipeline: Pipeline
    metrics: dict[str, Any]
    training_rows: int
    scope: str


class MLService:
    def __init__(self, f1_service):
        self.f1_service = f1_service
        self._artifacts_by_session: dict[tuple[int, str, str], ModelArtifacts] = {}
        self._saved_artifacts: ModelArtifacts | None = None

    def _to_seconds(self, value):
        if pd.isna(value):
            return None
        return value.total_seconds()

    def _build_training_frame(self, year, race, session) -> pd.DataFrame:
        selected_session = self.f1_service.load_session(
            year,
            race,
            session,
            include_telemetry=True,
        )
        laps = selected_session.laps.copy()
        if laps.empty:
            return pd.DataFrame()

        laps = laps.dropna(subset=["LapTime", "Sector1Time", "Sector2Time", "Sector3Time"])
        if laps.empty:
            return pd.DataFrame()

        rows: list[dict[str, Any]] = []
        for _, lap in laps.iterrows():
            rows.append(
                {
                    "year": year,
                    "event_name": race,
                    "session_name": session,
                    "driver_code": lap.get("Driver"),
                    "lap_number": lap.get("LapNumber"),
                    "tyre_life": lap.get("TyreLife"),
                    "compound": lap.get("Compound") or "UNKNOWN",
                    "sector1": self._to_seconds(lap.get("Sector1Time")),
                    "sector2": self._to_seconds(lap.get("Sector2Time")),
                    "sector3": self._to_seconds(lap.get("Sector3Time")),
                    "lap_time": self._to_seconds(lap.get("LapTime")),
                }
            )

        frame = pd.DataFrame(rows)
        if frame.empty:
            return frame

        frame = frame.sort_values(["driver_code", "lap_number"])
        frame[TARGET_COLUMN] = frame.groupby("driver_code")["lap_time"].shift(-1)
        frame = frame.dropna(subset=[TARGET_COLUMN])
        return frame

    def _build_pipeline(self) -> Pipeline:
        preprocessor = ColumnTransformer(
            transformers=[
                (
                    "numeric",
                    Pipeline(
                        steps=[
                            ("imputer", SimpleImputer(strategy="median")),
                        ]
                    ),
                    NUMERIC_FEATURES,
                ),
                (
                    "categorical",
                    Pipeline(
                        steps=[
                            ("imputer", SimpleImputer(strategy="most_frequent")),
                            ("encoder", OneHotEncoder(handle_unknown="ignore")),
                        ]
                    ),
                    CATEGORICAL_FEATURES,
                ),
            ]
        )

        return Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                (
                    "model",
                    RandomForestRegressor(
                        n_estimators=120,
                        max_depth=12,
                        min_samples_leaf=2,
                        random_state=42,
                        n_jobs=-1,
                    ),
                ),
            ]
        )

    def train_from_frame(self, training_frame: pd.DataFrame, scope="current session") -> ModelArtifacts:
        training_frame = training_frame.dropna(subset=[TARGET_COLUMN])

        if training_frame.empty:
            raise ValueError("Not enough valid lap data to train the session model.")

        features = training_frame[FEATURE_COLUMNS]
        target = training_frame[TARGET_COLUMN]
        pipeline = self._build_pipeline()

        if len(training_frame) >= 30:
            x_train, x_test, y_train, y_test = train_test_split(
                features,
                target,
                test_size=0.2,
                random_state=42,
            )
            pipeline.fit(x_train, y_train)
            predictions = pipeline.predict(x_test)
            mae = float(mean_absolute_error(y_test, predictions))
            r2 = float(r2_score(y_test, predictions))
            evaluation_rows = len(x_test)
        else:
            pipeline.fit(features, target)
            predictions = pipeline.predict(features)
            mae = float(mean_absolute_error(target, predictions))
            r2 = float(r2_score(target, predictions)) if len(training_frame) > 1 else 0.0
            evaluation_rows = len(training_frame)

        return ModelArtifacts(
            pipeline=pipeline,
            metrics={
                "mae_seconds": round(mae, 3),
                "r2_score": round(r2, 3),
                "evaluation_rows": evaluation_rows,
                "target": TARGET_COLUMN,
            },
            training_rows=len(training_frame),
            scope=scope,
        )

    def _train_model_for_session(self, year, race, session) -> ModelArtifacts:
        training_frame = self._build_training_frame(year, race, session)
        return self.train_from_frame(training_frame, scope="current session")

    def save_artifacts(self, artifacts: ModelArtifacts, path=TRAINED_MODEL_PATH):
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "pipeline": artifacts.pipeline,
                "metrics": artifacts.metrics,
                "training_rows": artifacts.training_rows,
                "scope": artifacts.scope,
                "feature_columns": FEATURE_COLUMNS,
                "target_column": TARGET_COLUMN,
            },
            path,
        )

    def _load_saved_artifacts(self) -> ModelArtifacts | None:
        if self._saved_artifacts is not None:
            return self._saved_artifacts

        if not TRAINED_MODEL_PATH.exists():
            return None

        payload = joblib.load(TRAINED_MODEL_PATH)
        self._saved_artifacts = ModelArtifacts(
            pipeline=payload["pipeline"],
            metrics=payload["metrics"],
            training_rows=payload["training_rows"],
            scope=payload.get("scope", "offline dataset"),
        )
        return self._saved_artifacts

    def _load_or_train_model(self, year, race, session) -> ModelArtifacts:
        saved_artifacts = self._load_saved_artifacts()
        if saved_artifacts is not None:
            return saved_artifacts

        key = (year, race, session)
        if key not in self._artifacts_by_session:
            self._artifacts_by_session[key] = self._train_model_for_session(year, race, session)
        return self._artifacts_by_session[key]

    def get_ai_insights(self, driver_code, year=None, race=None, session=None):
        year, race, session = self.f1_service._normalize_selection(year, race, session)
        laps = self.f1_service.get_laps(driver_code, year=year, race=race, session=session)
        if not laps:
            return {
                "driver": driver_code,
                "available": False,
                "message": "No lap data available for AI predictions in this session.",
            }

        valid_laps = [
            lap for lap in laps
            if lap.get("lap_time") and lap.get("sector1") and lap.get("sector2") and lap.get("sector3")
        ]
        if not valid_laps:
            return {
                "driver": driver_code,
                "available": False,
                "message": "This session does not have enough valid lap data for model inference yet.",
            }

        latest_lap = valid_laps[-1]
        current_lap_time = float(latest_lap["lap_time"])
        artifacts = self._load_or_train_model(year, race, session)
        feature_row = pd.DataFrame(
            [
                {
                    "year": year,
                    "event_name": race,
                    "session_name": session,
                    "driver_code": driver_code,
                    "lap_number": latest_lap.get("lap_number"),
                    "tyre_life": latest_lap.get("tyre_life"),
                    "compound": latest_lap.get("compound") or "UNKNOWN",
                    "sector1": latest_lap.get("sector1"),
                    "sector2": latest_lap.get("sector2"),
                    "sector3": latest_lap.get("sector3"),
                }
            ]
        )

        predicted_lap_time = float(artifacts.pipeline.predict(feature_row)[0])
        lap_delta = round(predicted_lap_time - current_lap_time, 3)

        if lap_delta < -0.25:
            pace_status = "improving"
            pace_summary = "The session model expects the next representative lap to be quicker than the latest one."
        elif lap_delta > 0.25:
            pace_status = "slowing"
            pace_summary = "The session model expects a slower next lap, which may indicate degradation or traffic."
        else:
            pace_status = "stable"
            pace_summary = "The session model expects the pace to stay close to the current lap."

        tyre_life = latest_lap.get("tyre_life") or 0
        if tyre_life >= 18:
            tyre_risk = "high"
        elif tyre_life >= 10:
            tyre_risk = "medium"
        else:
            tyre_risk = "low"

        insights = [
            {
                "type": "info",
                "title": "Predicted Next Lap",
                "text": f"Session ML prediction: next lap around {predicted_lap_time:.3f}s from the latest lap sectors and tyre state.",
            },
            {
                "type": "warning" if tyre_risk != "low" else "info",
                "title": "Tyre Risk",
                "text": f"Tyre life is {tyre_life} laps on {latest_lap.get('compound', 'UNKNOWN')} tyres, giving a {tyre_risk} degradation risk.",
            },
            {
                "type": "critical" if pace_status == "slowing" else "info",
                "title": "Pace Trend",
                "text": pace_summary,
            },
        ]

        return {
            "driver": driver_code,
            "available": True,
            "current_lap_time": current_lap_time,
            "predicted_next_lap_time": round(predicted_lap_time, 3),
            "lap_delta": lap_delta,
            "pace_status": pace_status,
            "tyre_risk": tyre_risk,
            "model": {
                "name": "RandomForestRegressor",
                "training_rows": artifacts.training_rows,
                "mae_seconds": artifacts.metrics["mae_seconds"],
                "r2_score": artifacts.metrics["r2_score"],
                "evaluation_rows": artifacts.metrics["evaluation_rows"],
                "target": artifacts.metrics["target"],
                "scope": artifacts.scope,
            },
            "insights": insights,
        }
