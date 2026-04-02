from flask import Flask, jsonify, request
from flask_cors import CORS
from services.fastf1_service import FastF1Service

app = Flask(__name__)
CORS(app) # Enable CORS for all routes so our React app can fetch data

# Instantiate the service. We'll use 2023 Monza GP as the default.
f1_service = FastF1Service(year=2023, race='Monza', session='R')

# Optional: eagerly load the session to avoid long waits on first request
# Warning: Since FastF1 takes quite some time (and memory) to load for the MVP we will load on demand.

@app.route('/api/drivers', methods=['GET'])
def get_drivers():
    try:
        drivers = f1_service.get_drivers()
        return jsonify(drivers)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/laps/<driver_code>', methods=['GET'])
def get_laps(driver_code):
    try:
        laps = f1_service.get_laps(driver_code.upper())
        return jsonify(laps)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/telemetry/<driver_code>', methods=['GET'])
def get_telemetry(driver_code):
    try:
        telemetry = f1_service.get_telemetry(driver_code.upper())
        return jsonify(telemetry)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/compare', methods=['GET'])
def compare_telemetry():
    driver1 = request.args.get('driver1')
    driver2 = request.args.get('driver2')
    
    if not driver1 or not driver2:
        return jsonify({"error": "Please provide both driver1 and driver2 parameters"}), 400
        
    try:
        telemetry1 = f1_service.get_telemetry(driver1.upper())
        telemetry2 = f1_service.get_telemetry(driver2.upper())
        return jsonify({
            driver1.upper(): telemetry1,
            driver2.upper(): telemetry2
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Pre-loading F1 Session (this might take a minute)...")
    # For a smoother UI experience out of the gate, load the session on startup
    f1_service.load_session()
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
