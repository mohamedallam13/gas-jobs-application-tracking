;(function(root,factory){
  root.BBMAIN = factory()
})(this,function(){
  
  var BBMAIN = {};
  
  const MASTER_INDEX_FILE_ID = '13WulRri_Yv8SW4qbcujgTULbrp8_AWMN';
  const ALL_FILE_IDS = Toolkit.readFromJSON(MASTER_INDEX_FILE_ID);
  
  const GSHEETS_REFERENCE_OBJ = Toolkit.readFromJSON(ALL_FILE_IDS.gsheetReference);
  const SHEETS = GSHEETS_REFERENCE_OBJ.sheets;
  const RANGES = GSHEETS_REFERENCE_OBJ.ranges;
  
  const ALL_SOURCES = Toolkit.readFromJSON(ALL_FILE_IDS.allSources);
  const LATEST_FORM_ID = ALL_SOURCES[ALL_SOURCES.length - 1].formId;
      
  var linkedSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var currentPositionId;
  
  var userObj = {};
  
  var positionsDBObj;
  var companyDBObj;
  
  getUserObject();
  getCurrentPositionId();
  
  function getCurrentPositionId(){
    currentPositionId = linkedSpreadsheet.getRange(RANGES.currentPositionId).getValue();
  }
  
  function getUserObject(){ 
    var userTableArr = linkedSpreadsheet.getRange(RANGES.userData).getValues();
    userTableArr.forEach(row => userObj[row[0]] = row[1]);
  }
  
  //Update Categories
  
  function setCategoriesInForm(){
    var catObj = getCategoriesTable();
    var categoriesList = Object.keys(catObj);
    BBGFORMS.updateListInForm(LATEST_FORM_ID,categoriesList,"Specialty");
  }
  
  function getCategoriesTable(){
    var catTableArr = linkedSpreadsheet.getRange(RANGES.categoriesTable).getValues();
    return Toolkit.simpleObjectify(catTableArr);
  }

  //Form Cover Letter Files
  
  function formCoverLetter(variables,manualBool){
    variables = variables || getVariables(currentPositionId);
    var filesObj = CLWRITER.init(ALL_FILE_IDS,GSHEETS_REFERENCE_OBJ,variables,manualBool);
    addToTracker(filesObj,currentPositionId);
    addToDB(filesObj,currentPositionId);
    return filesObj;
  }
  
  function addToTracker(filesObj,currentPositionId){
    var currentStatusEquivalent
    var writeArr = Object.keys(filesObj).map(function(head,i){
      if(i == 0){
        currentStatusEquivalent = head;
      }
      return filesObj[head];
    })
    BBSHEETSMANAGER.updateContinousEntriesToDashboardDB(GSHEETS_REFERENCE_OBJ,"jobTracker",currentPositionId,currentStatusEquivalent,writeArr);
    return filesObj;
  }
  
  function addToDB(filesObj,currentPositionId){
    var currentPositionObj = positionsDBObj.data[currentPositionId];
    if(!currentPositionObj.applications){
      currentPositionObj.applications = [];
    }
    filesObj.timestamp = Toolkit.timestampCreate(undefined,'dd.MM.YYYY HH:mm:ss');
    currentPositionObj.applications.push(filesObj);
  }
  
  //Save Load CL
  
  function saveLoadCL(bool){
    var CLObjs = BBCLHANDLER.getCLComposer(GSHEETS_REFERENCE_OBJ);
    if(CLObjs){
      if(bool){
        BBCLHANDLER.writeToCL(CLObjs,ALL_FILE_IDS.templates);
      }else{
        BBCLHANDLER.writeToComposer(CLObjs)
      }
    }
  }
  
  function saveAlltoDBFile(){
    BBCLHANDLER.populateDB(ALL_FILE_IDS.templates,GSHEETS_REFERENCE_OBJ);
    BBEMAILHANDLER.updateEmailTemplatesInDB(ALL_FILE_IDS,GSHEETS_REFERENCE_OBJ);
    var dbObj = Toolkit.readFromJSON(ALL_FILE_IDS.templates);
    dbObj.documentsList = getDocumentsSetupObject();
    dbObj.fileNames = getFilesObj();
    dbObj.CLHeading = getHeadings();
    Toolkit.writeToJSON(dbObj,ALL_FILE_IDS.templates)
  }
  
    //Tune Jobs
  
  function tune(bool){
    var tuneRange = linkedSpreadsheet.getRange(RANGES.jobsTuner);
    var tuneValue = tuneRange.getValue();
    var outOf = linkedSpreadsheet.getRange(RANGES.outOf).getValue();
    var max = parseInt(outOf.split(" ")[3]);
    var searchBarRange = linkedSpreadsheet.getRange(RANGES.jobsSearchBar);
    searchBarRange.clearContent();
    if(bool){
     if(tuneValue == max){
        tuneRange.setValue(1);
     }else{
       tuneRange.setValue(tuneValue+1);
     }
    }else{
      if(tuneValue != 1){
        tuneRange.setValue(tuneValue-1);
      }else{
        tuneRange.setValue(max);
      }
    }
    getCurrentPositionId();
    loadAllApplicationElementsToJobManager();
  }
  
  // Update Status
  
  function updateStatus(statusUpdate,automatedBool){
    var updateStatusRange = linkedSpreadsheet.getRange(RANGES.updateStatus);
    statusUpdate = statusUpdate || updateStatusRange.getValue();
    if(statusUpdate != ""){
      var statusesTableArr = linkedSpreadsheet.getRange(RANGES.statuses).getValues();
      var statusesObj = Toolkit.getTable(statusesTableArr,"Status",true);
      var currentStatusEquivalent = statusesObj[statusUpdate].equivalent;
      var statusUpdateObj = new StatusUpdateObj(statusesObj,currentStatusEquivalent);
      updateParameterInTrackerDBEntry(currentPositionId,"statuses",statusUpdateObj);
      BBSHEETSMANAGER.updateContinousEntriesToDashboardDB(GSHEETS_REFERENCE_OBJ,"jobTracker",currentPositionId,currentStatusEquivalent,Toolkit.timestampCreate(undefined,'MM/dd/YYYY HH:mm:ss'));
      if(!automatedBool){
        BBUI.popoutErrorMessges('Done','Job status has been updated!');
        linkedSpreadsheet.getRange(RANGES.updateStatus).clearContent();
      }
    }else{
      if(!automatedBool){
        BBUI.popoutErrorMessges('Error',"Please select a new status first!");
      }
    }
  }
  
  function StatusUpdateObj(statusesObj,currentStatusEquivalent){
    var self = this;
    Object.keys(statusesObj).forEach(function(status){
      var statusEquivalent = statusesObj[status].equivalent;
      if(currentStatusEquivalent == statusEquivalent){
        self[statusEquivalent] = Toolkit.timestampCreate(undefined,'dd.MM.YYYY HH:mm:ss');
      }else{
        self[statusEquivalent] = null;
      }
    })
  }
  
  // Manage Job Manager
  
  function loadAllApplicationElementsToJobManager(){
    var allVariables = getVariables(currentPositionId);
    loadToJobManagerComposer(allVariables);
    loadEmailsToJobManager(allVariables);
    loadDocumentsToJobManager(allVariables);
  }
  
  function getVariables(currentPositionId){
    var jobsVariablesObj = getJobsVariablesObj();
    var currentJobVariablesObj = jobsVariablesObj[currentPositionId];
    var fullVariablesObj = Object.assign(currentJobVariablesObj,userObj);
    return fullVariablesObj;
  }
  
  function loadEmailsToJobManager(allVariables){
    BBEMAILHANDLER.populateJobManagerEmailer(GSHEETS_REFERENCE_OBJ,allVariables,ALL_FILE_IDS.templates);
  }
  
  function loadDocumentsToJobManager(allVariables){
    var documentSetupObj = getDocumentsSetupObject();
    populateJobManagerDocsSection(allVariables.specialty,documentSetupObj);
  }
  
  function loadToJobManagerComposer(allVariables){
    BBCLHANDLER.populateJobManagerComposer(GSHEETS_REFERENCE_OBJ,allVariables,ALL_FILE_IDS.templates);
  }
  
  function populateJobManagerDocsSection(speciality,documentSetupObj){
    var jobManagerDocumentsRange = linkedSpreadsheet.getRange(RANGES.documentsTable);
    var jobManagerDocumentsValues = jobManagerDocumentsRange.getValues();
    var documentsSequence = jobManagerDocumentsValues.map(row => row[0]).slice(1).filter(row => row[0] != "" && row.length != 0);
    var startRow = jobManagerDocumentsRange.getRow();
    var startCol = jobManagerDocumentsRange.getColumn();
    var documentBySpeciality = documentSetupObj[speciality];
    documentsSequence.forEach(function(document,i){
      if(document == "CV"){
        linkedSpreadsheet.getSheetByName(SHEETS.jobManager.sheetName).getRange(startRow + 1,startCol + 1).setValue(documentBySpeciality.CV);
      }else{
        if(documentBySpeciality[document] == 'YES'){
          linkedSpreadsheet.getSheetByName(SHEETS.jobManager.sheetName).getRange(startRow + i + 1, startCol + 1).setValue(true);
        }else{
          linkedSpreadsheet.getSheetByName(SHEETS.jobManager.sheetName).getRange(startRow + i + 1, startCol + 1).setValue(false);
        }
      }
    })
  }
  
  function clearAllApplicationElements(){
    linkedSpreadsheet.getRange(RANGES.CLFinalReviewBody).clearContent();
    linkedSpreadsheet.getRange(RANGES.CLFinalReviewReceiver).clearContent();
    linkedSpreadsheet.getRange(RANGES.CLFinalReviewSender).clearContent();
    linkedSpreadsheet.getRange(RANGES.CLFinalReviewSubject).clearContent();
    linkedSpreadsheet.getRange(RANGES.jobManagerEmailSubject).clearContent();
    linkedSpreadsheet.getRange(RANGES.jobManagerEmailBody).clearContent();
    clearJobManagerDocsSection();
  }
  
  function clearJobManagerDocsSection(){
    var jobManagerDocumentsRange = linkedSpreadsheet.getRange(RANGES.documentsTable);
    var jobManagerDocumentsValues = jobManagerDocumentsRange.getValues();
    var documentsSequence = jobManagerDocumentsValues.map(row => row[0]).slice(1).filter(row => row[0] != "" && row.length != 0);
    var startRow = jobManagerDocumentsRange.getRow();
    var startCol = jobManagerDocumentsRange.getColumn();
    documentsSequence.forEach(function(document,i){
      if(document == "CV"){
        linkedSpreadsheet.getSheetByName(SHEETS.jobManager.sheetName).getRange(startRow + 1,startCol + 1).clearContent();
      }else{
        linkedSpreadsheet.getSheetByName(SHEETS.jobManager.sheetName).getRange(startRow + i + 1, startCol + 1).setValue(false);
      }
    })
  }
  
  function produceCoverLetterFromManager(){
    positionsDBObj =  Toolkit.readFromJSON(ALL_FILE_IDS.positionsDB);
    formCoverLetter(undefined,true);
    Toolkit.writeToJSON(positionsDBObj,ALL_FILE_IDS.positionsDB);
  }
  
  // Variables
  
  function getJobsVariablesObj(){
    var trackerSheetObj = readSheet(SHEETS.jobTracker,'positionId');
    var jobsIndexed = trackerSheetObj.indexedValues;
    var companiesSheetObj = readSheet(SHEETS.companiesDB,'companyId');
    var companiesIndexed = companiesSheetObj.indexedValues;
    var allIdsVariablesObj = addCompanyInfoToPositions(jobsIndexed,companiesIndexed);
    Object.keys(allIdsVariablesObj).forEach(function(id){
      augementToVariablesObj(allIdsVariablesObj[id]);
    })
    return allIdsVariablesObj
  }
  
  function readSheet(sheetOptions,indexedBy){
    sheetOptions.startCol = linkedSpreadsheet.getRange(sheetOptions.dataWriteStartColName).getColumn();
    var sheetObj = Toolkit.readSheet(sheetOptions);
    if(indexedBy){
      sheetObj.indexedValues = Toolkit.indexObjArrBy(sheetObj.objectifiedValues.entriesDataObjArr,indexedBy);
    }
    return sheetObj;
  }
  
  function addCompanyInfoToPositions(jobsIndexed,companiesIndexed){
    var variablesObj = {};
    Object.keys(jobsIndexed).forEach(function(positionId){
      //            if(positionId != "" && positionId == currentPositionId){ //Only current
      if(positionId != ""){
        var jobObj = jobsIndexed[positionId];
        var companyObj = companiesIndexed[jobObj.companyId];
        variablesObj[positionId] = Object.assign(companyObj,jobObj);
      }
    })
    return variablesObj;
  }
  
  function augementToVariablesObj(variablesObj){
    variablesObj.todayTimestamp = Toolkit.timestampCreate(undefined,'dd.MM.YYYY HH:mm:ss');
    variablesObj.todayDate = Toolkit.timestampCreate(undefined,'d MMMM, YYYY');
    var language = variablesObj.applicationLanguage == "English"? "EN" : "DE";
    if(language == "DE"){
      variablesObj.country = variablesObj.country == "Germany"? "Deutschland" : variablesObj.country;
    }
    addGreetings(variablesObj,language,["contactPersonA","contactPersonB"])
    setEmails(variablesObj,["contactPersonA","contactPersonB"])
  }
  
  function addGreetings(variablesObj,language,personArray){
    personArray.forEach(function(person){
      variablesObj[person + "Greeting"] = "Dear ";
      if(language == "DE"){
        variablesObj[person + "Greeting"] = variablesObj[person + "Title"] = "Mr."?  "Sehr geeherter " : "Sehr geeherte ";
        variablesObj[person + "Title"] = variablesObj[person + "Title"] == "Mr."? "Herr" : "Frau";
      }
      if(variablesObj[person + "Title"] != ""){
        variablesObj[person + "FirstName"] = variablesObj[person + "Name"].split(" ")[0].replace(".","");
        variablesObj[person + "LastName"] = variablesObj[person + "Name"].split(" ")[1].replace(".","");
        var greetingName = variablesObj[person + "LastName"];
        if(variablesObj[person + "LastName"] == "" || variablesObj[person + "LastName"].length == 1){
          greetingName = variablesObj[person + "FirstName"];
        }
        variablesObj[person + "Greeting"] = variablesObj[person + "Greeting"] + variablesObj[person + "Title"] + " " + greetingName + ",";
      }else{
        variablesObj[person + "Greeting"] = language == "EN"? variablesObj[person + "Greeting"] + "Hiring Manager,": variablesObj[person + "Greeting"] + "Damen und Herren," 
      }
    })  
  }
  
  function setEmails(variablesObj,personArray){
    var populateEmails = getAssumedEmails(variablesObj);
    personArray.forEach(function(person,i,array){
      if(variablesObj[person + "Email"] == ""){
        variablesObj[person + "Email"] = variablesObj.companyEmail + "," + populateEmails;
      }else{
        var otherPerson = array[i + 1]? array[i + 1] : array[i - 1];
        variablesObj[person + "CC"] = variablesObj.companyEmail + "," + variablesObj[otherPerson + "Email"] + "," + populateEmails;
        if(variablesObj.companyEmail == ""){
          variablesObj[person + "CC"] = variablesObj[otherPerson + "Email"];
        }
      }
    })  
  }
  
  function getAssumedEmails(variablesObj){
    var splitWebsite = variablesObj.website.split(".");
    var ext = splitWebsite[splitWebsite.length - 1].replace("/","");
    var domain = splitWebsite[splitWebsite.length - 2].replace("http://","").replace("https://","");
    var names = ['karriere','jobs','bewerbung'];
    var emailsArr =  names.map(function(name){
      return name + '@' + domain + '.' + ext
    })
    var emails = emailsArr.join(',');
    return emails;
  }
  
  // Setup To DB;
  
  function getDocumentsSetupObject(){
    var documentSetupTableArr = linkedSpreadsheet.getRange(RANGES.documentsSetup).getValues();
    var documentSetupObj = Toolkit.getTable(documentSetupTableArr,"Categories",true);
    return documentSetupObj;
  }
  
  function getFilesObj(){
    var filesTableArr = linkedSpreadsheet.getRange(RANGES.filenames).getValues();
    var filesObj = Toolkit.getTable(filesTableArr,"Name",false)
    return filesObj;
  }
  
  function getHeadings(){
    var receiverArr = linkedSpreadsheet.getRange(RANGES.headingReceiver).getValues();
    var senderArr = linkedSpreadsheet.getRange(RANGES.headingSender).getValues();
    var headingsArrays = [senderArr,receiverArr];
    var headingsArr = [];
    var headingsObj = {};
    headingsArrays.forEach(function(array){
      var rowString = '';
      array.forEach(function(row){
        if(row[0] != "" && row[0] != null){
          rowString +=  "{{ " + row[0] + " }} " 
        }
        if(row[1] != "" && row[1] != null){
          rowString +=  "{{ " + row[1] + " }}" 
        }
        rowString = rowString.trim();
        if(row[0] != "" || row[1] != ""){
          rowString += "\n";
        }
      })
      headingsArr.push(rowString);
    })
    headingsObj.sender = headingsArr[0];
    headingsObj.receiver = headingsArr[1];
    return headingsObj;
  }
  
  // Send Application
  
  function sendManualApplication(){
    positionsDBObj = Toolkit.readFromJSON(ALL_FILE_IDS.positionsDB);
    sendApplication(currentPositionId,true)
    Toolkit.writeToJSON(positionsDBObj,ALL_FILE_IDS.positionsDB);
  }
  
  function sendAutoApplication(){
    sendApplication(currentPositionId,false)
  }
  
  function sendApplication(currentPositionId,manualBool){
    var variables = getVariables(currentPositionId);
    var coverLetterFileObj
    if(variables.latestCoverLetterName != ""){
      var newCoverLetterBool = BBUI.yesNoMessage("Cover Letter Already Exists","The application already has a cover letter, do you want to create a new one?");
      if(newCoverLetterBool){
        coverLetterFileObj = formCoverLetter(variables,manualBool);
      }else{
        coverLetterFileObj = {
          latestCoverLetterName: variables.latestCoverLetterName,
          latestCoverLetterDocURL: variables.latestCoverLetterDocURL,
          latestCoverLetterPDFURL: variables.latestCoverLetterPDFURL
        }
      }
    }else{
      coverLetterFileObj = formCoverLetter(variables,manualBool);
    }
    if(variables.applicationThrough == "Website"){
      var emailBool = BBUI.yesNoMessage("Email Application","The application is supposed to be through website, do you want to send it also via Email?");
    }
    if(variables.applicationThrough == "Email" || emailBool){
      var response = BBEMAILHANDLER.init(ALL_FILE_IDS,GSHEETS_REFERENCE_OBJ,variables,coverLetterFileObj,manualBool);
      if(!response){
        updateStatus("Contacted",manualBool);
      }else{
        BBUI.popoutErrorMessges("Error While Sending Email",response);
        console.log(response)
      }
    }else{
      updateStatus("Contacted",manualBool);
    }
  }
  
  // Update DB
  
  function updateParameterInTrackerDBEntry(id,param,obj){
    var fileId = ALL_FILE_IDS.positionsDB;
    var dbObj = positionsDBObj || Toolkit.readFromJSON(fileId);
    if(Array.isArray(dbObj.data[id][param])){
      dbObj.data[id][param].push(obj)
    }else{
      dbObj.data[id][param] = obj;
    }
    Toolkit.writeToJSON(dbObj,fileId);
  }
  
  function updateParameterInCompanyDBEntry(id,param,obj){
    var fileId = ALL_FILE_IDS.companiesDB;
    var dbObj = companyDBObj || Toolkit.readFromJSON(fileId);
    if(Array.isArray(dbObj.data[id][param])){
      dbObj.data[id][param].push(obj)
    }else{
      dbObj.data[id][param] = obj;
    }
    Toolkit.writeToJSON(dbObj,fileId);
  }
  
//  function updateOneEntryDashboardDB(sheetLabel,currentId,head,value){
//    var sheetOptions = SHEETS[sheetLabel];
//    var sheet = linkedSpreadsheet.getSheetByName(sheetOptions.sheetName);
//    var header = sheet.getRange(sheetOptions.headerRow,1,1,sheet.getLastColumn()).getValues()[0];
//    var writeCol = header.indexOf(head) + 1;
//    var idsCol = header.indexOf(sheetOptions.idColumn) + 1;
//    var idsColValues = getColumn(sheet,sheetOptions.headerRow,idsCol,sheet.getLastRow(),1);
//    var writeRow = idsColValues.indexOf(currentId) + sheetOptions.headerRow;
//    sheet.getRange(writeRow,writeCol).setValue(value);
//  }
//  
//  function getColumn(sheet,row,col,rowRange,colRange){
//    return sheet.getRange(row,col,rowRange,colRange).getValues().map(row => row[0]).filter(entry => entry != "");
//  }
//  
  
  BBMAIN.loadAllApplicationElementsToJobManager = loadAllApplicationElementsToJobManager;
  BBMAIN.setCategoriesInForm = setCategoriesInForm;
  BBMAIN.saveLoadCL = saveLoadCL;
  BBMAIN.tune = tune;
  BBMAIN.saveAlltoDBFile = saveAlltoDBFile;
  BBMAIN.updateStatus = updateStatus;
  BBMAIN.sendApplication = sendApplication;
  BBMAIN.clearAllApplicationElements = clearAllApplicationElements;
  BBMAIN.produceCoverLetterFromManager = produceCoverLetterFromManager;
  BBMAIN.sendManualApplication = sendManualApplication;
  
  return BBMAIN
})

function updateCategories(){
  BBMAIN.setCategoriesInForm();
}

function saveCL(){
  BBMAIN.saveLoadCL(true);
}

function loadCL(){
  BBMAIN.saveLoadCL(false);
}

function nextJob(){
  BBMAIN.tune(true)
}

function previousJob(){
  BBMAIN.tune(false)
}

function loadAllApplicationElementsToJobManager(){
  BBMAIN.loadAllApplicationElementsToJobManager();
}

function clearAllApplicationElements(){
  BBMAIN.clearAllApplicationElements();
}

function saveAlltoDBFile(){
  BBMAIN.saveAlltoDBFile();
}

function updateStatus(){
  BBMAIN.updateStatus();
}

function produceCoverLetterFromManager(){
  BBMAIN.produceCoverLetterFromManager();
}

function sendApplicationFromManager(){
  BBMAIN.sendManualApplication();
}