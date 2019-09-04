var source = SpreadsheetApp.getActiveSpreadsheet();

function CircurarList(values) {
  if (values)
    this.values = values;
  else
    this.values = [];
  this.index = 0;
}

CircurarList.prototype.next = function () {
    this.index++;
    if (this.index >= this.values.length)
        this.index = 0;
    return this.values[index];
}

CircurarList.prototype.add = function (value) {
    this.values.push(value);
}

Object.defineProperty(CircurarList.prototype, 'length', {
     get: function(){ return this.values.length}
})


String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Zbiórki')
  .addItem('Dodaj nowy miesiąc', 'generate_new_month')
  .addToUi();
}

function new_month_tab(){
    var new_sheet = source.insertSheet(sheet_name)
    return new_sheet
}

function _get_month_days(year, month){
  return 32 - new Date(year, month, 32).getDate()
}

function get_meetings_days() {
   var meetings_sheet = source.getSheetByName("pory zbiórek")
   var meetings = meetings_sheet.getRange("A2:E5").getValues();
   var meetings_days = {}
   for (var i=0; i < meetings.length; i++) {
      var day_name = (meetings[i][0]).capitalize()
      var day_name_hour = meetings[i][4]
      if (day_name in meetings_days) {
          meetings_days[day_name].push(day_name_hour)
      }
      else {
          meetings_days[day_name] = [day_name_hour]
      }
   }
   
   return meetings_days
}

function get_meetigns_owners() {
  var meetings_sheet = source.getSheetByName("prowadzący")
  var owners = meetings_sheet.getRange("A2:D10").getValues()
  var actual_owners = []
  for (var i=0; i < owners.length; i++) {
      var last_owner = owners[i][3]
      if (last_owner == "x") {
        actual_owners = owners.slice(i)
        actual_owners = actual_owners.concat(owners.slice(0,i))
        break
      }
  }
  
  if (actual_owners.length == 0)
    return owners
  else
    return actual_owners
}

function get_owsners_by_meetings_times() {
  var meetings_times_sheet = source.getSheetByName("pory zbiórek")
  var meetings_times = meetings_times_sheet.getRange("E2:E5").getValues();
  var meetings_sheet = source.getSheetByName("prowadzący")
  var owners = meetings_sheet.getRange("A2:D10").getValues()
  var hours = {}
  for (var i=0; i < meetings_times.length; i++) {
    var time_array = meetings_times[i]
    var time = new Date(time_array)
    if ( ! hours.hasOwnProperty(time)) {
      hours[time] = []
    }
  }
  
  owners_by_time = {}
  owners_by_time2 = new CircurarList()
  for (var i=0; i < owners.length; i++) {
      owners_by_time[owners[i][0]] = {'time_from': new Date(owners[i][1]), 'time_to': new Date(owners[i][2]), 'ptk': 0}
      owners_by_time2.add( {'time_from': new Date(owners[i][1]), 'time_to': new Date(owners[i][2]), 'ptk': 0})
  }

  
  for (keys in hours) {
      hours[keys] = owners.filter(function(el){
//        Logger.log(new Date(keys));
//        Logger.log(new Date(el[1]));
//        Logger.log(new Date(el[2]));
//        Logger.log("-cmp-"); 
//        Logger.log(new Date(keys) >= new Date(el[1]));
//        Logger.log(new Date(keys) <= new Date(el[2]));
//        Logger.log("-----"); 
//        key_date = new Date(keys); 
          return new Date(keys) >= new Date(el[1]) && new Date(keys) <= new Date(el[2])
          })
  }

  Logger.log(owners_by_time)
  //return owners_by_time
  return owners_by_time2
}

function set_last_month_owner () {
  var meetings_sheet = source.getSheetByName("prowadzący")
  var owners = meetings_sheet.getRange("D:D").clear()
}

function generate_new_month() {
    var weekdays = new Array("Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota");
    var current_year = new Date().getFullYear()
    var month = 8
    var month_days = _get_month_days(current_year, month)
    var meetings_days = get_meetings_days()
    var sheet = source.getSheetByName("test")
    var dates = []
    var _pre_week_day_number = 0
    
    //Logger.log(get_meetigns_owners())
    var meetings_owners = get_meetigns_owners()
    var owners_by_time = get_owsners_by_meetings_times()
    for (var day=1; day <= month_days; day++) {
        var week_day_number = new Date(current_year, month, day).getDay()
        var day_name = weekdays[week_day_number]
        // Jeżeli to nie dzien zbiórki pomiń
        if  (! meetings_days.hasOwnProperty(day_name)) 
            continue
            
        // dla danego dnia ustaw pory zbiórek i prowadzących, którym odpowiadają godziny
        var day_hours = meetings_days[day_name]
        for (j=0; j < day_hours.length; j++) {
              var hour = day_hours[j]
              var last_ptk = 0
              var not_found = true
                for (owner in owners_by_time) {
                    if (new Date(hour) >= owners_by_time[owner].time_from && new Date(hour) <= owners_by_time[owner].time_to && owners_by_time[owner].ptk == last_ptk) {
                        var new_owner = owner
                        last_ptk = owners_by_time[owner]
                        owners_by_time[owner].ptk++ 
                        not_found = true
                        break
                    }
                    // zrobic obieg pętli jeszcze raz jak wszyscy mają punktację równą :D
                    
                }
              dates.push([(day)  + "/" + (month + 1) + "/" + current_year, day_name, hour, new_owner])
        }
        if (week_day_number > _pre_week_day_number ) {
            _pre_week_day_number = week_day_number
        } else {
            dates.push(["", "","", ""])
            _pre_week_day_number = -1
        }
    }
    //Logger.log(dates)
    sheet.getRange("A2:D" + (dates.length +1 )).setValues(dates).setNumberFormat("dd/mm/yyyy")
    sheet.getRange("A2:A" + (dates.length +1 )).setHorizontalAlignment("center");
    sheet.getRange("B2:B" + (dates.length +1 )).setHorizontalAlignment("left");
    sheet.getRange("C2:C" + (dates.length +1 )).setNumberFormat("hh:ss").setHorizontalAlignment("center");
}


