//import * as Tone from "tone";
import {Transport,Sampler, Reverb, Frequency, getContext}  from "tone";

const $ = H5P.jQuery;

// constants and helper functions

const scaleDefinitions = { // defined in semitones from tonis
  major : [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12], // natural, to be certain that 'minor' is also defined
  minorNatural : [0, 2, 3, 5, 7, 8, 10, 12],
  minorHarmonic : [0, 2, 3, 5, 7, 8, 11, 12]
};

const stringToIntArray = (str) => { // string  must include numbers separated by spaces or commas
  const numArray = [];
  for (let element of str.trim().split(/[ ,]+/) ) { // split by comma or white space
    const number = parseInt(element);
    if (number) {
      numArray.push(number);
    }
  }
  return numArray;
}

const isDigit = char => /^\d+$/.test(char);

const insertSpace = (input) => {
  const index = input.length-1;
  console.log("input: ", input);
  // if two last symbols are digits, insert a space in between of them
  if (index>=1) {
    if (isDigit(input.charAt(index)) && isDigit(input.charAt(index-1))) {
      input = input.substr(0, index) + " " + input.substr(index);
      //console.log("Inserted space: ", input, index, input.substr(0, index));
    }
  }
  // hardCoded for now: TODO: pass element as parameter: or rewrite the function
  $("#degreeInput").val(input);
}

export default class DegreeDictations extends H5P.EventDispatcher {



  /**
   * @constructor
   *
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super();

    this.scale = params.scale;
    this.level = params.level;
    // check the code for better translations and add degaults jQuery extend something...
    this.l10n =  {
      "explanation" : "You will hear first the tonic note and then a short melody of 7 notes. Enter the degrees as numbers 1..7",
      "instrument": "Instrument",
      "flute":  "Flute",
      "oboe": "Oboe",
      "guitar": "Guitar",
      "violin":  "Violin",
      "play": "Play",
      "stop": "Stop",
      "check": "Check",
      "enterDegrees":"Enter degrees",
      "correct": "Correct",
      "wrong": "Wrong",
      "correctDegreesAre": "Correct degrees are: ",
      ...params.l10n
    };

    console.log("Params: ", params, this.l10n);

    // don't deal with notation at this point, just playback
    this.tonicNoteNumber = 60 + Math.floor(Math.random()*7); // different tonic on different starts
    this.degreeArray = [];
    this.tempo = 60; // later from slider
    this.loaded = false;
    this.answered = false;
    this.audioEnabled = false;


    // SOUND -----

    const reverb = new  Reverb( {decay:2.5, wet:0.1} ).toDestination();

    const createSampler = (instrument) => {
      this.loaded = false;
      const sampleList = {};
      for (let i=60; i<=84; i++) {
        //TODO: check if file exists
        sampleList[i]=i+".mp3";
      }
      // seems that in development mode I need to hardcode the path for now as H5P.getLibraryPath does not work correctly in development mode
      // const path = "/drupal7/sites/default/files/h5p/development/H5P.DegreeDictations/dist/instruments/" + instrument + "/";

      //NB! parameter for getLibraryPath must include also the version like -1.0 UPDATE THIS LINE when semantiv version is changed!
      const path = H5P.getLibraryPath("H5P.DegreeDictations-1.0") + "/dist/instruments/" + instrument + "/" ;
      console.log("Path: ", path, H5P.getLibraryPath("H5P.DegreeDictations-1.0"));
      const sampler = new  Sampler( {
            urls: sampleList,
            baseUrl: path, //"./instruments/"+instrument + "/",
            release: 0.5,
            onerror: (error) => { console.log("error on loading", error) },
            onload: () => { console.log("Samples loaded"); sampler.connect(reverb); this.loaded = true;  }
          }
      ).sync();
      return sampler;
    }

    this.sampler = createSampler("guitar"); // localStorage to remember this and other settings?

    const play = async () => {

      if (!this.audioEnabled) {
        await  getContext().resume();
        console.log('audio is ready');
        this.audioEnabled = true;
      }

      if ( Transport.state === "started") {
        stopSound();
      }

       Transport.start("+0.1");

      let timing = 0;
      const beatDuration = 60/this.tempo;
      console.log("beat duration:", beatDuration);

      //play tonic, pause
      playNote(this.tonicNoteNumber, timing, beatDuration);
      timing += 2*beatDuration;
      //console.log("midiNotes at this point: ", this.midiNotes);

      for (let midiNote of this.midiNotes) {
        playNote(midiNote, timing, beatDuration);
        timing += beatDuration;
      }
    }

    const playNote = ( midiNote=60, when=0, duration=1) => {
      const freq =  Frequency(midiNote, "midi").toFrequency();
      const volume = 0.6;

      if (this.sampler) {
        this.sampler.triggerAttackRelease(freq, duration+0.5, when, volume); //
      } else {
        console.log("Sampler is null: ", sampler);
      }

    }

    const stopSound = () => {
      console.log("stopSound")
      this.sampler.releaseAll();
       Transport.cancel(0);
       Transport.stop("+0.01");
    }



    // exercise logic -----------------------------

    const checkDegreesResponse = (responseString) => {

      if (this.answered) { alert("You have already answered"); return; }

      let isCorrect = true;
      this.answered = true;
      const correctArray =  this.degreeArray;
      const responseArray = stringToIntArray(responseString);
      let correctString = "";
      console.log("Responsearray: ", responseArray)

      for (let i=0; i<correctArray.length; i++ ) {
        const responseDegree = Math.abs(responseArray[i]);
        const correctDegree = Math.abs(correctArray[i]);
        correctString += (correctDegree === 8)  ? "1 " :  (correctDegree.toString() + " ");

        if (responseDegree !== correctDegree ) { // ignore minus signs
          if (correctDegree === 8 && responseDegree===1) { // there is no 8. degree actually, 1st is correct but allow both in the answer
            isCorrect = true;
          } else {
            console.log("Wrong degree: ", i, responseDegree[i]);
            isCorrect = false;
          }
        }
      }

      if (isCorrect) {
        $("#feedBack").html('<p class="correct">' + this.l10n.correct + '</p>');
      } else {
        $("#feedBack").html('<span class="wrong">'+ this.l10n.wrong +'!</span>' + this.l10n.correctDegreesAre + " "  + correctString);
      }
    }


    const createMidiSequence = ( degreeString) => {
      const degrees =  stringToIntArray(degreeString); //simplify(degreeString).split(" "); // simplify the string
      console.log("Degree Array", degrees);
      this.degreeArray = degrees; // save it for later control

      const midiNotes = [];

      if (degrees.length<7) {
        console.log("error in splitting degreeString or not enough degrees");
        return [];
      }
      const scale = scaleDefinitions[this.scale];
      if (scale) {
        for (let degree of degrees) {
          if ( ![-5, -6, -7, 1, 2, 3, 4, 5, 6, 7, 8].includes(degree)  ) {
            console.log("Wrong degree: ", degree);
            break;
          }
          let semitones = 0;
          if (degree>0) {
            semitones = scale[degree-1];
          } else {
            semitones = -(12-scale[Math.abs(degree)-1]);
          }
          const midiNote = this.tonicNoteNumber + semitones;
          midiNotes.push(midiNote);
          console.log("degree, index, semitones, NN", degree, semitones, midiNote);
        }

      } else {
        console.log("Could not find definition for scale ", this.scale);
      }
      return  midiNotes;
    }

    this.midiNotes = createMidiSequence(params.degrees);





    // UI: inputField, playButton, stopButton, respondeButton

    /**
     * Attach library to wrapper.
     *
     * @param {jQuery} $wrapper Content's container.
     */
    this.attach = function ($wrapper) {

      const self = this;

      $wrapper.addClass("h5p-degree-dictations");

      $wrapper.append( $("<p>").text(this.l10n.explanation) );

      $wrapper.append( "<span>" + this.l10n.instrument + ":</span>" );

      const $instrumentSelection = ($('<select>', {
        id: 'instrumentSelection',
        class: 'select',
        change: function (event) {
          const instrument = event.target.value;
          console.log("Change", event.target.value);
          self.sampler = createSampler(instrument);
        }
      }));

      $instrumentSelection.append([
        $('<option>').val('guitar').text(this.l10n.guitar),
        $('<option>').val('oboe').text(this.l10n.oboe),
        $('<option>').val('flute').text(this.l10n.flute),
        $('<option>').val('violin').text(this.l10n.violin),

      ]);

      $wrapper.append([ $instrumentSelection, '<br />' ]);
      $wrapper.append($('<button>', {
        text: this.l10n.play,
        id: 'playButton',
        class: "button",
        click: function () {
          console.log("PLAY");
          play();
        }
      }));

      $wrapper.append($('<button>', {
        text: this.l10n.stop,
        id: 'stopButton',
        class: "button",
        click: function () {
          console.log("STOP");
          stopSound();
          //self.stop();
        }
      }));

      $wrapper.append("<br/>");

      $wrapper.append([
        $('<span>').text(this.l10n.enterDegrees),
        $('<input>', { type:"text", id:"degreeInput", class: "textField",
          keyup: (event) => {
            insertSpace(event.target.value);
            console.log(event.key);
            if (event.key==='Enter') {
              checkDegreesResponse($("#degreeInput").val());
            }
          }
        })
      ] );



      $wrapper.append($('<button>', {
        text: this.l10n.check,
        id: 'checkButton',
        class: 'button',
        click: function () {
          checkDegreesResponse($("#degreeInput").val());
        }

      }));

      $wrapper.append('<div id="feedBack"></div>');

    };
  }
}
