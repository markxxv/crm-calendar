// Calendar demo state and interactions.
// All event rendering is handled by Alpine.js; the page contains no HTML string templates.
function calendarApp() {
  const pad = (value) => String(value).padStart(2, "0");
  const toKey = (date) =>
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
  const fromKey = (key) => {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  };
  const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);
  const initialDate = new Date();

  const eventTypes = [
    { id: "all", label: "Все" },
    { id: "viewing", label: "Показы" },
    { id: "call", label: "Звонки" },
    { id: "docs", label: "Документы" },
    { id: "meeting", label: "Встречи" },
    { id: "reminder", label: "Напоминания" },
  ];

  const typeNames = {
    viewing: "Просмотр недвижимости",
    call: "Звонок",
    docs: "Документы",
    meeting: "Встреча",
    reminder: "Напоминание",
  };

  return {
    today: toKey(initialDate),
    currentMonth: new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    selectedDate: null,
    filter: "all",
    search: "",
    eventTypes,
    typeNames,
    events: [],
    nextId: 1,
    modalOpen: false,
    toastMessage: "",
    toastHandle: null,
    form: {
      title: "",
      type: "viewing",
      date: toKey(initialDate),
      time: "",
      related: "",
    },

    init() {
      this.generateDemoEvents();
    },

    get monthTitle() {
      return titleCase(
        new Intl.DateTimeFormat("ru-RU", {
          month: "long",
          year: "numeric",
        }).format(this.currentMonth),
      );
    },

    get todayLabel() {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
      }).format(fromKey(this.today));
    },

    get todayWeekday() {
      return titleCase(
        new Intl.DateTimeFormat("ru-RU", {
          weekday: "long",
        }).format(fromKey(this.today)),
      );
    },

    get visibleEvents() {
      const query = this.search.trim().toLocaleLowerCase("ru-RU");

      return this.events.filter((event) => {
        const typeMatches = this.filter === "all" || event.type === this.filter;
        const text = [event.title, event.related, typeNames[event.type]]
          .join(" ")
          .toLocaleLowerCase("ru-RU");

        return typeMatches && (!query || text.includes(query));
      });
    },

    get monthEvents() {
      const prefix = toKey(this.currentMonth).slice(0, 7);
      return this.visibleEvents.filter((event) => event.date.startsWith(prefix));
    },

    get busyDays() {
      const counts = {};

      this.monthEvents.forEach((event) => {
        counts[event.date] = (counts[event.date] || 0) + 1;
      });

      return Object.values(counts).filter((count) => count >= 6).length;
    },

    get attentionCount() {
      return this.monthEvents.filter((event) => event.attention && !event.done).length;
    },

    get calendarDays() {
      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth();
      const weekday = (new Date(year, month, 1).getDay() + 6) % 7;
      const totalDays = new Date(year, month + 1, 0).getDate();
      const cells = Math.ceil((weekday + totalDays) / 7) * 7;

      return Array.from({ length: cells }, (_, index) => {
        const date = new Date(year, month, index - weekday + 1, 12);
        return {
          key: toKey(date),
          day: date.getDate(),
          outside: date.getMonth() !== month,
        };
      });
    },

    get hours() {
      const occupied = this.timedToday.map((event) => Number(event.time.slice(0, 2)));
      const earliest = Math.min(8, ...occupied);
      const latest = Math.max(20, ...occupied);

      return Array.from({ length: latest - earliest + 1 }, (_, index) => earliest + index);
    },

    get todayEvents() {
      return this.eventsFor(this.today);
    },

    get untimedToday() {
      return this.todayEvents.filter((event) => !event.time);
    },

    get timedToday() {
      return this.todayEvents.filter((event) => event.time);
    },

    get todayAttention() {
      return this.todayEvents.filter((event) => event.attention && !event.done).length;
    },

    get selectedEvents() {
      return this.selectedDate ? this.eventsFor(this.selectedDate) : [];
    },

    get selectedTimed() {
      return this.selectedEvents.filter((event) => event.time);
    },

    get selectedUntimed() {
      return this.selectedEvents.filter((event) => !event.time);
    },

    eventsFor(date) {
      return this.visibleEvents
        .filter((event) => event.date === date)
        .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
    },

    eventsAtHour(hour) {
      return this.timedToday.filter((event) => Number(event.time.slice(0, 2)) === hour);
    },

    formatDate(date) {
      return titleCase(
        new Intl.DateTimeFormat("ru-RU", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(fromKey(date)),
      );
    },

    labelFor(event) {
      return event.related || typeNames[event.type];
    },

    dayLoad(date) {
      return Math.min(100, (this.eventsFor(date).length / 9) * 100);
    },

    changeMonth(offset) {
      this.currentMonth = new Date(
        this.currentMonth.getFullYear(),
        this.currentMonth.getMonth() + offset,
        1,
      );
      this.selectedDate = null;
    },

    goToday() {
      const date = fromKey(this.today);
      this.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      this.selectedDate = null;
    },

    openDay(date) {
      this.selectedDate = date;
    },

    openCreate(date = this.today) {
      this.form = {
        title: "",
        type: "viewing",
        date,
        time: "",
        related: "",
      };
      this.modalOpen = true;
      this.$nextTick(() => this.$refs.eventTitle.focus());
    },

    createEvent() {
      const title = this.form.title.trim();

      if (!title || !this.form.date) return;

      this.addEvent({
        ...this.form,
        title,
        related: this.form.related.trim(),
      });

      const date = fromKey(this.form.date);
      this.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      this.modalOpen = false;
      this.notify("Событие добавлено в календарь");
    },

    toggleComplete(id) {
      const event = this.events.find((item) => item.id === id);
      if (event) event.done = !event.done;
    },

    addEvent({
      date,
      type,
      title,
      time = "",
      related = "",
      attention = false,
      done = false,
    }) {
      this.events.push({
        id: this.nextId++,
        date,
        type,
        title,
        time,
        related,
        attention,
        done,
      });
    },

    notify(message) {
      this.toastMessage = message;
      clearTimeout(this.toastHandle);
      this.toastHandle = setTimeout(() => {
        this.toastMessage = "";
      }, 2500);
    },

    generateDemoEvents() {
      const homes = [
        "Villa Sol, Marbella",
        "Penthouse Centro",
        "Вилла Cabo Roig",
        "Квартира у моря",
        "Residencial Marina",
        "Casa Blanca",
        "Таунхаус Park",
        "Апартаменты Azur",
        "Вилла Vista",
        "Квартира Plaza",
      ];
      const people = [
        "Александр",
        "Мария",
        "Николай",
        "Ольга",
        "София",
        "Даниэль",
        "Анастасия",
        "Михаил",
      ];
      const templates = {
        viewing: ["Показ · ", "Повторный просмотр · ", "Осмотр · "],
        call: ["Позвонить клиенту · ", "Обсудить предложение · ", "Уточнить решение · "],
        docs: ["Отправить документы · ", "Проверить договор · ", "Подготовить выписку · "],
        meeting: ["Встреча с собственником · ", "Встреча в офисе · ", "Подписание · "],
        reminder: ["Напомнить об оплате · ", "Подтвердить время · ", "Проверить ответ · "],
      };
      const kinds = ["viewing", "call", "docs", "meeting", "reminder"];
      const anchor = fromKey(this.today);

      // Seed neighboring months too, so month navigation remains useful.
      for (let offset = -2; offset <= 2; offset++) {
        const year = anchor.getFullYear();
        const month = anchor.getMonth() + offset;
        const countDays = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= countDays; day++) {
          const date = toKey(new Date(year, month, day, 12));
          if (date === this.today) continue;

          let count = day % 7 === 0 ? 1 : 2 + ((day * 7 + 3) % 5);
          if ([6, 12, 19, 20, 23, 28].includes(day)) count += 4;

          for (let index = 0; index < count; index++) {
            const type = kinds[(day * 3 + index * 2) % kinds.length];
            const related =
              type === "call" || type === "reminder"
                ? people[(day + index) % people.length]
                : homes[(day + index * 3) % homes.length];
            const time =
              index % 5 === 0
                ? ""
                : pad(9 + ((index * 3 + day) % 10)) +
                  ":" +
                  ["00", "15", "30", "45"][(index + day) % 4];

            this.addEvent({
              date,
              type,
              title: templates[type][(day + index) % 3] + related,
              time,
              related,
              attention: [15, 16, 20].includes(day) && index === 0,
            });
          }
        }
      }

      [
        ["docs", "Отправить документы по Villa Marina", "", "Villa Marina · Виктория", true],
        ["reminder", "Уточнить статус ипотечного решения", "", "Клиент Андрей"],
        ["call", "Позвонить Марии Петровой", "09:30", "Квартира в Alicante"],
        ["viewing", "Показ · Вилла Cabo Roig", "10:00", "Клиент София"],
        ["meeting", "Встреча с собственником", "11:30", "Условия продажи"],
        ["docs", "Согласовать договор", "13:00", "Casa Blanca · Юрист"],
        ["call", "Обратный звонок · Даниэль", "14:15", "Апартаменты Azur"],
        ["viewing", "Повторный просмотр · Penthouse", "15:00", "Клиент Николай"],
        ["reminder", "Подтвердить встречу на понедельник", "17:00", "Риелтор Ольга"],
      ].forEach(([type, title, time, related, attention = false]) => {
        this.addEvent({
          date: this.today,
          type,
          title,
          time,
          related,
          attention,
        });
      });
    },
  };
}

document.addEventListener("alpine:init", () => {
  Alpine.data("calendarApp", calendarApp);
});
