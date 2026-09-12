let simulationTimer = null;

let generatedCount = 0;

let manualCount = 0;


const automaticSection =
    document.getElementById(
        "automatic-section"
    );

const manualSection =
    document.getElementById(
        "manual-section"
    );

const automaticModeButton =
    document.getElementById(
        "automatic-mode-button"
    );

const manualModeButton =
    document.getElementById(
        "manual-mode-button"
    );

const dataType =
    document.getElementById(
        "data-type"
    );

const manualDataType =
    document.getElementById(
        "manual-data-type"
    );

const dataTable =
    document.getElementById(
        "data-table"
    );

const manualTable =
    document.getElementById(
        "manual-table"
    );


automaticModeButton.addEventListener(
    "click",
    function () {

        automaticSection.classList.remove(
            "hidden"
        );

        manualSection.classList.add(
            "hidden"
        );

        automaticModeButton.classList.add(
            "active"
        );

        manualModeButton.classList.remove(
            "active"
        );
    }
);


manualModeButton.addEventListener(
    "click",
    function () {

        stopSimulation();

        manualSection.classList.remove(
            "hidden"
        );

        automaticSection.classList.add(
            "hidden"
        );

        manualModeButton.classList.add(
            "active"
        );

        automaticModeButton.classList.remove(
            "active"
        );
    }
);


function updateAutomaticType() {

    const variableSettings =
        document.getElementById(
            "variable-settings"
        );

    const attributeSettings =
        document.getElementById(
            "attribute-settings"
        );

    const display =
        document.getElementById(
            "display-data-type"
        );


    if (dataType.value === "variable") {

        variableSettings.classList.remove(
            "hidden"
        );

        attributeSettings.classList.add(
            "hidden"
        );

        display.innerText =
            "Variable";

    } else {

        variableSettings.classList.add(
            "hidden"
        );

        attributeSettings.classList.remove(
            "hidden"
        );

        display.innerText =
            "Attribute";
    }
}


dataType.addEventListener(
    "change",
    updateAutomaticType
);


function updateManualType() {

    const variable =
        document.getElementById(
            "manual-variable"
        );

    const attribute =
        document.getElementById(
            "manual-attribute"
        );

    const display =
        document.getElementById(
            "manual-type-display"
        );


    if (
        manualDataType.value ===
        "variable"
    ) {

        variable.classList.remove(
            "hidden"
        );

        attribute.classList.add(
            "hidden"
        );

        display.innerText =
            "Variable";

    } else {

        variable.classList.add(
            "hidden"
        );

        attribute.classList.remove(
            "hidden"
        );

        display.innerText =
            "Attribute";
    }
}


manualDataType.addEventListener(
    "change",
    updateManualType
);


function getConfiguration() {

    return {

        process_name:
            document.getElementById(
                "process-name"
            ).value,

        data_type:
            dataType.value,

        mean:
            Number(
                document.getElementById(
                    "mean"
                ).value
            ),

        standard_deviation:
            Number(
                document.getElementById(
                    "standard-deviation"
                ).value
            ),

        defect_rate:
            Number(
                document.getElementById(
                    "defect-rate"
                ).value
            ),

        sample_size:
            Number(
                document.getElementById(
                    "sample-size"
                ).value
            ),

        abnormal_mode:
            document.getElementById(
                "abnormal-mode"
            ).checked
    };
}


async function saveConfiguration(
    showMessage = true
) {

    const message =
        document.getElementById(
            "save-message"
        );

    try {

        const response =
            await fetch(
                "/api/config",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            getConfiguration()
                        )
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to save configuration."
            );
        }


        if (showMessage) {

            message.innerText =
                "✓ Configuration saved.";

            message.style.color =
                "#16a34a";
        }

        return true;

    } catch (error) {

        message.innerText =
            "✗ " + error.message;

        message.style.color =
            "#dc2626";

        return false;
    }
}


document.getElementById(
    "save-button"
).addEventListener(
    "click",
    function () {

        saveConfiguration(true);
    }
);


async function generateAutomaticData() {

    const saved =
        await saveConfiguration(false);

    if (!saved) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/generate"
            );

        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            return;
        }


        generatedCount++;


        document.getElementById(
            "generated-count"
        ).innerText =
            generatedCount;


        document.getElementById(
            "condition"
        ).innerText =
            data.condition;


        if (
            data.data_type ===
            "variable"
        ) {

            document.getElementById(
                "current-value"
            ).innerText =
                data.value;

            document.getElementById(
                "value-details"
            ).innerText =
                data.process_name
                + " • Variable Measurement";


            addGeneralRow(
                data
            );

        } else {

            document.getElementById(
                "current-value"
            ).innerText =
                data.defect_count;

            document.getElementById(
                "value-details"
            ).innerText =
                data.defect_count
                + " defectives from "
                + data.sample_size
                + " inspected units";


            addGeneralRow(
                data
            );
        }

    } catch (error) {

        document.getElementById(
            "value-details"
        ).innerText =
            "Unable to generate data.";
    }
}


document.getElementById(
    "generate-button"
).addEventListener(
    "click",
    generateAutomaticData
);


document.getElementById(
    "start-button"
).addEventListener(
    "click",
    async function () {

        if (
            simulationTimer !== null
        ) {
            return;
        }


        const saved =
            await saveConfiguration(true);

        if (!saved) {
            return;
        }


        const badge =
            document.getElementById(
                "simulation-badge"
            );


        badge.innerText =
            "RUNNING";

        badge.classList.remove(
            "stopped"
        );

        badge.classList.add(
            "running"
        );


        document.getElementById(
            "start-button"
        ).disabled =
            true;

        document.getElementById(
            "stop-button"
        ).disabled =
            false;


        await generateAutomaticData();


        simulationTimer =
            setInterval(
                generateAutomaticData,
                1000
            );
    }
);


function stopSimulation() {

    if (
        simulationTimer !== null
    ) {

        clearInterval(
            simulationTimer
        );

        simulationTimer = null;
    }


    const badge =
        document.getElementById(
            "simulation-badge"
        );


    badge.innerText =
        "STOPPED";

    badge.classList.remove(
        "running"
    );

    badge.classList.add(
        "stopped"
    );


    document.getElementById(
        "start-button"
    ).disabled =
        false;

    document.getElementById(
        "stop-button"
    ).disabled =
        true;
}


document.getElementById(
    "stop-button"
).addEventListener(
    "click",
    stopSimulation
);


document.getElementById(
    "send-manual-button"
).addEventListener(
    "click",
    async function () {

        const message =
            document.getElementById(
                "manual-message"
            );

        const processName =
            document.getElementById(
                "manual-process-name"
            ).value.trim();


        if (!processName) {

            message.innerText =
                "Enter a process name.";

            message.style.color =
                "#dc2626";

            return;
        }


        let endpoint;
        let payload;


        if (
            manualDataType.value ===
            "variable"
        ) {

            const valueInput =
                document.getElementById(
                    "manual-value"
                );

            if (
                valueInput.value === ""
            ) {

                message.innerText =
                    "Enter the next measurement.";

                message.style.color =
                    "#dc2626";

                return;
            }


            endpoint =
                "/api/manual/variable";


            payload = {

                process_name:
                    processName,

                value:
                    Number(
                        valueInput.value
                    )
            };

        } else {

            const defectInput =
                document.getElementById(
                    "manual-defect-count"
                );

            const sampleInput =
                document.getElementById(
                    "manual-sample-size"
                );


            if (
                defectInput.value === "" ||
                sampleInput.value === ""
            ) {

                message.innerText =
                    "Enter defective count and sample size.";

                message.style.color =
                    "#dc2626";

                return;
            }


            endpoint =
                "/api/manual/attribute";


            payload = {

                process_name:
                    processName,

                defect_count:
                    Number(
                        defectInput.value
                    ),

                sample_size:
                    Number(
                        sampleInput.value
                    )
            };
        }


        try {

            const response =
                await fetch(
                    endpoint,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to submit data."
                );
            }


            manualCount++;


            document.getElementById(
                "manual-count"
            ).innerText =
                manualCount;


            message.innerText =
                "✓ Observation "
                + manualCount
                + " added to the stream.";

            message.style.color =
                "#16a34a";


            if (
                data.data_type ===
                "variable"
            ) {

                document.getElementById(
                    "manual-current-value"
                ).innerText =
                    data.value;

                document.getElementById(
                    "manual-details"
                ).innerText =
                    "Observation "
                    + manualCount
                    + " • "
                    + data.process_name;


                document.getElementById(
                    "manual-value"
                ).value =
                    "";

            } else {

                document.getElementById(
                    "manual-current-value"
                ).innerText =
                    data.defect_count;

                document.getElementById(
                    "manual-details"
                ).innerText =
                    "Observation "
                    + manualCount
                    + " • "
                    + data.defect_count
                    + " / "
                    + data.sample_size;


                document.getElementById(
                    "manual-defect-count"
                ).value =
                    "";
            }


            addManualRow(
                data
            );

            addGeneralRow(
                data
            );


        } catch (error) {

            message.innerText =
                "✗ " + error.message;

            message.style.color =
                "#dc2626";
        }
    }
);


function addManualRow(data) {

    const empty =
        document.getElementById(
            "manual-empty-row"
        );

    if (empty) {
        empty.remove();
    }


    let value;


    if (
        data.data_type ===
        "variable"
    ) {

        value =
            data.value;

    } else {

        value =
            data.defect_count
            + " / "
            + data.sample_size;
    }


    const row =
        document.createElement(
            "tr"
        );


    row.innerHTML = `
        <td>${manualCount}</td>
        <td>${escapeHtml(data.process_name)}</td>
        <td>${data.data_type}</td>
        <td>${value}</td>
    `;


    manualTable.appendChild(
        row
    );
}


function addGeneralRow(data) {

    const empty =
        document.getElementById(
            "empty-row"
        );

    if (empty) {
        empty.remove();
    }


    let value;


    if (
        data.data_type ===
        "variable"
    ) {

        value =
            data.value;

    } else {

        value =
            data.defect_count
            + " / "
            + data.sample_size;
    }


    const row =
        document.createElement(
            "tr"
        );


    row.innerHTML = `
        <td>${data.id}</td>
        <td>${data.source}</td>
        <td>${escapeHtml(data.process_name)}</td>
        <td>${data.data_type}</td>
        <td>${value}</td>
        <td>${data.condition}</td>
    `;


    dataTable.insertBefore(
        row,
        dataTable.firstChild
    );


    while (
        dataTable.children.length > 20
    ) {

        dataTable.removeChild(
            dataTable.lastChild
        );
    }
}


document.getElementById(
    "clear-manual-button"
).addEventListener(
    "click",
    async function () {

        try {

            const response =
                await fetch(
                    "/api/manual-data/clear",
                    {
                        method: "POST"
                    }
                );


            const result =
                await response.json();


            if (!result.success) {
                return;
            }


            manualCount = 0;


            document.getElementById(
                "manual-count"
            ).innerText =
                "0";


            document.getElementById(
                "manual-current-value"
            ).innerText =
                "--";


            document.getElementById(
                "manual-details"
            ).innerText =
                "No manual observations submitted";


            manualTable.innerHTML = `
                <tr id="manual-empty-row">
                    <td colspan="4">
                        No manual observations submitted.
                    </td>
                </tr>
            `;


            document.getElementById(
                "manual-message"
            ).innerText =
                "Manual data cleared.";


            await loadGeneralStream();


        } catch (error) {

            document.getElementById(
                "manual-message"
            ).innerText =
                "Unable to clear manual data.";
        }
    }
);


async function loadGeneralStream() {

    try {

        const response =
            await fetch(
                "/api/data"
            );

        const result =
            await response.json();


        dataTable.innerHTML =
            "";


        if (
            result.data.length === 0
        ) {

            dataTable.innerHTML = `
                <tr id="empty-row">
                    <td colspan="6">
                        No data generated yet.
                    </td>
                </tr>
            `;

            return;
        }


        const recent =
            result.data.slice(-20);


        recent.reverse();


        recent.forEach(
            function (data) {

                let value;


                if (
                    data.data_type ===
                    "variable"
                ) {

                    value =
                        data.value;

                } else {

                    value =
                        data.defect_count
                        + " / "
                        + data.sample_size;
                }


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `
                    <td>${data.id}</td>
                    <td>${data.source}</td>
                    <td>${escapeHtml(data.process_name)}</td>
                    <td>${data.data_type}</td>
                    <td>${value}</td>
                    <td>${data.condition}</td>
                `;


                dataTable.appendChild(
                    row
                );
            }
        );


    } catch (error) {

        console.error(
            "Unable to load data stream."
        );
    }
}


function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}


async function loadConfiguration() {

    try {

        const response =
            await fetch(
                "/api/config"
            );

        const result =
            await response.json();

        const config =
            result.config;


        document.getElementById(
            "process-name"
        ).value =
            config.process_name;


        document.getElementById(
            "manual-process-name"
        ).value =
            config.process_name;


        dataType.value =
            config.data_type;


        document.getElementById(
            "mean"
        ).value =
            config.mean;


        document.getElementById(
            "standard-deviation"
        ).value =
            config.standard_deviation;


        document.getElementById(
            "defect-rate"
        ).value =
            config.defect_rate;


        document.getElementById(
            "sample-size"
        ).value =
            config.sample_size;


        document.getElementById(
            "abnormal-mode"
        ).checked =
            config.abnormal_mode;


        updateAutomaticType();

        updateManualType();


    } catch (error) {

        console.error(
            "Unable to load configuration."
        );
    }
}


loadConfiguration();

loadGeneralStream();