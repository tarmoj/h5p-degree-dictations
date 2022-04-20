const $ = H5P.jQuery; // this does not work...


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

    // test if H5p and $ are available:
    console.log("H5P, $", H5P, $);

    this.element = document.createElement('div');
    this.scale = params.scale;
    this.level = params.level;
    this.degrees = params.degrees;
    this.element.innerText = "Correct scales are: " + this.degrees;
    console.log("Read from params: ", this.scale, this.level, this.degrees, params);
    this.degreeInput = document.createElement('input'); //$("<input>", { id:"degreeInput", type:"text", value:"enter degrees" });
    this.degreeInput.type = "text";
    this.degreeInput.id = "degreeInput";

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

      const playButton = document.createElement('button');
      playButton.innerText = "PLAY";
      playButton.onclick = () => console.log("PLAY");
      container.appendChild(playButton);

      $wrapper.append($('<button>', {
        text: "KONTROLLI",
        id: 'checkButton',
        click: function () {
          console.log("Check", self.degreeInput.value);
        }

      }));

    };
  }
}
