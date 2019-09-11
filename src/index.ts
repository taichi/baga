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
  const threads = GmailApp.search(`subject:(ご予約いただいているレッスン・セミナーのご連絡) -label:${label.getName()}`);
  if (!threads) {
    Logger.log("No reservation");
    Logger.log("END   search");
    return;
  }
  for (const thd of threads) {
    for (const msg of thd.getMessages()) {
      const body = msg.getPlainBody();
      const reg = /時間：(\d{4}\/\d{1,2}\/\d{1,2}) (\d{1,2}:\d{1,2})-(\d{1,2}:\d{1,2})/;
      const result = reg.exec(body);

      const locreg = /場所：(.*)LS/;
      const locres = locreg.exec(body);
      if (result && locres) {
        const from = moment(`${result[1]} ${result[2]}`, "YYYY/MM/DD hh:mm").toDate();
        const to = moment(`${result[1]} ${result[3]}`, "YYYY/MM/DD hh:mm").toDate();
        const location = locres[1];
        handler(location, from, to);
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

// tslint:disable-next-line: no-unsafe-any
global.main = main;
