import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.dataset_service import DEFAULT_DATASET_PATH, FastF1DatasetBuilder
from services.fastf1_service import FastF1Service


DEFAULT_SESSIONS = ["Qualifying", "Race"]


def parse_args():
    parser = argparse.ArgumentParser(description="Generate a reusable FastF1 ML dataset CSV.")
    parser.add_argument("--years", nargs="+", type=int, default=[2023, 2024], help="F1 seasons to include.")
    parser.add_argument("--max-events", type=int, default=5, help="Maximum events per season to include.")
    parser.add_argument("--sessions", nargs="+", default=DEFAULT_SESSIONS, help="Session names to include.")
    parser.add_argument("--output", default=str(DEFAULT_DATASET_PATH), help="CSV dataset output path.")
    parser.add_argument(
        "--skip-telemetry",
        action="store_true",
        help="Skip per-lap telemetry aggregates for faster dataset generation.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    output_path = Path(args.output)
    builder = FastF1DatasetBuilder(FastF1Service())
    dataset = builder.build_dataset(
        years=args.years,
        sessions=args.sessions,
        max_events=args.max_events,
        include_telemetry=not args.skip_telemetry,
    )

    if dataset.empty:
        raise SystemExit("No dataset rows were created. Try different years, events, or sessions.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(output_path, index=False)

    print("\nDataset generation complete.")
    print(f"Dataset: {output_path}")
    print(f"Rows: {len(dataset)}")
    print(f"Columns: {len(dataset.columns)}")
    print(", ".join(dataset.columns))


if __name__ == "__main__":
    main()
