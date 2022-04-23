;(function(root,factory){
  root.BBUI = factory()
})(this,function(){
  
  var BBUI = {};
  
  function popoutErrorMessges(title,message){
    var ui = SpreadsheetApp.getUi(); // Same variations.
    var result = ui.alert(
      title,
      message,
      ui.ButtonSet.OK);
  }
  
  function yesNoMessage(title,message){
    var ui = SpreadsheetApp.getUi(); // Same variations.
    var result = ui.alert(
      title,
      message,
      ui.ButtonSet.YES_NO);
    if (result == ui.Button.YES) {
      return true;
    }
    return false;
  }
  
  function popupText(message){
    var input = Browser.inputBox(message);
    return input;
  }
  
  BBUI.popoutErrorMessges = popoutErrorMessges;  
  BBUI.yesNoMessage = yesNoMessage;  
  BBUI.popupText = popupText;  
  
  return BBUI
})
