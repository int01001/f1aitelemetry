import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np


BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_REPORT_PATH = BACKEND_DIR / "models" / "ml_training_report.json"


def parse_args():
    parser = argparse.ArgumentParser(description="Generate PNG graphs from the saved ML training report.")
    parser.add_argument("--report-path", default=str(DEFAULT_REPORT_PATH), help="Path to ml_training_report.json")
    parser.add_argument("--output-dir", default=str(PROJECT_ROOT), help="Directory where PNG graphs are saved")
    return parser.parse_args()


def load_report(report_path: Path):
    if not report_path.exists():
        raise SystemExit(f"Training report not found: {report_path}")
    return json.loads(report_path.read_text(encoding="utf-8"))


def save_regression_metrics(report: dict, output_dir: Path):
    metrics = report["models"]["next_lap_time_regressor"]["metrics"]
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    error_names = ["MAE", "RMSE"]
    error_values = [metrics["mae_seconds"], metrics["rmse_seconds"]]
    error_colors = ["#f97316", "#e11d48"]
    axes[0].bar(error_names, error_values, color=error_colors)
    axes[0].set_title("Lap Time Regressor Error Metrics")
    axes[0].set_ylabel("Seconds")
    for index, value in enumerate(error_values):
        axes[0].text(index, value + 0.05, f"{value:.3f}", ha="center", va="bottom")

    r2_value = metrics["r2_score"]
    axes[1].bar(["R^2"], [r2_value], color="#2563eb")
    axes[1].set_title("Lap Time Regressor Fit")
    axes[1].set_ylim(0, 1)
    axes[1].set_ylabel("Score")
    axes[1].text(0, r2_value + 0.02, f"{r2_value:.3f}", ha="center", va="bottom")

    fig.suptitle("Random Forest Lap Time Predictor", fontsize=14, fontweight="bold")
    fig.tight_layout()
    output_path = output_dir / "lap_time_regression_metrics.png"
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    return output_path


def save_classifier_overview(report: dict, output_dir: Path):
    models = {
        "Tyre Degradation": report["models"]["tyre_degradation_classifier"]["metrics"],
        "Pit Stop": report["models"]["pit_stop_classifier"]["metrics"],
    }
    metric_names = ["accuracy", "precision_macro", "recall_macro", "f1_macro"]
    metric_labels = ["Accuracy", "Precision", "Recall", "F1"]
    x = np.arange(len(metric_names))
    width = 0.35

    fig, ax = plt.subplots(figsize=(11, 6))
    for offset, (label, metrics) in enumerate(models.items()):
        values = [metrics[name] for name in metric_names]
        bars = ax.bar(x + (offset - 0.5) * width, values, width=width, label=label)
        for bar, value in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width() / 2, value + 0.015, f"{value:.3f}", ha="center", va="bottom", fontsize=9)

    ax.set_xticks(x, metric_labels)
    ax.set_ylim(0, 1)
    ax.set_ylabel("Score")
    ax.set_title("Classifier Quality Metrics")
    ax.legend()
    fig.tight_layout()
    output_path = output_dir / "classifier_metrics_overview.png"
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    return output_path


def save_class_distribution(report: dict, output_dir: Path):
    tyre_distribution = report["models"]["tyre_degradation_classifier"]["metrics"]["class_distribution"]
    pit_distribution = report["models"]["pit_stop_classifier"]["metrics"]["class_distribution"]

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    for ax, title, distribution, color in [
        (axes[0], "Tyre Degradation Class Distribution", tyre_distribution, "#f59e0b"),
        (axes[1], "Pit Stop Class Distribution", pit_distribution, "#10b981"),
    ]:
        labels = list(distribution.keys())
        values = list(distribution.values())
        bars = ax.bar(labels, values, color=color)
        ax.set_title(title)
        ax.set_ylabel("Rows")
        for bar, value in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width() / 2, value, f"{value}", ha="center", va="bottom", fontsize=9)

    fig.tight_layout()
    output_path = output_dir / "classification_class_distribution.png"
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    return output_path


def save_confusion_matrices(report: dict, output_dir: Path):
    outputs = []
    configs = [
        (
            "tyre_degradation_confusion_matrix.png",
            "Tyre Degradation Confusion Matrix",
            report["models"]["tyre_degradation_classifier"]["metrics"]["confusion_matrix"],
            report["models"]["tyre_degradation_classifier"]["metrics"]["labels"],
            "YlOrRd",
        ),
        (
            "pit_stop_confusion_matrix.png",
            "Pit Stop Confusion Matrix",
            report["models"]["pit_stop_classifier"]["metrics"]["confusion_matrix"],
            report["models"]["pit_stop_classifier"]["metrics"]["labels"],
            "GnBu",
        ),
    ]

    for filename, title, matrix, labels, cmap in configs:
        matrix_array = np.array(matrix)
        fig, ax = plt.subplots(figsize=(6, 5))
        image = ax.imshow(matrix_array, cmap=cmap)
        ax.set_title(title)
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
        ax.set_xticks(range(len(labels)), labels)
        ax.set_yticks(range(len(labels)), labels)
        plt.colorbar(image, ax=ax, fraction=0.046, pad=0.04)

        for row in range(matrix_array.shape[0]):
            for column in range(matrix_array.shape[1]):
                ax.text(column, row, f"{matrix_array[row, column]}", ha="center", va="center", color="black")

        fig.tight_layout()
        output_path = output_dir / filename
        fig.savefig(output_path, dpi=200, bbox_inches="tight")
        plt.close(fig)
        outputs.append(output_path)

    return outputs


def main():
    args = parse_args()
    report_path = Path(args.report_path)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    report = load_report(report_path)

    outputs = [
        save_regression_metrics(report, output_dir),
        save_classifier_overview(report, output_dir),
        save_class_distribution(report, output_dir),
        *save_confusion_matrices(report, output_dir),
    ]

    print("Saved graphs:")
    for output in outputs:
        print(output)


if __name__ == "__main__":
    main()
