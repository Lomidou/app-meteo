let inputCity = document.querySelector('.city-input')
let cityButton = document.getElementById('search')
let currentLocation = document.getElementById('current-location')
let myCards = document.getElementById("cards")
let currentCard = document.querySelector('.weather-oneday')
const API_KEY = 'd5cf7c231b4ffeb4d622c34f87163d2c' // API Key pour Geocoding
const API_KEY_2 = 'qtW7P-4DMeT1kX4fZCheEnSrhZRqGP5uYNy7P2E2FqQ' // API Key pour images

let createCard = (cityName, weatherCard, index) => {
    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', options);
    };

    if (index === 0){
        return `
            <div class="details">
            <h3>${cityName} - ${formatDate(weatherCard.dt_txt)}</h3>
            <h4>Température : ${Math.round(weatherCard.main.temp)} °C</h4>
            <h4>Humidité : ${weatherCard.main.humidity} %</h4>
            <h4>Vent : ${Math.round(weatherCard.wind.speed *3.6)} km/h</h4>
        </div>
        <img src="https://openweathermap.org/img/wn/${weatherCard.weather[0].icon}@2x.png" alt="weather-icons">
        `
    }
    else{ 
        return `
            <li class="card-weather">
                <div class="details">
                <h3>${formatDate(weatherCard.dt_txt)}</h3>
                <h4>Temp. : ${Math.round(weatherCard.main.temp)} °C</h4>
                <h4>Hum. : ${weatherCard.main.humidity} %</h4>
                <h4>Vent : ${Math.round(weatherCard.wind.speed * 3.6)} km/h</h4>
            </div>
            <img src="https://openweathermap.org/img/wn/${weatherCard.weather[0].icon}@2x.png" alt="weather-icons">
            </li>`
        }
}

async function getImage (){
    let page = 1;
    const keyword = inputCity.value;
    const Image_API_url = `https://api.unsplash.com/search/photos?page=${page}&per_page=1&query=${keyword}&client_id=${API_KEY_2}`;
    const response = await fetch(Image_API_url);
    const data = await response.json()
    let image = document.createElement('img')
    image.src = data.results[0].urls.raw
    let myImage = document.createElement('a')
    myImage.href = data.results[0].links.html
    myImage.target = "_blank"
    myImage.appendChild(image)
    let ImageContainer = document.getElementById('image')
    while (ImageContainer.firstChild) {
        ImageContainer.removeChild(ImageContainer.firstChild);
    }
    ImageContainer.appendChild(myImage)
}

cityButton.addEventListener("click", (e) =>{
    e.preventDefault();
    page = 1;
    getImage();
})

async function suggestionList(inputValue) {

    const suggestionListURL = `https://api.openweathermap.org/geo/1.0/direct?q=${inputValue}&limit=5&appid=${API_KEY}`;

    try {
        const response = await fetch(suggestionListURL);

        if (!response.ok) {
            throw new Error(response.status);
        }

        const data = await response.json();
        displaySuggestions(data);
    } catch (error) {
        console.error(error);
    }
}

function displaySuggestions(data){
    const autocompleteList = document.getElementById('autocompleteList')
    autocompleteList.innerHTML = ''

    data.forEach(city => {
        const suggestionItem = document.createElement('div');
        suggestionItem.textContent = city.name;
        suggestionItem.addEventListener('click', () => selectCity(city.name));
        autocompleteList.appendChild(suggestionItem);
    })
}

const cityInput = document.getElementById('cityInput');
cityInput.addEventListener('input', () => suggestionList(cityInput.value));

function selectCity(cityName) {
    const cityInput = document.getElementById('cityInput');
    cityInput.value = cityName;
    document.getElementById('autocompleteList').innerHTML = '';
}

const getWeatherDetails = (cityName, lat, lon) => {
    const Weather_api_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    fetch(Weather_api_URL)
    .then(response => {
        if(!response.ok){
        throw new Error (response.status)
        }
        return response.json()
    })
    .then(data =>{
        let GetOneDay = [];
        let GetFiveDays = data.list.filter(forecast => {
            let forecastDate = new Date(forecast.dt_txt).getDate()
            if (!GetOneDay.includes(forecastDate)){
                return GetOneDay.push(forecastDate)
            }
        })
        cityName.value = "";
        currentCard.innerHTML = "";
        myCards.innerHTML = "";
        inputCity.value = "";
        //console.log(GetFiveDays)
        GetFiveDays.forEach((weatherCard, index) => {
            if (index === 0){
                currentCard.insertAdjacentHTML("beforeend", createCard(cityName, weatherCard, index))
            }else{
                myCards.insertAdjacentHTML("beforeend", createCard(cityName, weatherCard, index));}
        })
    })
    .catch(error =>{
        console.error(error)
    })
}

const GetCityCoordinates = () => {
    let cityName = inputCity.value.trim()
    if (!cityName) return;

    let Geocoding_api_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`

    fetch(Geocoding_api_URL)
    .then(response => {
        if (!response.ok) {
            throw new Error(response.status);
        }
        return response.json();
    })
    .then(data => {
        if (!data.length) {
            return alert(`Pas de coordonnées trouvées pour ${cityName}`);
        }
        let { name, lat, lon } = data[0];
        getWeatherDetails(name, lat, lon);
    })
    .catch(error => {
        console.error (error)
    })
}

const GetUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position =>{
            const { latitude, longitude } = position.coords;
            const Reverse_Geocoding_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
            fetch(Reverse_Geocoding_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.status);
                }
                return response.json();
            })
            .then(data => {
                let { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
            })
            .catch(()=>{
                alert("Pas de coordonnées trouvées pour votre position !")
            })
       },
        error => {
            if (error.code === errorPERMISSION_DENIED ){
                alert("Veuillez autoriser l'application à accéder à votre position.")
            }
            console.log(error)
       }
    )
}

let DarkMode = document.getElementById('icon')
DarkMode.addEventListener("click", ()=> {
document.body.classList.toggle('darkmode')
if(document.body.classList.contains('darkmode')){
    DarkMode.src = './images/sun.png'
}else{
    DarkMode.src = './images/moon.png'
}
})

inputCity.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        page = 1;
        getImage();
        GetCityCoordinates();
        autocompleteList.innerHTML = "";
    }
});

currentLocation.addEventListener("click", GetUserCoordinates)
cityButton.addEventListener("click", GetCityCoordinates)