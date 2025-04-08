const sheetmapperOptions = {
    googleSheetDownloadUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMF8SeghzrdGwEj5z6zRiRRS_XwepCrNoNGCZL0rYlqCfVol5LCIr8cDorI6_1iuq-U-vXadUcdxfa/pub?output=csv',
    mapboxAccessToken: 'pk.eyJ1IjoiZGJlcmdlcjMyNCIsImEiOiJjbTkxejI1ODYwMGQ1MmxvbWZreDZhMGgxIn0.nfxxsMs9W6jzp0-Wo-OEZg',
    markerOptions: {
        color: '#4682b4',
        scale: 0.8
    },
    title: "Edible Plants in NYC",
    description: "Explore the locations of edible plants across New York City."
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

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11', // Add your Mapbox style here
            center: [-73.95, 40.73],  // Default center (Brooklyn)
            zoom: 12,  // Default zoom level
        });

        const plantInfo = {
            "Magnolia": {
                description: "Magnolia is a genus of flowering plants with beautiful large blossoms. Many species are edible.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Magnolia_x_soulangeana_%28Jean_Tosti%29.jpg",
                subtitle: "Magnolia Trees are known for their large and fragrant flowers.",
                details: "They are found in temperate and subtropical regions of the world."
            },
            "Juneberry": {
                description: "Juneberries are sweet, edible berries. They're often found in urban parks and bloom in early summer.",
                imageUrl: "https://example.com/juneberry.jpg",
                subtitle: "Juneberries are small, sweet berries that grow in clusters.",
                details: "They are often used in jams and pies."
            },
            // Add more plants here...
        };
        
        map.on('load', function () {
            geojsonData.features.forEach((d) => {
                const name = d.properties.Name;
        
                // Popup content logic
                const popupContent = `<h3>${name}</h3>` +
                    `<h4><b>Address: </b>${d.properties.Address}</h4>` +
                    `<h4><b>Phone: </b>${d.properties.Phone}</h4>`;
        
                // Create the marker and attach the popup
                const marker = new mapboxgl.Marker(markerOptions)
                    .setLngLat(d.geometry.coordinates)
                    .setPopup(new mapboxgl.Popup().setHTML(popupContent))
                    .addTo(map);
        
                // Add click event to the marker to update the sidebar
                marker.getElement().addEventListener('click', () => {
                    // Retrieve plant info (fallback to empty if not found)
                    const info = plantInfo[name] || {
                        description: "No information available.",
                        imageUrl: "",
                        subtitle: "",
                        details: ""
                    };
        
                    // Update sidebar content
                    document.getElementById("title").innerText = name;
                    document.getElementById("plant-description").innerText = info.description;
                    document.getElementById("plant-image").src = info.imageUrl;
                    document.getElementById("plant-image").alt = name;
                    document.getElementById("plant-subtitle").innerText = info.subtitle;
                    document.getElementById("plant-details").innerText = info.details;
                });
            });
        });
        
        // If the title and description from options exist, set them in the sidebar
        if (title) {
            document.getElementById("title").innerHTML = title;
        }

        if (description) {
            document.getElementById("description").innerHTML = description;
        }

    } catch (error) {
        // Handle errors gracefully
        console.error('Error:', error);  // Log the error to the console
        alert('An error occurred while loading the map data. Please try again later.');
    }
});
