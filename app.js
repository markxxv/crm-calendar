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

  const statuses = [
    { id: "planned", label: "Запланировано", icon: "calendar" },
    { id: "progress", label: "В работе", icon: "play" },
    { id: "waiting", label: "Ожидание", icon: "clock" },
    { id: "done", label: "Выполнено", icon: "check" },
    { id: "cancelled", label: "Отменено", icon: "x" },
  ];

  const priorities = [
    { id: "low", label: "Низкий", icon: "minus" },
    { id: "normal", label: "Обычный", icon: "flag" },
    { id: "high", label: "Высокий", icon: "flag" },
    { id: "urgent", label: "Срочный", icon: "alert" },
  ];

  // Only the three confirmed agency team members are used in the prototype.
  const staff = [
    {
      id: "roman",
      name: "Román Galyautdinov",
      role: "Founder & Real Estate Expert",
      photo: "https://spain-costas.com/img/team_01.webp",
      email: "roman@spain-costas.com",
      phone: "+34 622 204 413",
      phoneHref: "tel:+34622204413",
    },
    {
      id: "olga",
      name: "Olga Shumakova",
      role: "Residency & Administrative Specialist",
      photo: "https://spain-costas.com/img/team_03.webp",
      email: "info@spain-costas.com",
      phone: "+34 644 23 12 73",
      phoneHref: "tel:+34644231273",
    },
    {
      id: "alina",
      name: "Alina Perlova",
      role: "Business Development & Partnerships Lead",
      photo: "https://spain-costas.com/img/team_02.webp",
      email: "alina@spain-costas.com",
      phone: "+34 694 23 77 36",
      phoneHref: "tel:+34694237736",
    },
  ];

  return {
    today: toKey(initialDate),
    currentMonth: new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    selectedDate: null,
    filter: "all",
    search: "",
    eventTypes,
    typeNames,
    statuses,
    priorities,
    staff,
    events: [],
    nextId: 1,
    detailEventId: null,
    employeePickerOpen: false,
    statusPickerOpen: false,
    priorityPickerOpen: false,
    activeStaffPopover: null,
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
          weekend: date.getDay() === 0 || date.getDay() === 6,
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

    get detailEvent() {
      return this.events.find((event) => event.id === this.detailEventId) || null;
    },

    get detailStaff() {
      if (!this.detailEvent) return [];
      return this.staff.filter((person) => this.detailEvent.staffIds.includes(person.id));
    },

    get unassignedStaff() {
      if (!this.detailEvent) return [];
      return this.staff.filter((person) => !this.detailEvent.staffIds.includes(person.id));
    },

    optionFor(options, id) {
      return options.find((option) => option.id === id) || options[0];
    },

    optionColor(group, id) {
      const valid = group === "status" ? this.statuses : this.priorities;
      const selected = this.optionFor(valid, id);
      return `var(--${group}-${selected.id})`;
    },

    eventsFor(date) {
      return this.visibleEvents
        .filter((event) => event.date === date)
        .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
    },

    // Adjacent-month and weekend cells are deliberately summary-free.
    // Real events stay in the data and remain accessible in the day drawer.
    cellEvents(cell) {
      return cell.outside || cell.weekend ? [] : this.eventsFor(cell.key);
    },

    cellEventCount(cell) {
      return this.cellEvents(cell).length;
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
      const selected = fromKey(date);

      // Clicking an adjacent month's day switches the visible month first.
      if (
        selected.getFullYear() !== this.currentMonth.getFullYear() ||
        selected.getMonth() !== this.currentMonth.getMonth()
      ) {
        this.currentMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
      }

      this.selectedDate = date;
    },

    openEvent(id) {
      if (!this.events.some((event) => event.id === id)) return;

      this.detailEventId = id;
      this.closeDetailMenus();
    },

    closeDetailMenus() {
      this.employeePickerOpen = false;
      this.statusPickerOpen = false;
      this.priorityPickerOpen = false;
      this.activeStaffPopover = null;
    },

    closeEvent() {
      this.detailEventId = null;
      this.closeDetailMenus();
    },

    toggleDetailMenu(menu) {
      const isOpen = Boolean(this[menu]);
      this.closeDetailMenus();
      this[menu] = !isOpen;
    },

    setStatus(id) {
      const event = this.detailEvent;
      if (!event || !this.statuses.some((status) => status.id === id)) return;
      event.status = id;
      event.done = id === "done";
      this.statusPickerOpen = false;
    },

    setPriority(id) {
      const event = this.detailEvent;
      if (!event || !this.priorities.some((priority) => priority.id === id)) return;
      event.priority = id;
      this.priorityPickerOpen = false;
    },

    assignStaff(staffId) {
      const event = this.detailEvent;
      if (!event || !this.staff.some((person) => person.id === staffId)) return;
      if (event.staffIds.includes(staffId)) return;

      event.staffIds = [...event.staffIds, staffId];
      this.employeePickerOpen = false;
    },

    removeStaff(staffId) {
      const event = this.detailEvent;
      if (!event) return;
      event.staffIds = event.staffIds.filter((id) => id !== staffId);
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
      if (!event) return;
      event.done = !event.done;
      event.status = event.done ? "done" : "planned";
    },

    addEvent({
      date,
      type,
      title,
      time = "",
      related = "",
      attention = false,
      done = false,
      staffIds = null,
      status = "planned",
      priority = "normal",
    }) {
      const defaultStaff = {
        viewing: "roman",
        call: "alina",
        docs: "olga",
        meeting: "roman",
        reminder: "olga",
      };
      const primary = defaultStaff[type] || "roman";
      // Some demo events have two agents, making the avatar stack meaningful.
      const secondary = type === "docs" ? "alina" : type === "viewing" ? "alina" : "olga";
      const assigned = staffIds || (
        this.nextId % 4 === 0 && primary !== secondary
          ? [primary, secondary]
          : [primary]
      );

      this.events.push({
        id: this.nextId++,
        date,
        type,
        title,
        time,
        related,
        attention,
        done: done || status === "done",
        status: done ? "done" : status,
        priority,
        staffIds: [...new Set(assigned)],
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
          const calendarDate = new Date(year, month, day, 12);
          const date = toKey(calendarDate);

          // Weekend demo noise is unnecessary. Today's agenda remains populated.
          if (calendarDate.getDay() === 0 || calendarDate.getDay() === 6) continue;
          if (date === this.today) continue;

          let count = 2 + ((day * 7 + 3) % 5);
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
              status: ["planned", "progress", "waiting", "planned", "done"][(day + index) % 5],
              priority: ["normal", "normal", "low", "high", "urgent"][(day * 2 + index) % 5],
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
      ].forEach(([type, title, time, related, attention = false], index) => {
        this.addEvent({
          date: this.today,
          type,
          title,
          time,
          related,
          attention,
          status: index === 1 ? "waiting" : index === 4 ? "progress" : "planned",
          priority: index === 0 ? "urgent" : index === 3 ? "high" : "normal",
          staffIds: index === 3
            ? ["roman", "alina"]
            : index === 5
              ? ["olga", "roman"]
              : index === 2
                ? ["alina", "roman"]
                : null,
        });
      });
    },
  };
}

document.addEventListener("alpine:init", () => {
  Alpine.data("calendarApp", calendarApp);
});
