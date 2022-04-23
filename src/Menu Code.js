function onOpen(){
  
  var ui = SpreadsheetApp.getUi();
  var mainMenu = ui.createMenu("Control Panel");
  
  var manageCL = ui.createMenu("Manage Cover Letters")
  .addItem("Save CL Template", "saveCL")
  .addItem("Load CL Template", "loadCL")
  
//  var manageStandardEmails = ui.createMenu("Standard Emails")
//  .addItem("Load Template", "loadTemplate")
//  .addItem("Save Template", "saveTemplate")
//  
//  var updateTemplates = ui.createMenu("Update Templates")
//  .addItem("Update All Templates", "updateAllTemplates")
  
  
  mainMenu.addSubMenu(manageCL)
  .addSeparator()
  .addItem("Save All to DB", "saveAlltoDBFile")
  .addSeparator()
  .addItem("Load Application Elements", "loadAllApplicationElementsToJobManager")
  .addSeparator()
  .addItem("Send Application", "sendApplicationFromManager")
//  .addSubMenu(manageStandardEmails)
//  .addSeparator()
//  .addSubMenu(updateTemplates)
//  .addSeparator()
//  .addItem("Save All to DB", "saveAlltoDBFile")
  .addToUi()
  
}