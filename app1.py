from flask import Flask, jsonify, request, render_template
import random
import time

app = Flask(__name__)


simulator_config = {
    "process_name": "Generic Manufacturing Process",
    "data_type": "variable",
    "mean": 500.0,
    "standard_deviation": 0.15,
    "defect_rate": 0.04,
    "sample_size": 100,
    "abnormal_mode": False
}


data_stream = []

manual_stream = []

next_data_id = 1


def add_to_stream(data):

    global next_data_id

    data["id"] = next_data_id
    next_data_id += 1

    data_stream.append(data)

    if len(data_stream) > 500:
        data_stream.pop(0)

    if data["source"] == "manual":

        manual_stream.append(data)

        if len(manual_stream) > 500:
            manual_stream.pop(0)

    return data


@app.route("/")
def home():

    return render_template("index.html")


@app.route("/api/config", methods=["GET", "POST"])
def configuration():

    global simulator_config

    if request.method == "GET":

        return jsonify({
            "success": True,
            "config": simulator_config
        })

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "No configuration data received."
        }), 400

    try:

        process_name = str(
            data.get(
                "process_name",
                simulator_config["process_name"]
            )
        ).strip()

        data_type = str(
            data.get(
                "data_type",
                simulator_config["data_type"]
            )
        )

        mean = float(
            data.get(
                "mean",
                simulator_config["mean"]
            )
        )

        standard_deviation = float(
            data.get(
                "standard_deviation",
                simulator_config["standard_deviation"]
            )
        )

        defect_rate = float(
            data.get(
                "defect_rate",
                simulator_config["defect_rate"]
            )
        )

        sample_size = int(
            data.get(
                "sample_size",
                simulator_config["sample_size"]
            )
        )

        abnormal_mode = bool(
            data.get(
                "abnormal_mode",
                simulator_config["abnormal_mode"]
            )
        )

        if not process_name:
            raise ValueError(
                "Process name cannot be empty."
            )

        if data_type not in ["variable", "attribute"]:
            raise ValueError(
                "Invalid data type."
            )

        if standard_deviation <= 0:
            raise ValueError(
                "Standard deviation must be greater than 0."
            )

        if defect_rate < 0 or defect_rate > 1:
            raise ValueError(
                "Defect rate must be between 0 and 1."
            )

        if sample_size <= 0:
            raise ValueError(
                "Sample size must be greater than 0."
            )

        simulator_config = {
            "process_name": process_name,
            "data_type": data_type,
            "mean": mean,
            "standard_deviation": standard_deviation,
            "defect_rate": defect_rate,
            "sample_size": sample_size,
            "abnormal_mode": abnormal_mode
        }

        return jsonify({
            "success": True,
            "message": "Configuration saved successfully.",
            "config": simulator_config
        })

    except (ValueError, TypeError) as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 400


def create_variable_data():

    mean = float(
        simulator_config["mean"]
    )

    standard_deviation = float(
        simulator_config["standard_deviation"]
    )

    abnormal_mode = simulator_config[
        "abnormal_mode"
    ]

    if abnormal_mode:

        direction = random.choice([-1, 1])

        shifted_mean = (
            mean
            + direction
            * 6
            * standard_deviation
        )

        value = random.normalvariate(
            shifted_mean,
            standard_deviation
        )

        condition = "Abnormal"

    else:

        value = random.normalvariate(
            mean,
            standard_deviation
        )

        condition = "Normal"

    data = {
        "success": True,
        "source": "automatic",
        "process_name":
            simulator_config["process_name"],
        "data_type": "variable",
        "value": round(value, 3),
        "condition": condition,
        "timestamp": int(time.time())
    }

    return add_to_stream(data)


def create_attribute_data():

    sample_size = int(
        simulator_config["sample_size"]
    )

    defect_rate = float(
        simulator_config["defect_rate"]
    )

    abnormal_mode = simulator_config[
        "abnormal_mode"
    ]

    if abnormal_mode:

        active_defect_rate = min(
            max(
                defect_rate * 4,
                defect_rate + 0.10
            ),
            1.0
        )

        condition = "Abnormal"

    else:

        active_defect_rate = defect_rate
        condition = "Normal"

    defect_count = sum(
        1
        for _ in range(sample_size)
        if random.random() < active_defect_rate
    )

    proportion_defective = (
        defect_count / sample_size
    )

    data = {
        "success": True,
        "source": "automatic",
        "process_name":
            simulator_config["process_name"],
        "data_type": "attribute",
        "sample_size": sample_size,
        "defect_count": defect_count,
        "proportion_defective":
            round(proportion_defective, 4),
        "condition": condition,
        "timestamp": int(time.time())
    }

    return add_to_stream(data)


@app.route("/api/generate")
def generate_data():

    if simulator_config["data_type"] == "variable":

        return jsonify(
            create_variable_data()
        )

    return jsonify(
        create_attribute_data()
    )


@app.route("/api/variable-data")
def variable_data():

    return jsonify(
        create_variable_data()
    )


@app.route("/api/attribute-data")
def attribute_data():

    return jsonify(
        create_attribute_data()
    )


@app.route(
    "/api/manual/variable",
    methods=["POST"]
)
def manual_variable():

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "No manual data received."
        }), 400

    try:

        value = float(
            data["value"]
        )

        process_name = str(
            data.get(
                "process_name",
                simulator_config["process_name"]
            )
        ).strip()

        if not process_name:
            raise ValueError(
                "Process name cannot be empty."
            )

        observation = {
            "success": True,
            "source": "manual",
            "process_name": process_name,
            "data_type": "variable",
            "value": value,
            "condition": "Manual Input",
            "timestamp": int(time.time())
        }

        observation = add_to_stream(
            observation
        )

        return jsonify(observation)

    except (ValueError, TypeError, KeyError) as error:

        return jsonify({
            "success": False,
            "message":
                str(error) or
                "Enter a valid measurement."
        }), 400


@app.route(
    "/api/manual/attribute",
    methods=["POST"]
)
def manual_attribute():

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "success": False,
            "message": "No manual data received."
        }), 400

    try:

        defect_count = int(
            data["defect_count"]
        )

        sample_size = int(
            data["sample_size"]
        )

        process_name = str(
            data.get(
                "process_name",
                simulator_config["process_name"]
            )
        ).strip()

        if not process_name:
            raise ValueError(
                "Process name cannot be empty."
            )

        if sample_size <= 0:
            raise ValueError(
                "Sample size must be greater than 0."
            )

        if defect_count < 0:
            raise ValueError(
                "Defective count cannot be negative."
            )

        if defect_count > sample_size:
            raise ValueError(
                "Defective count cannot exceed sample size."
            )

        proportion = (
            defect_count / sample_size
        )

        observation = {
            "success": True,
            "source": "manual",
            "process_name": process_name,
            "data_type": "attribute",
            "sample_size": sample_size,
            "defect_count": defect_count,
            "proportion_defective":
                round(proportion, 4),
            "condition": "Manual Input",
            "timestamp": int(time.time())
        }

        observation = add_to_stream(
            observation
        )

        return jsonify(observation)

    except (ValueError, TypeError, KeyError) as error:

        return jsonify({
            "success": False,
            "message":
                str(error) or
                "Enter valid attribute data."
        }), 400


@app.route("/api/data")
def get_data_stream():

    after_id = request.args.get(
        "after_id",
        default=0,
        type=int
    )

    new_data = [
        item
        for item in data_stream
        if item["id"] > after_id
    ]

    return jsonify({
        "success": True,
        "count": len(new_data),
        "data": new_data
    })


@app.route("/api/manual-data")
def get_manual_stream():

    return jsonify({
        "success": True,
        "count": len(manual_stream),
        "data": manual_stream
    })


@app.route(
    "/api/manual-data/clear",
    methods=["POST"]
)
def clear_manual_data():

    global data_stream
    global manual_stream

    manual_ids = {
        item["id"]
        for item in manual_stream
    }

    data_stream = [
        item
        for item in data_stream
        if item["id"] not in manual_ids
    ]

    manual_stream = []

    return jsonify({
        "success": True,
        "message": "Manual data cleared successfully."
    })


@app.route(
    "/api/data/clear",
    methods=["POST"]
)
def clear_all_data():

    global data_stream
    global manual_stream
    global next_data_id

    data_stream = []
    manual_stream = []
    next_data_id = 1

    return jsonify({
        "success": True,
        "message": "All simulator data cleared."
    })


@app.route("/api/status")
def status():

    return jsonify({
        "application": "SPC Data Simulator",
        "status": "running",
        "stored_observations": len(data_stream),
        "manual_observations": len(manual_stream),
        "port": 5001
    })


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )