#!/bin/bash
npm run build
scp -P 38307 dist/h5p-degree-dictations.js  v2404@uuu.ee:/home/v2404/public_html/tarmojohannes/drupal7/sites/default/files/h5p/development/H5P.DegreeDictations/dist/
