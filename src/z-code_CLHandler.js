;(function(root,factory){
  root.BBCLHANDLER = factory()
})(this,function(){
  
  var BBCLHANDLER = {};
  
  var GSHEETS_REFERENCE_OBJ
  var SHEETS
  var RANGES
  
  var linkedSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  //Blitzwriter
  
  function populateDB(templatesFileId){
    GSHEETS_REFERENCE_OBJ = arguments[1];
    setGlobals();
    var langauges = ["EN","DE"];
    langauges.forEach(function(language){
      var CLTemplatesObj = getCLBD(language).CLTableObj;
      Object.keys(CLTemplatesObj).forEach(function(speciality){
        if(speciality != ''){
          var paragraphsObj = CLTemplatesObj[speciality];
          saveToTemplatesFile(templatesFileId,paragraphsObj,speciality,language);
        }
      })
    })
  }
  
  function writeToCL(CLObjs,templatesFileId){
    var toJSONObj = {};
    var speciality = CLObjs.composerObj.Speciality;
    var CLPartition = CLObjs.templatesTable.CLTableObj[speciality];
    var colShift = CLPartition.entryIndexInSheet;
    var CLRange = CLObjs.templatesTable.CLTableRange;
    var paragraphsObj = CLObjs.composerObj.paragraphs;
    var sheet = CLRange.getSheet();
    Object.keys(paragraphsObj).forEach(function(paragraph,i){
      if(paragraphsObj[paragraph].include){
        var content = paragraphsObj[paragraph].content.trim();
        if(paragraphsObj[paragraph].breakAfter){
          content += '\n\n'
        }
        sheet.getRange(CLRange.getRow() + i + 1, CLRange.getColumn() + colShift).setValue(content);
      }
    })
    saveToTemplatesFile(templatesFileId,paragraphsObj,speciality,CLObjs.composerObj.Language)
  }
  
  function saveToTemplatesFile(FILE_ID,paragraphsObj,speciality,language){
    var templatesFileObj = Toolkit.readFromJSON(FILE_ID);
    if(!templatesFileObj.CLParagraphs[language]){
      templatesFileObj.CLParagraphs[language] = {};
    }
    templatesFileObj.CLParagraphs[language][speciality] = paragraphsObj;
    Toolkit.writeToJSON(templatesFileObj, FILE_ID);
  }
  
  function writeToComposer(CLObjs){
    var speciality = CLObjs.composerObj.Speciality;
    var CLPartition = CLObjs.templatesTable.CLTableObj[speciality];
    var composerRange = CLObjs.composerObj.composerRange;
    var sheet = composerRange.getSheet();
    Object.keys(CLPartition).forEach(function(paragraphName){
      if(paragraphName != "entryIndexInSheet" && paragraphName != "Speciality"){
        var paragraph = CLPartition[paragraphName];
        var rowShift = CLObjs.composerObj.paragraphs[paragraphName.toUpperCase()].cellShift;
        sheet.getRange(composerRange.getRow() + rowShift, composerRange.getColumn() + 1).setValue(paragraph);   
      }
    })
  }
  
  function getCLComposer(){
    GSHEETS_REFERENCE_OBJ = arguments[0];
    setGlobals();
    var composerTableRange = linkedSpreadsheet.getRange(RANGES.CLComposer);
    var composerTableArr = composerTableRange.getValues();
    var composerObj = {};
    composerObj.composerRange = composerTableRange;
    composerObj.Speciality = composerTableArr[0][1];
    composerObj.Language = composerTableArr[0][2];
    if(composerObj.Speciality == "" || composerObj.Language == ""){
      BBUI.popoutErrorMessges("Missing Info","Please provide Speciality AND Language!");
      return;
    }
    composerObj.paragraphs = {};
    composerTableArr.slice(2).forEach(function(row,i,arr){
      if(i % 2 == 0){
        composerObj.paragraphs[row[0]] = {};
        composerObj.paragraphs[row[0]].content = row[1];
        composerObj.paragraphs[row[0]].include = row[2] == "●"? true : false;
        composerObj.paragraphs[row[0]].cellShift = i + 2;
        if(arr[i + 1] && arr[i + 1][0] == "Break"){
          composerObj.paragraphs[row[0]].breakAfter = true;
        }else{
          composerObj.paragraphs[row[0]].breakAfter = false;
        }
      }
    })
    var templatesTable = getCLBD(composerObj.Language);
    return {composerObj:composerObj,templatesTable:templatesTable};
  }
  
  function getCLBD(language){
    var CLRange = language == "EN"? "ENCLTemplates" : "DECLTemplates";
    var CLTableRange =  linkedSpreadsheet.getRange(RANGES[CLRange]);
    var CLTableArr = CLTableRange.getValues();
    var CLTableObj = Toolkit.getTable(CLTableArr,"Speciality");
    return {CLTableRange: CLTableRange,CLTableObj: CLTableObj}
  }
  
  //Job Manager Composer
  
  function populateJobManagerComposer(){
    GSHEETS_REFERENCE_OBJ = arguments[0];
    var variables = arguments[1];
    var templatesFileId = arguments[2];
    setGlobals();
    var language = variables.applicationLanguage == 'English'? 'EN' : 'DE';
    var speciality = variables.specialty;
    var templates = Toolkit.readFromJSON(templatesFileId);
    var bodyTemplateObj = templates.CLParagraphs[language][speciality];
    var headersTemplate = templates.CLHeading;
    var compiledBodyTemplate = getCompiledBody(bodyTemplateObj,variables);
    var subject = Toolkit.createTemplateSimple(bodyTemplateObj["Subject Line"],variables);
    var body = Toolkit.createTemplateSimple(compiledBodyTemplate,variables);
    var headerReceived = Toolkit.createTemplateSimple(headersTemplate.receiver,variables);
    var headerSender = Toolkit.createTemplateSimple(headersTemplate.sender,variables);
    writeToJobManagerComposer(subject,body,headerReceived,headerSender);
  }
  
  function writeToJobManagerComposer(subject,body,headerReceived,headerSender){
    linkedSpreadsheet.getRange(RANGES.CLFinalReviewSubject).setValue(subject);
    linkedSpreadsheet.getRange(RANGES.CLFinalReviewBody).setValue(body);
    linkedSpreadsheet.getRange(RANGES.CLFinalReviewReceiver).setValue(headerReceived);
    linkedSpreadsheet.getRange(RANGES.CLFinalReviewSender).setValue(headerSender);
  }
  
  function getCompiledBody(bodyTemplateObj,variables){
    var compiledBodyTemplate = '';
    Object.keys(bodyTemplateObj).forEach(function(paragraph){
      if(paragraph != "Subject Line" && paragraph != "Speciality" && paragraph != "entryIndexInSheet"){
        compiledBodyTemplate += Toolkit.createTemplateSimple(bodyTemplateObj[paragraph],variables);
        console.log(paragraph);
      }
    })
    return compiledBodyTemplate;
  }
  
  function setGlobals(){
    SHEETS = GSHEETS_REFERENCE_OBJ.sheets;
    RANGES = GSHEETS_REFERENCE_OBJ.ranges;
  }
  
  BBCLHANDLER.populateDB = populateDB;
  BBCLHANDLER.populateJobManagerComposer = populateJobManagerComposer;
  BBCLHANDLER.getCLComposer = getCLComposer;
  BBCLHANDLER.writeToCL = writeToCL;
  BBCLHANDLER.writeToComposer = writeToComposer;
  
  return BBCLHANDLER
})