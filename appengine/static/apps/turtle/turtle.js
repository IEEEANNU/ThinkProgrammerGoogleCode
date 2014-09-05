/**
 * Blockly Apps: Turtle Graphics
 *
 * Copyright 2012 Google Inc.
 * https://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview JavaScript for Blockly's Turtle application.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * Create a namespace for the application.
 */
var Turtle = {};
// Supported languages.
BlocklyApps.LANGUAGES =
		['en']; // edited by Zuhair, We don't want any languages for now
    /*['ar', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'fa', 'fr', 'hi', 'hrx',
     'hu', 'is', 'it', 'ko', 'ms', 'nl', 'pl', 'pms', 'pt-br', 'ro', 'ru',
     'sco', 'sv', 'tr', 'uk', 'vi', 'zh-hans', 'zh-hant'];*/
BlocklyApps.LANG = BlocklyApps.getLang();

/**
* Get the level and the question from the URL, added by Zuhair
*/
Turtle.LEVEL = BlocklyApps.getStringParamFromUrl("level", "default");
Turtle.QUESTION = BlocklyApps.getStringParamFromUrl("question", "default");
var testing = BlocklyApps.getStringParamFromUrl("test", "false");

/**
* Get the selected level from a json file, added by Zuhair
*/

if (testing == "false"){
var request = new XMLHttpRequest();
   request.open("GET", "questions.json", false);
   request.send(null);
	var levelquestion = JSON.parse(request.responseText)[Turtle.LEVEL][Turtle.QUESTION];
}
else{
var levelquestion = {
			"toolbox_type":null, 
			"max_blocks":null, 
			"question_image":"example.png", 
			"question_text":"hello",
			"loaded_blocks":null
	};
	}
   Turtle.TOOLBOX_TYPE = levelquestion.toolbox_type?levelquestion.toolbox_type:"full";
   Turtle.MAX_BLOCKS = levelquestion.max_blocks?levelquestion.max_blocks:Infinity;
   Turtle.QUESTION_IMAGE = levelquestion.question_image;
   Turtle.QUESTION_TEXT = levelquestion.question_text;
   Turtle.LOADED_BLOCKS = levelquestion.loaded_blocks;

document.write('<script type="text/javascript" src="generated/' +
               BlocklyApps.LANG + '.js"></script>\n');
 
Turtle.HEIGHT = 400;
Turtle.WIDTH = 400;


/**
 * PID of animation task currently executing.
 */
Turtle.pid = 0;

/**
 * Should the turtle be drawn?
 */
Turtle.visible = true;

/**
* Is the code executed? , Added by Zuhair
*/
Turtle.executed = false;

/**
 * Initialize Blockly and the turtle.  Called on page load.
 */
Turtle.init = function() {
  BlocklyApps.init();

  var rtl = BlocklyApps.isRtl();
  var blocklyDiv = document.getElementById('blockly');
  var visualization = document.getElementById('visualization');
  var onresize = function(e) {
    var top = visualization.offsetTop;
    blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
    blocklyDiv.style.left = rtl ? '10px' : '420px';
    blocklyDiv.style.width = (window.innerWidth - 440) + 'px';
  };
  window.addEventListener('scroll', function() {
      onresize();
      Blockly.fireUiEvent(window, 'resize');
    });
  window.addEventListener('resize', onresize);
  onresize();

  var toolbox = document.getElementById('toolbox');
  Blockly.inject(document.getElementById('blockly'),
      {path: '../../',
	  maxBlocks: Turtle.MAX_BLOCKS,
       rtl: rtl,
       toolbox: toolbox,
       trashcan: true});

  Blockly.JavaScript.INFINITE_LOOP_TRAP = '  BlocklyApps.checkTimeout(%1);\n';

  // Add to reserved word list: API, local variables in execution evironment
  // (execute) and the infinite loop detection function.
  Blockly.JavaScript.addReservedWords('Turtle,code');

  window.addEventListener('beforeunload', function(e) {
    if (Blockly.mainWorkspace.getAllBlocks().length > 2) {
      e.returnValue = BlocklyApps.getMsg('Turtle_unloadWarning');  // Gecko.
      return BlocklyApps.getMsg('Turtle_unloadWarning');  // Webkit.
    }
    return null;
  });

  // Hide download button if browser lacks support
  // (http://caniuse.com/#feat=download).
  if (!(goog.userAgent.GECKO ||
       (goog.userAgent.WEBKIT && !goog.userAgent.SAFARI))) {
    document.getElementById('captureButton').className = 'disabled';
  } else {
    BlocklyApps.bindClick('captureButton', Turtle.createImageLink);
  }

  // Initialize the slider.
  var sliderSvg = document.getElementById('slider');
  Turtle.speedSlider = new Slider(10, 35, 130, sliderSvg);

  var defaultXml = Turtle.LOADED_BLOCKS ? Turtle.LOADED_BLOCKS : '<xml></xml>'; // edited by Zuhair
  BlocklyApps.loadBlocks(defaultXml);

  Turtle.ctxDisplay = document.getElementById('display').getContext('2d');
  Turtle.ctxScratch = document.getElementById('scratch').getContext('2d');
  Turtle.reset();

  BlocklyApps.bindClick('runButton', Turtle.runButtonClick);
  BlocklyApps.bindClick('resetButton', Turtle.resetButtonClick);
  
  // Added by Zuhair
  if (Turtle.LEVEL != "default") {
  document.getElementById("question_image").src = Turtle.QUESTION_IMAGE? "questions/"+Turtle.QUESTION_IMAGE:"error.png";
  document.getElementById("question_text").innerHTML = Turtle.QUESTION_TEXT?Turtle.QUESTION_TEXT:"No such question";
	BlocklyApps.bindClick('submitButton', Turtle.submitClick);
    BlocklyApps.bindClick('showQuestionButton', Turtle.showQuestionClick);
	// Show question on startup
    var content = document.getElementById('dialogQuestion');
    var style = {
      width: '50%',
      left: '30%',
      top: '5em'
    };
    BlocklyApps.showDialog(content, null, false, true, style,
        BlocklyApps.stopDialogKeyDown);
    BlocklyApps.startDialogKeyDown();
  }

  // Lazy-load the syntax-highlighting.
  window.setTimeout(BlocklyApps.importPrettify, 1);
};

window.addEventListener('load', Turtle.init);

/**
 * Reset the turtle to the start position, clear the display, and kill any
 * pending tasks.
 */
Turtle.reset = function() {
  // Starting location and heading of the turtle.
  Turtle.x = Turtle.HEIGHT / 2;
  Turtle.y = Turtle.WIDTH / 2;
  Turtle.heading = 0;
  Turtle.penDownValue = true;
  Turtle.visible = true;

  // Clear the display.
  Turtle.ctxScratch.canvas.width = Turtle.ctxScratch.canvas.width;
  Turtle.ctxScratch.strokeStyle = '#000000';
  Turtle.ctxScratch.fillStyle = '#000000';
  Turtle.ctxScratch.lineWidth = 1;
  Turtle.ctxScratch.lineCap = 'round';
  Turtle.ctxScratch.font = 'normal 18pt Arial';
  Turtle.display();

  // Kill any task.
  if (Turtle.pid) {
    window.clearTimeout(Turtle.pid);
  }
  Turtle.pid = 0;
};

/**
 * Copy the scratch canvas to the display canvas. Add a turtle marker.
 */
Turtle.display = function() {
  Turtle.ctxDisplay.globalCompositeOperation = 'copy';
  Turtle.ctxDisplay.drawImage(Turtle.ctxScratch.canvas, 0, 0);
  Turtle.ctxDisplay.globalCompositeOperation = 'source-over';
  // Draw the turtle.
  if (Turtle.visible) {
    // Make the turtle the colour of the pen.
    Turtle.ctxDisplay.strokeStyle = Turtle.ctxScratch.strokeStyle;
    Turtle.ctxDisplay.fillStyle = Turtle.ctxScratch.fillStyle;

    // Draw the turtle body.
    var radius = Turtle.ctxScratch.lineWidth / 2 + 10;
    Turtle.ctxDisplay.beginPath();
    Turtle.ctxDisplay.arc(Turtle.x, Turtle.y, radius, 0, 2 * Math.PI, false);
    Turtle.ctxDisplay.lineWidth = 3;
    Turtle.ctxDisplay.stroke();

    // Draw the turtle head.
    var WIDTH = 0.3;
    var HEAD_TIP = 10;
    var ARROW_TIP = 4;
    var BEND = 6;
    var radians = 2 * Math.PI * Turtle.heading / 360;
    var tipX = Turtle.x + (radius + HEAD_TIP) * Math.sin(radians);
    var tipY = Turtle.y - (radius + HEAD_TIP) * Math.cos(radians);
    radians -= WIDTH;
    var leftX = Turtle.x + (radius + ARROW_TIP) * Math.sin(radians);
    var leftY = Turtle.y - (radius + ARROW_TIP) * Math.cos(radians);
    radians += WIDTH / 2;
    var leftControlX = Turtle.x + (radius + BEND) * Math.sin(radians);
    var leftControlY = Turtle.y - (radius + BEND) * Math.cos(radians);
    radians += WIDTH;
    var rightControlX = Turtle.x + (radius + BEND) * Math.sin(radians);
    var rightControlY = Turtle.y - (radius + BEND) * Math.cos(radians);
    radians += WIDTH / 2;
    var rightX = Turtle.x + (radius + ARROW_TIP) * Math.sin(radians);
    var rightY = Turtle.y - (radius + ARROW_TIP) * Math.cos(radians);
    Turtle.ctxDisplay.beginPath();
    Turtle.ctxDisplay.moveTo(tipX, tipY);
    Turtle.ctxDisplay.lineTo(leftX, leftY);
    Turtle.ctxDisplay.bezierCurveTo(leftControlX, leftControlY,
        rightControlX, rightControlY, rightX, rightY);
    Turtle.ctxDisplay.closePath();
    Turtle.ctxDisplay.fill();
  }
};

/**
* Show question, Added by Zuhair
*/

Turtle.showQuestionClick = function(e) {
	var origin = e.target;
  var content = document.getElementById('dialogQuestion');
  var style = {
    width: '50%',
    left: '30%',
    top: '5em'
  };
  BlocklyApps.showDialog(content, origin, true, true, style,
      BlocklyApps.stopDialogKeyDown);
  BlocklyApps.startDialogKeyDown();
}

/**
* Submit click, Added by Zuhair
*/

Turtle.submitClick = function(e) {
var origImageSrc = document.getElementById('display').toDataURL('image/png');
var diffImage = document.getElementById('diff_image');
var submitResponse = document.getElementById('submit_response');
if(Turtle.executed == true){ // submit only when the code is executed
	
// TODO
	
	diffImage.src = origImageSrc; // TODO put the difference image here
	submitResponse.innerHTML = ""; // TODO show the response here (accepts html put in a string)
  }
  else{
    diffImage.src = "error.png";
	submitResponse.innerHTML = "Please run your program first.";
  }
	var origin = e.target;
  var content = document.getElementById('dialogSubmit');
  var style = {
    width: '50%',
    left: '30%',
    top: '5em'
  };
  BlocklyApps.showDialog(content, origin, true, true, style,
  BlocklyApps.stopDialogKeyDown);
  BlocklyApps.startDialogKeyDown();
}

/**
 * Click the run button.  Start the program.
 */
Turtle.runButtonClick = function() {
	Turtle.executed = true;
  var runButton = document.getElementById('runButton');
  var resetButton = document.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  runButton.style.display = 'none';
  resetButton.style.display = 'inline';
  // Prevent double-clicks or double-taps.
  resetButton.disabled = true;
  setTimeout(function() {resetButton.disabled = false;},
             BlocklyApps.DOUBLE_CLICK_TIME);

  document.getElementById('spinner').style.visibility = 'visible';
  Blockly.mainWorkspace.traceOn(true);
  Turtle.execute();
};

/**
 * Click the reset button.  Reset the Turtle.
 */
Turtle.resetButtonClick = function() {
	Turtle.executed = false;
  var runButton = document.getElementById('runButton');
  runButton.style.display = 'inline';
  document.getElementById('resetButton').style.display = 'none';
  // Prevent double-clicks or double-taps.
  runButton.disabled = true;
  setTimeout(function() {runButton.disabled = false;},
             BlocklyApps.DOUBLE_CLICK_TIME);

  document.getElementById('spinner').style.visibility = 'hidden';
  Blockly.mainWorkspace.traceOn(false);
  Turtle.reset();
};


/**
 * Execute the user's code.  Heaven help us...
 */
Turtle.execute = function() {
  BlocklyApps.log = [];
  BlocklyApps.ticks = 1000000;

  var code = Blockly.JavaScript.workspaceToCode();
  try {
    eval(code);
  } catch (e) {
    // Null is thrown for infinite loop.
    // Otherwise, abnormal termination is a user error.
    if (e !== Infinity) {
      alert(e);
    }
  }

  // BlocklyApps.log now contains a transcript of all the user's actions.
  // Reset the graphic and animate the transcript.
  Turtle.reset();
  Turtle.pid = window.setTimeout(Turtle.animate, 100);
};

/**
 * Iterate through the recorded path and animate the turtle's actions.
 */
Turtle.animate = function() {
  // All tasks should be complete now.  Clean up the PID list.
  Turtle.pid = 0;

  var tuple = BlocklyApps.log.shift();
  if (!tuple) {
    document.getElementById('spinner').style.visibility = 'hidden';
    BlocklyApps.highlight(null);
    return;
  }
  var command = tuple.shift();
   if(document.getElementById('highlight_blocks').checked){ //Added by Zuhair
	 BlocklyApps.highlight(tuple.pop());
	 }
  Turtle.step(command, tuple);
  Turtle.display();

  // Scale the speed non-linearly, to give better precision at the fast end.
  var stepSpeed = 100* Math.pow(1 - Turtle.speedSlider.getValue(), 2);
  Turtle.pid = window.setTimeout(Turtle.animate, stepSpeed);
};

/**
 * Execute one step.
 * @param {string} command Logo-style command (e.g. 'FD' or 'RT').
 * @param {!Array} values List of arguments for the command.
 */
Turtle.step = function(command, values) {
  switch (command) {
    case 'FD':  // Forward
      if (Turtle.penDownValue) {
        Turtle.ctxScratch.beginPath();
        Turtle.ctxScratch.moveTo(Turtle.x, Turtle.y);
      }
      var distance = values[0];
      if (distance) {
        Turtle.x += distance * Math.sin(2 * Math.PI * Turtle.heading / 360);
        Turtle.y -= distance * Math.cos(2 * Math.PI * Turtle.heading / 360);
        var bump = 0;
      } else {
        // WebKit (unlike Gecko) draws nothing for a zero-length line.
        var bump = 0.1;
      }
      if (Turtle.penDownValue) {
        Turtle.ctxScratch.lineTo(Turtle.x, Turtle.y + bump);
        Turtle.ctxScratch.stroke();
      }
      break;
    case 'RT':  // Right Turn
      Turtle.heading += values[0];
      Turtle.heading %= 360;
      if (Turtle.heading < 0) {
        Turtle.heading += 360;
      }
      break;
    case 'DP':  // Draw Print
      Turtle.ctxScratch.save();
      Turtle.ctxScratch.translate(Turtle.x, Turtle.y);
      Turtle.ctxScratch.rotate(2 * Math.PI * (Turtle.heading - 90) / 360);
      Turtle.ctxScratch.fillText(values[0], 0, 0);
      Turtle.ctxScratch.restore();
      break;
    case 'DF':  // Draw Font
      Turtle.ctxScratch.font = values[2] + ' ' + values[1] + 'pt ' + values[0];
      break;
    case 'PU':  // Pen Up
      Turtle.penDownValue = false;
      break;
    case 'PD':  // Pen Down
      Turtle.penDownValue = true;
      break;
    case 'PW':  // Pen Width
      Turtle.ctxScratch.lineWidth = values[0];
      break;
    case 'PC':  // Pen Colour
      Turtle.ctxScratch.strokeStyle = values[0];
      Turtle.ctxScratch.fillStyle = values[0];
      break;
    case 'HT':  // Hide Turtle
      Turtle.visible = false;
      break;
    case 'ST':  // Show Turtle
      Turtle.visible = true;
      break;
	  // Added by Zuhair
	case 'DL': // Draw Loop
		if (Turtle.penDownValue) {
        Turtle.ctxScratch.beginPath();
		var radius = values[0];
		var cenx = Turtle.x +radius * Math.cos(2 * Math.PI * Turtle.heading / 360);
		var ceny = Turtle.y +radius * Math.sin(2 * Math.PI * Turtle.heading / 360);
        Turtle.ctxScratch.arc(cenx, ceny,Math.abs(radius),0,2*Math.PI);
        Turtle.ctxScratch.stroke();
      }
	  break;
	 case 'AL': // Draw arc left
	    var radius = values[0];
		var angle = values[1];
		if (Turtle.penDownValue) {
        Turtle.ctxScratch.beginPath();
		var cenx = Turtle.x + radius * Math.cos(2 * Math.PI * Turtle.heading / 360);
		var ceny = Turtle.y + radius * Math.sin(2 * Math.PI * Turtle.heading / 360);
		var start_angle;
		var end_angle;
		if (radius>=0){
			start_angle = 2 * Math.PI * ((Turtle.heading+180)%360) / 360;
			end_angle = 2 * Math.PI * ((Turtle.heading+angle+180)%360)/ 360;
		}
		else{
			start_angle = 2 * Math.PI * ((Turtle.heading+angle)%360) / 360;
			end_angle = 2 * Math.PI * ((Turtle.heading)%360)/ 360;
		}
        Turtle.ctxScratch.arc(cenx, ceny,Math.abs(radius),start_angle,end_angle);
        Turtle.ctxScratch.stroke();
      }
	   Turtle.heading +=angle;
	  Turtle.x = cenx - radius * Math.cos(2 * Math.PI * Turtle.heading / 360);
	  Turtle.y = ceny - radius * Math.sin(2 * Math.PI * Turtle.heading / 360);
      break;
	  
  }
};

/**
 * Save an image of the SVG canvas.
 */
Turtle.createImageLink = function() {
  var imgLink = document.getElementById('downloadImageLink');
  imgLink.setAttribute('href',
      document.getElementById('display').toDataURL('image/png'));
  var temp = window.onbeforeunload;
  window.onbeforeunload = null;
  imgLink.click();
  window.onbeforeunload = temp;
};

// Turtle API.

Turtle.moveForward = function(distance, id) {
  BlocklyApps.log.push(['FD', distance, id]);
};

Turtle.moveBackward = function(distance, id) {
  BlocklyApps.log.push(['FD', -distance, id]);
};

Turtle.turnRight = function(angle, id) {
  BlocklyApps.log.push(['RT', angle, id]);
};

Turtle.turnLeft = function(angle, id) {
  BlocklyApps.log.push(['RT', -angle, id]);
};

Turtle.penUp = function(id) {
  BlocklyApps.log.push(['PU', id]);
};

Turtle.penDown = function(id) {
  BlocklyApps.log.push(['PD', id]);
};

Turtle.penWidth = function(width, id) {
  BlocklyApps.log.push(['PW', Math.max(width, 0), id]);
};

Turtle.penColour = function(colour, id) {
  BlocklyApps.log.push(['PC', colour, id]);
};

Turtle.hideTurtle = function(id) {
  BlocklyApps.log.push(['HT', id]);
};

Turtle.showTurtle = function(id) {
  BlocklyApps.log.push(['ST', id]);
};

Turtle.drawPrint = function(text, id) {
  BlocklyApps.log.push(['DP', text, id]);
};

Turtle.drawFont = function(font, size, style, id) {
  BlocklyApps.log.push(['DF', font, size, style, id]);
};

// Added by Zuhair

Turtle.drawCircleRight = function(radius, id) {
  BlocklyApps.log.push(['DL', radius, id]);
};

Turtle.drawCircleLeft = function(radius, id) {
  BlocklyApps.log.push(['DL', -radius, id]);
};

Turtle.arcLeft = function(radius, angle, id) {
  BlocklyApps.log.push(['AL', -radius, -angle,id]);
}

Turtle.arcRight = function(radius, angle, id) {
  BlocklyApps.log.push(['AL', radius, angle,id]);
}

