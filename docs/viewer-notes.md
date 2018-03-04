Existing
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


New
==================

Parameters



Viewer



Canvas



Player


