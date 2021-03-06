/* maps
 *  Description: define parameters of our map static tile
 *  - attribution: credits to OpenStreetMap and Mapbox
 *  - maxZoom: higher = city level detail / lower = continent level detail
 *  - id: id of map's static image
 *  - accessToken: our access token
 */
var lightMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 18,
    id: 'light-v10',
    accessToken: API_KEY
});

var darkMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: 'dark-v10',
    accessToken: API_KEY
});

var satelliteMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: 'satellite-streets-v11',
    accessToken: API_KEY
});

// To display as options in control layer
var baseMaps = {
    "Light Map": lightMap,
    "Dark Map": darkMap,
    "Satellite": satelliteMap
}

/* extraLayers
 *  Description: layers that can enhance the map for better understanding of visualization
 */
var extraLayers = {
    PLATES: new L.layerGroup()
}

// To display as options in control layer
var extraMaps = {
    "Extras": {
        "Tectonic Plates": extraLayers.PLATES
    }
}

/* dataLayers
 *  Description: a dictionary of different group layers for the different types of natural disasters
 *  - EARTHQUAKES: earthquake layer group
 *  - FLOODS: flood layer group
 *  - HURRICANES: hurricane layer group
 *  - TORNADOES: tornado layer group
 */
var dataLayers = {
    pastHour: new L.layerGroup(),
    pastDay: new L.layerGroup(),
    pastSevenDays: new L.layerGroup(),
    pastThirtyDays: new L.layerGroup()
};

// To display as options in control layer
var overlayMaps = {
    "Filter Earthquakes": {
        "Past Hour": dataLayers.pastHour,
        "Past Day": dataLayers.pastDay,
        "Past 7 Days": dataLayers.pastSevenDays,
        "Past 30 Days": dataLayers.pastThirtyDays
    },
    "Extra": {
        "Tectonic Plates": extraLayers.PLATES
    }
};

var options = {
    exclusiveGroups: ["Filter Earthquakes"],
    groupCheckboxes: false
};

/* Map
 *  Description: initiate map centered on North America
 */
var map = L.map("map", {
    center: [47.0479471, -121.2054656],
    zoom: 3,
    layers: [darkMap]
});

/* Control Layers
 *  Description: Top right control box to filter natural disaster layers and type of map and bottom left legend
 */
L.control.groupedLayers(baseMaps, overlayMaps, options).addTo(map);

/* Legend
 *  Description: Creating the legend for the map
 */
let legend = L.control({
    position: 'bottomright'
});

legend.onAdd = function (map) {
    let div = L.DomUtil.create("div", "legend"),
        grades = [0, 1, 2, 3, 4, 5],
        labels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];

    grades.forEach(grade => {
        div.innerHTML += '<i style="background:' + markerColor(grade) + '"></i> ' +
            grade + ((grade+1) ? '&ndash;' + (grade+1) + '<br>' : '+');
    })

    return div;
};

legend.addTo(map);

/* Earth Tectonic Plates
 *  Description: Add a layer for tectonic plates
 *
 *  Credit:
 *      - utilizes @fraxen's conversion of tectonic plates data into GeoJSON
 *          -(https: //github.com/fraxen/tectonicplates)
 */
var platesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

d3.json(platesUrl).then(data => {
    extraLayers.PLATES.addLayer(
        L.geoJSON(data, {
            style: {
                weight: 1,
                color: "orange"
            }
        })
    )
    extraLayers.PLATES.addTo(map)
});

/* markerSize
 *  Description: function to return a magnified size of an earthquake's magnitude for use of leaflet marker size
 */
function markerSize(magnitude) {
    return magnitude * 2;
};

/* markerColor
 *  Description: function to return color based on magnitude
 */
function markerColor(magnitude) {
    if (magnitude >= 5){
        return "#ff0000";   // Red
    }else if (magnitude >= 4){
        return "#ff6600";   // Light Red
    }else if (magnitude >= 3){
        return "#ff9933";   // Orange
    }else if (magnitude >= 2){
        return "#ffcc00";   // Light Orange
    }else if (magnitude >= 1){
        return "#ffff00";   // Yellow
    }else{
        return "#00ff00";    // Green
    }
};

// d3 converters for epoch time
var dateFormat = d3.timeFormat("%x %X");

// Hour
d3.json(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson`).then(data => {
    dataLayers.pastHour.addLayer(
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    stroke: false,
                    fillOpacity: 0.5,
                    color: markerColor(feature.properties.mag),
                    fillColor: markerColor(feature.properties.mag),
                    radius: markerSize(feature.properties.mag)
                });
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(
                    `<center>
                    <b>EARTHQUAKE</b><br>
                    Magnitude: ${feature.properties.mag}<br>
                    Date/Time: ${dateFormat(feature.properties.time)}<br>
                    Coordinates: ${feature.geometry.coordinates[0]}, ${feature.geometry.coordinates[1]}<br>
                    Location: ${feature.properties.title}<br>
                    </center>`);
            }
        })
    )
});
dataLayers.pastHour.addTo(map);

// Day
d3.json(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`).then(data => {
    dataLayers.pastDay.addLayer(
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    stroke: false,
                    fillOpacity: 0.5,
                    color: markerColor(feature.properties.mag),
                    fillColor: markerColor(feature.properties.mag),
                    radius: markerSize(feature.properties.mag)
                });
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(
                    `<center>
                    <b>EARTHQUAKE</b><br>
                    Magnitude: ${feature.properties.mag}<br>
                    Date/Time: ${dateFormat(feature.properties.time)}<br>
                    Coordinates: ${feature.geometry.coordinates[0]}, ${feature.geometry.coordinates[1]}<br>
                    Location: ${feature.properties.title}<br>
                    </center>`);
            }
        })
    )
});
dataLayers.pastDay.addTo(map);

// 7 Days
d3.json(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson`).then(data => {
    dataLayers.pastSevenDays.addLayer(
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    stroke: false,
                    fillOpacity: 0.5,
                    color: markerColor(feature.properties.mag),
                    fillColor: markerColor(feature.properties.mag),
                    radius: markerSize(feature.properties.mag)
                });
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(
                    `<center>
                    <b>EARTHQUAKE</b><br>
                    Magnitude: ${feature.properties.mag}<br>
                    Date/Time: ${dateFormat(feature.properties.time)}<br>
                    Coordinates: ${feature.geometry.coordinates[0]}, ${feature.geometry.coordinates[1]}<br>
                    Location: ${feature.properties.title}<br>
                    </center>`);
            }
        })
    )
});
dataLayers.pastSevenDays.addTo(map);

// 30 Days
d3.json(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson`).then(data => {
    dataLayers.pastThirtyDays.addLayer(
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    stroke: false,
                    fillOpacity: 0.5,
                    color: markerColor(feature.properties.mag),
                    fillColor: markerColor(feature.properties.mag),
                    radius: markerSize(feature.properties.mag)
                });
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(
                    `<center>
                    <b>EARTHQUAKE</b><br>
                    Magnitude: ${feature.properties.mag}<br>
                    Date/Time: ${dateFormat(feature.properties.time)}<br>
                    Coordinates: ${feature.geometry.coordinates[0]}, ${feature.geometry.coordinates[1]}<br>
                    Location: ${feature.properties.title}<br>
                    </center>`);
            }
        })
    )
});
dataLayers.pastThirtyDays.addTo(map);