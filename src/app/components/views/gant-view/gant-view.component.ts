import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Task } from 'src/app/models/task.model';
import { GanttItem, GanttGroup, GanttViewType } from '@worktile/gantt';
import { parseISO, isValid } from 'date-fns';

@Component({
  selector: 'app-gant-view',
  templateUrl: './gant-view.component.html',
  styleUrls: ['./gant-view.component.scss']
})
export class GantViewComponent implements OnInit, OnChanges {
  @Input() tasks: Task[] = [];
  @Input() statuses: { key: string; label: string; color: string }[] = [];
  // Optional resolver to map workspace id -> workspace name
  @Input() getEspacioTrabajoName?: (id?: string) => string;
  // Optional list name to display when tasks don't include listaNombre
  @Input() listName?: string;

  currentViewType: GanttViewType = GanttViewType.month;
  groups: GanttGroup[] = [];
  items: GanttItem[] = [];
  start: number = 0; // ms
  end: number = 0; // ms

  GanttViewType = GanttViewType;

  constructor() {}

  ngOnInit(): void {
    this.rebuild();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks'] || changes['statuses']) {
      this.rebuild();
    }
  }

  changeView(viewType: GanttViewType) {
    this.currentViewType = viewType;
  }

  private rebuild(): void {
    const tasks = Array.isArray(this.tasks) ? this.tasks : [];


    const groupMap = new Map<string, GanttGroup>();
    tasks.forEach(t => {
      const groupId = String((t as any).listaIdentificador || 'sin-lista');
      if (!groupMap.has(groupId)) {
        const listTitle: string | undefined = (t as any).listaNombre || this.listName;
        const workspaceTitle: string | undefined = this.getEspacioTrabajoName
          ? this.getEspacioTrabajoName(String((t as any).espacioTrabajoIdentificador || ''))
          : undefined;
        const title = String(listTitle || workspaceTitle || groupId);
        groupMap.set(groupId, { id: groupId, title });
      }
    });
    this.groups = Array.from(groupMap.values());

    // Map tasks to items with start/end
    const items: GanttItem[] = [];
    const allDates: number[] = [];
    for (const t of tasks) {
      const start = this.pickStart(t);
      const end = this.pickEnd(t);
      if (!start && !end) {
        continue; // skip tasks with no dates
      }
      const s = start || end!;
      const e = end || start!;
      const sMs = this.toMs(s);
      const eMs = this.toMs(e);
      allDates.push(sMs, eMs);

      items.push({
        id: String(t.identificador),
        title: String(t.nombre || 'Tarea'),
        start: sMs,
        end: eMs,
        group_id: String((t as any).listaIdentificador || 'sin-lista'),
        color: this.colorForTask(t),
        progress: this.progressFromTask(t)
      });
    }
    this.items = items;

    if (allDates.length) {
      const min = Math.min(...allDates);
      const max = Math.max(...allDates);
      this.start = min;
      this.end = max;
    } else {
      // Default to a 1-week window starting today
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      this.start = start.getTime();
      this.end = this.start + 7 * 24 * 60 * 60 * 1000;
    }
  }

  private pickStart(t: Task): Date | string | number | undefined {
    return (
      (t as any).fechaInicio ||
      (t as any).fechaCreacionTarea ||
      (t as any).fechaTerminada ||
      (t as any).fechaVencimiento
    );
  }

  private pickEnd(t: Task): Date | string | number | undefined {
    return (
      (t as any).fechaFin ||
      (t as any).fechaVencimiento ||
      (t as any).fechaCerrada ||
      (t as any).fechaTerminada
    );
  }

  private colorForTask(t: Task): string | undefined {
    const label = String((t as any).estadoLabel || (t as any).estado || '').toUpperCase();
    if (!label) return undefined;
    const st = (this.statuses || []).find(s => (s.key || '').toUpperCase() === label || (s.label || '').toUpperCase() === label);
    return st?.color;
  }

  private progressFromTask(t: Task): number | undefined {
    const p = (t as any).progreso;
    if (typeof p === 'number') {
      if (p <= 1) return Math.max(0, Math.min(1, p));
      return Math.max(0, Math.min(1, p / 100));
    }
    return undefined;
  }

  private toMs(v: Date | string | number): number {
    if (typeof v === 'number') {
      // Heuristic: if value looks like seconds, convert to ms
      return v < 3_000_000_000 ? v * 1000 : v;
    }
    if (v instanceof Date) return v.getTime();
    const d = parseISO(String(v));
    return isValid(d) ? d.getTime() : Date.now();
  }
}