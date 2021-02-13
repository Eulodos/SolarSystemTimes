

document.addEventListener("DOMContentLoaded", () => {

    const today = new Date();

    const dailyAsteroid = document.querySelector("#dailyAsteroid");
    const asteroidsTable = document.querySelector("#allAsteroids");
    const rootEl = document.documentElement;
    const modal = document.querySelector('.modal');
    const modalButton = document.querySelector('.modal-button');
    const modalCloses = document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button');
    const modalImg = document.querySelector(".image");
    const picAddInfo = document.querySelector("#picAddInfo");
    const cardContent = document.querySelector(".card-content");
    const navDate = document.querySelector("#navDate");
    const apodDate = document.querySelector("#apodDate");

    const API_KEY = 'Nre4wmY8qqGoPkT0PVjrljeeU54ganxOEHEpb0Gc';


    navDate.textContent = `${today.toLocaleDateString()} - `;


    const formatDate = (date) => {
        console.log(date);
        return date.toISOString().split("T")[0];
    }


    if (apodDate) {
        apodDate.value = "";
        apodDate.max = formatDate(today);
    }

    // HANDLE MODALS

    const openModal = () => {
        rootEl.classList.toggle("is-clipped");
        modal.classList.toggle("is-active");
    }
    
    // Remove already existing images

    const deleteImg = () => {
        const img = document.querySelector("#dailyImg");
        if (img) img.remove();
    }

    const deleteTitle = () => {
        const title = document.querySelector("#dailyImgTitle");
        if (title) title.remove();
    }

    const deleteAuthor = () => {
        const subtitle = document.querySelector("#dailyImgSubtitle");
        if (subtitle) subtitle.remove();
    }

    const deleteDescription = () => {
        const desc = document.querySelector("#desc");
        if (desc) desc.remove();
    }


    const clearPreviousContent = () => {
        deleteImg();
        deleteTitle();
        deleteAuthor();
        deleteDescription();
    }

    const closeModal = () => {
        rootEl.classList.toggle("is-clipped");
        modal.classList.toggle("is-active");
        clearPreviousContent();
    }


    //DAILY IMAGE =====================================================================================================================================

    const readDateInput = () => {
        const datepicker = document.querySelector("#apodDate");
        if (datepicker.value) {
            return new Date(datepicker.value);
        }
        console.error("Add no value specified handling");
    }

    if (modalCloses.length != 0) {
        for (let modal of modalCloses) {
            modal.addEventListener("click", closeModal)
        }
    }

    modalButton.addEventListener("click", async () => {
        const dateInput = readDateInput();
        console.log(dateInput);
        const date = formatDate(dateInput ? dateInput : today);
        //Resolve promise?
        console.log("Before fetching");
        console.log(date);

        try {
            const parsedResp = await fetchDailyImage(date);
            populateCard(parsedResp);
            openModal();
            console.log("Fetched daily img");
        } catch (e) {
            console.error("Encountered error when fetching daily image: ", e);
        }
    })

    const populateCard = (parsedResp) => {
        const sourceURL = extractImgUrl(parsedResp);
        appendImg(sourceURL);
        appendTitle(parsedResp);
        appendAuthor(parsedResp);
        appendDescription(parsedResp);
    }

    async function fetchDailyImage(date) {
        const response = await fetch("https://api.nasa.gov/planetary/apod?" + new URLSearchParams({ api_key: API_KEY, date: date, thumbs: true }));
        const parsedResp = await response.json();
        console.log("While fetching");
        return parsedResp;
    }

    const extractImgUrl = (response) => {
        const type = response.media_type;
        switch (type) {
            case "image":
                return response.url;
            case "video":
                return response.thumbnail_url;
            default:
                return "Unknown media type";
        }
    }

    const appendImg = (url) => {
        const img = document.createElement("img");
        img.src = url;
        img.id = "dailyImg";
        modalImg.append(img);
        console.log("Appended: ", url);
    }

    const appendTitle = (response) => {
        const cardDesc = document.createElement("p");
        cardDesc.classList.toggle("title");
        cardDesc.classList.toggle("is-4");
        cardDesc.textContent = response.title;
        cardDesc.id = "dailyImgTitle";
        picAddInfo.prepend(cardDesc);
    }

    const appendAuthor = (response) => {
        const author = document.createElement("p");
        author.classList.toggle("subtitle");
        author.classList.toggle("is-6");
        const copyright = response.copyright ? response.copyright : "Source uknown (or see picture edge)"
        author.textContent = copyright;
        author.id = "dailyImgSubtitle";
        picAddInfo.append(author);
    }

    const appendDescription = (response) => {
        if (response.explanation) {
            const desc = document.createElement("div");
            const source = document.createElement("a");
            source.textContent = "View original source";
            desc.classList.toggle("content");
            const type = response.media_type;
            switch (type) {
                case "image":
                    source.href = response.hdurl;
                    break;
                case "video":
                    source.href = response.url;
                    break;
            }
            desc.textContent = response.explanation + " ";
            desc.append(source);
            desc.id = "desc";
            cardContent.append(desc);
        }
    }

    // ASTEROIDS =====================================================================================================================================

    const fetchAsteroids = async () => {
        const todayFormatted = formatDate(today);
        const response = await fetch("https://api.nasa.gov/neo/rest/v1/feed?" + new URLSearchParams({ api_key: API_KEY, start_date: todayFormatted, end_date: todayFormatted }));
        const parsedRes = await response.json();
        console.log(parsedRes);
        return parsedRes;
    }

    const populateTable = async () => {
        const rawAsteroids = await fetchAsteroids();
        const allAsteroids = rawAsteroids.near_earth_objects[formatDate(today)];

        let currNearest = allAsteroids[0];
        for (let asteroid of allAsteroids) {
            const row = createRow(asteroid);
            asteroidsTable.append(row);

            if (parseInt(asteroid.close_approach_data[0].miss_distance.kilometers) < parseInt(currNearest.close_approach_data[0].miss_distance.kilometers)) {
                currNearest = asteroid;
            }
        }
        setNearest(currNearest);
    }

    const setNearest = (asteroid) => {
        const innerAsteroidDiv = document.createElement("div");
        innerAsteroidDiv.textContent = asteroid.name;
        dailyAsteroid.append(innerAsteroidDiv);
    }

    const createRow = (asteroid) => {
        const row = document.createElement("tr");

        const name = asteroid.name;
        const absMag = asteroid.absolute_magnitude_h;
        const estDiaMin = asteroid.estimated_diameter.meters.estimated_diameter_min;
        const estDiaMax = asteroid.estimated_diameter.meters.estimated_diameter_max;
        const hazardous = asteroid.is_potentially_hazardous_asteroid;
        const fullDate = asteroid.close_approach_data[0].close_approach_date_full;
        const relVel = asteroid.close_approach_data[0].relative_velocity.kilometers_per_hour;
        const missDist = asteroid.close_approach_data[0].miss_distance.kilometers;
        const isSentryMon = asteroid.is_sentry_object;
        const orbBody = asteroid.close_approach_data[0].orbiting_body;

        const tdName = document.createElement("td");
        const tdAbsMag = document.createElement("td");
        const tdEstDiaMin = document.createElement("td");
        const tdEstDiaMax = document.createElement("td");
        const tdHazardous = document.createElement("td");
        const tdFullDate = document.createElement("td");
        const tdRelVel = document.createElement("td");
        const tdMissDist = document.createElement("td");
        const tdIsSentryMon = document.createElement("td");
        const tdOrbBody = document.createElement("td");

        tdName.textContent = name;
        tdAbsMag.textContent = absMag;
        tdEstDiaMin.textContent = estDiaMin.toFixed(2);
        tdEstDiaMax.textContent = estDiaMax.toFixed(2);
        tdHazardous.textContent = hazardous ? "yes" : "no";
        tdFullDate.textContent = fullDate;
        tdRelVel.textContent = parseInt(relVel).toFixed(2);
        tdMissDist.textContent = parseInt(missDist).toFixed(2);
        tdIsSentryMon.textContent = isSentryMon ? "yes" : "no";
        tdOrbBody.textContent = orbBody;

        row.append(tdName, tdAbsMag, tdEstDiaMin, tdEstDiaMax, tdHazardous, tdFullDate, tdRelVel, tdMissDist, tdIsSentryMon, tdOrbBody);
        for (let child of row.children) {
            child.classList.toggle("is-dark");
        }
        return row;
    }

    populateTable();
})
