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

    this.element = document.createElement('div');
    this.scale = params.scale;
    this.level = params.level;
    this.degrees = params.degrees;
    this.element.innerText = "Correct scales are: " + this.degrees;
    console.log("Read from params: ", this.scale, this.level, this.degrees, params);

    /**
     * Attach library to wrapper.
     *
     * @param {jQuery} $wrapper Content's container.
     */
    this.attach = function ($wrapper) {
      $wrapper.get(0).classList.add('h5p-degree-dictations');
      //this.element.innerHTML = "Correct scales are: " + this.degrees;
      $wrapper.get(0).appendChild(this.element);
    };
  }
}
