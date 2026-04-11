import argparse
import json
from pathlib import Path
import sys

import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.dataset_service import DEFAULT_DATASET_PATH, FastF1DatasetBuilder
from services.fastf1_service import FastF1Service
from services.ml_service import MLService, TRAINED_MODEL_PATH


DEFAULT_SESSIONS = ["Qualifying", "Race"]
DATASET_PATH = DEFAULT_DATASET_PATH
METRICS_PATH = BACKEND_DIR / "models" / "lap_time_predictor_metrics.json"


def parse_args():
    parser = argparse.ArgumentParser(description="Build a FastF1 lap dataset and train the lap-time ML model.")
    parser.add_argument("--years", nargs="+", type=int, default=[2023, 2024], help="F1 seasons to include.")
    parser.add_argument("--max-events", type=int, default=5, help="Maximum events per season to include.")
    parser.add_argument("--sessions", nargs="+", default=DEFAULT_SESSIONS, help="Session names to include.")
    parser.add_argument("--dataset-path", default=str(DATASET_PATH), help="CSV dataset output path.")
    parser.add_argument("--model-path", default=str(TRAINED_MODEL_PATH), help="Trained model output path.")
    parser.add_argument("--use-existing-dataset", action="store_true", help="Train from an existing CSV instead of extracting FastF1 data.")
    parser.add_argument("--skip-telemetry", action="store_true", help="Skip per-lap telemetry aggregates while generating the CSV.")
    return parser.parse_args()


def main():
    args = parse_args()
    dataset_path = Path(args.dataset_path)
    model_path = Path(args.model_path)

    f1_service = FastF1Service()
    ml_service = MLService(f1_service)
    if args.use_existing_dataset:
        if not dataset_path.exists():
            raise SystemExit(f"Dataset does not exist: {dataset_path}")
        dataset = pd.read_csv(dataset_path)
    else:
        builder = FastF1DatasetBuilder(f1_service)
        dataset = builder.build_dataset(
            years=args.years,
            sessions=args.sessions,
            max_events=args.max_events,
            include_telemetry=not args.skip_telemetry,
        )

        if dataset.empty:
            raise SystemExit("No training rows were created. Try different years, events, or sessions.")

        dataset_path.parent.mkdir(parents=True, exist_ok=True)
        dataset.to_csv(dataset_path, index=False)

    artifacts = ml_service.train_from_frame(dataset, scope="offline CSV dataset")
    ml_service.save_artifacts(artifacts, model_path)

    metrics_payload = {
        "model": "RandomForestRegressor",
        "data_source": "existing CSV" if args.use_existing_dataset else "FastF1 API extraction",
        "dataset_path": str(dataset_path),
        "model_path": str(model_path),
        "training_rows": artifacts.training_rows,
        "metrics": artifacts.metrics,
        "requested_years": args.years,
        "sessions": args.sessions,
    }
    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")

    print("\nTraining complete.")
    print(f"Dataset: {dataset_path}")
    print(f"Model: {model_path}")
    print(f"Metrics: {METRICS_PATH}")
    print(json.dumps(metrics_payload, indent=2))


if __name__ == "__main__":
    main()
