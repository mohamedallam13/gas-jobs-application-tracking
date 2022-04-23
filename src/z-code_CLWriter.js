;(function(root,factory){
  root.CLWRITER = factory()
})(this,function(){
  
  var CLWRITER = {};
  
  var ALL_FILE_IDS;
  var templatesObj
  
  var linkedSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var GSHEETS_REFERENCE_OBJ
  var SHEETS
  var RANGES
  
  function init(){
    ALL_FILE_IDS = arguments[0];
    GSHEETS_REFERENCE_OBJ = arguments[1];
    var variables = arguments[2];
    var manualBool = arguments[3];
    setGlobals();
    templatesObj = Toolkit.readFromJSON(ALL_FILE_IDS.templates);
    var coverLetterElements = manualBool? formReviewedElements(variables) : formUnreviewedElements(variables);
    var coverLetterFileObj = createFile(coverLetterElements,variables);
    return coverLetterFileObj;
  }
  
  function formReviewedElements(variables){
    var coverLetterElements = {};
    coverLetterElements.receiverHeading = linkedSpreadsheet.getRange(RANGES.CLFinalReviewReceiver).getValue();
    coverLetterElements.senderHeading = linkedSpreadsheet.getRange(RANGES.CLFinalReviewSender).getValue();
    coverLetterElements.subject = linkedSpreadsheet.getRange(RANGES.CLFinalReviewSubject).getValue();
    coverLetterElements.body = linkedSpreadsheet.getRange(RANGES.CLFinalReviewBody).getValue();
    stripCoverLetter();
    return coverLetterElements;
  }
  
  function stripCoverLetter(){
  
  }
  
  function formUnreviewedElements(variables){
    var language = variables.applicationLanguage == 'English'? 'EN' : 'DE';
    var speciality = variables.specialty; 
    var templatesObj = Toolkit.readFromJSON(ALL_FILE_IDS.templates);
    var coverLetterElements = {};
    coverLetterElements.subject = Toolkit.createTemplateSimple(templatesObj.CLParagraphs[language][speciality]["Subject Line"],variables);
    coverLetterElements.body = compileBody(templatesObj.CLParagraphs[language][speciality],variables);
    coverLetterElements.senderHeading = Toolkit.createTemplateSimple(templatesObj.CLHeading.sender,variables);
    coverLetterElements.receiverHeading = Toolkit.createTemplateSimple(templatesObj.CLHeading.receiver,variables);
    return coverLetterElements
  }
  
  function compileBody(paragraphsObj,variables){
    var body = "";
    Object.keys(paragraphsObj).forEach(function(paragraphName){
      if(paragraphName != "Subject Line" && paragraphName != "Speciality" && paragraphName != "entryIndexInSheet"){
        body = body + paragraphsObj[paragraphName]
      }
    })
    return body;
  }
  
  function createFile(coverLetterElements,variables){
    var folder = DriveApp.getFolderById(templatesObj.coverLettersFolder);
    var dateString = Toolkit.timestampCreate(undefined,'MM.dd.YYYY').toString().replace(/\./g,"_");
    var fileName = variables.positionTitleCompound + "-" + dateString;
    var copyFile = getTemplateFile(folder,fileName);
    var copyDoc = replaceBody(coverLetterElements,copyFile,fileName);
    var newFilePDF = producePDF(copyDoc,fileName);
    var pdfURL = newFilePDF.getUrl();
    var docURL = copyDoc.getUrl();
    try{
      folder.addFile(newFilePDF);
      DriveApp.getRootFolder().removeFile(newFilePDF);
    }catch(e){
      console.log(e);
      console.log(templatesObj.coverLettersFolder);
    }
    return {latestCoverLetterName: fileName,latestCoverLetterDocURL: docURL,latestCoverLetterPDFURL: pdfURL};
  }
  
  function getTemplateFile(folder,fileName){
    var folder = DriveApp.getFolderById(templatesObj.coverLettersFolder) 
    var copyFile = DriveApp.getFileById(templatesObj.coverLetterTemplateDoc).makeCopy(fileName,folder);
    DriveApp.getRootFolder().removeFile(copyFile);
    return copyFile;
  }
  
  function replaceBody(coverLetterElements,copyFile,fileName){
    var letterid = copyFile.getId() 
    var copyDoc = DocumentApp.openById(letterid),
        copyBody = copyDoc.getActiveSection();
    copyDoc.setName(fileName);
    copyBody.replaceText("%Addresser%", coverLetterElements.senderHeading);
    copyBody.replaceText("%Addressee%", coverLetterElements.receiverHeading);
    copyBody.replaceText("%Subject%", coverLetterElements.subject);
    copyBody.replaceText("%Body%", coverLetterElements.body); 
    copyDoc.saveAndClose();
    return copyDoc;
  }
  
  function producePDF(copyDoc,fileName){
    var newFilePDF = DriveApp.createFile(copyDoc.getAs('application/pdf'))
    newFilePDF.setName(fileName);
    return newFilePDF;
  }
  
  function setGlobals(){
    SHEETS = GSHEETS_REFERENCE_OBJ.sheets;
    RANGES = GSHEETS_REFERENCE_OBJ.ranges;
  }
  
  
  CLWRITER.init = init;
  
  return CLWRITER
})