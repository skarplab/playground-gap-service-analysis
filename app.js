require([
    "esri/WebMap",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/layers/GeoJSONLayer",
    "esri/widgets/FeatureTable",
    "esri/widgets/Expand",
    "esri/widgets/LayerList",
    "esri/widgets/BasemapGallery",
    "esri/core/watchUtils"
], function (WebMap, MapView, FeatureLayer, GeoJSONLayer, FeatureTable, Expand, LayerList, BasemapGallery, watchUtils) {
    let selectedFeature,
        id;
    const features = [];

    const map = new WebMap({
        portalItem: {
            id: "3582b744bba84668b52a16b0b6942544"
        }
    });

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
        // SCHOOL POINTS LAYER
        const schoolPointsRenderer = {
            type: "simple",
            symbol: {
                type: "simple-marker",
                outline: {
                    width: 1.25,
                    color: [247, 247, 247, 1]
                },
                size: 8,
                color: [153, 0, 0, 1]
            }
          }

        const schoolPointsLabel = {
            symbol: {
              type: "text",
              color: "#4C1213",
              haloColor: "#f7f7f7",
              haloSize: 2,
              font: {
                 family: "serif",
                 size: 10
               }
            },
            labelPlacement: "above-center",
            labelExpressionInfo: {
              expression: "$feature.namelong"
            },
            maxScale: 0,
            minScale: 62500
          }

        const schoolPointsLayer = new GeoJSONLayer({
            url: './playground_schools.geojson',
            renderer: schoolPointsRenderer,
            labelingInfo: [schoolPointsLabel],
            labelsVisible: true
        })
        schoolPointsLayer.title = "WCPSS Schools with a Playground"

        // SCHOOL SERVICE AREAS LAYER

        const schoolRenderer = {
            type: "simple",
            symbol: {
                type: "simple-fill",
                outline: {
                    width: 0.25,
                    color: "#191919"
                },
                color: [153, 0, 0, 0.65]
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
                        ,
                        {
                            fieldName: 'weighted_mean_lap_score',
                            label: "Mean Land Acquisition Priority of Service Area (Population Weighted)",
                            format: {
                                places: 2
                            }
                        },
                        {
                            fieldName: 'mean_social_equity_score',
                            label: "Mean Social Equity of Service Area",
                            format: {
                                places: 2
                            }
                        },
                        {
                            fieldName: 'weighted_mean_social_equity_score',
                            label: "Mean Social Equity of Service Area (Population Weighted)",
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
                    label: "Additional Raleigh Population Served within a 10 Minute Walk of a Playground",
                    format: {
                        digitSeparator: true
                    }
                }, {
                    name: "mean_lap_score",
                    label: "Land Acquisition Priority",
                    format: {
                        places: 2
                    }
                }, {
                    name: "weighted_mean_lap_score",
                    label: "Population Weighted Land Acquisition Priority",
                    format: {
                        places: 2
                    }
                }, {
                    name: "mean_social_equity_score",
                    label: "Social Equity Score",
                    format: {
                        places: 2
                    }
                }, {
                    name: "weighted_mean_social_equity_score",
                    label: "Population Weighted Social Equity Score",
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
                    width: 0.25,
                    color: "#191919"
                },
                color: [241, 190, 72, 0.5]
            }
        }

        const parkSAPopupTemplate = {
            title: "Areas within a 10 Minute Walk of a Park with a Playground",
            content: [{
                type: "fields",
                fieldInfos: [
                    {
                        fieldName: "population",
                        label: "Raleigh Population within a 10 Minute Walk of a Public Park Playground ",
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

        // LAND ACQUISITION ANALYSIS

        const lapRenderer = {
            type: "simple",
            symbol: {
                type: "simple-fill",
                outline: {
                    width: 0
                }
            },
            visualVariables: [
                {
                    type: "color",
                    field: "lap_score",
                    stops: [
                        {
                            value: 100.0,
                            color: "#d73027",
                            label: "High Priority"
                        },
                        {
                            value: 50.0,
                            color: "#ffffbf"
                        },
                        {
                            value: 0.0,
                            color: "#4575b4",
                            label: "Low Priority"
                        }
                    ]
                }
            ]
        }

        const lapPopupTemplate = {
            title: "Land Acquisition Prioritization, Census Block {geoid10}",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: "lap_score",
                            label: "Score",
                            format: {
                                places: 2
                            }
                        }
                    ]
                }
            ]
        }

        const lapLayer = new FeatureLayer({
            portalItem: {
                id:"9f4a52777d9948b38f25f1411dc58ed4"
            },
            title: 'Land Acquisition Prioritization',
            renderer: lapRenderer,
            visible: false,
            outFields: ['geoid10', 'lap_score'],
            popupTemplate: lapPopupTemplate,
            definitionExpression: "etj=1"
        })

        // SOCIAL EQUITY ANALYSIS
        const socialEquityRenderer = {
            type: "simple",
            symbol: {
                type: "simple-fill",
                outline: {
                    width: 0
                }
            },
            visualVariables: [
                {
                    type: "color",
                    field: "social_equity_score",
                    stops: [
                        {
                            value: 90.0,
                            color: "#4e6605",
                            label: "High Priority"
                        },
                        {
                            value: 65.0,
                            color: "#7c9e14"
                        },
                        {
                            value: 40.0,
                            color: "#d9d7d6"
                        },
                        {
                            value: 0.0,
                            color: "#e6e4e1",
                            label: "Low Priority"
                        }
                    ]
                }
            ]
        }

        const socialEquityPopupTemplate = {
            title: "Social Equity Priority, Census Block {geoid10}",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: "social_equity_score",
                            label: "Score",
                            format: {
                                places: 2
                            }
                        }
                    ]
                }
            ]
        }

        const socialEquityLayer = new FeatureLayer({
            portalItem: {
                id:"9f4a52777d9948b38f25f1411dc58ed4"
            },
            title: 'Social Equity Priority',
            renderer: socialEquityRenderer,
            visible: false,
            outFields: ['geoid10','social_equity_score'],
            popupTemplate: socialEquityPopupTemplate,
            definitionExpression: "etj=1"
        })

        // ADD LAYERS TO MAP
        map.add(socialEquityLayer)
        map.add(lapLayer)
        map.add(parkSALayer)
        map.add(schoolLayer)
        map.add(schoolPointsLayer)

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

        const basemapGallery = new BasemapGallery({
            view: view
        })

        const bgExpand = new Expand({
            content: basemapGallery
        })

        view.ui.add(bgExpand, {
            position: "bottom-right"
        })


        // Add toggle visibility slider
        view.ui.add(document.getElementById("mainDiv"), "bottom-left");

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
