const C2 = 65.41;
const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const octaves = ["2", "3", "4", "5", "6", "7"];
var testFrequencies = [];
for (var i = 0; i < 72; i++) {
    var noteFrequency = C2 * Math.pow(2, i / 12);
    var noteName = notes[i % 12] + octaves[Math.floor(i / 12)];
    var note = { frequency: noteFrequency, name: noteName };
    testFrequencies = testFrequencies.concat([note]);
}
const noteMap = [
  "214E2UL",
  "206F2U",
  "198G2U",
  "190A2U",
  "182B2U",
  "174C3U",
  "166D3D",
  "158E3D",
  "150F3D",
  "142G3D",
  "135A3D",
  "127B3D",
  "119C4DL",
  "103C4UL",
  "095D4U",
  "087E4U",
  "079F4U",
  "072G4U",
  "064A4U",
  "056B4U",
  "048C5D",
  "040D5D",
  "032E5D",
  "024F5D",
  "016G5D",
  "008A5DL"
];
// The above encodes note info like so: first 3 digits represent y coord, letter represents note name
// next digit represents octave, U or D shows whether stem goes up or down, L is added at the end if a ledger line is needed
var currentNote = "";
var currentNotePosition = 175;
var notesPlayed = 0;
var staffNotes = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
var desiredNotes = [];
var minNote = 0;
var maxNote = 26;
var barEnabled = true;
var barPosition = 135;
var barDuration = 30000;
let ws;

$(window).on("load", function() {
  connectWebSocket();
  if ($("#barcheckbox").prop("checked")) {
      $("[id^='bpm']").fadeOut(0);
  }
  updateNoteRange();
});

function connectWebSocket() {
  ws = new WebSocket('ws://192.168.0.132:81'); // Replace with your ESP32's IP

  ws.onopen = function() {
      $("#loading").text("Connected to ESP32");
  };

  ws.onmessage = function(event) {
      const receivedNote = event.data; // Get the note from the ESP32
      console.log("Received note from ESP32:", receivedNote);
      interpretNote(receivedNote); // Process the received note
  };

  ws.onclose = function() {
      $("#loading").text("Disconnected, retrying...");
      setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = function(error) {
      $("#loading").text("WebSocket error: " + error.message);
  }
}

/* 
  TODO: implement multi-note receives 
*/
function interpretNote(receivedNote) {
  // Trim whitespace from receivedNote
  const trimmedNote = receivedNote.trim();

  console.log("expected", currentNote, "actual", trimmedNote);
  if (currentNote === "" || trimmedNote === currentNote) {
      continuePractice(true);
  }
}

function startPractice() {
  barEnabled = !$("#barcheckbox").prop("checked");
  if (parseFloat($("#bpm").val())) {
    barDuration = 970000 / $("#bpm").val();
  } // Conversion of user input to animation speed
  notesPlayed = 0;
  currentNotePosition = 150;
  $("#bar").stop();
  $("#bar").css("left", "135px");
  $("[id^='note']").fadeIn(0);
  $("[id^='sharp']").fadeOut(0);
  $("#Extra").fadeOut(0);
  generateRandomNotes(16);
  $("[id^='note']").each(function(noteNum) {
    var noteInfo;
    var tempNote;
    if (desiredNotes[0] === -1) {
      // Only true when there should be a rest (no note)
      $("#note" + noteNum).fadeOut(0);
      noteInfo = "127  L";
      tempNote = "";
    } else {
      noteInfo = noteMap[parseInt(desiredNotes[0].toString().substring(0, 2), 10)];
      tempNote = noteInfo.substring(3, 5);
      if (desiredNotes[0].includes("s")) {
        // Make notes sharp.
        tempNote = noteInfo.substring(3, 4) + "#" + noteInfo.substring(4, 5);
        $("#sharp" + noteNum).fadeIn(0);
      }
      var whole = desiredNotes[0].includes("W") ? true : false; // Make notes whole
    }
    desiredNotes.shift(); // Remove pregenerated notes once used
    staffNotes[noteNum] = tempNote;
    this.style.top = parseInt(noteInfo.substring(0, 3), 10) + "px";
    $("#sharp" + noteNum).css("top", parseInt(noteInfo.substring(0, 3), 10) - 12 + "px");
    if (whole) {
      this.height = 15;
      this.src = noteInfo.length === 7 ? "Images\\notewithline.png" : "Images\\note.png"; // length = 7 iff L is in noteInfo
      desiredNotes = [-1].concat(desiredNotes);
    } else {
      this.height = 70;
      if (noteInfo.substring(5, 6) === "U") {
        this.src = noteInfo.length === 7 ? "Images\\halfnoteupwithline.png" : "Images\\halfnoteupnoline.png";
        this.style.top = -54 + parseInt(noteInfo.substring(0, 3), 10) + "px";
      } else {
        this.src = noteInfo.length === 7 ? "Images\\halfnotedownwithline.png" : "Images\\halfnotedownnoline.png";
      }
    }
    if (noteNum === 15) {
      if (!desiredNotes[0]) {
        desiredNotes[0] = Math.floor(+minNote + Math.random() * (maxNote - minNote)) + "H";
      }
      if (desiredNotes[0] !== -1) {
        // Code only runs if the next note is not a rest
        $("#Extra").fadeIn(0);
        var extraNoteInfo = noteMap[parseInt(desiredNotes[0].toString().substring(0, 2), 10)];
        if (desiredNotes[0].includes("s")) {
          $("#sharpExtra").fadeIn(0);
        }
        $("#Extra").attr("height", 15);
        $("#Extra").css("top", parseInt(extraNoteInfo.substring(0, 3), 10) + "px");
        $("#sharpExtra").css("top", parseInt(extraNoteInfo.substring(0, 3), 10) - 12 + "px");
        $("#Extra").attr("src", extraNoteInfo.length === 7 ? "Images\\notewithline.png" : "Images\\note.png");
      }
    }
  });
  currentNote = staffNotes[0];
  if (barEnabled) {
    $("#bar")
      .delay(3000)
      .animate(
        { left: "855px" },
        {
          duration: barDuration,
          easing: "linear",
          complete: startPractice,
          progress: function() {
            barPosition = parseInt(
              $("#bar")
                .css("left")
                .substring(0, 3),
              10
            );
            if (barPosition > currentNotePosition + 25) {
              continuePractice(false);
            }
          }
        }
      );
  }
}

function continuePractice(success) {
  // success = true when note is played, false when bar passes over note without being played
  if (notesPlayed === 15 && !barEnabled) {
    startPractice();
  } else {
    var barLeniency = 216000 / barDuration;
    if (success && (!barEnabled || Math.abs(barPosition + barLeniency - currentNotePosition - 25) < 25)) {
      $("#note" + notesPlayed + ",#sharp" + notesPlayed).fadeOut(500);
      if (currentNote !== "") {
        $("#loading").text("Successfully played " + currentNote);
      }
    } else if (success) {
      return;
    } else {
      $("[id $=note" + notesPlayed + "]").prop(
        "src",
        $("[id $=note" + Math.min(notesPlayed, 15) + "]")
          .prop("src")
          .slice(0, -4) + "red.png"
      );
    }
    notesPlayed++; // Please note the order of these statements if you're going through the code in your head
    currentNote = staffNotes[notesPlayed];
    currentNotePosition = parseInt(
      $("[id $=note" + Math.min(notesPlayed, 15) + "]")
        .css("left")
        .substring(0, 3),
      10
    );
  }
}

$("[id$='note']").on("change", updateNoteRange);
function updateNoteRange() {
  minNote = $("#minnote").val();
  maxNote = $("#maxnote").val();
  if (+minNote > +maxNote) {
    $("#maxnote").val(+minNote + 1);
    updateNoteRange();
  }
  setTimeout(function() {
    // Display glitches pop up unless I wait a millisecond
    $("#minnotedisplay").text("Lowest note: " + noteMap[minNote].substring(3, 5));
    $("#maxnotedisplay").text("Highest note: E2"); // Displayed iff maxNote === 0
    $("#maxnotedisplay").text("Highest note: " + noteMap[maxNote - 1].substring(3, 5));
    if ($("#playmusic").val() === "Random") {
      desiredNotes = [];
    }
  }, 1);
}

$("#barcheckbox").on("click", function() {
  if (!$("#barcheckbox").prop("checked")) {
    $("[id^='bpm']").fadeIn(0);
  } else {
    $("[id^='bpm']").css("display", "none");
  }
});

$("#playmusic").on("click", function() {
  switch ($("#music").val()) {
    case "Random":
      desiredNotes = [];
      generateRandomNotes(16);
      startPractice();
      break;
    case "Ode to Joy":
      desiredNotes = Object.assign(desiredNotes, window.odeToJoyConverted);
      startPractice();
      break;
    case "Fur Elise":
      desiredNotes = Object.assign(desiredNotes, window.furEliseConverted);
      startPractice();
      break;
    default:
      return;
  }
});

function generateRandomNotes(size) {
  for (var i = 0; i < size; i++) {
    if (desiredNotes[i] === undefined) {
      desiredNotes[i] = Math.floor(+minNote + Math.random() * (maxNote - minNote));
      if (noteMap[desiredNotes[i]].substring(3, 4).match("[CDFGA]") && Math.random() > 0.5 && $("#_sharpcheckbox").prop("checked")) {
        desiredNotes[i] += "s";
      }
      if (Math.random() > 0.5 && $("#wholecheckbox").prop("checked")) {
        desiredNotes[i] += "W";
      } else {
        desiredNotes[i] += "H";
      }
    }
  }
}
