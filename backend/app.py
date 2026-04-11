from flask import Flask, jsonify, request
from flask_cors import CORS

from services.fastf1_service import FastF1Service
from services.ml_service import MLService


app = Flask(__name__)
CORS(app)

f1_service = FastF1Service(
    default_year=2023,
    default_race="Italian Grand Prix",
    default_session="Race",
)
ml_service = MLService(f1_service)


def get_selection_from_request():
    return (
        request.args.get("year", type=int),
        request.args.get("race"),
        request.args.get("session"),
    )


@app.route("/api/seasons", methods=["GET"])
def get_seasons():
    try:
        return jsonify(f1_service.get_available_years())
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/events", methods=["GET"])
def get_events():
    year = request.args.get("year", type=int) or f1_service.default_year

    try:
        return jsonify(f1_service.get_events(year))
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/drivers", methods=["GET"])
def get_drivers():
    year, race, session = get_selection_from_request()

    try:
        drivers = f1_service.get_drivers(year=year, race=race, session=session)
        return jsonify(drivers)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/laps/<driver_code>", methods=["GET"])
def get_laps(driver_code):
    year, race, session = get_selection_from_request()

    try:
        laps = f1_service.get_laps(driver_code.upper(), year=year, race=race, session=session)
        return jsonify(laps)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/telemetry/<driver_code>", methods=["GET"])
def get_telemetry(driver_code):
    year, race, session = get_selection_from_request()

    try:
        telemetry = f1_service.get_telemetry(driver_code.upper(), year=year, race=race, session=session)
        return jsonify(telemetry)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/compare", methods=["GET"])
def compare_telemetry():
    driver1 = request.args.get("driver1")
    driver2 = request.args.get("driver2")
    year, race, session = get_selection_from_request()

    if not driver1 or not driver2:
        return jsonify({"error": "Please provide both driver1 and driver2 parameters"}), 400

    try:
        telemetry1 = f1_service.get_telemetry(driver1.upper(), year=year, race=race, session=session)
        telemetry2 = f1_service.get_telemetry(driver2.upper(), year=year, race=race, session=session)
        return jsonify(
            {
                driver1.upper(): telemetry1,
                driver2.upper(): telemetry2,
            }
        )
    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/ai-insights/<driver_code>", methods=["GET"])
def get_ai_insights(driver_code):
    year, race, session = get_selection_from_request()

    try:
        insights = ml_service.get_ai_insights(
            driver_code.upper(),
            year=year,
            race=race,
            session=session,
        )
        return jsonify(insights)
    except Exception as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
