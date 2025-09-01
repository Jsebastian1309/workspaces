import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { Task } from 'src/app/models/task.model';
import { startOfDay, endOfDay, parseISO, isValid, addDays, addWeeks, addMonths } from 'date-fns';

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnChanges {
  @Input() tasks: Task[] = [];
  // Permite configurar los campos de fechas si tu backend usa nombres distintos
  @Input() dateFieldMap: { start?: string[]; end?: string[]; due?: string[] } = {
    start: ['fechaInicio', 'inicio', 'start'],
    end: ['fechaFin', 'fechaFinal', 'fechaCierre', 'fin', 'end'],
    due: ['fechaVencimiento', 'vencimiento', 'dueDate']
  };
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView; // expose enum to template
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.events = this.mapTasksToEvents(this.tasks);
    }
  }

  private coerceDate(d?: string | Date): Date | undefined {
    if (!d) return undefined;
    if (d instanceof Date) return isNaN(d.getTime()) ? undefined : d;
    const parsed = parseISO(d as string);
    return isValid(parsed) ? parsed : undefined;
  }

  private pickFirstDate(task: any, candidates: string[] = []): Date | undefined {
    for (const key of candidates) {
      if (task && task[key]) {
        const dt = this.coerceDate(task[key]);
        if (dt) return dt;
      }
    }
    return undefined;
  }

  private parseTime(value?: string): { h: number; m: number } | undefined {
    if (!value || typeof value !== 'string') return undefined;
    const m = value.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return undefined;
    const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    return { h, m: min };
  }

  private withTime(base: Date, t?: { h: number; m: number }): Date {
    if (!t) return base;
    const d = new Date(base);
    d.setHours(t.h, t.m, 0, 0);
    return d;
  }

  private mapTasksToEvents(tasks: Task[]): CalendarEvent[] {
    const startKeys = this.dateFieldMap.start ?? [];
    const endKeys = this.dateFieldMap.end ?? [];
    const dueKeys = this.dateFieldMap.due ?? [];

    return (tasks || [])
      .map(t => {
        // Buscar fechas por prioridad: start/end; si no hay, usar due para ambos
        let startDate = this.pickFirstDate(t, startKeys);
        let endDate = this.pickFirstDate(t, endKeys);
        const dueDate = this.pickFirstDate(t, dueKeys);

        if (!startDate && dueDate) startDate = dueDate;
        if (!endDate && (t as any)?.duracionHoras && startDate) {
          // si hay duración, estimar fin sumando días completos por simplicidad (mejorar si se requiere horas exactas)
          const hours = Number((t as any).duracionHoras) || 0;
          endDate = addDays(startDate, Math.ceil(hours / 24));
        }
        if (!endDate && dueDate) endDate = dueDate;
        if (!startDate && !endDate) return null; // omitir tareas sin fecha

        // Horas opcionales
        const startTime = this.parseTime((t as any)?.horaInicio);
        const endTime = this.parseTime((t as any)?.horaFin);

        const start = startDate ? this.withTime(startOfDay(startDate), startTime) : startOfDay(new Date());
        const endBase = endDate ?? startDate ?? new Date();
        const end = endTime ? this.withTime(endOfDay(endBase), endTime) : endOfDay(endBase);
        const allDay = !(startTime || endTime);

        return {
          title: t.nombre,
          start,
          end,
          allDay,
          color: this.colorByStatus(t.estado),
          meta: t,
        } as CalendarEvent;
      })
      .filter((e): e is CalendarEvent => !!e);
  }

  private colorByStatus(status?: string) {
    const map: any = {
      DONE: { primary: '#2e7d32', secondary: '#c8e6c9' },
      OPEN: { primary: '#1976d2', secondary: '#bbdefb' },
      PENDING: { primary: '#f9a825', secondary: '#fff59d' },
      BLOCKED: { primary: '#c62828', secondary: '#ffcdd2' }
    };
    return map[status || 'OPEN'] || map['OPEN'];
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  dayClicked(date: Date) {
    this.viewDate = date;
    this.view = CalendarView.Day;
  }

  prev() {
    this.viewDate = this.shiftDate(-1);
  }

  next() {
    this.viewDate = this.shiftDate(1);
  }

  today() {
    this.viewDate = new Date();
  }

  private shiftDate(step: number): Date {
    switch (this.view) {
      case CalendarView.Month:
        return addMonths(this.viewDate, step);
      case CalendarView.Week:
        return addWeeks(this.viewDate, step);
      case CalendarView.Day:
      default:
        return addDays(this.viewDate, step);
    }
  }
}
