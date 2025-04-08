const sheetmapperOptions = {
    googleSheetDownloadUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMF8SeghzrdGwEj5z6zRiRRS_XwepCrNoNGCZL0rYlqCfVol5LCIr8cDorI6_1iuq-U-vXadUcdxfa/pub?output=csv',
    mapboxAccessToken: 'pk.eyJ1IjoiZGJlcmdlcjMyNCIsImEiOiJjbTkxejI1ODYwMGQ1MmxvbWZreDZhMGgxIn0.nfxxsMs9W6jzp0-Wo-OEZg',
    markerOptions: {
        color: '#4682b4',
        scale: 0.8
    },
    title: 'Mapbox Sheetmapper',
    description: 'Sheetmapper is an html and javascript template to help you quickly create an interactive map with point data sourced from a google sheet.'
};

async function convertCsvToGeojson(csvData) {
    return new Promise((resolve, reject) => {
        csv2geojson.csv2geojson(csvData, {
            latfield: 'Latitude',
            lonfield: 'Longitude',
            delimiter: ','
        }, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

const { markerOptions, title, description, googleSheetDownloadUrl, mapboxAccessToken } = sheetmapperOptions;

mapboxgl.accessToken = mapboxAccessToken;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`${googleSheetDownloadUrl}`);
        if (!response.ok) {
            throw new Error(`Error loading google sheet data. Make sure googleSheetId is configured properly and that the google sheet has been published to the web.`);
        }

        const csvData = await response.text();
        console.log(csvData);
        const geojsonData = await convertCsvToGeojson(csvData);

        const bounds = turf.bbox(geojsonData);

        const map = new mapboxgl.Map({
            container: 'map',
            bounds,
            fitBoundsOptions: {
                padding: 100
            }
        });

        map.on('load', function () {
            geojsonData.features.forEach((d) => {
                console.log("Name:", d.properties.Name, "| Coordinates:", d.geometry.coordinates);

                const [lng, lat] = d.geometry.coordinates;
                if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    console.warn("Skipping invalid coordinates:", d.geometry.coordinates);
                    return;
                }

                const popupContent = `<h3>${d.properties.Name}</h3>` +
                    `<h4><b>Address: </b>${d.properties.Address}</h4>` +
                    `<h4><b>Phone: </b>${d.properties.Phone}</h4>`;

                new mapboxgl.Marker(markerOptions)
                    .setLngLat(d.geometry.coordinates)
                    .setPopup(new mapboxgl.Popup().setHTML(popupContent))
                    .addTo(map);
            });

            if (title) {
                document.getElementById("title").innerHTML = title;
            }

            if (description) {
                document.getElementById("description").innerHTML = description;
            }
        });

    } catch (error) {
        alert(error);
    }
});
