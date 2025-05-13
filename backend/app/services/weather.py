import requests

API_KEY = "195b409172864b4d89a230745251204"
CITIES = ["Destin", "Clearwater Beach", "Cocoa Beach", "Miami", "Key West"]

def get_florida_weather():
    weather_data = {}
    base_url = "http://api.weatherapi.com/v1/current.json"

    for city in CITIES:
        try:
            response = requests.get(base_url, params={
                "key": API_KEY,
                "q": city
            })
            data = response.json()
            condition = data["current"]["condition"]["text"]
            temp_f = data["current"]["temp_f"]
            weather_data[city] = f"{condition}, {temp_f}°F"
        except Exception as e:
            weather_data[city] = "Unavailable"

    return weather_data
