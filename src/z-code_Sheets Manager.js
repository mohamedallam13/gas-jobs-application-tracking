;(function(root,factory){
  root.BBSHEETSMANAGER = factory()
})(this,function(){
  
  var BBSHEETSMANAGER = {};  
  
  var linkedSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var GSHEETS_REFERENCE_OBJ
  var SHEETS
  var RANGES
  
  function updateContinousEntriesToDashboardDB(GSHEETS_REFERENCE_OBJG,sheetLabel,currentId,head,value){
    setGlobals(GSHEETS_REFERENCE_OBJG);
    var sheetOptions = SHEETS[sheetLabel];
    var sheet = linkedSpreadsheet.getSheetByName(sheetOptions.sheetName);
    var header = sheet.getRange(sheetOptions.headerRow,1,1,sheet.getLastColumn()).getValues()[0];
    var writeCol = header.indexOf(head) + 1;
    var idsCol = header.indexOf(sheetOptions.idColumn) + 1;
    var idsColValues = getColumn(sheet,sheetOptions.headerRow,idsCol,sheet.getLastRow(),1);
    var writeRow = idsColValues.indexOf(currentId) + sheetOptions.headerRow;
    if(Array.isArray(value)){
      sheet.getRange(writeRow,writeCol,1,value.length).setValues([value]);
    }else{
      sheet.getRange(writeRow,writeCol).setValue(value);
    }
  }
  
  function getColumn(sheet,row,col,rowRange,colRange){
    return sheet.getRange(row,col,rowRange,colRange).getValues().map(row => row[0]).filter(entry => entry != "");
  }
  
  function setGlobals(GSHEETS_REFERENCE_OBJG){
    GSHEETS_REFERENCE_OBJ = GSHEETS_REFERENCE_OBJG;
    SHEETS = GSHEETS_REFERENCE_OBJ.sheets;
    RANGES = GSHEETS_REFERENCE_OBJ.ranges;
  }
  
  BBSHEETSMANAGER.updateContinousEntriesToDashboardDB = updateContinousEntriesToDashboardDB;
  
  return BBSHEETSMANAGER
})