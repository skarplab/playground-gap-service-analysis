require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/widgets/FeatureTable",
    "esri/widgets/Expand",
    "esri/widgets/LayerList",
    "esri/core/watchUtils"
], function (Map, MapView, GeoJSONLayer, FeatureTable, Expand, LayerList, watchUtils) {
    let selectedFeature,
        id;
    const features = [];

    const map = new Map({basemap: "gray-vector"});

    const view = new MapView({
        map: map,
        container: "viewDiv",
        zoom: 11,
        center: [
            -78.65, 35.8
        ],
        popup: {
            dockEnabled: true,
            dockOptions: {
                buttonEnabled: false,
                breakpoint: false
            }
        }
    });

    // When view is ready, find feature layer and set title and outFields
    view.when(function () { 
        
        // SCHOOL LAYER

        const schoolRenderer = {
            type: "simple",
            symbol: {
                type: "simple-fill",
                outline: {
                    width: 0
                },
                color: [253, 216, 53, 0.5]
            }
        }

        const schoolPopupTemplate = {
            title: "{name}",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: "population",
                            label: "Additional Population Served",
                            format: {
                                digitSeparator: true
                            }
                        },
                        {
                            fieldName: 'mean_lap_score',
                            label: "Mean Land Acquisition Priority of Service Area",
                            format: {
                                places: 2
                            }
                        }
                    ]
                }
            ]
        }

        const schoolLayer = new GeoJSONLayer(
            {
                url: './playground_school_10mw_unserved.geojson',
                renderer: schoolRenderer,
                popupTemplate: schoolPopupTemplate
            }
        )
        schoolLayer.title = "Portions of 10 Minute Walk Service Area of WCPSS Schoools with Playgrounds not Served by a Public Park Playground";
        schoolLayer.outFields = ["*"];

        map.add(schoolLayer)

        // Get references to div elements for toggling table visibility
        const appContainer = document.getElementById("appContainer");
        const tableContainer = document.getElementById("tableContainer");
        const tableDiv = document.getElementById("tableDiv");

        // Create FeatureTable
        const featureTable = new FeatureTable({
            view: view, // make sure to pass in view in order for selection to work
            layer: schoolLayer,
            fieldConfigs: [
                {
                    name: "name",
                    label: "School",
                    direction: "asc"
                }, {
                    name: "population",
                    label: "Addtional Raleigh Population Served",
                    format: {
                        digitSeparator: true
                    }
                }, {
                    name: "mean_lap_score",
                    label: "Average Land Acquisition Priority",
                    format: {
                        places: 2
                    }
                }
            ],
            container: tableDiv
        });

        // PARK PLAYGROUND SERVICE AREA

        const parkSARenderer = {
            type: "simple",
            symbol: {
                type: "simple-fill",
                outline: {
                    width: 0
                },
                color: [128, 203, 196, 0.5]
            }
        }

        const parkSAPopupTemplate = {
            title: "Areas within a 10 Minute Walk of a Park with a Playground",
            content: [{
                type: "fields",
                fieldInfos: [
                    {
                        fieldName: "population",
                        label: "Raleigh Population Served",
                        format: {
                            digitSeparator: true
                        }
                    }
                ]}
            ]
        }

        const parkSALayer = new GeoJSONLayer({
            url: './playground_park_10mw_combined_sa.geojson',
            renderer: parkSARenderer,
            popupTemplate: parkSAPopupTemplate
        })
        parkSALayer.title = "Areas within a 10 Minute Walk of a Park with a Playground"

        map.add(parkSALayer)

        // LAYER LIST

        
        const layerList = new LayerList({
            view: view,
            listItemCreatedFunction: function(event) {
                const item = event.item;
                if (item.layer.type != "group") {
                  // don't show legend twice
                  item.panel = {
                    content: "legend",
                    open: true
                  };
                }
              }
        })

        const llExpand = new Expand({
            view: view,
            content: layerList
        })

        view.ui.add(llExpand, "bottom-right")


        // Add toggle visibility slider
        view.ui.add(document.getElementById("mainDiv"), "top-right");

        // Get reference to div elements
        const checkboxEle = document.getElementById("checkboxId");
        const labelText = document.getElementById("labelText");

        // Listen for when toggle is changed, call toggleFeatureTable function
        checkboxEle.onchange = function () {
            toggleFeatureTable();
        };

        function toggleFeatureTable() { // Check if the table is displayed, if so, toggle off. If not, display.
            if (! checkboxEle.checked) {
                appContainer.removeChild(tableContainer);
                labelText.innerHTML = "Show Table";
            } else {
                appContainer.appendChild(tableContainer);
                labelText.innerHTML = "Hide Table";
            }
        }

        featureTable.on("selection-change", function (changes) { // If row is unselected in table, remove it from the features array
            changes.removed.forEach(function (item) {
                const data = features.find(function (data) {
                    return data.feature === item.feature;
                });
            });

            // If a row is selected, add to the features array
            changes.added.forEach(function (item) {
                const feature = item.feature;
                features.push({feature: feature});

                // Listen for row selection in the feature table. If the popup is open and a row is selected that is not the same feature as opened popup, close the existing popup.
                if (feature.attributes.OBJECTID !== id && view.popup.visible === true) {
                    featureTable.deselectRows(selectedFeature);
                    view.popup.close();
                }
            });
        });

        // Watch for the popup's visible property. Once it is true, clear the current table selection and select the corresponding table row from the popup
        watchUtils.watch(view.popup, "visible", (graphic) => {
            selectedFeature = view.popup.selectedFeature;
            if (selectedFeature !== null && view.popup.visible !== false) {
                featureTable.clearSelection();
                featureTable.selectRows(view.popup.selectedFeature);
                id = selectedFeature.getObjectId();
            }
        });
    });
});
