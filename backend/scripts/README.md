# Backend Scripts

Use these scripts from the project root.

Easiest option from the project root:

```bat
generate_dataset.bat --years 2024 --all-events --sessions Race --output backend\data\fastf1_2024_all_race_laps.csv
```

If you double-click `generate_dataset.bat` with no arguments, it generates `2021-2024` Race-session laps by default.

Generate a reusable FastF1 ML dataset:

```bat
.\backend\.venv\Scripts\python.exe backend\scripts\generate_dataset.py --years 2024 --max-events 1 --sessions Race
```

Generate all race laps for every supported race in a season:

```bat
.\backend\.venv\Scripts\python.exe backend\scripts\generate_dataset.py --years 2024 --all-events --sessions Race --output backend\data\fastf1_2024_all_race_laps.csv
```

FastF1 cache messages are normal. They mean FastF1 is reusing files it already downloaded into `backend\f1cache` so the next run is faster.

For richer but much slower per-lap car telemetry summaries, add `--include-telemetry`:

```bat
.\backend\.venv\Scripts\python.exe backend\scripts\generate_dataset.py --years 2024 --max-events 1 --sessions Race --include-telemetry
```

Train the lap-time model from the generated CSV:

```bat
.\backend\.venv\Scripts\python.exe backend\scripts\train_model.py --dataset-path backend\data\fastf1_ml_dataset.csv --use-existing-dataset
```

Train the baseline ML model suite:

```bat
train_ml_models.bat --dataset-path backend\data\fastf1_2018_2024_all_race_laps.csv
```

This trains:

- `lap_time_predictor.joblib`: Random Forest regression for next-lap time
- `tyre_degradation_classifier.joblib`: Random Forest classification for tyre degradation risk
- `pit_stop_classifier.joblib`: Random Forest classification for whether the next lap is a pit-in lap
- `ml_training_report.json`: metrics and model metadata
