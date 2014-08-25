Blockly.Blocks['comment'] = {
  init: function() {
    this.setColour(60);
    this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput("your comment here"), "COMMENT_TEXT");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['comment'] = function(block) {
  var text_comment_text = block.getFieldValue('COMMENT_TEXT');
  var code = '//'+text_comment_text;
  return code;
};