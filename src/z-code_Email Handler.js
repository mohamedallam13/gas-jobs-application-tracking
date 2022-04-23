;(function(root,factory){
  root.BBEMAILHANDLER = factory()
})(this,function(){
  
  var BBEMAILHANDLER = {};
  
  var ALL_FILE_IDS;
  var templatesObj
  var filesObj
  var attachementsArr = [];
  
  var linkedSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var GSHEETS_REFERENCE_OBJ
  var SHEETS
  var RANGES
  
  const LIVE = true;
  const TEST_MAIL = "mh.allam@yahoo.com";
  
  function init(){
    ALL_FILE_IDS = arguments[0];
    GSHEETS_REFERENCE_OBJ = arguments[1];
    var variables = arguments[2];
    var coverLetterFileObj = arguments[3];
    var manualBool = arguments[4];
    setGlobals();
    templatesObj = templatesObj || Toolkit.readFromJSON(ALL_FILE_IDS.templates);
    if(manualBool){
      getDocumentsFromManager(coverLetterFileObj,variables)
      var emailElements = getEmailFromManage(variables);
    }else{
      getDocumentsFromSetup(coverLetterFileObj,variables)
      var emailElements = getTemplateFromSetup(variables);
    }
    var emailOptions = new EmailObj(emailElements,variables);
    var response = sendEmail(emailOptions);
    return response;
  }
  
  function getDocumentsFromManager(coverLetterFileObj,variables){
    var language = variables.applicationLanguage == 'English'? 'EN' : 'DE';
    var jobManagerDocumentsRange = linkedSpreadsheet.getRange(RANGES.documentsTable);
    var jobManagerDocumentsValues = jobManagerDocumentsRange.getValues();
    var jobManagerDocumentsObj =  Toolkit.getTable(jobManagerDocumentsValues,"Document List",true);
    getAttachements(coverLetterFileObj,jobManagerDocumentsObj,language);
  }
  
  function getDocumentsFromSetup(coverLetterFileObj,variables){
    var language = variables.applicationLanguage == 'English'? 'EN' : 'DE';
    var speciality = variables.specialty; 
    var documentsObj = templatesObj.documentsList[speciality];
    getAttachements(coverLetterFileObj,documentsObj,language);
  }
  
  function getAttachements(coverLetterFileObj,docObj,language){
    filesObj = templatesObj.fileNames;
    var attachementsNamesArr = [];
    if(!Array.isArray(coverLetterFileObj)){
      coverLetterFileObj = [coverLetterFileObj];
    }
    coverLetterFileObj.forEach(function(covLetterObj){
      attachementsNamesArr.push(covLetterObj.latestCoverLetterName);
    })
    Object.keys(docObj).forEach(function(docLabel){
      var documentStatus = docObj[docLabel]["Selection Options"];
      if(docLabel == "CV"){
        documentStatus = documentStatus.replace("EN",language);
        var fileName = filesObj.Filename[documentStatus];
        if(fileName != ""){
          attachementsNamesArr.push(fileName);
        }
      }else{
        if(documentStatus == "YES" || documentStatus ==true){
          var fileName = filesObj.Filename[docLabel];
          if(fileName != ""){
            attachementsNamesArr.push(fileName);
          }
        }
      }
    })
    attachementsNamesArr.forEach(createAttachmentsArray);
  }
  
  function createAttachmentsArray(attachmentName){
    var files = DriveApp.getFilesByName(attachmentName);
    var i = 0;
    while(files.hasNext() && i < 1){
      attachementsArr.push(files.next().getAs(MimeType.PDF));
      i++
    }
  }
  
  function getEmailFromManage(variables){
    var emailElements = {};
    emailElements.subject = linkedSpreadsheet.getRange(RANGES.jobManagerEmailSubject).getValue();
    emailElements.body = linkedSpreadsheet.getRange(RANGES.jobManagerEmailBody).getValue();
    stripEmail();
    return emailElements;
  }
  
  function stripEmail(){
  
  }
  
  function updateEmailTemplatesInDB(){
    ALL_FILE_IDS = arguments[0];
    GSHEETS_REFERENCE_OBJ = arguments[1];
    setGlobals();
    var templatesFileObj = Toolkit.readFromJSON(ALL_FILE_IDS.templates);
    var emailTableEN = linkedSpreadsheet.getRange(RANGES.ENEmailTemplates).getValues();
    var emailTableDE = linkedSpreadsheet.getRange(RANGES.DEEmailTemplates).getValues();
    var emailTableENObj = Toolkit.getTable(emailTableEN,"Speciality",false);
    var emailTableDEObj = Toolkit.getTable(emailTableDE,"Speciality",false);
    if(!templatesFileObj.emails.EN){
      templatesFileObj.emails.EN = {};
    }
    templatesFileObj.emails.EN.firstEmail = emailTableENObj;
    if(!templatesFileObj.emails.DE){
      templatesFileObj.emails.DE = {};
    }
    templatesFileObj.emails.DE.firstEmail = emailTableDEObj;
    Toolkit.writeToJSON(templatesFileObj, ALL_FILE_IDS.templates);
  }
  
  function populateJobManagerEmailer(){
    GSHEETS_REFERENCE_OBJ = arguments[0];
    var variables = arguments[1];
    var templatesFileId = arguments[2];
    setGlobals();
    var language = variables.applicationLanguage == 'English'? 'EN' : 'DE';
    var speciality = variables.specialty;
    var templates = Toolkit.readFromJSON(templatesFileId);
    var templateObj = templates.emails[language].firstEmail[speciality];
    var subject = Toolkit.createTemplateSimple(templateObj.Subject,variables);
    var body = Toolkit.createTemplateSimple(templateObj.Body,variables);
    writeToJobManagerEmailer(subject,body);
  }
  
  function writeToJobManagerEmailer(subject,body,headerReceived,headerSender){
    linkedSpreadsheet.getRange(RANGES.jobManagerEmailSubject).setValue(subject);
    linkedSpreadsheet.getRange(RANGES.jobManagerEmailBody).setValue(body);
  }
  
  function setGlobals(){
    SHEETS = GSHEETS_REFERENCE_OBJ.sheets;
    RANGES = GSHEETS_REFERENCE_OBJ.ranges;
  }
  
  
  function EmailObj(emailElements,variables){
    this.attachments = attachementsArr;
    this.name = variables.userName;
    this.to = LIVE? variables.contactPersonAEmail : TEST_MAIL;    
    this.cc = LIVE? variables.contactPersonACC : "";
    this.subject =  emailElements.subject;
    this.body = emailElements.body; //TODO Make a template and add elements to it
  }
  
  function sendEmail(emailOptions) {
    /* parameters
    attachments  - BlobSource[] - an array of files to send with the email
    bcc          - String       - a comma-separated list of email addresses to BCC
    body         - String       - the body of the email
    cc           - String       - a comma-separated list of email addresses to CC
    htmlBody     - String       - if set, devices capable of rendering HTML will use it instead of the required body argument; you can add an optional inlineImages field in HTML body if you have inlined images for your email
    inlineImages - Object       - a JavaScript object containing a mapping from image key (String) to image data (BlobSource); this assumes that the htmlBody parameter is used and contains references to these images in the format <img src="cid:imageKey" /> (see example)
    name         - String       - the name of the sender of the email (default: the user's name)
    noReply      - Boolean      - true if the email should be sent from a generic no-reply email address to discourage recipients from responding to emails; this option is only possible for Google Apps accounts, not Gmail users
    replyTo      - String       - an email address to use as the default reply-to address (default: the user's email address)
    subject      - String       - the subject of the email
    to           - String       - the address of the recipient
    */
    var rdq = getRemainingDailyQuota();
    if (rdq < 1) {
      throw 'Remaining e-mail quota exceeded. Please send e-mail manually.';
    } else {
      try{
        MailApp.sendEmail(emailOptions)
      }catch(e){
        Logger.log(e)
        return e
      };
    }
  }
  
  function getRemainingDailyQuota() {
    var rdq = MailApp.getRemainingDailyQuota();
    return rdq;
  } 
  
  
  BBEMAILHANDLER.init = init;
  BBEMAILHANDLER.updateEmailTemplatesInDB = updateEmailTemplatesInDB;
  BBEMAILHANDLER.populateJobManagerEmailer = populateJobManagerEmailer;
  
  return BBEMAILHANDLER
})

