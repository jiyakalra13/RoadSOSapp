const apiKey = "iQyYhFdUmtreVL0CPjR7EIDMs1H24XGqKkbf3Bx9TpvgOwSn5uUalKAOXorHRe9BGVyzxi1E4bgIStsm";

fetch("https://www.fast2sms.com/dev/bulkV2", {
  method: "POST",
  headers: {
    "authorization": apiKey,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    route: "q",
    message: "Test message from RoadSOS",
    flash: 0,
    numbers: "9999999999" // Using a dummy number just to see the API response
  })
})
.then(res => res.json())
.then(data => console.log("Response:", data))
.catch(err => console.error("Error:", err));
