;(function(root,factory){
  root.BBGFORMS = factory()
})(this,function(){
  
  var BBGFORMS = {};
  
  function addEntryToListInForm(formId,entry,questionName){
    var form = FormApp.openById(formId);
    var items = form.getItems();
    for (var i in items) { 
      if(items[i].getTitle() == questionName){
        var listItem = items[i].asListItem();
        var choices = listItem.getChoices();
        choices.push(listItem.createChoice(entry));
        listItem.setChoices(choices)
        break;
      }
    }
  }
  
  function updateListInForm(formId,listOfEntries,questionName){
    var form = FormApp.openById(formId);
    var items = form.getItems();
    for (var i in items) { 
      if(items[i].getTitle() == questionName){
        var listItem = items[i].asListItem();
        var choices = listItem.getChoices();
        listOfEntries.forEach(function(entry){
          if(choices.indexOf(entry) == -1){
            choices.push(listItem.createChoice(entry));
          }
        })
        listItem.setChoices(choices)
        break;
      }
    }
  }
  
  BBGFORMS.addEntryToListInForm = addEntryToListInForm;  
  BBGFORMS.updateListInForm = updateListInForm;  
  
  return BBGFORMS
})
