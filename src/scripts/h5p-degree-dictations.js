//import * as Tone from "tone";
import {Transport,Sampler, Reverb, Frequency, getContext}  from "tone";

const $ = H5P.jQuery;

// constants and helper functions

const scaleDefinitions = { // defined in semitones from tonis
  major : [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12], // natural, to be certain that 'minor' is also defined
  minorNatural : [0, 2, 3, 5, 7, 8, 10, 12],
  minorHarmonic : [0, 2, 3, 5, 7, 8, 11, 12],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
  lydian: [0, 2, 4, 6, 7, 9, 11, 12],
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12]
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

    //this.scale = params.scale;
    //this.level = params.level;
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
      "clear": "Clear",
      "volume": "Volume",
      "mode": "Mode (scale)",
      "selectDictation": "Select dictation",
      "previous": "Previous",
      "next": "Next",
      "difficulty": "Difficulty level",
      "euSupportText": "The project is supported by European Social Fund",
      ...params.l10n
    };

    console.log("Params: ", params);

    // now exercises is a list from version 1.1.0
    this.exercises = params.dictations;

    this.tonicNoteNumber = 60 + Math.floor(Math.random()*7); // different tonic on different starts
    this.degreeArray = [];
    this.tempo = 60; // later from slider
    this.answered = false;
    this.audioEnabled = false;
    this.exerciseIndex = 0;

    // get library name with version:
    let library;
    // if (H5PIntegration) {
    //   library = Object.values(H5PIntegration.contents)[0].library.replace(" ","-"); // get the library version from contents and replace space with -
    // } else {
    //   library = "H5P.DegreeDictations-1.2"; // fallback, do not forget to update it when version changes!
    // }
    library = "H5P.DegreeDictations-1.2"; // hard-code for now H5PIntegration method does not works this way if there are several exercises on the page.
    this.libraryPath =  H5P.getLibraryPath(library);
    console.log("The library name and version and path is: ", library, this.libraryPath);

    //console.log("This: ", this, H5P);


    // SOUND -----

    const reverb = new  Reverb( {decay:2.5, wet:0.1} ).toDestination();

    const createSampler = (instrument) => {
      //this.loaded = false;
      const sampleList = {};
      for (let i=60; i<=84; i++) {
        //TODO: check if file exists
        sampleList[i]=i+".mp3";
      }
      // seems that in development mode I need to hardcode the path for now as H5P.getLibraryPath does not work correctly in development mode
      // const path = "/drupal7/sites/default/files/h5p/development/H5P.DegreeDictations/dist/instruments/" + instrument + "/";

      //NB! parameter for getLibraryPath must include also the version like -1.0 UPDATE THIS LINE when semantic version is changed!


      //const path = H5P.getLibraryPath(this.libraryInfo.versionedNameNoSpaces) + "/dist/instruments/" + instrument + "/" ; // this does not include libraryInfo...
      const path = this.libraryPath + "/dist/instruments/" + instrument + "/" ;
      console.log("Path: ", path);
      const sampler = new  Sampler( {
            urls: sampleList,
            baseUrl: path, //"./instruments/"+instrument + "/",
            release: 0.5,
            onerror: (error) => { console.log("error on loading", error) },
            onload: () => { console.log("Samples loaded"); sampler.connect(reverb);  }
          }
      ).sync();
      return sampler;
    }

    this.sampler =  createSampler("guitar"); // use localStorage to remember this and other settings?

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
        console.log("Sampler is null: ", this.sampler);
      }

    }

    const stopSound = () => {
      console.log("stopSound")
      this.sampler.releaseAll();
       Transport.cancel(0);
       Transport.stop("+0.01");
    }



    // exercise logic -----------------------------

    const loadExercise = (index) => {
      if ( Transport.state === "started") {
        stopSound();
      }

      this.exerciseIndex = index;
      this.degreeArray = stringToIntArray(this.exercises[index].degrees);
      console.log("loadExercise degrees: ", index, this.degreeArray);
      this.midiNotes = createMidiSequence(); // from this.degreeArray
      this.answered = false;

      // UI changes
      $("#feedBack").html("");
      let scale = this.exercises[index].scale;
      if (this.l10n[scale]) scale = this.l10n[scale]; // use translation, if present
      let level =  this.exercises[index].level;
      if (this.l10n[level]) level = this.l10n[level];
      $('#scaleLabel').text(scale);
      $('#levelSpan').text(this.l10n.difficulty + ": " + level);
      clearDegreeInputs();
    }

    const createMenuRow = () => {
      const $menuDiv = $("<div>", {id: "menuDiv", class: "vertical-center"});
      const $exerciseMenu =   $('<select>', {
        id: "exerciseSelect",
        attr: {'aria-label': this.l10n.selectDictation},
        class: "select",
        change:  (event) => {
          //console.log("option", event.target.selectedIndex, event.target);
          const exerciseIndex = event.target.selectedIndex; //parseInt(event.target.value);
          console.log("Change", exerciseIndex);
          loadExercise(exerciseIndex);
        }
      }) ;
      for (let i= 0; i<this.exercises.length; i++) {
        console.log("Adding exercise to menu: ", this.exercises[i].title)
        $exerciseMenu.append( $('<option>').text(this.exercises[i].title).val(i) );
      }
      $menuDiv.append([
        $('<span>').text(this.l10n.selectDictation),
        $('<button>', {
          id: "backButton",
          class: "button",
          text: "<",
          attr: {'aria-label': this.l10n.previous},
          click: () => {
            if (this.exerciseIndex>0) {
              console.log("Back");
              $("#exerciseSelect")[0].selectedIndex=this.exerciseIndex-1;
              $("#exerciseSelect").trigger("change");
            }
          }
        }),
        $exerciseMenu,
        // see for style of forward & next: https://www.w3schools.com/howto/howto_css_next_prev.asp
        $('<button>', {
          id: "forwardButton",
          class: "button",
          attr: {'aria-label': this.l10n.next},
          text: ">",
          click: () => {
            if (this.exerciseIndex<this.exercises.length-1) {
              //console.log("Forward");
              $("#exerciseSelect")[0].selectedIndex=this.exerciseIndex + 1;
              $("#exerciseSelect").trigger("change");
            }
          }
        }),
      ]);
      return $menuDiv;
    };

    const checkDegreesResponse = () => {

      if (this.answered) { alert("You have already answered"); return; }

      let isCorrect = true;
      this.answered = true;
      const correctArray =  this.degreeArray;
      const responseArray = []; //stringToIntArray(responseString);
      this.degreeInputCells.map( $cell =>  responseArray.push(parseInt($cell.val())) );

      let correctString = "";
      console.log("Responsearray: ", responseArray)

      for (let i=0; i<correctArray.length; i++ ) {
        const responseDegree = Math.abs(responseArray[i]);
        const correctDegree = Math.abs(correctArray[i]);
        correctString += (correctDegree === 8)  ? "1 " :  (correctDegree.toString() + " ");

        if (responseDegree !== correctDegree ) { // ignore minus signs
          if (correctDegree === 8 && responseDegree===1) { // there is no 8. degree actually, 1st is correct but allow both in the answer
            isCorrect = true;
            this.degreeInputCells[i].addClass("greenBorder");
          } else {
            console.log("Wrong degree: ", i, responseDegree[i]);
            this.degreeInputCells[i].addClass("redBorder");
            isCorrect = false;
          }
        } else {
          this.degreeInputCells[i].addClass("greenBorder");
        }
      }

      if (isCorrect) {
        $("#feedBack").html('<p class="correct">' + this.l10n.correct + '</p>').focus();
      } else {
        $("#feedBack").html('<span class="wrong">'+ this.l10n.wrong +'!</span>' + this.l10n.correctDegreesAre + " "  + correctString).focus();
      }
    }


    const createMidiSequence = ( ) => {
      const degrees =  this.degreeArray; // must be set via in loadExercise

      const midiNotes = [];

      if (degrees.length<7) {
        console.log("not enough degrees");
        return [];
      }
      const scale = scaleDefinitions[this.exercises[this.exerciseIndex].scale];
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
        console.log("Could not find definition for scale ", this.exercises[this.exerciseIndex].scale);
      }
      return  midiNotes;
    }

    //this.midiNotes = createMidiSequence(params.degrees);


    // UI: inputField, playButton, stopButton, responseButton

    const validateInput = (userInput) => { // check if allowed degree
      return [-5,-6,-7,1,2,3,4,5,6,7,8].includes(parseInt(userInput));
    }

    this.degreeInputCells = []; // array of input elements

    const clearDegreeInputs = () => {
      for (const $element  of this.degreeInputCells) {
        $element.val("");
        $element.removeClass("redBorder");
        $element.removeClass("greenBorder");
      }
    }

    const createDegreeInput = () => { // creates array of 7 inputs
      this.degreeInputCells = [];
      const $degreeInput = $('<div>', {id:"degreeInputDiv"});
      for (let i=0; i<7;i++) {
        const $cell = $('<input>', {
              id: "degreeCell" + i,
              attr: {index: i, 'aria-label': "degree "+(i+1).toString() },
              class: "degreeCell",
              type: "text",
              inputmode: "numeric",
              size: 1,
              keyup: (event) => {
                const index = parseInt(event.target.getAttribute("index"));
                const input = event.target.value;
                //console.log(index, input);
                let result = true;
                let move = 0;

                if ( /\d/.test(event.key) ) { // if number, validate and move to next
                  result =  validateInput(input);
                  //console.log("is digit. result:", result);
                  if (result) {
                    if (index<6) move = 1;
                  }
                } else if (event.key==="ArrowRight" && index<6) {
                  move = 1;
                } else if (event.key==="ArrowLeft" && index>0) {
                  move = -1;
                }

                if (move!==0) {
                  this.degreeInputCells[index+move].focus();
                }

                if (event.key==='Enter') {
                  console.log("Enter");
                  checkDegreesResponse();
                }
              }
            }

        );
        $degreeInput.append($cell);
        this.degreeInputCells.push($cell);
      }

      $('<button>', {
        id: "resetButton",
        class: "button",
        text: this.l10n.clear,
        click: clearDegreeInputs
      }).appendTo($degreeInput);

      $('<button>', {
        text: this.l10n.check,
        id: 'checkButton',
        class: 'button',
        click: function () {
          checkDegreesResponse();
        }

      }).appendTo($degreeInput);

      //$('<div>', {id: "errorMessage"}).text("Wrong degree somewhere").appendTo($degreeInput);

      console.log("Created degreeInput: ", $degreeInput, this.degreeInputCells);
      return $degreeInput; //this.degreeInputCells;
    }


    /**
     * Attach library to wrapper.
     *
     * @param {jQuery} $wrapper Content's container.
     */
    this.attach = function ($wrapper) {

      const self = this;

     $wrapper.addClass("h5p-degree-dictations");

      $wrapper.append( createMenuRow() );

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

      const $controlRow = $('<div>', {id: "controlRow", class:"vertical-center"});

      $controlRow.append($('<button>', {
        text: this.l10n.play,
        id: 'playButton',
        class: "button",
        click: function () {
          console.log("PLAY");
          play();
        }
      }));

      $controlRow.append($('<button>', {
        text: this.l10n.stop,
        id: 'stopButton',
        class: "button",
        click: function () {
          console.log("STOP");
          stopSound();
          //self.stop();
        }
      }));

      $controlRow.append($("<label>").css("margin-left", "15px").text(this.l10n.volume + ":") );

      $controlRow.append( $("<input>", {
            id: "volumeSlider",
            type: "range",
            class: "slider",
            min: -40,
            max: 6,
            value: 0
          }).on("input change",  (event) => {
            const value = event.target.value;
            console.log("Volume: ",  value);
            this.sampler.volume.rampTo(value, 0.05);
          } )
      ) ;

      $wrapper.append($controlRow);


      $wrapper.append("<br/>");

      // set this text in loadExercise
      $wrapper.append([
        $('<div>',{id:"levelSpan"}).html(this.l10n.difficulty + ": " + this.exercises[this.exerciseIndex].level),
        $('<span>').html(this.l10n.enterDegrees + ". " + this.l10n.mode + ': <b><label id="scaleLabel"></label></b>'),
        createDegreeInput()
      ] );


      $wrapper.append('<div id="feedBack" tabindex="0"></div>'); // tabIndex for making it focusable

      const euLogoPath = this.libraryPath + "/eu.jpg";
      console.log("logo path:", euLogoPath);
      const $euDiv = $('<div>', {id:"euDiv"}).html("<br /><p><small>" + this.l10n.euSupportText +  "</small></p>");
      $euDiv.append(
          $('<img>', {
            id: "euLogo",
            alt: "The project is supported by EU social Fund",
            width: "200px",
            align: "left",
            src: euLogoPath,
            load: () => this.trigger("resize") // probably does not work...
          })
      );

      $wrapper.append($euDiv);

      loadExercise(0); // perhaps use localStorage to remember last exercise... must create unique identifier by exercise ID then...


    };
  }
}
