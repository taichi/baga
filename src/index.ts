import * as moment from "moment";

// tslint:disable-next-line: no-any
declare var global: any;

function main() {
  const today = moment().format("YYYY/MM/DD");
  Logger.log(`START Baga ${today}`);
  const name = "Gaba";
  const cal = makeCalendar(name);
  const label = makeLabel(name);
  search(label, register.bind({}, cal));
  Logger.log(`END   Baga ${today}`);
}

function makeCalendar(name: string) {
  const cals = CalendarApp.getCalendarsByName(name);
  if (cals && 0 < cals.length) {
    return cals[0];
  }
  return CalendarApp.createCalendar(name);
}

function register(cal: GoogleAppsScript.Calendar.Calendar, studio: string, begin: Date, end: Date) {
  const title = `Gaba (${studio})`;
  const events = cal.getEvents(begin, end);
  if (events && 0 < events.length) {
    for (const e of events) {
      const t = e.getTitle();
      if (title === t) {
        Logger.log(`Lesson is already registered. ${begin} `);
        return;
      }
    }
  }
  cal.createEvent(title, begin, end);
}

function makeLabel(name: string) {
  const label = GmailApp.getUserLabelByName(name);
  if (label) {
    return label;
  }
  return GmailApp.createLabel(name);
}

function search(label: GoogleAppsScript.Gmail.GmailLabel, handler: (studio: string, begin: Date, end: Date) => void) {
  Logger.log("START search");
  const threads = GmailApp.search(`subject:(予約いただいているレッスンのご連絡) -label:${label.getName()}`);
  if (!threads) {
    Logger.log("No reservation");
    Logger.log("END   search");
    return;
  }
  for (const thd of threads) {
    for (const msg of thd.getMessages()) {
      const studio = getStudio(msg);
      const body = msg.getPlainBody();
      const time = /(\d{1,2}:\d{1,2}) - (\d{1,2}:\d{1,2})/g;
      let result = time.exec(body);
      const toDate = (t: string) => moment(`${getDay(body)} ${t}`, "MM/DD hh:mm").toDate();
      while (result) {
        handler(studio, toDate(result[1]), toDate(result[2]));
        result = time.exec(body);
      }
      GmailApp.starMessage(msg);
    }
    label.addToThread(thd);
  }
  Logger.log("END   search");
}

function getStudio(msg: GoogleAppsScript.Gmail.GmailMessage) {
  const fromres = /\((.*)LS\)/.exec(msg.getFrom());
  return fromres ? fromres[1] : "不明";
}

function getDay(body: string) {
  const d = /(\d{1,2})月(\d{1,2})日のレッスンのリマインダーです。/.exec(body);
  if (!d) {
    Logger.log(`${body} is not Gaba message`);
    throw new Error("cannot parse lesson date.");
  }
  return `${d[1]}/${d[2]}`;
}

// tslint:disable-next-line: no-unsafe-any
global.main = main;
