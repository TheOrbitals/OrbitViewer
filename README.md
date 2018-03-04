Orbit Viewer
=========================

Orbit Viewer is an interactive visualization tool used to view near earth objects (comets and asteroids) in relation to the planets. This project was started during the [2015 International Space Apps Challenge](https://2015.spaceappschallenge.org/). If you're interested, you can watch the [30 second video project concept](https://vimeo.com/124757184) and the 11 minute [hackathon presentation and Q&A](https://www.youtube.com/embed/Pp_ZC7IZj-o?start=5560).

## Origins & goal

The code base is a direct port of a Java Applet of the same name by Osamu Ajiki and Ron Baalke. You can find more about that project on [its website](http://www.astroarts.com/products/orbitviewer/index.html) and at its [source code repo](https://github.com/TheOrbitals/OrbitViewerApplet). This applet is currently being used on NASA's website. You can see an example [here](http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=6344%20P-L;orb=1). This new Orbit Viewer project aims to provide an alternative solution to the existing Orbit Viewer applet.

## Process

In the near term, this project will achieve feature parity with the original Orbit Viewer but using current web technologies (specifically the Canvas API). After that, it will add a number of features that make it an even better experience on the web such as being embedded in other pages and fullscreen support.

This readme will evolve as the more of the project is implemented. You can see the current progress by viewing the demo page.

[View the demo](https://theorbitals.github.io/OrbitViewer)

## Usage

If you're interested in running this locally or contributing to this project, the first step is to clone this repo. After it's cloned, install the dependencies.

    cd OrbitViewer
    npm install

Build the source files into a single file. You don't need to do this if you're going to turn on a watcher (described below).

    npm run build

Spin up a local HTTP server. If you have a different way than this, go for it.

    python -m http.server 8000

Set up a watcher so `main.js` gets rebuilt automatically as you save your changes.

    npm run watch

Navigate to the listening endpoint

    open http://localhost:8000

## Contributing

If you're interested in contributing to this project, sweet! Pull requests are welcomed. Please use a linter and try to adhere to the existing code style. Although admittedly, that will be pretty difficult at this stage of the project.
