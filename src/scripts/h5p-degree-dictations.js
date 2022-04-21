const $ = H5P.jQuery; // this does not work...

const simplify = (string) => {
  if (typeof(string)==="string") {
    return string.trim().replace(/\s\s+/g, ' ');
  } else {
    return string;
  }
}

const scaleDefinitions = { // defined in semitones from tonis
  major : [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12], // natural, to be certain that 'minor' is also defined
  minorNatural : [0, 2, 3, 5, 7, 8, 10, 12],
  minorHarmonic : [0, 2, 3, 5, 7, 8, 11, 12]
};

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


    this.element = document.createElement('div');
    this.scale = params.scale;
    this.level = params.level;
    this.degrees = params.degrees; // ADD simplify() comes in as a string  separated with spaces, turn into array
    this.element.innerText = "Correct degrees are: " + this.degrees;
    console.log("Read from params: ", this.scale, this.level, this.degrees, params);
    this.degreeInput = document.createElement('input'); //$("<input>", { id:"degreeInput", type:"text", value:"enter degrees" });
    this.degreeInput.type = "text";
    this.degreeInput.id = "degreeInput";

    // don't deal with notation at this point, just playback
    this.tonicNoteNumber = 60; // TODO: take random



    // methods
    this.play = () => {
      // TODO: simply string
      // find interval in semitones
      const degrees = this.degrees.split(" ");
      if (!degrees) {
        console.log("error in splitting degreeString");
        return;
      }
      const scale = scaleDefinitions[this.scale];
      if (scale) {
        for (let i=0; i<degrees.length; i++) {
          const degree = parseInt(this.degrees[i]);
          if (degree < -5 || degree > 8  ) {
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
          console.log("degree, index, semitones, NN", degree, semitones, midiNote);
        }

      } else {
        console.log("Could not find definition for scale ", this.scale);
      }


    }


    // UI: inputField, playButton, stopButton, respondeButton

    /**
     * Attach library to wrapper.
     *
     * @param {jQuery} $wrapper Content's container.
     */
    this.attach = function ($wrapper) {

      const self = this;
      const container = $wrapper.get(0);
      // container külge saab lisada (appendChild) DOM elemente, $wrapperi külge jQuery elemente.
      console.log("Container:", container);
      container.classList.add('h5p-degree-dictations');
      container.appendChild(this.element);
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<br />Suvaline div<br/><b>>Kaherealine</b>';
      container.appendChild(testDiv);

      container.append(this.degreeInput);

      $wrapper.append($('<button>', {
        text: "PLAY",
        id: 'playButton',
        click: function () {
          console.log("PLAY");
          self.play();
        }
      }));

      $wrapper.append($('<button>', {
        text: "CHECK",
        id: 'checkButton',
        click: function () {
          console.log("Check", self.degreeInput.value);
        }

      }));

    };
  }
}
