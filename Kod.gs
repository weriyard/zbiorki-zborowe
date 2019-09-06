var source = SpreadsheetApp.getActiveSpreadsheet();

function CircurarList(values) {
  if (values)
    this.values = values;
  else
    this.values = [];
  this.index = -1;
}

CircurarList.prototype.next = function () {
    this.index++;
    if (this.index >= this.values.length)
        this.index = 0;
    return this.values[this.index];
}

CircurarList.prototype.add = function (value) {
    this.values.push(value);
}

Object.defineProperty(CircurarList.prototype, 'length', {
     get: function(){ return this.values.length}
})


Object.defineProperty(CircurarList.prototype, 'index_pos', {
     get: function(){ return this.index}
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
        actual_owners = owners.slice(i + 1)
        actual_owners = actual_owners.concat(owners.slice(0,i + 1))
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
  var owners = get_meetigns_owners()
  Logger.log('OWNERS: ' + owners)
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
      owners_by_time2.add({'name': owners[i][0],'time_from': new Date(owners[i][1]), 'time_to': new Date(owners[i][2]), 'ptk': 0})
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

  //Logger.log(owners_by_time2)
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
    sheet.clear()
    var dates = []
    var _pre_week_day_number = 0
    
    //Logger.log(get_meetigns_owners())
    var meetings_owners = get_meetigns_owners()
    var owners_by_time = get_owsners_by_meetings_times()
    var last_ptk = 0
    var last_hour_index = []
    for (var day=1; day <= month_days; day++) {
        var week_day_number = new Date(current_year, month, day).getDay()
        var day_name = weekdays[week_day_number]
        // Jeżeli to nie dzien zbiórki pomiń
        if  (! meetings_days.hasOwnProperty(day_name)) 
          continue
            
            // dla danego dnia ustaw pory zbiórek i prowadzących, którym odpowiadają godziny
        var day_hours = meetings_days[day_name]
        var j = 0
        var internal_counter = 0
        var new_owner = owners_by_time.next()
        Logger.log('DAY: ' + day_name + "   " + day)
        
        while (true) {
             if (internal_counter = owners_by_time.length) {
               last_ptk++
               //Logger.log('Podbijam ptk na: ' + last_ptk )
               //Logger.log(owners_by_time.index + 1)
               //Logger.log(owners_by_time.length)
             }
             if (last_ptk > new_owner.ptk)
                last_ptk = new_owner.ptk
             var hour = new Date(day_hours[j])
             
//              Logger.log('HOUR : ' + new Date(hour) )
//              Logger.log('FROM: ' + new Date(new_owner.time_from))
//              Logger.log('TO : ' + new Date(new_owner.time_to))
              Logger.log('polecam USERA: ' + new_owner.name + " USER PTK:  " + new_owner.ptk + "  LAST PTK:  " + last_ptk + " INDEX: " + owners_by_time.index_pos)
              if (hour >= new Date(new_owner.time_from) && hour <= new Date(new_owner.time_to) && new_owner.ptk <= last_ptk) {
                  var hour_stamp = hour.getHours() + "_" + hour.getMinutes()
                  //Logger.log('hour stamp ::: ' +  hour_stamp + " Last hour index: " + last_hour_index.hasOwnProperty(hour_stamp))
                  
                  if (!last_hour_index.hasOwnProperty(hour_stamp)) {
                      var meeting_owner = new_owner.name
                      new_owner.ptk++
                      
                      if (owners_by_time.index_pos + 1 == owners_by_time.length)
                          last_hour_index[hour_stamp] = 0
                      else
                          last_hour_index[hour_stamp] = owners_by_time.index_pos + 1
                      
                      dates.push([(day)  + "a/" + (month + 1) + "/" + current_year, day_name, hour, meeting_owner])
                      //Logger.log('--> last_hour_index: ' + last_hour_index)
                      Logger.log('--> wybieram USERA a: ' + meeting_owner + "   " + new_owner.ptk)
                     j++
                     internal_counter++
                     //hour_assigned =  true
                     break
                 }
                 Logger.log('Wymagam indexu ' +  last_hour_index[hour_stamp] + " dla godziny " + hour.getHours())
                 if (last_hour_index.hasOwnProperty(hour_stamp) && last_hour_index[hour_stamp] == owners_by_time.index_pos) {
                      var meeting_owner = new_owner.name
                      new_owner.ptk++
                      if (owners_by_time.index_pos + 1 == owners_by_time.length)
                          last_hour_index[hour_stamp] = 0
                      else
                          last_hour_index[hour_stamp] = owners_by_time.index_pos + 1
                      //Logger.log('--> last_hour_index: ' + last_hour_index)
                      Logger.log('--> wybieram USERA b: ' + meeting_owner + "   " + new_owner.ptk)
                      dates.push([(day)  + "b/" + (month + 1) + "/" + current_year, day_name, hour, meeting_owner])
                      j++
                      internal_counter++
                      //hour_assigned = true
                  }
                Logger.log('Licznik godziny : ' + j )
                if (j == day_hours.length)
                    break
             }
             
             new_owner = owners_by_time.next()
              //internal_counter++
              //Logger.log('LEN: ' + owners_by_time.length)
              //Logger.log('Last ptk: ' + last_ptk)
        }
        if (day == 22) 
            break
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


