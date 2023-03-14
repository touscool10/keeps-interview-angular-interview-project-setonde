import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { CalendarService } from '../calendar/calendar.service';
import { CreateEventComponent } from '../event/create-event.component';
import { EventService } from '../event/event.service';
import { Events } from '../event/interfaces';
import { Day, Month, MonthDays } from './interfaces';

@Component({
  selector: 'app-month',
  templateUrl: './month.component.html',
  styleUrls: ['./month.component.scss']
})
export class MonthComponent implements OnInit {

  public allEvents: Events[] = [];
  public selectedMonth!: number;
  public selectedYear!: number;

  public days: Day[] = [
    { name: 'Sunday',     id: 0, abbreviation: 'Sun' },
    { name: 'Monday',     id: 1, abbreviation: 'Mon' },
    { name: 'Tuesday',    id: 2, abbreviation: 'Tue' },
    { name: 'Wednesday',  id: 3, abbreviation: 'Wed' },
    { name: 'Thursday',   id: 4, abbreviation: 'Thu' },
    { name: 'Friday',     id: 5, abbreviation: 'Fri' },
    { name: 'Saturday',   id: 6, abbreviation: 'Sat' }
  ]


  public years: number[] = [];
  public dateIsToday: boolean = false;
  public selectedDate: number = 1;
  public totalMonthDays: number = 0;
  public firstDayOfMonth: number = 0;
  public monthDaysArray: MonthDays[] = [];
  public monthWeeksGroups: any[] = [];

  public emptyDays: number = 0;

  constructor(
    private calendarService: CalendarService,
    private dialog: MatDialog,
  ) {

  }


  ngOnInit(): void {

    this.calendarService
          .getUpdateSubject()
          .subscribe(eventsArray => {
            this.refreshAllEvents(eventsArray);
            this.init();
          });

  }

  init() {

      this.calendarService.getMonthOrYearChange()
      .subscribe(result => {
        this.refreshYearAndMonth(result);
        this.getTotalMonthDays();
        this.getfirstDayOfMonth();
        this.generateMonthDays();
      });
  }


  getTotalMonthDays(){
    this.totalMonthDays = new Date( this.selectedYear, this.selectedMonth + 1 , 0 ).getDate();
  }

  getfirstDayOfMonth(){
    this.firstDayOfMonth = new Date( this.selectedYear, this.selectedMonth, 1 ).getDay();
  }

  generateMonthDays(){
    this.monthDaysArray = [];
    const firstDay: number = 1;
    const lastDay: number = this.totalMonthDays;

    for (let i = firstDay; i <= lastDay; i++) {
      let day: MonthDays = {
        date: i,
        month: this.selectedMonth,
        year: this.selectedYear,
        events: this.getDaysEvents(i, this.selectedMonth, this.selectedYear)
      }
      this.monthDaysArray.push(day);
    }
    this.computeEmptyDays(this.selectedMonth, this.selectedYear);
    this.populateMonth();

    console.log('this.monthDaysArray: ', this.monthDaysArray);

  }

  private computeEmptyDays(month: number, year: number){
    let monthFirstDay = new Date(year, month, 1).getDay();
    this.emptyDays =  monthFirstDay;
  }

  populateMonth(){
    let monthWeeks: MonthDays[] = [];
    for(let i = 0; i < this.emptyDays; i++){
      monthWeeks.push(
        {
          date: null,
          month: this.selectedMonth,
          year: this.selectedYear,
          events: []
        }
      );
    }

    this.monthDaysArray = [...monthWeeks, ...this.monthDaysArray];

  }

  getSelectedYear(year: number){
    this.selectedYear = year;
    this.getSelectedMonth(this.selectedMonth);
  }

  getSelectedMonth(month: number){
    this.selectedMonth = month;
    this.getTotalMonthDays();
    this.getfirstDayOfMonth();
    this.generateMonthDays();
  }

  isToday(date: MonthDays){
    this.dateIsToday = false;

    let today = new Date();
    let todayDate = today.getDate();
    let todayMonth =  today.getMonth();
    let todayYear =  today.getFullYear();

    if(date.date === todayDate && date.month === todayMonth && date.year === todayYear){
      this.dateIsToday = true;
    }

    return this.dateIsToday;

  };

  /*
  getSelectedTabInfos(event: MatTabChangeEvent){

    let monthName: string  = event.tab.textLabel;
    let selectedMonth: Month | number | undefined  = this.months.find(m => m.name === monthName);
    selectedMonth = selectedMonth ? selectedMonth.id : 0;
    this.getSelectedMonth(selectedMonth);

  }*/


  getDaysEvents(date: number, month: number, year: number){

    let events: Events[] = [];

    console.log("this.allEvents : ", this.allEvents);

      if(this.allEvents.length > 0){
        this.allEvents.forEach((event) => {
          if(event.day === date && event.month === month  && event.year === year ){
            events.push(event);
          }
        });
      }

      return this.orderEvents(events);

  }

  private orderEvents(events: Events[]){
    let eventsAux: Events[] = [];


    events.forEach((event) => {
      let hourFormated = this.formatEventHour(event);
      event.hourFormated = hourFormated;
      eventsAux.push(event);
    });

    console.log("eventsAux : ", eventsAux);


    eventsAux.sort(function(a, b){
      return (a.hourFormated as number) - (b.hourFormated as number)
    });

    return eventsAux;

  }

  private formatEventHour(event: Events){

    let hour:any = event.hour.split(':');
    hour = hour[0] + hour[1];
    hour = parseInt(hour);

    console.log("hour : ", hour);

    return hour;
  }

  refreshYearAndMonth(value : { selectedMonth: number, selectedYear: number, selectedMonthName?: string }){
    this.selectedMonth = value.selectedMonth;
    this.selectedYear = value.selectedYear;
  }

  refreshAllEvents(value : Events[]){
    this.allEvents = value;
    console.log('ENTREI refreshAllEvents :', [this.allEvents, this.selectedMonth, this.selectedYear]);
  }

  openEditEventDialog(eventId: number | undefined) {

    const config = new MatDialogConfig();

    config.disableClose = true;
    config.autoFocus = true;
    config.panelClass = "modal-panel";

    config.data =  { allEvents: this.allEvents, editMode: true, eventId: eventId };

    const dialogRef = this.dialog.open(CreateEventComponent, config);

    dialogRef.afterClosed().subscribe(result => {

        if (result) {
          this.allEvents = result;
        }
    });
  }



}