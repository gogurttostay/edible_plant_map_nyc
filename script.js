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
            if (error) reject(error);
            else resolve(data);
        });
    });
}

const { markerOptions, title, description, googleSheetDownloadUrl, mapboxAccessToken } = sheetmapperOptions;
mapboxgl.accessToken = mapboxAccessToken;

let currentHighlightedMarker = null;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(googleSheetDownloadUrl);
        if (!response.ok) throw new Error("Error loading sheet data");

        const csvData = await response.text();
        const geojsonData = await convertCsvToGeojson(csvData);

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [-73.95, 40.73],
            zoom: 12,
            maxBounds: [[-74.259, 40.477], [-73.700, 40.917]]
        });

        const plantInfo = {
            "Magnolia": {
                description: "Magnolia is a genus of flowering plants with beautiful large blossoms. Magnolia Trees are known for their large and fragrant flowers. They are found in temperate and subtropical regions of the world. Many species are edible.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Magnolia_x_soulangeana_%28Jean_Tosti%29.jpg",
                subtitle: "Season: Late March through early April.",
                details: "Magnolia × soulangeana, commonly known as the saucer magnolia, is widespread throughout NYC. Best harvested as late buds or early, closed blossoms, they make excellent pickles. They can also be used raw in salads, coated in sugar to make a shrub, or cooked down into a floral syrup.",
                caption: "Image: Jean Tosti via Wikimedia Commons"

            },
            "Juneberry": {
                description: "Amelanchier, better known as juneberries or serviceberries, are native to North America. Juneberries are sweet, edible berries often found in urban parks. They begin ripening by early June (hence the name). As the berries turn from bright red to near-black, you have another week to grab them before they drop. When perfectly ripe, they are as sweet as apples and as juicy as blueberries with a subtle almond aftertaste, which comes from the trace amounts of cyanide in the berries.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Amelanchier_ovalis3.JPG",
                subtitle: "Season: Late May through June.",
                details: "Juneberries are delicious raw, but they also make a great jam. They can be used in pies, tarts, and other desserts. Cooked down into a syrup, they're great in a cocktail or seltzer. Macerate them in a liqour of your choice for 6 months for a taste of summer in the depths of winter.",
                caption: "Image: I.Sáček via Wikimedia Commons"

            },
            "Mulberry": {
                description: "Morus rubra or alba (red or white mulberry) tend to be small- to medium-size trees with irregular, variegated leaves. Notwithstanding the child’s song, they are not bushes. Both the native red, which has ripe purplish-black berries, as well as the Chinese white, which was introduced in the 19th century to support an ultimately unsuccessful silk industry and which produces ghostly pale-to-sometimes purplish fruit, are prodigious fruit-bearers.",
                imageUrl: "https://static01.nyt.com/images/2012/06/08/nyregion/08mulberry1-cityroom/08mulberry1-cityroom-blog480.jpg",
                subtitle: "Season: Late May through June.",
                details: "I enjoy mulberries’ benignly sweet flavor either in jams or straight off the tree. Like raspberries and blackberries, mulberries are aggregate fruit clusters, but without the tartness.",
                caption: "Image: Ava Chin via The New York Times"

            },
            "Raspberry": {
                description: "Rubus idaeus, or the red raspberry, is a perennial shrub that produces edible fruit. Raspberries are a great source of vitamin C and fiber. They are often used in desserts, jams, and jellies.",
                imageUrl: "https://www.farmersalmanac.com/wp-content/uploads/2020/11/raspberries-456232_1920.jpg",
                subtitle: "Season: July through August.",
                details: "Raspberries can be eaten raw or cooked. They are often used in desserts, jams, and jellies. They can also be frozen for later use.",
                caption: "Image: Farmers Almanac"

            },
            // Add more plants here... 
        };

        map.on('load', () => {
            geojsonData.features.forEach(d => {
                const name = d.properties.Name;

                const getColorByType = (type) => {
                    switch (type) {
                        case 'Fruit Tree': return '#DF99F0';
                        case 'Fruit Bush': return '#A3005C';
                        case 'Flower': return '#E59EBF';
                        case 'Herb': return '#B5DF90';
                        case 'Leafy Green': return '#60992D';
                        case 'Nut Tree': return '#B27C66';
                        default: return '#4682b4';
                    }
                };

                const color = getColorByType(d.properties.Type);

                // Outer marker div
                const el = document.createElement('div');
                el.className = 'custom-marker';

                // Inner styled circle
                const inner = document.createElement('div');
                inner.className = 'custom-marker-inner';
                inner.style.backgroundColor = color;
                inner.style.width = `${15 * markerOptions.scale}px`;
                inner.style.height = `${15 * markerOptions.scale}px`;

                el.appendChild(inner);

                const marker = new mapboxgl.Marker(el)
                    .setLngLat(d.geometry.coordinates)
                    .addTo(map);

                el.addEventListener('click', (e) => {
                    e.stopPropagation();

                    if (currentHighlightedMarker && currentHighlightedMarker !== inner) {
                        currentHighlightedMarker.style.transform = "scale(1)";
                        currentHighlightedMarker.style.border = "none";
                    }

                    inner.style.transform = "scale(1.5)";
                    inner.style.border = "2px solid white";
                    currentHighlightedMarker = inner;

                    const info = plantInfo[name] || {
                        description: "No information available.",
                        imageUrl: "",
                        subtitle: "",
                        details: "",
                        caption: ""
                    };

                    document.getElementById("title").innerText = name;
                    // Show the location title and description by removing the "hidden" class
                    document.getElementById("location-title").classList.remove("hidden");
                    document.getElementById("location-description-title").classList.remove("hidden");
                    document.getElementById("plant-address").innerText = d.properties["Address"];
                    document.getElementById("plant-location").innerText = d.properties["Description"];
                    document.getElementById("plant-description").innerText = info.description;
                    document.getElementById("plant-image").src = info.imageUrl;
                    document.getElementById("plant-image").alt = name;
                    document.getElementById("plant-subtitle").innerText = info.subtitle;
                    document.getElementById("plant-details").innerText = info.details;
                    document.getElementById("plant-image-caption").innerText = info.caption;

                    console.log("Info object:", info);

                });

                el.addEventListener("mouseenter", () => {
                    if (currentHighlightedMarker !== inner) {
                        inner.style.transform = "scale(1.2)";
                    }
                });

                el.addEventListener("mouseleave", () => {
                    if (currentHighlightedMarker !== inner) {
                        inner.style.transform = "scale(1)";
                    }
                });
            });

            map.on('click', () => {
                document.getElementById("title").innerText = "Click a pin to learn more!";
                document.getElementById("location-title").classList.add("hidden");
                document.getElementById("location-description-title").classList.add("hidden");
                document.getElementById("plant-address").innerText = "";
                document.getElementById("plant-location").innerText = "";
                document.getElementById("plant-subtitle").innerText = "";
                document.getElementById("plant-description").innerText = "";
                document.getElementById("plant-details").innerText = "";
                document.getElementById("plant-image-caption").innerText = "";
                const img = document.getElementById("plant-image");
                img.src = "";
                img.alt = "";

                if (currentHighlightedMarker) {
                    currentHighlightedMarker.style.transform = "scale(1)";
                    currentHighlightedMarker.style.border = "none";
                    currentHighlightedMarker = null;
                }
            });

        });

        if (title) {
            document.getElementById("title").innerHTML = title;
        }

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while loading the map data. Please try again later.');
    }
});
