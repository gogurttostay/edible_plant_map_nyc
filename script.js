const sheetmapperOptions = {
    googleSheetDownloadUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMF8SeghzrdGwEj5z6zRiRRS_XwepCrNoNGCZL0rYlqCfVol5LCIr8cDorI6_1iuq-U-vXadUcdxfa/pub?output=csv',
    mapboxAccessToken: 'pk.eyJ1IjoiZGJlcmdlcjMyNCIsImEiOiJjbTkxejI1ODYwMGQ1MmxvbWZreDZhMGgxIn0.nfxxsMs9W6jzp0-Wo-OEZg',
    markerOptions: {
        color: '#4682b4',
        scale: 0.8
    },
    title: "Click a pin to learn more!",
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
            style: 'mapbox://styles/mapbox/outdoors-v12', // Add your Mapbox style here
            center: [-73.95, 40.73],  // Default center (Brooklyn)
            zoom: 12,  // Default zoom level
        });

        const plantInfo = {
            "Magnolia": {
                description: "Magnolia is a genus of flowering plants with beautiful large blossoms. Magnolia Trees are known for their large and fragrant flowers. They are found in temperate and subtropical regions of the world. Many species are edible.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Magnolia_x_soulangeana_%28Jean_Tosti%29.jpg",
                subtitle: "Season: Late-March through early-April.",
                details: "Magnolia × soulangeana, commonly known as the saucer magnolia, is widespread throughout NYC. Best harvested as late buds or early, closed blossoms, they make excellent pickles. They can also be used raw in salads, coated in sugar to make a shrub, or cooked down into a floral syrup.",
                caption: "Image: Jean Tosti via Wikimedia Commons"

            },
            "Juneberry": {
                description: "Amelanchier, better known as juneberries or serviceberries, are native to North America. Juneberries are sweet, edible berries often found in urban parks. They begin ripening by early June (hence the name). As the berries turn from bright red to near-black, you have another week to grab them before they drop. When perfectly ripe, they are as sweet as apples and as juicy as blueberries with a subtle almond aftertaste, which comes from the trace amounts of cyanide in the berries.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Amelanchier_ovalis3.JPG",
                subtitle: "Season: Late-May through June.",
                details: "Juneberries are delicious raw, but they also make a great jam. They can be used in pies, tarts, and other desserts. Cooked down into a syrup, they're great in a cocktail or seltzer. Macerate them in a liqour of your choice for 6 months for a taste of summer in the depths of winter.",
                caption: "Image: I.Sáček via Wikimedia Commons"

            },
            "Mulberry": {
                description: "Morus rubra or alba (red or white mulberry) tend to be small- to medium-size trees with irregular, variegated leaves. Notwithstanding the child’s song, they are not bushes. Both the native red, which has ripe purplish-black berries, as well as the Chinese white, which was introduced in the 19th century to support an ultimately unsuccessful silk industry and which produces ghostly pale-to-sometimes purplish fruit, are prodigious fruit-bearers.",
                imageUrl: "https://static01.nyt.com/images/2012/06/08/nyregion/08mulberry1-cityroom/08mulberry1-cityroom-blog480.jpg",
                subtitle: "Season: Late-May through June.",
                details: "I enjoy mulberries’ benignly sweet flavor either in jams or straight off the tree. Like raspberries and blackberries, mulberries are aggregate fruit clusters, but without the tartness.",
                caption: "Image: Ava Chin via The New York Times"

            },
            // Add more plants here... 
        };

        map.on('load', function () {
            geojsonData.features.forEach((d) => {
                const name = d.properties.Name;

                // Popup content logic
                const popupContent = `<h3>${name}</h3>` +
                    `<h4><b>Address: </b>${d.properties.Address}</h4>` +
                    `<h4><b>Location Description:</b> ${d.properties.Description || ""}</h4>`;




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
                    document.getElementById("plant-image-caption").innerText = info.caption || "";

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
