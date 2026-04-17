import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.ml_service import FEATURE_COLUMNS, TARGET_COLUMN, TRAINED_MODEL_PATH


DATA_DIR = BACKEND_DIR / "data"
MODEL_DIR = BACKEND_DIR / "models"
REPORT_PATH = MODEL_DIR / "ml_training_report.json"
LAP_TIME_METRICS_PATH = MODEL_DIR / "lap_time_predictor_metrics.json"
DEFAULT_DATASET_CANDIDATES = [
    DATA_DIR / "fastf1_2018_2024_all_race_laps.csv",
    DATA_DIR / "fastf1_2021_2024_all_race_laps.csv",
    DATA_DIR / "fastf1_2024_all_race_laps.csv",
    DATA_DIR / "fastf1_ml_dataset.csv",
    DATA_DIR / "fastf1dataset.csv",
]

RICH_NUMERIC_FEATURES = [
    "year",
    "round_number",
    "lap_number",
    "position",
    "lap_time",
    "sector1",
    "sector2",
    "sector3",
    "tyre_life",
    "stint",
    "air_temp_mean",
    "track_temp_mean",
    "humidity_mean",
    "pressure_mean",
    "wind_speed_mean",
]
RICH_CATEGORICAL_FEATURES = [
    "event_name",
    "country",
    "location",
    "session_name",
    "driver_code",
    "team",
    "compound",
    "fresh_tyre",
    "track_status",
    "is_accurate",
    "is_pit_out",
    "is_pit_in",
    "rainfall_any",
]


def parse_args():
    parser = argparse.ArgumentParser(description="Train ML models from the generated FastF1 lap CSV.")
    parser.add_argument("--dataset-path", help="CSV dataset path. Defaults to the largest known generated dataset.")
    parser.add_argument("--models-dir", default=str(MODEL_DIR), help="Directory where model artifacts are saved.")
    parser.add_argument("--estimators", type=int, default=80, help="Number of trees for the Random Forest models.")
    parser.add_argument("--test-size", type=float, default=0.2, help="Validation split size.")
    return parser.parse_args()


def resolve_dataset_path(dataset_path: str | None) -> Path:
    if dataset_path:
        path = Path(dataset_path)
        if not path.exists():
            raise SystemExit(f"Dataset does not exist: {path}")
        return path

    for path in DEFAULT_DATASET_CANDIDATES:
        if path.exists():
            return path

    raise SystemExit(
        "No FastF1 CSV dataset found. Generate one first with generate_dataset.bat "
        "or backend\\scripts\\generate_dataset.py."
    )


def build_preprocessor(numeric_features: list[str], categorical_features: list[str]) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(steps=[("imputer", SimpleImputer(strategy="median"))]),
                numeric_features,
            ),
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_features,
            ),
        ]
    )


def clean_features(frame: pd.DataFrame, numeric_features: list[str], categorical_features: list[str]) -> pd.DataFrame:
    features = frame[numeric_features + categorical_features].copy()
    for column in numeric_features:
        features[column] = pd.to_numeric(features[column], errors="coerce")
    for column in categorical_features:
        features[column] = features[column].astype(object).where(features[column].notna(), "UNKNOWN").astype(str)
    return features


def prepare_dataset(dataset_path: Path) -> pd.DataFrame:
    dataset = pd.read_csv(dataset_path, low_memory=False)

    required_columns = {"year", "event_name", "session_name", "driver_code", "lap_number", "lap_time", TARGET_COLUMN}
    missing_columns = required_columns - set(dataset.columns)
    if missing_columns:
        raise SystemExit(f"Dataset is missing required columns: {sorted(missing_columns)}")

    sort_columns = ["year", "event_name", "session_name", "driver_code", "lap_number"]
    dataset = dataset.sort_values(sort_columns).reset_index(drop=True)

    for column in ["is_pit_out", "is_pit_in", "fresh_tyre", "is_accurate", "rainfall_any"]:
        if column in dataset.columns:
            dataset[column] = dataset[column].astype(str).str.lower().isin(["true", "1", "yes"])

    dataset["lap_time_delta"] = dataset[TARGET_COLUMN] - dataset["lap_time"]
    dataset["degradation_risk"] = pd.cut(
        dataset["lap_time_delta"],
        bins=[-np.inf, 0.30, 1.00, np.inf],
        labels=["low", "medium", "high"],
    ).astype(object)

    group_columns = ["year", "event_name", "session_name", "driver_code"]
    next_lap_is_pit_in = dataset.groupby(group_columns)["is_pit_in"].shift(-1)
    dataset["next_lap_is_pit_in"] = next_lap_is_pit_in.map(
        lambda value: bool(value) if pd.notna(value) else False
    ).astype(int)

    return dataset


def existing_features(frame: pd.DataFrame, feature_names: list[str]) -> list[str]:
    return [feature for feature in feature_names if feature in frame.columns]


def train_regressor(
    frame: pd.DataFrame,
    feature_columns: list[str],
    target_column: str,
    numeric_features: list[str],
    categorical_features: list[str],
    estimators: int,
    test_size: float,
) -> tuple[Pipeline, dict]:
    training_frame = frame.dropna(subset=[target_column]).copy()
    numeric_features = existing_features(training_frame, numeric_features)
    categorical_features = existing_features(training_frame, categorical_features)
    feature_columns = numeric_features + categorical_features

    features = clean_features(training_frame, numeric_features, categorical_features)
    target = pd.to_numeric(training_frame[target_column], errors="coerce")
    valid_target = target.notna()
    features = features[valid_target]
    target = target[valid_target]

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=test_size,
        random_state=42,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor(numeric_features, categorical_features)),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=estimators,
                    max_depth=14,
                    min_samples_leaf=2,
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)
    mae = float(mean_absolute_error(y_test, predictions))
    rmse = float(np.sqrt(mean_squared_error(y_test, predictions)))
    r2 = float(r2_score(y_test, predictions))

    metrics = {
        "target": target_column,
        "feature_columns": feature_columns,
        "training_rows": int(len(x_train)),
        "evaluation_rows": int(len(x_test)),
        "mae_seconds": round(mae, 3),
        "rmse_seconds": round(rmse, 3),
        "r2_score": round(r2, 3),
    }
    return pipeline, metrics


def train_classifier(
    frame: pd.DataFrame,
    target_column: str,
    numeric_features: list[str],
    categorical_features: list[str],
    estimators: int,
    test_size: float,
) -> tuple[Pipeline, dict]:
    training_frame = frame.dropna(subset=[target_column]).copy()
    numeric_features = existing_features(training_frame, numeric_features)
    categorical_features = existing_features(training_frame, categorical_features)
    feature_columns = numeric_features + categorical_features

    features = clean_features(training_frame, numeric_features, categorical_features)
    target = training_frame[target_column].astype(str)

    stratify = target if target.value_counts().min() >= 2 else None
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=test_size,
        random_state=42,
        stratify=stratify,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor(numeric_features, categorical_features)),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=estimators,
                    max_depth=14,
                    min_samples_leaf=2,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)
    labels = sorted(target.unique().tolist())

    metrics = {
        "target": target_column,
        "feature_columns": feature_columns,
        "training_rows": int(len(x_train)),
        "evaluation_rows": int(len(x_test)),
        "accuracy": round(float(accuracy_score(y_test, predictions)), 3),
        "precision_macro": round(float(precision_score(y_test, predictions, average="macro", zero_division=0)), 3),
        "recall_macro": round(float(recall_score(y_test, predictions, average="macro", zero_division=0)), 3),
        "f1_macro": round(float(f1_score(y_test, predictions, average="macro", zero_division=0)), 3),
        "labels": labels,
        "class_distribution": target.value_counts().to_dict(),
        "confusion_matrix": confusion_matrix(y_test, predictions, labels=labels).tolist(),
        "classification_report": classification_report(y_test, predictions, zero_division=0, output_dict=True),
    }
    return pipeline, metrics


def save_model(path: Path, pipeline: Pipeline, metrics: dict, dataset_path: Path, model_name: str, scope: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": pipeline,
            "metrics": metrics,
            "training_rows": metrics["training_rows"],
            "scope": scope,
            "model_name": model_name,
            "feature_columns": metrics["feature_columns"],
            "target_column": metrics["target"],
            "dataset_path": str(dataset_path),
            "trained_at": datetime.now(timezone.utc).isoformat(),
        },
        path,
    )


def main():
    args = parse_args()
    dataset_path = resolve_dataset_path(args.dataset_path)
    models_dir = Path(args.models_dir)
    dataset = prepare_dataset(dataset_path)

    print("ML training configuration:")
    print(f"  Dataset: {dataset_path}")
    print(f"  Rows: {len(dataset)}")
    print(f"  Years: {sorted(dataset['year'].dropna().astype(int).unique().tolist())}")
    print(f"  Events: {dataset['event_name'].nunique()}")
    print(f"  Estimators per model: {args.estimators}")
    years = sorted(dataset["year"].dropna().astype(int).unique().tolist())
    missing_years = [year for year in range(years[0], years[-1] + 1) if year not in years]
    if missing_years:
        print(f"  Warning: dataset is missing these years inside the selected range: {missing_years}")
    print()

    app_numeric_features = [column for column in FEATURE_COLUMNS if column in ["year", "lap_number", "tyre_life", "sector1", "sector2", "sector3"]]
    app_categorical_features = [column for column in FEATURE_COLUMNS if column not in app_numeric_features]
    lap_pipeline, lap_metrics = train_regressor(
        dataset,
        FEATURE_COLUMNS,
        TARGET_COLUMN,
        app_numeric_features,
        app_categorical_features,
        args.estimators,
        args.test_size,
    )
    save_model(
        TRAINED_MODEL_PATH,
        lap_pipeline,
        lap_metrics,
        dataset_path,
        "RandomForestRegressor",
        "offline CSV dataset",
    )

    tyre_pipeline, tyre_metrics = train_classifier(
        dataset,
        "degradation_risk",
        RICH_NUMERIC_FEATURES,
        RICH_CATEGORICAL_FEATURES,
        args.estimators,
        args.test_size,
    )
    tyre_model_path = models_dir / "tyre_degradation_classifier.joblib"
    save_model(
        tyre_model_path,
        tyre_pipeline,
        tyre_metrics,
        dataset_path,
        "RandomForestClassifier",
        "offline CSV dataset",
    )

    pit_pipeline, pit_metrics = train_classifier(
        dataset,
        "next_lap_is_pit_in",
        RICH_NUMERIC_FEATURES,
        RICH_CATEGORICAL_FEATURES,
        args.estimators,
        args.test_size,
    )
    pit_model_path = models_dir / "pit_stop_classifier.joblib"
    save_model(
        pit_model_path,
        pit_pipeline,
        pit_metrics,
        dataset_path,
        "RandomForestClassifier",
        "offline CSV dataset",
    )

    report = {
        "dataset_path": str(dataset_path),
        "dataset_rows": int(len(dataset)),
        "years": years,
        "missing_years_between_min_max": missing_years,
        "events": int(dataset["event_name"].nunique()),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "models": {
            "next_lap_time_regressor": {
                "artifact": str(TRAINED_MODEL_PATH),
                "algorithm": "RandomForestRegressor",
                "metrics": lap_metrics,
            },
            "tyre_degradation_classifier": {
                "artifact": str(tyre_model_path),
                "algorithm": "RandomForestClassifier",
                "metrics": tyre_metrics,
                "label_rule": "high if next lap is >=1.00s slower, medium if >=0.30s slower, otherwise low",
            },
            "pit_stop_classifier": {
                "artifact": str(pit_model_path),
                "algorithm": "RandomForestClassifier",
                "metrics": pit_metrics,
                "label_rule": "predicts whether the next lap has is_pit_in=True",
            },
        },
    }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    LAP_TIME_METRICS_PATH.write_text(
        json.dumps(
            {
                "model": "RandomForestRegressor",
                "data_source": "existing CSV",
                "dataset_path": str(dataset_path),
                "model_path": str(TRAINED_MODEL_PATH),
                "training_rows": lap_metrics["training_rows"],
                "metrics": lap_metrics,
                "years": years,
                "missing_years_between_min_max": missing_years,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print("Training complete.")
    print(f"  Next-lap time model: {TRAINED_MODEL_PATH}")
    print(f"    MAE: {lap_metrics['mae_seconds']}s | R2: {lap_metrics['r2_score']}")
    print(f"  Tyre degradation model: {tyre_model_path}")
    print(f"    Accuracy: {tyre_metrics['accuracy']} | F1 macro: {tyre_metrics['f1_macro']}")
    print(f"  Pit-stop model: {pit_model_path}")
    print(f"    Accuracy: {pit_metrics['accuracy']} | F1 macro: {pit_metrics['f1_macro']}")
    print(f"  Report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
