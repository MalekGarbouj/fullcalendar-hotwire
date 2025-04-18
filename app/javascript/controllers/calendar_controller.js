import { Controller } from "@hotwired/stimulus";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import { put } from "@rails/request.js";

export default class extends Controller {
  static targets = ["popup", "window", "agentsList"];
  static values = {
    agentId: String,
  }

  connect() {
    this.agentIdValue = this.agentsListTarget?.value || null;
    this.initExternalEvents();
    this.initCalendar();

    window.addEventListener("resize", () => this.setView());
    window.addEventListener("load", () => {
      this.calendar.render();
      this.setView();
    });

    addEventListener("turbo:before-stream-render", () => {
      this.calendar.refetchEvents();
    });
  }

  setDefaultAgent(event) {
    this.agentIdValue = event.target.value;
    this.fetchAgentTasks();
  }

  fetchAgentTasks() {
    if (!this.agentIdValue) return;

    fetch(`/agents/${this.agentIdValue}/events`, {
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        this.reinitializeCalendar(data);
      })
      .catch((error) => console.error("Error fetching tasks:", error));
  }

  reinitializeCalendar(tasks) {
    this.calendar.getEvents().forEach(event => event.remove());

    tasks.forEach((task) => {
      this.calendar.addEvent({
        id: task.id,
        title: task.title,
        startTime: task.start_at.split("T")[1].slice(0, 5),
        endTime: task.finish_at.split("T")[1].slice(0, 5),
        daysOfWeek: task.days,
        startRecur: task.start_on,
        endRecur: task.finish_on,
        editable: false,
        extendedProps: task,
      });
    });
  }

  initExternalEvents() {
    const external = document.getElementById("external-tasks");

    new Draggable(external, {
      itemSelector: ".fc-event",
      eventData: (el) => {
        const eventData = JSON.parse(el.dataset.event);
        return {
          id: el.dataset.id,
          title: eventData.title,
          startTime: eventData.starts_at,
          endTime: eventData.ends_at,
          editable: false,
          extendedProps: eventData,
        };
      },
    });
  }

  initCalendar() {
    this.calendar = new Calendar(this.windowTarget, {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      selectable: true,
      editable: true,
      timeZone: "UTC",
      droppable: true,
      events: "/events.json",
      initialView: "timeGridWeek",
      headerToolbar: {
        left: "prev,next",
        center: "today",
        right: "dayGridMonth,timeGridWeek,listWeek"
      },
      select: (info) => {
        this.popupTarget.src = `/events/new?event[start]=${info.startStr}&event[end]=${info.endStr}`;
      },
      eventClick: (info) => {
        this.popupTarget.src = `/events/${info.event.id}?date=${info.event.startStr}`;
      },
      eventDrop: (info) => {
        put(`/events/${info.event.id}`, {
          body: { event: { start: info.event.startStr, end: info.event.endStr } },
        });
      },
      eventResize: (info) => {
        put(`/events/${info.event.id}`, {
          body: JSON.stringify({
            event: {
              start: info.event.startStr,
              end: info.event.endStr
            }
          }),
          contentType: "application/json"
        });
      },
      eventReceive: this.handleEventReceive.bind(this),
    });
  }

  handleEventReceive(info) {
    const taskID = info.draggedEl.dataset.id;
    const data = {
      task_id: taskID,
      agent_id: this.agentIdValue,
    };

    fetch(`/events/${taskID}/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content,
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((_data) => {
        this.removeExternalTask(info.draggedEl);
      })
      .catch((error) => {
        console.error("Assignment failed:", error);
        info.revert();
      });
  }

  removeExternalTask(taskEl) {
    taskEl.remove();
  }

  setView() {
    if (window.innerWidth < 800) {
      this.calendar.changeView("listWeek");
    } else {
      this.calendar.changeView("timeGridWeek");
    }
  }
}
