import argparse
from pathlib import Path
import sys

import fastf1

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.dataset_service import DEFAULT_DATASET_PATH, LEGACY_DATASET_PATH, FastF1DatasetBuilder
from services.fastf1_service import FastF1Service


DEFAULT_YEARS = [2024]
DEFAULT_MAX_EVENTS = 1
DEFAULT_SESSIONS = ["Race"]


def parse_args():
    parser = argparse.ArgumentParser(description="Generate a reusable FastF1 ML dataset CSV.")
    parser.add_argument("--years", nargs="+", type=int, default=DEFAULT_YEARS, help="F1 seasons to include.")
    parser.add_argument("--max-events", type=int, default=DEFAULT_MAX_EVENTS, help="Maximum events per season to include.")
    parser.add_argument("--all-events", action="store_true", help="Include every supported race event for each selected year.")
    parser.add_argument("--sessions", nargs="+", default=DEFAULT_SESSIONS, help="Session names to include.")
    parser.add_argument("--output", default=str(DEFAULT_DATASET_PATH), help="CSV dataset output path.")
    parser.add_argument(
        "--include-telemetry",
        action="store_true",
        help="Include per-lap telemetry aggregates. This is much slower but creates richer data.",
    )
    parser.add_argument(
        "--skip-telemetry",
        action="store_true",
        help="Deprecated compatibility flag. Telemetry is skipped by default unless --include-telemetry is used.",
    )
    return parser.parse_args()


def main():
    fastf1.set_log_level("ERROR")

    args = parse_args()
    output_path = Path(args.output)
    max_events = None if args.all_events else args.max_events
    include_telemetry = args.include_telemetry and not args.skip_telemetry

    print("Dataset generation configuration:")
    print(f"  Years: {args.years}")
    print(f"  Events per year: {'all supported events' if max_events is None else max_events}")
    print(f"  Sessions: {args.sessions}")
    print(f"  Include telemetry aggregates: {include_telemetry}")
    print(f"  Output: {output_path}")
    print()

    builder = FastF1DatasetBuilder(FastF1Service())
    dataset = builder.build_dataset(
        years=args.years,
        sessions=args.sessions,
        max_events=max_events,
        include_telemetry=include_telemetry,
    )

    if dataset.empty:
        raise SystemExit("No dataset rows were created. Try different years, events, or sessions.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(output_path, index=False)

    legacy_dataset_written = False
    if output_path.resolve() == DEFAULT_DATASET_PATH.resolve():
        dataset.to_csv(LEGACY_DATASET_PATH, index=False)
        legacy_dataset_written = True

    print("\nDataset generation complete.")
    print(f"Dataset: {output_path}")
    if legacy_dataset_written:
        print(f"Legacy dataset alias: {LEGACY_DATASET_PATH}")
    print(f"Rows: {len(dataset)}")
    print(f"Columns: {len(dataset.columns)}")
    print(", ".join(dataset.columns))


if __name__ == "__main__":
    main()
