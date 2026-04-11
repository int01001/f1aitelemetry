# Backend Scripts

Use these scripts from the project root.

Generate a reusable FastF1 ML dataset:

```bat
.\backend\.venv\Scripts\python.exe backend\scripts\generate_dataset.py --years 2024 --max-events 1 --sessions Race
```

Train the lap-time model from the generated CSV:

```bat
.\backend\.venv\Scripts\python.exe backend\scripts\train_model.py --dataset-path backend\data\fastf1_ml_dataset.csv --use-existing-dataset
```

For faster dataset generation, add `--skip-telemetry`.
