Developer Notes
===================

This code is written in ES6/2015 with the exception of the `import` syntax because Node.js is not yet supporting it.

## time.js

 - Line 68: Ensure reference "Astro.JD2000"
 - Line 98: Investigate use of Span (TimeSpan)

## comet-orbit.js

 - Line 17: Sort out Xyz "orbit = new Xyz[nDivision+1];"

## planet-exp.js

 - Line 372: Sort out how the arrays are populated

## planet-orbit.js

 - Line 38: Sort out the end of that for loop

OrbitViewer.getObject() ... implement it!


Viewer: Existing
==================

OrbitViewer : Applet
 - contains control settings and their values, time limits, centered object, atime
 - holds references to the player and the canvas
 - loads and validates target object
 - starts and stops the player
 - listens for events

OrbitCanvas : Canvas
 - draws everything to the canvas (black region)
 - initialized with object and atime
 - holds object & planet orbits, and their positions
 - contains horz & vert rotation (rotation matrix), and zoom
 - contains colors, canvas size

OrbitPlayer : Runnable
 - used during time-based animation
 - initialized with an OrbitViewer
 - has run() method
 - calls viewer.getATime(), atime.changeDate(), viewer.setNewDate()


Viewer: New
==================

Parameters



Viewer



Canvas



Player


