import { askAI2 } from "./ask2.js";

const bigItemComponent = "id9290bda0-5b11-45d5-a45e-ad1a4575ab72",
  headingAlternativeComponent = "id31f3cfdf-f1c6-4837-935e-af14edce875f";

async function common(message) {
  window.searchQuery = message;
  document.getElementById("ui").setAttribute("data-layout", "X");

  document.querySelector(".item1").innerHTML = "";
  document.querySelector(".item2").innerHTML = "";
  document.querySelector(".item3").innerHTML = "";
  document.querySelector(".item4").innerHTML = "";
  document.querySelector(".item5").innerHTML = "";
  document.querySelector(".item6").innerHTML = "";
  document.querySelector(".item7").innerHTML = "";
  document.querySelector(".item8").innerHTML = "";
  document.querySelector(".item9").innerHTML = "";
  document.querySelector(".item10").innerHTML = "";

  const title = document.createElement("jsb-component");

  title.id = headingAlternativeComponent + "_0";
  document.querySelector(".item1").appendChild(title);

  window.searchResult = await askAI2(message);

  const cards = [
    document.createElement("jsb-component"),
    document.createElement("jsb-component"),
    document.createElement("jsb-component"),
    document.createElement("jsb-component"),
    document.createElement("jsb-component"),
  ];

  cards[0].id = bigItemComponent + "_0";
  cards[1].id = bigItemComponent + "_1";
  cards[2].id = bigItemComponent + "_2";
  cards[3].id = bigItemComponent + "_3";
  cards[4].id = bigItemComponent + "_4";
  document.querySelector(".item1").appendChild(cards[0]);
  document.querySelector(".item1").appendChild(cards[1]);
  document.querySelector(".item1").appendChild(cards[2]);
  document.querySelector(".item1").appendChild(cards[3]);
  document.querySelector(".item1").appendChild(cards[4]);
}

export const setupAudio = () => {
  function getLocalStream() {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream) => {
        window.localStream = stream;
        if (window.localAudio) window.localAudio.srcObject = stream;
        if (window.localAudio) window.localAudio.autoplay = true;
      })
      .catch((err) => {
        console.error(`you got an error: ${err}`);
      });
  }

  getLocalStream();

  const startButton = document.getElementById("start");
  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();

  recognition.lang = "no-NO";

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    startButton.style.background = "#808080";
    document.getElementById("search").value = transcript;
    common(transcript);
  };
  startButton.addEventListener("click", (e) => {
    e.preventDefault();
    window.searchMode = true;
    document.getElementById("search").value = "";
    startButton.style.background = "green";
    recognition.start();
  });

  document
    .getElementById("search")
    .addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        common(document.getElementById("search").value);
      }
    });
  document.getElementById("search").addEventListener("focus", function (event) {
    window.searchMode = true;
  });
  document.getElementById("search").addEventListener("blur", function (event) {
    window.searchMode = false;
  });
};
